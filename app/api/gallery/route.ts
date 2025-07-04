import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";

// Define the type for the formatted output when retrieving a list (for data table)
interface FormattedGalleryItem {
  id: string;
  image: string; // The URL of the image
  category: string;
  title: string; // The title in the requested locale
  description: string | null; // The description in the requested locale
}

// Schema for POST request validation (for FormData parsing)
const createGallerySchema = z.object({
  category: z.string().min(1, { message: "Category is required." }),
  translations: z.string().transform((str, ctx) => {
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
        locale: z.string().min(1, { message: "Locale is required." }),
        title: z.string().min(1, { message: "Title is required." }),
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
  }),
});

// GET handler for fetching all gallery items (with a single translation per item)
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const galleryItems = await prisma.gallery.findMany({
      select: {
        id: true,
        image: true,
        category: true,
        translations: {
          where: { locale },
          select: {
            title: true,
            description: true,
          },
          take: 1, // Get only one translation for the specified locale
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedGallery: FormattedGalleryItem[] = galleryItems
      .filter((item) => item.translations.length > 0) // Only include items with a translation for the requested locale
      .map((item) => {
        const translation = item.translations[0]; // Guaranteed to exist due to filter and take: 1
        return {
          id: item.id,
          image: item.image,
          category: item.category,
          title: translation.title,
          description: translation.description,
        };
      });

    return NextResponse.json(formattedGallery);
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching gallery items." },
      { status: 500 },
    );
  }
}

// POST handler for creating new gallery items
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    let imagePath: string | null = null;

    if (!imageFile) {
      return NextResponse.json(
        { message: "Image file is required." },
        { status: 400 },
      );
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Image must be less than 5MB." },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        {
          message: "Invalid image file type. Allowed types: JPEG, PNG, WebP.",
        },
        { status: 400 },
      );
    }

    // Check for Vercel Blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set.");
      return NextResponse.json(
        { message: "Missing Blob storage configuration." },
        { status: 500 },
      );
    }

    // Upload image to Vercel Blob
    try {
      const blob = await put(
        `gallery/${Date.now()}-${imageFile.name}`,
        imageFile,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        },
      );
      imagePath = blob.url; // Store the URL from Vercel Blob
      console.log(`Uploaded to Vercel Blob: ${imagePath}`);
    } catch (uploadError) {
      console.error("Error uploading to Vercel Blob:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload image." },
        { status: 500 },
      );
    }

    // Extract and validate gallery data
    const category = formData.get("category") as string;
    const translationsString = formData.get("translations") as string;

    // Validate the data using Zod schema
    const validatedData = createGallerySchema.parse({
      category,
      translations: translationsString,
    });

    // Create gallery item with translations
    const galleryItem = await prisma.gallery.create({
      data: {
        image: imagePath,
        category: validatedData.category,
        translations: {
          createMany: {
            data: validatedData.translations.map((t) => ({
              locale: t.locale,
              title: t.title,
              description: t.description,
            })),
          },
        },
      },
      // Include translations to format the response
      include: {
        translations: true,
      },
    });

    // Format the response to match FormattedGalleryItem (for the default/English locale)
    const responseLocale = request.nextUrl.searchParams.get("locale") || "en";
    const responseTranslation =
      galleryItem.translations.find((t) => t.locale === responseLocale) ||
      galleryItem.translations.find((t) => t.locale === "en") ||
      galleryItem.translations[0]; // Fallback to the first available translation

    const formattedResponse: FormattedGalleryItem = {
      id: galleryItem.id,
      image: galleryItem.image,
      category: galleryItem.category,
      title: responseTranslation?.title || "",
      description: responseTranslation?.description || null,
    };

    return NextResponse.json(formattedResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery item:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid gallery data", errors: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors (e.g., unique constraint violation, if category/image combination was unique)
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            message:
              "A gallery item with this unique constraint already exists.",
          },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while creating the gallery item.",
      },
      { status: 500 },
    );
  }
}
