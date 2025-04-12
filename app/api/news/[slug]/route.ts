import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Interface for the formatted response
interface NewsDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  image: string | null;
  date: Date;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");

  if (!locale) {
    return NextResponse.json(
      { error: "Locale parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Find news by slug with translations filtered by locale
    const newsItem = await prisma.news.findUnique({
      where: {
        slug: params.slug,
      },
      select: {
        id: true,
        slug: true,
        image: true,
        date: true,
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
          take: 1,
        },
      },
    });

    // Handle not found and no translations cases
    if (!newsItem || newsItem.translations.length === 0) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    // Format the response combining news and translation data
    const translation = newsItem.translations[0];
    const formattedNews: NewsDetail = {
      id: newsItem.id,
      slug: newsItem.slug,
      title: translation.title,
      content: translation.content,
      excerpt: translation.excerpt,
      image: newsItem.image,
      date: newsItem.date,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords,
    };

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error fetching news detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
