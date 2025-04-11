import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/components/admin/user/schema";
import path from "path";
import fs from "fs";
import { QuranicStudyLevel } from "@prisma/client"; // Import enum if needed for validation

// Define Zod schema for the text fields coming from FormData
// Expect dateOfBirth as string, handle conversion later
const updateTextFieldsSchema = userSchema
  .partial()
  .omit({ id: true, image: true, nationalCardPicture: true, emailVerified: true }) // Omit fields handled separately or not updated here
  .extend({
    dateOfBirth: z.string().optional(), // Expect string from FormData
  });

// Helper function to handle file saving and old file deletion
async function saveFile(
  file: File | null,
  uploadSubDir: string,
  fileNamePrefix: string,
  currentPath: string | null | undefined
): Promise<string | undefined> {
  if (!file) return undefined; // No new file, return undefined

  // --- Delete old file if it exists ---
  if (currentPath) {
    const oldFilePath = path.join(process.cwd(), "public", currentPath);
    try {
      await fs.promises.unlink(oldFilePath);
      console.log(`Deleted old file: ${oldFilePath}`);
    } catch (err: any) {
      // Ignore error if file doesn't exist, log others
      if (err.code !== "ENOENT") {
        console.error(`Error deleting old file ${oldFilePath}:`, err);
      }
    }
  }

  // --- Save new file ---
  const uploadDir = path.join(process.cwd(), "public", "uploads", uploadSubDir);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${fileNamePrefix}-${uniqueSuffix}${path.extname(file.name)}`;
  const filePath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.promises.writeFile(filePath, buffer);

  const relativePath = `/uploads/${uploadSubDir}/${filename}`;
  console.log(`Saved new file: ${filePath} (relative: ${relativePath})`);
  return relativePath; // Return the relative path for DB storage
}


export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // Wait for params to be available and validate userId
  const { userId } = await Promise.resolve(params);

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return NextResponse.json(
      { message: "Invalid or missing User ID" },
      { status: 400 }
    );
  }

  // Sanitize userId by trimming any whitespace
  const sanitizedUserId = userId.trim();

  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    // Extract files
    const imageFile = formData.get("image") as File | null;
    const nationalCardFile = formData.get("nationalCardPicture") as File | null;

    // --- Validate Text Fields ---
    // Prepare text data for Zod validation (convert relevant fields if needed)
    const textDataToValidate: Record<string, any> = {};
    for (const key in updateTextFieldsSchema.shape) {
        if (body[key] !== undefined) {
            // Handle potential enum conversion if needed (example for quranicStudyLevel)
            if (key === 'quranicStudyLevel' && typeof body[key] === 'string') {
                 if (Object.values(QuranicStudyLevel).includes(body[key] as QuranicStudyLevel)) {
                    textDataToValidate[key] = body[key];
                 } else {
                     // Handle invalid enum value - maybe throw error or assign default?
                     // For now, let Zod catch it if it's required or handle downstream
                 }
            } else {
                textDataToValidate[key] = body[key];
            }
        }
    }

    const validatedTextData = updateTextFieldsSchema.safeParse(textDataToValidate);

    if (!validatedTextData.success) {
      console.error("Validation Errors:", validatedTextData.error.flatten());
      return NextResponse.json(
        {
          message: "Invalid text data",
          errors: validatedTextData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // --- Validate Files (Basic Example: Size & Type) ---
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]; // Add webp if desired

    if (imageFile && imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ message: "Profile picture must be less than 5MB" }, { status: 400 });
    }
    if (imageFile && !ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ message: "Invalid profile picture file type" }, { status: 400 });
    }
    if (nationalCardFile && nationalCardFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ message: "National card picture must be less than 5MB" }, { status: 400 });
    }
    if (nationalCardFile && !ALLOWED_IMAGE_TYPES.includes(nationalCardFile.type)) {
        return NextResponse.json({ message: "Invalid national card picture file type" }, { status: 400 });
    }


    // --- Process Update ---
    // Fetch current user to get old file paths
    const currentUser = await prisma.user.findUnique({ where: { id: sanitizedUserId } });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Save files and get new paths
    const newImagePath = await saveFile(imageFile, "avatars", "avatar", currentUser.image);
    const newNationalCardPath = await saveFile(nationalCardFile, "national-cards", "national-card", currentUser.nationalCardPicture);

    // Prepare data for Prisma update
    const dataToUpdate: Record<string, any> = { ...validatedTextData.data };

    // Add file paths if they were updated
    if (newImagePath !== undefined) {
      dataToUpdate.image = newImagePath;
    }
    if (newNationalCardPath !== undefined) {
      dataToUpdate.nationalCardPicture = newNationalCardPath;
    }

    // Convert date string back to Date object if necessary
    if (dataToUpdate.dateOfBirth && typeof dataToUpdate.dateOfBirth === "string") {
      const parsedDate = new Date(dataToUpdate.dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
          dataToUpdate.dateOfBirth = parsedDate;
      } else {
          // Handle invalid date string if necessary, maybe remove it or return error
          delete dataToUpdate.dateOfBirth; // Or return validation error
          console.warn(`Invalid date string received for user ${sanitizedUserId}: ${body.dateOfBirth}`);
      }
    } else if (dataToUpdate.dateOfBirth === '') {
        // Handle empty string case if needed, e.g., set to null or remove
        delete dataToUpdate.dateOfBirth; // Or set to null if schema allows
    }


    // Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: sanitizedUserId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser); // Return updated user data
  } catch (error) {
    console.error(`Error updating user ${sanitizedUserId}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && (error as any).code === "P2025") {
      // Prisma error code for record not found
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE handler if needed later
// export async function DELETE(...) { ... }
