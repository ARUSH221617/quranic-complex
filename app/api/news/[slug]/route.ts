import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get("locale")

  if (!locale) {
    return NextResponse.json(
      { error: "Locale parameter is required" },
      { status: 400 }
    )
  }

  try {
    const newsItem = await prisma.news.findFirst({
      where: { 
        slug: params.slug,
        locale
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        image: true,
        date: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true
      }
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(newsItem)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    )
  }
}
