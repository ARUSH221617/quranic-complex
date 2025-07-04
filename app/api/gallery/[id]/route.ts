import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { put, del } from "@vercel/blob";
import { Prisma } from "@prisma/client";

// Schema for PUT request validation
const updateGallerySchema = z.object({
  category: z.string().min(1, { message: "Category is required." }).optional(),
  translations: z
    .string()
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        if (!Array.isArray(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Translations must be an array.",
          });
          return z.NEVER;
        }
        const translationSchema = z.object({
          locale: z.string().min(1, "Locale is required."),
          title: z.string().min(1, "Title is required."),
          description: z.string().nullable(),
        });
        return z.array(translationSchema).parse(parsed);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON for translations.",
        });
        return z.NEVER;
      }
    })
    .optional(),
  // Note: 'image' field is handled directly from FormData for file uploads,
  // not directly validated in the Zod schema for parsing body, but its resulting URL is used for DB.
});

// Define the type for the formatted output for a single item (for edit sheet)
interface FormattedGalleryItemDetail {
  id: string;
  image: string | null;
  category: string;
  translations: { locale: string; title: string; description: string | null }[];
}

// GET handler for a single gallery item (used by edit sheet to populate data)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const galleryItem = await prisma.gallery.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        category: true,
        translations: {
          // Fetch all translations for the edit sheet
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { message: "Gallery item not found." },
        { status: 404 },
      );
    }

    // Return all translations for the edit sheet
    const formattedResponse: FormattedGalleryItemDetail = {
      id: galleryItem.id,
      image: galleryItem.image,
      category: galleryItem.category,
      translations: galleryItem.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error(`Error fetching gallery item with ID ${params.id}:`, error);
    return NextResponse.json(
      { message: "An error occurred while fetching the gallery item." },
      { status: 500 },
    );
  }
}

// PUT handler for updating an existing gallery item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const formData = await request.formData();

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    const category = formData.get("category") as string;
    const translationsString = formData.get("translations") as string;

    // Get current gallery item to check for existing image
    const currentGalleryItem = await prisma.gallery.findUnique({
      where: { id },
      select: { image: true },
    });

    if (!currentGalleryItem) {
      return NextResponse.json(
        { message: "Gallery item not found for update." },
        { status: 404 },
      );
    }

    let newImageUrl: string | null = currentGalleryItem.image; // Default to existing image

    // Determine if an image operation (upload new, remove old) is happening
    const isNewFileSelected = imageFile instanceof File && imageFile.size > 0;
    const isImageCleared = imageFile instanceof File && imageFile.size === 0;

    if (isNewFileSelected) {
      // Case 1: A new image file is provided
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "New image must be less than 5MB." },
          { status: 400 },
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          {
            message:
              "Invalid new image file type. Allowed types: JPEG, PNG, WebP.",
          },
          { status: 400 },
        );
      }

      // Delete old image from Vercel Blob if it exists and is a Blob URL
      if (
        process.env.BLOB_READ_WRITE_TOKEN &&
        currentGalleryItem.image &&
        currentGalleryItem.image.includes("vercel-storage.com")
      ) {
        try {
          await del(currentGalleryItem.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          console.log(
            `Deleted old blob for replacement: ${currentGalleryItem.image}`,
          );
        } catch (deleteError) {
          console.error(
            "Error deleting old blob for replacement:",
            deleteError,
          );
          // Continue even if deletion fails
        }
      }

      // Upload new image to Vercel Blob
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("BLOB_READ_WRITE_TOKEN is not set.");
        return NextResponse.json(
          { message: "Missing Blob storage configuration." },
          { status: 500 },
        );
      }
      try {
        const blob = await put(
          `gallery/${Date.now()}-${imageFile.name}`,
          imageFile,
          {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          },
        );
        newImageUrl = blob.url;
        console.log(`Uploaded new blob: ${newImageUrl}`);
      } catch (uploadError) {
        console.error("Error uploading new blob:", uploadError);
        return NextResponse.json(
          { message: "Failed to upload new image." },
          { status: 500 },
        );
      }
    } else if (isImageCleared) {
      // Case 2: Image input was cleared (file object with size 0)
      if (
        process.env.BLOB_READ_WRITE_TOKEN &&
        currentGalleryItem.image &&
        currentGalleryItem.image.includes("vercel-storage.com")
      ) {
        try {
          await del(currentGalleryItem.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          console.log(
            `Deleted old blob due to clear: ${currentGalleryItem.image}`,
          );
        } catch (delError) {
          console.error("Error deleting old blob on clear:", delError);
        }
      }
      newImageUrl = null; // Set to null for DB
    }
    // Case 3: No new file uploaded, and image was not explicitly cleared
    // In this scenario, newImageUrl retains its initial value which is currentGalleryItem.image.
    // No explicit action is needed here as `newImageUrl` is initialized with `currentGalleryItem.image`.

    // Parse translations from JSON string
    let translations;
    try {
      translations = JSON.parse(translationsString);
    } catch (parseError) {
      return NextResponse.json(
        { message: "Invalid translations format." },
        { status: 400 },
      );
    }

    // Validate the parsed data with Zod
    const validatedData = updateGallerySchema.parse({
      category,
      translations,
    });

    const updateData: Prisma.GalleryUpdateInput = {
      image: newImageUrl ?? undefined,
      category: validatedData.category,
    };

    // Update gallery item and its translations
    await prisma.$transaction(async (tx) => {
      // Delete existing translations for this gallery item
      await tx.galleryTranslation.deleteMany({
        where: { galleryId: id },
      });

      // Create new translations, ensuring translations is always an array
      await tx.galleryTranslation.createMany({
        data: (validatedData.translations || []).map((t) => ({
          galleryId: id,
          locale: t.locale,
          title: t.title,
          description: t.description || null,
        })),
      });

      // Update the main gallery item (image and category)
      await tx.gallery.update({
        where: { id },
        data: updateData,
      });
    });

    // Fetch the updated item to return it formatted
    const updatedGalleryItem = await prisma.gallery.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        category: true,
        translations: {
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!updatedGalleryItem) {
      throw new Error("Failed to retrieve updated gallery item.");
    }

    // Return all translations for the edit sheet on successful update
    const formattedResponse: FormattedGalleryItemDetail = {
      id: updatedGalleryItem.id,
      image: updatedGalleryItem.image,
      category: updatedGalleryItem.category,
      translations: updatedGalleryItem.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error(`Error updating gallery item with ID ${params.id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid gallery data", errors: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Gallery item not found." },
          { status: 404 },
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while updating the gallery item." },
      { status: 500 },
    );
  }
}

// DELETE handler for deleting a gallery item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const galleryItem = await prisma.gallery.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
      },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { message: "Gallery item not found." },
        { status: 404 },
      );
    }

    // Delete image from Vercel Blob if it exists and is a Blob URL
    if (
      process.env.BLOB_READ_WRITE_TOKEN &&
      galleryItem.image &&
      galleryItem.image.includes("vercel-storage.com")
    ) {
      try {
        await del(galleryItem.image, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log(`Deleted blob: ${galleryItem.image}`);
      } catch (delError) {
        console.error("Error deleting blob:", delError);
        // Continue with DB deletion even if blob deletion fails
      }
    }

    // Delete the gallery item and its associated translations from the database
    // Prisma's onDelete: Cascade in schema.prisma should handle translations.
    await prisma.gallery.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Gallery item deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error deleting gallery item with ID ${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Gallery item not found." },
          { status: 404 },
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while deleting the gallery item." },
      { status: 500 },
    );
  }
}
