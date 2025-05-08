"use server";

import { prisma } from "@/lib/prisma";

export async function getLatestNews({
  limit = 5,
  locale = "en",
}: {
  limit?: number;
  locale?: string;
}) {
  try {
    const news = await prisma.news.findMany({
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        translations: {
          where: {
            locale: locale,
          },
          select: {
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

    // Map the results to a more friendly format
    const formattedNews = news.map((item) => ({
      id: item.id,
      slug: item.slug,
      date: item.date,
      image: item.image,
      title: item.translations[0]?.title || "",
      content: item.translations[0]?.content || "",
      excerpt: item.translations[0]?.excerpt || "",
      metaTitle: item.translations[0]?.metaTitle || null,
      metaDescription: item.translations[0]?.metaDescription || null,
      keywords: item.translations[0]?.keywords || null,
    }));

    return {
      success: true,
      data: formattedNews,
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching news items.",
    };
  }
}
