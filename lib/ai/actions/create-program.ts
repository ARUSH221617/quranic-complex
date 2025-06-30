"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from '@vercel/blob';

// Schema for request validation
const createProgramSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  ageGroup: z.string(),
  schedule: z.string(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  locale: z.enum(["en", "fa", "ar"]).default("en"),
});

export async function createProgram(data: FormData) {
  try {
    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = data.get("image") as File | null;
    if (imageFile) {
      if (imageFile.size > MAX_FILE_SIZE) {
        throw new Error("Image must be less than 5MB");
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        throw new Error("Invalid image file type. Allowed types: JPEG, PNG, WebP");
      }
    }

    // Extract and validate program data
    const programData = {
      slug: data.get("slug"),
      title: data.get("title"),
      description: data.get("description"),
      ageGroup: data.get("ageGroup"),
      schedule: data.get("schedule"),
      metaTitle: data.get("metaTitle"),
      metaDescription: data.get("metaDescription"),
      keywords: data.get("keywords"),
      locale: data.get("locale") || "en",
    };

    // Validate the data
    const validatedData = createProgramSchema.parse(programData);

    // Check if slug is unique
    const existingProgram = await prisma.program.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProgram) {
      throw new Error(`A program item with slug \"${validatedData.slug}\" already exists.`);
    }

    // Save image if provided
    let imagePath: string | null = null;
    if (imageFile) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is not set.');
        return {
          success: false,
          error: 'Missing Blob storage configuration. Cannot upload image.',
        };
      }
      try {
        const blob = await put(`programs/${Date.now()}-${imageFile.name}`, imageFile, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        imagePath = blob.url; // Store the URL from Vercel Blob
        console.log(`Uploaded to Vercel Blob: ${imagePath}`);
      } catch (uploadError: any) {
        console.error('Error uploading to Vercel Blob:', uploadError);
        return {
          success: false,
          error: `Failed to upload image: ${uploadError.message || 'Unknown error'}`,
        };
      }
    }

    // Create program with translation
    const program = await prisma.program.create({
      data: {
        slug: validatedData.slug,
        image: imagePath, // This will be the blob URL or null
        translations: {
          create: {
            locale: validatedData.locale,
            title: validatedData.title,
            description: validatedData.description,
            ageGroup: validatedData.ageGroup,
            schedule: validatedData.schedule,
            metaTitle: validatedData.metaTitle || null,
            metaDescription: validatedData.metaDescription || null,
            keywords: validatedData.keywords || null,
          },
        },
      },
      select: {
        id: true,
        slug: true,
        image: true,
        translations: {
          where: {
            locale: validatedData.locale,
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
        },
      },
    });

    if (!program.translations.length) {
      throw new Error("Failed to create program translation");
    }

    // Revalidate the program pages
    revalidatePath("/programs");
    revalidatePath("/programs/[slug]");

    return {
      success: true,
      data: {
        id: program.id,
        slug: program.slug,
        title: program.translations[0].title,
        description: program.translations[0].description,
        ageGroup: program.translations[0].ageGroup,
        schedule: program.translations[0].schedule,
        image: program.image,
        metaTitle: program.translations[0].metaTitle,
        metaDescription: program.translations[0].metaDescription,
        keywords: program.translations[0].keywords,
      },
    };
  } catch (error) {
    console.error("Error creating program:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while creating the program item.",
    };
  }
}
