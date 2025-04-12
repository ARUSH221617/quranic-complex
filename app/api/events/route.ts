import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define the type for the final formatted output
interface FormattedEvent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  date: Date;
  time: string;
  location: string;
  image: string | null;
}

// Define the expected structure returned by the Prisma query
type EventWithTranslationSelect = Prisma.EventGetPayload<{
  select: {
    id: true;
    slug: true;
    date: true;
    time: true;
    location: true;
    image: true;
    translations: {
      select: {
        name: true;
        description: true;
      };
      where: {
        locale: string;
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

    // Get events from the database
    const eventItems = await prisma.event.findMany({
      select: {
        id: true,
        slug: true,
        date: true,
        time: true,
        location: true,
        image: true,
        translations: {
          where: {
            locale: locale,
          },
          select: {
            name: true,
            description: true,
          },
          take: 1,
        },
      },
      orderBy: { date: "asc" },
      where: {
        date: {
          gte: new Date(), // Only future events
        },
      },
    });

    // Filter and map results
    const formattedEvents: FormattedEvent[] = eventItems
      .filter(
        (item): item is EventWithTranslationSelect & {
          translations: [NonNullable<EventWithTranslationSelect["translations"][0]>];
        } => item.translations.length > 0,
      )
      .map((item) => {
        const translation = item.translations[0];
        return {
          id: item.id,
          slug: item.slug,
          name: translation.name,
          description: translation.description,
          date: item.date,
          time: item.time,
          location: item.location,
          image: item.image,
        };
      });

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching events." },
      { status: 500 },
    );
  }
}