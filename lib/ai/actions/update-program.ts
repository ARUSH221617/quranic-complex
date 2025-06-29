"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { Prisma } from "@prisma/client";

// Schema for request validation from FormData
const updateProgramFormSchema = z.object({
  slug: z.string(),
  locale: z.enum(["en", "fa", "ar"]),
  title: z.string().optional(),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  schedule: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  image: z.instanceof(File).optional().nullable(),
  remove_image: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export async function updateProgram(formData: FormData) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set.");
      return {
        success: false,
        error: "Missing Blob storage configuration. Cannot process image.",
      };
    }

    // Extract data from FormData
    const rawData = {
      slug: formData.get("slug"),
      locale: formData.get("locale"),
      title: formData.get("title"),
      description: formData.get("description"),
      ageGroup: formData.get("ageGroup"),
      schedule: formData.get("schedule"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      keywords: formData.get("keywords"),
      image: formData.get("image"),
      remove_image: formData.get("remove_image"),
    };

    // Validate the data
    const validatedData = updateProgramFormSchema.parse(rawData);
    const {
      slug,
      locale,
      image: imageFile,
      remove_image,
      ...textFields
    } = validatedData;

    // Check if the program item exists
    const existingProgram = await prisma.program.findUnique({
      where: { slug: slug },
      select: { id: true, image: true }, // Select id and current image for update
    });

    if (!existingProgram) {
      return {
        success: false,
        error: `Program item with slug "${slug}" not found.`,
      };
    }

    let newImageUrl: string | null | undefined = undefined; // undefined means no change, null means remove

    // Basic image validation (if a new image is provided)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (imageFile && imageFile.size > 0) {
      // Check if a file is actually provided
      if (imageFile.size > MAX_FILE_SIZE) {
        return { success: false, error: "Image must be less than 5MB" };
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return {
          success: false,
          error: "Invalid image file type. Allowed types: JPEG, PNG, WebP",
        };
      }

      // New image provided, delete old one from Blob if it exists
      if (existingProgram.image) {
        try {
          await del(existingProgram.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          console.log(`Deleted old blob: ${existingProgram.image}`);
        } catch (e: any) {
          console.error(
            "Failed to delete old blob, continuing with upload:",
            e.message,
          );
          // Optionally return an error if old blob deletion is critical
        }
      }
      // Upload new image to Blob
      try {
        const blob = await put(
          `programs/${Date.now()}-${imageFile.name}`,
          imageFile,
          {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          },
        );
        newImageUrl = blob.url;
        console.log(`Uploaded new blob: ${newImageUrl}`);
      } catch (e: any) {
        console.error("Failed to upload new blob:", e.message);
        return {
          success: false,
          error: `Failed to upload new image: ${e.message}`,
        };
      }
    } else if (remove_image) {
      // remove_image flag is true, delete existing image from Blob if it exists
      if (existingProgram.image) {
        try {
          await del(existingProgram.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          console.log(
            `Deleted blob due to remove_image flag: ${existingProgram.image}`,
          );
          newImageUrl = null; // Explicitly set to null for DB update
        } catch (e: any) {
          console.error("Failed to delete blob on removal:", e.message);
          return {
            success: false,
            error: `Failed to delete image: ${e.message}`,
          };
        }
      } else {
        newImageUrl = null; // No existing image, but remove_image was true, ensure it's null
      }
    }

    // --- Prepare Program Data (Image) ---
    const programUpdatePayload: Prisma.ProgramUpdateInput = {};
    let hasProgramChanges = false;

    if (newImageUrl !== undefined) {
      // if newImageUrl is null (removed) or a new URL
      programUpdatePayload.image = newImageUrl;
      hasProgramChanges = true;
    }

    // --- Update Program item if there are changes ---\
    if (hasProgramChanges) {
      await prisma.program.update({
        where: { id: existingProgram.id },
        data: programUpdatePayload,
      });
    }

    // --- Prepare and Update Translation ---
    // Find the translation to update or create
    const translationFields: { [key: string]: any } = {};
    const translationKeys: (keyof typeof textFields)[] = [
      "title",
      "description",
      "ageGroup",
      "schedule",
      "metaTitle",
      "metaDescription",
      "keywords",
    ];

    translationKeys.forEach((key) => {
      if (textFields[key] !== undefined) {
        translationFields[key] =
          textFields[key] === null ? Prisma.DbNull : textFields[key];
      }
    });

    const updatedTranslation = await prisma.programTranslation.upsert({
      where: {
        programId_locale: { programId: existingProgram.id, locale: locale },
      },
      update: translationFields,
      create: {
        programId: existingProgram.id,
        locale: locale,
        title: validatedData.title || "", // Provide default if not present
        description: validatedData.description || "",
        ageGroup: validatedData.ageGroup || "",
        schedule: validatedData.schedule || "",
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        keywords: validatedData.keywords,
      },
      select: {
        id: true,
        locale: true,
        title: true,
        description: true,
        ageGroup: true,
        schedule: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
      },
    });

    // Refetch the program item to include potentially updated image for the return
    const finalProgramData = await prisma.program.findUnique({
      where: { id: existingProgram.id },
      select: {
        id: true,
        slug: true,
        image: true,
      },
    });

    // Revalidate the program pages
    revalidatePath("/programs");
    revalidatePath(`/programs/${slug}`); // Revalidate the specific program page

    return {
      success: true,
      data: {
        ...updatedTranslation, // Contains translation fields
        slug: finalProgramData?.slug, // Add slug from program
        image: finalProgramData?.image, // Add image from program
      },
    };
  } catch (error) {
    console.error("Error updating program:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating the program item.",
    };
  }
}
