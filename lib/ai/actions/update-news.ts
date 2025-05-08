"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Schema for request validation
const updateNewsSchema = z.object({
  slug: z.string(),
  locale: z.enum(["en", "fa", "ar"]),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

type UpdateNewsData = z.infer<typeof updateNewsSchema>;

export async function updateNews(data: UpdateNewsData) {
  try {
    // Validate the data
    const validatedData = updateNewsSchema.parse(data);

    const { slug, locale, ...updateFields } = validatedData;

    // Check if the news item exists
    const existingNews = await prisma.news.findUnique({
      where: { slug: slug },
      select: { id: true }, // Select id for relation update
    });

    if (!existingNews) {
      return {
        success: false,
        error: `News item with slug "${slug}" not found.`,
      };
    }

    // Find the translation to update
    const existingTranslation = await prisma.newsTranslation.findUnique({
      where: {
        newsId_locale: {
          newsId: existingNews.id,
          locale: locale,
        },
      },
      select: { id: true }, // Select id for update
    });

    if (!existingTranslation) {
      return {
        success: false,
        error: `News translation for slug "${slug}" and locale "${locale}" not found.`,
      };
    }

    // Filter out undefined or null values from updateFields before updating
    const fieldsToUpdate: { [key: string]: any } = {};
    for (const key in updateFields) {
      // Use hasOwnProperty to be safe
      if (Object.prototype.hasOwnProperty.call(updateFields, key)) {
        const value = updateFields[key as keyof typeof updateFields];
        // Only include if not undefined. Allow null explicitly for nullable fields.
        if (value !== undefined) {
          fieldsToUpdate[key] = value;
        }
      }
    }

    // Update the news translation
    const updatedTranslation = await prisma.newsTranslation.update({
      where: {
        id: existingTranslation.id,
      },
      data: fieldsToUpdate,
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

    // Revalidate the news pages
    revalidatePath("/news");
    revalidatePath(`/news/${slug}`); // Revalidate the specific news page

    return {
      success: true,
      data: updatedTranslation,
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
