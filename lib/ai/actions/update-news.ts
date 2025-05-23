"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, del } from '@vercel/blob';
import { Prisma } from "@prisma/client";

// Schema for request validation from FormData
const updateNewsFormSchema = z.object({
  slug: z.string(),
  locale: z.enum(["en", "fa", "ar"]),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  date: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
  image: z.instanceof(File).optional().nullable(),
  remove_image: z.string().transform(val => val === 'true').optional(),
});

export async function updateNews(formData: FormData) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set.');
      return {
        success: false,
        error: 'Missing Blob storage configuration. Cannot process image.',
      };
    }

    // Extract data from FormData
    const rawData = {
      slug: formData.get("slug"),
      locale: formData.get("locale"),
      title: formData.get("title"),
      content: formData.get("content"),
      excerpt: formData.get("excerpt"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      keywords: formData.get("keywords"),
      date: formData.get("date"),
      image: formData.get("image"),
      remove_image: formData.get("remove_image"),
    };

    // Validate the data
    const validatedData = updateNewsFormSchema.parse(rawData);
    const { slug, locale, image: imageFile, remove_image, ...textAndDateFields } = validatedData;

    // Check if the news item exists
    const existingNews = await prisma.news.findUnique({
      where: { slug: slug },
      select: { id: true, image: true }, // Select id and current image for update
    });

    if (!existingNews) {
      return {
        success: false,
        error: `News item with slug "${slug}" not found.`,
      };
    }

    let newImageUrl: string | null | undefined = undefined; // undefined means no change, null means remove

    // Basic image validation (if a new image is provided)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (imageFile && imageFile.size > 0) { // Check if a file is actually provided
      if (imageFile.size > MAX_FILE_SIZE) {
        return { success: false, error: "Image must be less than 5MB" };
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return { success: false, error: "Invalid image file type. Allowed types: JPEG, PNG, WebP" };
      }

      // New image provided, delete old one from Blob if it exists
      if (existingNews.image) {
        try {
          await del(existingNews.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
          console.log(`Deleted old blob: ${existingNews.image}`);
        } catch (e: any) {
          console.error("Failed to delete old blob, continuing with upload:", e.message);
          // Optionally return an error if old blob deletion is critical
        }
      }
      // Upload new image to Blob
      try {
        const blob = await put(`news/${Date.now()}-${imageFile.name}`, imageFile, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        newImageUrl = blob.url;
        console.log(`Uploaded new blob: ${newImageUrl}`);
      } catch (e: any) {
        console.error("Failed to upload new blob:", e.message);
        return { success: false, error: `Failed to upload new image: ${e.message}` };
      }
    } else if (remove_image) {
      // remove_image flag is true, delete existing image from Blob if it exists
      if (existingNews.image) {
        try {
          await del(existingNews.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
          console.log(`Deleted blob due to remove_image flag: ${existingNews.image}`);
          newImageUrl = null; // Explicitly set to null for DB update
        } catch (e: any) {
          console.error("Failed to delete blob on removal:", e.message);
          return { success: false, error: `Failed to delete image: ${e.message}` };
        }
      } else {
        newImageUrl = null; // No existing image, but remove_image was true, ensure it's null
      }
    }

    // --- Prepare News Data (Image & Date) ---
    const newsUpdatePayload: Prisma.NewsUpdateInput = {};
    let hasNewsChanges = false;

    if (newImageUrl !== undefined) { // if newImageUrl is null (removed) or a new URL
      newsUpdatePayload.image = newImageUrl;
      hasNewsChanges = true;
    }
    if (textAndDateFields.date !== undefined && textAndDateFields.date !== null) {
        newsUpdatePayload.date = textAndDateFields.date;
        hasNewsChanges = true;
    }
    
    // --- Update News item if there are changes ---
    if (hasNewsChanges) {
        await prisma.news.update({
            where: { id: existingNews.id },
            data: newsUpdatePayload,
        });
    }
    
    // --- Prepare and Update Translation ---
    // Find the translation to update or create
    const translationFields: { [key: string]: any } = {};
    const translationKeys: (keyof typeof textAndDateFields)[] = [
      "title", "content", "excerpt", "metaTitle", "metaDescription", "keywords"
    ];

    translationKeys.forEach(key => {
      if (textAndDateFields[key] !== undefined) {
        translationFields[key] = textAndDateFields[key] === null ? Prisma.DbNull : textAndDateFields[key];
      }
    });


    const updatedTranslation = await prisma.newsTranslation.upsert({
      where: {
        newsId_locale: { newsId: existingNews.id, locale: locale },
      },
      update: translationFields,
      create: {
        newsId: existingNews.id,
        locale: locale,
        title: validatedData.title || "", // Provide default if not present
        content: validatedData.content || "",
        excerpt: validatedData.excerpt || "",
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        keywords: validatedData.keywords,
      },
      select: {
        id: true,
        locale: true,
        title: true,
        content: true,
        excerpt: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
      },
    });
    
    // Refetch the news item to include potentially updated image and date for the return
    const finalNewsData = await prisma.news.findUnique({
        where: { id: existingNews.id },
        select: {
            id: true,
            slug: true,
            image: true,
            date: true,
        }
    });


    // Revalidate the news pages
    revalidatePath("/news");
    revalidatePath(`/news/${slug}`); // Revalidate the specific news page

    return {
      success: true,
      data: {
        ...updatedTranslation, // Contains translation fields
        slug: finalNewsData?.slug, // Add slug from news
        image: finalNewsData?.image, // Add image from news
        date: finalNewsData?.date,   // Add date from news
      },
    };
  } catch (error) {
    console.error("Error updating news:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating the news item.",
    };
  }
}
