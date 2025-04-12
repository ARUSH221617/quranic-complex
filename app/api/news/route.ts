import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define the type for the final formatted output
interface FormattedNews {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  date: Date;
  metaTitle: string | null;
  metaDescription: string | null;
}

// Define the expected structure returned by the Prisma query
type NewsWithTranslationSelect = Prisma.NewsGetPayload<{
  select: {
    // Correct top-level select
    id: true;
    slug: true;
    image: true;
    date: true;
    translations: {
      // Nested select for translations
      select: {
        title: true;
        excerpt: true;
        metaTitle: true;
        metaDescription: true;
      };
      where: {
        // Filter within the nested select
        locale: string; // Placeholder, will be replaced by variable
      };
      take: 1;
    };
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale");

    if (!locale) {
      return NextResponse.json(
        { message: "Locale parameter is required" },
        { status: 400 },
      );
    }

    // Corrected Prisma query structure
    const newsItems = await prisma.news.findMany({
      select: {
        // Use only select at the top level
        id: true,
        slug: true,
        image: true,
        date: true,
        translations: {
          // Select and filter translations here
          where: {
            locale: locale, // Apply locale filter to translations
          },
          select: {
            title: true,
            excerpt: true,
            metaTitle: true,
            metaDescription: true,
          },
          take: 1,
        },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Filter and map results (same logic as before)
    const formattedNews: FormattedNews[] = newsItems
      .filter(
        (
          item,
        ): item is NewsWithTranslationSelect & {
          translations: [
            NonNullable<NewsWithTranslationSelect["translations"][0]>,
          ];
        } => item.translations.length > 0,
      )
      .map((item) => {
        const translation = item.translations[0];
        return {
          id: item.id,
          slug: item.slug,
          title: translation.title,
          excerpt: translation.excerpt,
          image: item.image,
          date: item.date,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
        };
      });

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching news." },
      { status: 500 },
    );
  }
}
