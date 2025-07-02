import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the type for the formatted output
interface FormattedGalleryItem {
  id: string;
  image: string;
  category: string;
  title: string;
  description: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const galleryItems = await prisma.gallery.findMany({
      select: {
        id: true,
        image: true,
        category: true,
        translations: {
          where: { locale },
          select: {
            title: true,
            description: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedGallery: FormattedGalleryItem[] = galleryItems
      .filter((item) => item.translations.length > 0)
      .map((item) => {
        const translation = item.translations[0];
        return {
          id: item.id,
          image: item.image,
          category: item.category,
          title: translation.title,
          description: translation.description,
        };
      });

    return NextResponse.json(formattedGallery);
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching gallery items." },
      { status: 500 },
    );
  }
}
