import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { put, del } from "@vercel/blob";
import { Prisma } from "@prisma/client";

const updateEventSchema = z.object({
  date: z.string().datetime(),
  time: z.string(),
  location: z.string(),
  translations: z
    .string()
    .transform((str, ctx) => {
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
          locale: z.string().min(1, "Locale is required."),
          name: z.string().min(1, "Name is required."),
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
    })
    .optional(),
});

interface FormattedEventItemDetail {
  id: string;
  image: string | null;
  date: Date;
  time: string;
  location: string;
  translations: { locale: string; name: string; description: string | null }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const eventItem = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        date: true,
        time: true,
        location: true,
        translations: {
          select: {
            locale: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!eventItem) {
      return NextResponse.json(
        { message: "Event item not found." },
        { status: 404 },
      );
    }

    const formattedResponse: FormattedEventItemDetail = {
      id: eventItem.id,
      image: eventItem.image,
      date: eventItem.date,
      time: eventItem.time,
      location: eventItem.location,
      translations: eventItem.translations.map((t) => ({
        locale: t.locale,
        name: t.name,
        description: t.description,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error(`Error fetching event item with ID ${params.id}:`, error);
    return NextResponse.json(
      { message: "An error occurred while fetching the event item." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const formData = await request.formData();

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const location = formData.get("location") as string;
    const translationsString = formData.get("translations") as string;

    const currentEventItem = await prisma.event.findUnique({
      where: { id },
      select: { image: true },
    });

    if (!currentEventItem) {
      return NextResponse.json(
        { message: "Event item not found for update." },
        { status: 404 },
      );
    }

    let newImageUrl: string | null = currentEventItem.image;

    const isNewFileSelected = imageFile instanceof File && imageFile.size > 0;
    const isImageCleared = imageFile instanceof File && imageFile.size === 0;

    if (isNewFileSelected) {
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "New image must be less than 5MB." },
          { status: 400 },
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          {
            message:
              "Invalid new image file type. Allowed types: JPEG, PNG, WebP.",
          },
          { status: 400 },
        );
      }

      if (
        process.env.BLOB_READ_WRITE_TOKEN &&
        currentEventItem.image &&
        currentEventItem.image.includes("vercel-storage.com")
      ) {
        try {
          await del(currentEventItem.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
        } catch (deleteError) {
          console.error(
            "Error deleting old blob for replacement:",
            deleteError,
          );
        }
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
        newImageUrl = blob.url;
      } catch (uploadError) {
        console.error("Error uploading new blob:", uploadError);
        return NextResponse.json(
          { message: "Failed to upload new image." },
          { status: 500 },
        );
      }
    } else if (isImageCleared) {
      if (
        process.env.BLOB_READ_WRITE_TOKEN &&
        currentEventItem.image &&
        currentEventItem.image.includes("vercel-storage.com")
      ) {
        try {
          await del(currentEventItem.image, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
        } catch (delError) {
          console.error("Error deleting old blob on clear:", delError);
        }
      }
      newImageUrl = null;
    }

    const validatedFields = updateEventSchema.safeParse({
      date,
      time,
      location,
      translations: translationsString,
    });

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          message: "Invalid event data",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const { translations, ...otherValidatedData } = validatedFields.data;

    const updateData: Prisma.EventUpdateInput = {
      ...otherValidatedData,
      image: newImageUrl,
    };

    if (translations && translations.length > 0) {
      const slug = translations[0].name.toLowerCase().replace(/\s/g, "-");
      updateData.slug = slug;
    }

    await prisma.$transaction(async (tx) => {
      if (translations) {
        await tx.eventTranslation.deleteMany({
          where: { eventId: id },
        });

        await tx.eventTranslation.createMany({
          data: translations.map((t) => ({
            eventId: id,
            locale: t.locale,
            name: t.name,
            description: t.description || null,
          })),
        });
      }

      await tx.event.update({
        where: { id },
        data: updateData,
      });
    });

    const updatedEventItem = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        date: true,
        time: true,
        location: true,
        translations: {
          select: {
            locale: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!updatedEventItem) {
      throw new Error("Failed to retrieve updated event item.");
    }

    const formattedResponse: FormattedEventItemDetail = {
      id: updatedEventItem.id,
      image: updatedEventItem.image,
      date: updatedEventItem.date,
      time: updatedEventItem.time,
      location: updatedEventItem.location,
      translations: updatedEventItem.translations.map((t) => ({
        locale: t.locale,
        name: t.name,
        description: t.description,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error(`Error updating event item with ID ${params.id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid event data", errors: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Event item not found." },
          { status: 404 },
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while updating the event item." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const eventItem = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
      },
    });

    if (!eventItem) {
      return NextResponse.json(
        { message: "Event item not found." },
        { status: 404 },
      );
    }

    if (
      process.env.BLOB_READ_WRITE_TOKEN &&
      eventItem.image &&
      eventItem.image.includes("vercel-storage.com")
    ) {
      try {
        await del(eventItem.image, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (delError) {
        console.error("Error deleting blob:", delError);
      }
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Event item deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error deleting event item with ID ${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Event item not found." },
          { status: 404 },
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while deleting the event item." },
      { status: 500 },
    );
  }
}
