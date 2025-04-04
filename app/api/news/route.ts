import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");

  if (!locale) {
    return NextResponse.json(
      { error: "Locale parameter is required" },
      { status: 400 }
    );
  }

  try {
    const news = await prisma.news.findMany({
      where: { locale },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        date: true,
        metaTitle: true,
        metaDescription: true
      }
    });

    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
