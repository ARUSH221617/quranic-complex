"use server";

import { prisma } from "@/lib/prisma";

// Define the function to get a single news item by slug
export async function getNewsBySlug(slug: string) {
  try {
    // Fetch the news item from the database
    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        translations: {
          select: {
            locale: true,
            title: true,
            content: true,
            excerpt: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
          },
        },
      },
    });

    // Check if the news item exists
    if (!news) {
      return {
        success: false,
        error: `No news item found with slug "${slug}".`,
      };
    }

    // Return the news item in a formatted structure
    return {
      success: true,
      data: {
        id: news.id,
        slug: news.slug,
        image: news.image,
        date: news.date,
        translations: news.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          content: translation.content,
          excerpt: translation.excerpt,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          keywords: translation.keywords,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching news by slug:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching the news item.",
    };
  }
}
