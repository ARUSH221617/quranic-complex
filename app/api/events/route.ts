import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";

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

const createEventSchema = z.object({
  date: z.string().datetime(),
  time: z.string(),
  location: z.string(),
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
        name: z.string().min(1, { message: "Name is required." }),
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

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const eventItems = await prisma.event.findMany({
      select: {
        id: true,
        slug: true,
        date: true,
        time: true,
        location: true,
        image: true,
        translations: {
          where: { locale },
          select: {
            name: true,
            description: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set.");
      return NextResponse.json(
        { message: "Missing Blob storage configuration." },
        { status: 500 },
      );
    }

    try {
      const blob = await put(
        `events/${Date.now()}-${imageFile.name}`,
        imageFile,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        },
      );
      imagePath = blob.url;
      console.log(`Uploaded to Vercel Blob: ${imagePath}`);
    } catch (uploadError) {
      console.error("Error uploading to Vercel Blob:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload image." },
        { status: 500 },
      );
    }

    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const location = formData.get("location") as string;
    const translationsString = formData.get("translations") as string;

    const validatedData = createEventSchema.parse({
      date,
      time,
      location,
      translations: translationsString,
    });

    const eventItem = await prisma.event.create({
      data: {
        image: imagePath,
        slug: validatedData.translations[0].name.toLowerCase().replace(/\s/g, "-"),
        date: validatedData.date,
        time: validatedData.time,
        location: validatedData.location,
        translations: {
          createMany: {
            data: validatedData.translations.map((t) => ({
              locale: t.locale,
              name: t.name,
              description: t.description,
            })),
          },
        },
      },
      include: {
        translations: true,
      },
    });

    const responseLocale = request.nextUrl.searchParams.get("locale") || "en";
    const responseTranslation =
      eventItem.translations.find((t) => t.locale === responseLocale) ||
      eventItem.translations.find((t) => t.locale === "en") ||
      eventItem.translations[0];

    const formattedResponse: FormattedEvent = {
      id: eventItem.id,
      image: eventItem.image,
      slug: eventItem.slug,
      name: responseTranslation?.name || "",
      description: responseTranslation?.description || null,
      date: eventItem.date,
      time: eventItem.time,
      location: eventItem.location,
    };

    return NextResponse.json(formattedResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating event item:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid event data", errors: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            message:
              "An event item with this unique constraint already exists.",
          },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while creating the event item.",
      },
      { status: 500 },
    );
  }
}
