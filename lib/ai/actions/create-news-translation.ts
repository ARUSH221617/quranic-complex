"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Schema for request validation
const createNewsTranslationSchema = z.object({
  slug: z.string().describe("The slug of the news item to translate."),
  locale: z
    .enum(["en", "fa", "ar"])
    .describe(
      "The locale for the new translation (must be one of: 'en', 'fa', 'ar').",
    ),
  title: z.string().describe("The title of the news item in the new locale."),
  content: z
    .string()
    .describe(
      "The full content of the news item in the new locale (can be in Markdown or HTML).",
    ),
  excerpt: z
    .string()
    .describe("A short summary of the news item in the new locale."),
  metaTitle: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO meta title in the new locale."),
  metaDescription: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO meta description in the new locale."),
  keywords: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO keywords (comma-separated) in the new locale."),
});

type CreateNewsTranslationData = z.infer<typeof createNewsTranslationSchema>;

export async function createNewsTranslation(data: CreateNewsTranslationData) {
  try {
    // Validate the data
    const validatedData = createNewsTranslationSchema.parse(data);

    const { slug, locale, ...translationData } = validatedData;

    // Find the news item by slug
    const existingNews = await prisma.news.findUnique({
      where: { slug: slug },
      select: { id: true }, // Select id for relation creation
    });

    if (!existingNews) {
      return {
        success: false,
        error: `News item with slug "${slug}" not found.`,
      };
    }

    // Check if a translation for this locale already exists for this news item
    const existingTranslation = await prisma.newsTranslation.findUnique({
      where: {
        newsId_locale: {
          newsId: existingNews.id,
          locale: locale,
        },
      },
      select: { id: true },
    });

    if (existingTranslation) {
      return {
        success: false,
        error: `Translation for locale "${locale}" already exists for news item with slug "${slug}".`,
      };
    }

    // Create the new news translation
    const newTranslation = await prisma.newsTranslation.create({
      data: {
        newsId: existingNews.id,
        locale: locale,
        title: translationData.title,
        content: translationData.content,
        excerpt: translationData.excerpt,
        metaTitle: translationData.metaTitle || null,
        metaDescription: translationData.metaDescription || null,
        keywords: translationData.keywords || null,
      },
      select: {
        id: true,
        locale: true,
        title: true,
      },
    });

    // Revalidate the news pages
    revalidatePath("/news");
    revalidatePath(`/news/${slug}`); // Revalidate the specific news page

    return {
      success: true,
      data: newTranslation,
    };
  } catch (error) {
    console.error("Error creating news translation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating the news translation.",
    };
  }
}
