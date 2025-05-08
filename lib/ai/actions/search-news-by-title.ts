"use server";

import { prisma } from "@/lib/prisma";

interface SearchNewsByTitleParams {
  titleQuery: string;
  locale?: "en" | "fa" | "ar";
}

export async function searchNewsByTitle({
  titleQuery,
  locale,
}: SearchNewsByTitleParams) {
  try {
    if (!titleQuery || titleQuery.trim() === "") {
      return {
        success: false,
        error: "Search query cannot be empty.",
      };
    }

    const whereCondition: any = {
      title: {
        contains: titleQuery,
        mode: "insensitive", // Case-insensitive search
      },
    };

    if (locale) {
      whereCondition.locale = locale;
    }

    const newsTranslations = await prisma.newsTranslation.findMany({
      where: whereCondition,
      select: {
        title: true,
        excerpt: true,
        locale: true,
        news: {
          // Include the parent News item
          select: {
            id: true,
            slug: true,
            date: true,
            image: true,
          },
        },
      },
      orderBy: {
        news: {
          date: "desc", // Order by most recent news
        },
      },
      take: 10, // Limit the number of results to 10
    });

    if (!newsTranslations || newsTranslations.length === 0) {
      return {
        success: true, // Request was successful, but no items found
        data: [],
        message: `No news items found matching "${titleQuery}".`,
      };
    }

    // Format the results for consistency and to avoid deeply nested objects
    const formattedResults = newsTranslations.map((nt) => ({
      id: nt.news.id,
      slug: nt.news.slug,
      date: nt.news.date,
      image: nt.news.image,
      title: nt.title,
      excerpt: nt.excerpt,
      locale: nt.locale,
    }));

    return {
      success: true,
      data: formattedResults,
    };
  } catch (error) {
    console.error("Error searching news by title:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while searching for news items.",
    };
  }
}