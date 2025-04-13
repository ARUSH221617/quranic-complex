import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Helper function to handle file saving and old file deletion
async function saveFile(
  file: File | null,
  uploadSubDir: string,
  fileNamePrefix: string,
  currentPath: string | null | undefined,
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

// Define the type for the final formatted output
interface FormattedProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  image: string | null;
  // Add translation specific fields if needed in response
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
}

// Schema for PATCH request body validation (text fields)
// Keep fields optional as it's a PATCH request
const updateProgramSchema = z.object({
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  schedule: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  // Image is handled separately via FormData
  // remove_image is handled separately via FormData
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug: id } = await Promise.resolve(params);
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const program = await prisma.program.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        slug: true,
        image: true,
        translations: {
          where: {
            locale: locale,
          },
          select: {
            title: true,
            description: true,
            ageGroup: true,
            schedule: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
          },
          take: 1, // Explicitly take only the first matching translation
        },
      },
    });

    if (!program || program.translations.length === 0) {
      return NextResponse.json(
        {
          message:
            "Program not found or no translation available for the specified locale",
        },
        { status: 404 },
      );
    }

    const translation = program.translations[0];

    const formattedProgram: FormattedProgram = {
      id: program.id,
      slug: program.slug,
      title: translation.title,
      description: translation.description,
      ageGroup: translation.ageGroup,
      schedule: translation.schedule,
      image: program.image,
      // Add translation meta fields
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords,
    };

    return NextResponse.json(formattedProgram);
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error fetching program:", error);

    // Provide a user-friendly error response
    return NextResponse.json(
      { message: "An error occurred while fetching the program." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug: id } = await Promise.resolve(params);
    const locale = request.nextUrl.searchParams.get("locale") || "en";
    const formData = await request.formData();

    // --- 1. Find the existing program ---
    const existingProgram = await prisma.program.findUnique({
      where: { id: id },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
    });

    console.log("Existing Program:", existingProgram);

    // --- 2. Handle missing program ---
    if (!existingProgram) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 },
      );
    }
    const existingTranslation = existingProgram.translations[0]; // Might be undefined if no translation exists for locale

    // --- 2. Prepare Text Data for Update ---
    const validatedData: Record<string, string | undefined> = {}; // Using string | undefined for simplicity, refine with Zod if needed
    const formDataKeys = Array.from(formData.keys());
    const textFields = [
      "slug",
      "title",
      "description",
      "ageGroup",
      "schedule",
      "metaTitle",
      "metaDescription",
      "keywords",
    ];

    formDataKeys.forEach((key) => {
      if (textFields.includes(key)) {
        // Ensure we get string values, handle potential File objects if keys overlap unexpectedly
        const value = formData.get(key);
        if (typeof value === "string") {
          validatedData[key] = value;
        }
        // If you expect some fields might *not* be strings from FormData, add more checks here
      }
    });

    // --- 3. Handle Image Update ---
    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("remove_image") === "true";
    let newImageUrl: string | null | undefined = undefined;

    if (imageFile) {
      // Validate image file if provided
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "Image must be less than 5MB" },
          { status: 400 },
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          {
            message: "Invalid image file type. Allowed types: JPEG, PNG, WebP",
          },
          { status: 400 },
        );
      }
    }

    if (removeImage) {
      // Handle image deletion
      if (existingProgram.image) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          existingProgram.image,
        );
        try {
          await fs.promises.unlink(oldFilePath);
          console.log(`Deleted old image file: ${oldFilePath}`);
        } catch (err: any) {
          // Only log error if file exists but couldn't be deleted
          if (err.code !== "ENOENT") {
            console.error(`Error deleting old image file ${oldFilePath}:`, err);
          }
        }
      }
      newImageUrl = null;
    } else if (imageFile) {
      // Save new image and get its path
      newImageUrl = await saveFile(
        imageFile,
        "programs",
        "program",
        existingProgram.image,
      );
    }

    // --- 4. Prepare Program Data (Slug & Image) ---
    const programUpdateData: Prisma.ProgramUpdateInput = {};
    let hasProgramChanges = false;

    // Only update image if newImageUrl is explicitly set (not undefined)
    if (newImageUrl !== undefined && newImageUrl !== existingProgram.image) {
      programUpdateData.image = newImageUrl;
      hasProgramChanges = true;
    }

    if (validatedData.slug && validatedData.slug !== existingProgram.slug) {
      // Check if new slug is unique (important!)
      const slugExists = await prisma.program.findUnique({
        where: { slug: validatedData.slug },
        select: { id: true }, // Select only id for efficiency
      });
      // Ensure the slug doesn't belong to another program
      if (slugExists && slugExists.id !== existingProgram.id) {
        return NextResponse.json(
          { message: `Slug "${validatedData.slug}" already exists.` },
          { status: 409 },
        ); // Conflict
      }
      programUpdateData.slug = validatedData.slug;
      hasProgramChanges = true;
    }

    // --- 5. Prepare Translation Data for Upsert ---
    const translationUpdateData: Prisma.ProgramTranslationUpdateWithoutProgramInput =
      {};
    const translationFieldsToUpdate: (keyof Prisma.ProgramTranslationUpdateWithoutProgramInput)[] =
      [
        "title",
        "description",
        "ageGroup",
        "schedule",
        "metaTitle",
        "metaDescription",
        "keywords",
      ];
    let hasTranslationChanges = false;

    translationFieldsToUpdate.forEach((field) => {
      if (validatedData[field] !== undefined) {
        const newValue = ["metaTitle", "metaDescription", "keywords"].includes(
          field,
        )
          ? validatedData[field] || undefined // Allow null for meta fields
          : (validatedData[field] ?? ""); // Default to empty string for required text fields

        // Check if the new value is different from the existing one (if existing translation exists)
        if (
          !existingTranslation ||
          newValue !==
            existingTranslation[field as keyof typeof existingTranslation]
        ) {
          translationUpdateData[field] = newValue;
          hasTranslationChanges = true;
        } else if (
          existingTranslation &&
          newValue ===
            existingTranslation[field as keyof typeof existingTranslation]
        ) {
          // Value provided but it's the same as existing, potential edge case for "no changes" logic below
          // Mark as change provided, even if same value for now
          hasTranslationChanges = true;
        }
      }
    });

    // Prepare data for the 'create' part of upsert - use provided data, falling back to defaults/empty
    const translationCreateData: Prisma.ProgramTranslationCreateWithoutProgramInput =
      {
        locale: locale,
        title: validatedData.title ?? "", // Default to empty string if not provided
        description: validatedData.description ?? "",
        ageGroup: validatedData.ageGroup ?? "",
        schedule: validatedData.schedule ?? "",
        metaTitle: validatedData.metaTitle || null, // Default to null if not provided or empty
        metaDescription: validatedData.metaDescription || null,
        keywords: validatedData.keywords || null,
      };

    // --- 6. Perform Update ---

    // Check if any actual changes are being made
    const isCreatingTranslation = !existingTranslation && hasTranslationChanges; // True if translation will be newly created
    const isUpdatingProgram = hasProgramChanges;
    const isUpdatingTranslation =
      existingTranslation && Object.keys(translationUpdateData).length > 0; // True if existing translation has fields to update

    if (
      !isUpdatingProgram &&
      !isCreatingTranslation &&
      !isUpdatingTranslation
    ) {
      // If no changes detected, return the existing data formatted correctly
      const existingFormattedProgram: FormattedProgram = {
        id: existingProgram.id,
        slug: existingProgram.slug,
        title: existingTranslation?.title ?? "",
        description: existingTranslation?.description ?? "",
        ageGroup: existingTranslation?.ageGroup ?? "",
        schedule: existingTranslation?.schedule ?? "",
        image: existingProgram.image,
        metaTitle: existingTranslation?.metaTitle,
        metaDescription: existingTranslation?.metaDescription,
        keywords: existingTranslation?.keywords,
      };
      return NextResponse.json(existingFormattedProgram, { status: 200 });
    }

    // Define the type expected from the select clause for better type safety
    type UpdatedProgramSelect = Prisma.ProgramGetPayload<{
      select: {
        id: true;
        slug: true;
        image: true;
        translations: {
          select: {
            title: true;
            description: true;
            ageGroup: true;
            schedule: true;
            metaTitle: true;
            metaDescription: true;
            keywords: true;
          };
          where: { locale: string };
          take: 1;
        };
      };
    }>;

    const updatedProgram = (await prisma.program.update({
      where: { id: existingProgram.id },
      data: {
        ...programUpdateData,
        translations: {
          upsert: {
            where: {
              programId_locale: {
                // Unique identifier for translation
                programId: existingProgram.id,
                locale: locale,
              },
            },
            // Provide data necessary for creating a new translation if it doesn't exist
            create: translationCreateData,
            // Provide only the fields that should be updated if translation exists
            update: translationUpdateData,
          },
        },
      },
      select: {
        // Select the same fields as GET for consistent response
        id: true,
        slug: true,
        image: true,
        translations: {
          where: {
            locale: locale,
          },
          select: {
            title: true,
            description: true,
            ageGroup: true,
            schedule: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
          },
          take: 1,
        },
      },
    })) as UpdatedProgramSelect; // Cast to the expected selected type

    // The select clause should guarantee translations array exists if update succeeds
    // but Prisma's default type might not reflect 'take: 1' strictly guaranteeing one element
    // or the upsert might theoretically fail to return the element in rare cases.
    if (
      !updatedProgram?.translations ||
      updatedProgram.translations.length === 0
    ) {
      // This indicates an issue either with the update/upsert logic or data retrieval
      console.error(
        "Failed to retrieve updated translation after upsert for program:",
        updatedProgram,
      );
      throw new Error(
        "Failed to update program or retrieve updated translation.",
      );
    }

    const updatedTranslation = updatedProgram.translations[0];
    const formattedProgram: FormattedProgram = {
      id: updatedProgram.id,
      slug: updatedProgram.slug,
      title: updatedTranslation.title,
      description: updatedTranslation.description,
      ageGroup: updatedTranslation.ageGroup,
      schedule: updatedTranslation.schedule,
      image: updatedProgram.image,
      metaTitle: updatedTranslation.metaTitle,
      metaDescription: updatedTranslation.metaDescription,
      keywords: updatedTranslation.keywords,
    };

    return NextResponse.json(formattedProgram);
  } catch (error) {
    console.error("Error updating program:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors (e.g., unique constraint violation if slug check failed somehow)
      if (error.code === "P2002") {
        // Identify the target field if possible from error meta
        const target = (error.meta as { target?: string[] })?.target?.join(
          ", ",
        );
        const message = target
          ? `A unique constraint violation occurred on field(s): ${target}. The value might already be in use.`
          : "A unique constraint violation occurred. The slug might already be in use.";

        return NextResponse.json({ message }, { status: 409 });
      }
      // Handle other potential known errors if necessary
    }
    // Handle Zod validation errors if schema parsing is re-enabled
    // if (error instanceof z.ZodError) {
    //     return NextResponse.json({ errors: error.errors }, { status: 400 });
    // }

    return NextResponse.json(
      { message: "An error occurred while updating the program." },
      { status: 500 },
    );
  }
}
