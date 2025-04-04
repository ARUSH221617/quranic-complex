import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const galleryItems = await prisma.gallery.findMany({
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        titleFa: true,
        image: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(galleryItems);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch gallery items" },
      { status: 500 }
    );
  }
}
