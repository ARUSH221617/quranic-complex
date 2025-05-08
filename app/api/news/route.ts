import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Helper function to handle file saving
async function saveFile(
  file: File | null,
  uploadSubDir: string,
  fileNamePrefix: string,
): Promise<string | undefined> {
  if (!file) return undefined;

  // --- Save new file ---
  const uploadDir = path.join(process.cwd(), "public", "uploads", uploadSubDir);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${fileNamePrefix}-${uniqueSuffix}${path.extname(file.name)}`;
  const filePath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.promises.writeFile(filePath, buffer);

  const relativePath = `/uploads/${uploadSubDir}/${filename}`;
  console.log(`Saved new file: ${filePath} (relative: ${relativePath})`);
  return relativePath;
}

// Schema for POST request validation
const createNewsSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  date: z.string().transform((str) => new Date(str)),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

// Define the type for the formatted output
interface FormattedNews {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  image: string | null;
  date: Date;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const newsItems = await prisma.news.findMany({
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
      orderBy: {
        date: "desc",
      },
    });

    const formattedNews: FormattedNews[] = newsItems
      .filter((news) => news.translations.length > 0)
      .map((news) => {
        const translation = news.translations[0];
        return {
          id: news.id,
          slug: news.slug,
          title: translation.title,
          content: translation.content,
          excerpt: translation.excerpt,
          image: news.image,
          date: news.date,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          keywords: translation.keywords,
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

// POST handler for creating new news items
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    if (imageFile) {
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "Image must be less than 5MB" },
          { status: 400 },
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          {
            message: "Invalid image file type. Allowed types: JPEG, PNG, WebP",
          },
          { status: 400 },
        );
      }
    }

    // Extract and validate news data
    const newsData = {
      slug: formData.get("slug"),
      title: formData.get("title"),
      content: formData.get("content"),
      excerpt: formData.get("excerpt"),
      date: formData.get("date"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      keywords: formData.get("keywords"),
    };

    // Validate the data
    const validatedData = createNewsSchema.parse(newsData);

    // Check if slug is unique
    const existingNews = await prisma.news.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingNews) {
      return NextResponse.json(
        {
          message: `A news item with slug "${validatedData.slug}" already exists.`,
        },
        { status: 409 },
      );
    }

    // Save image if provided
    const imagePath = imageFile
      ? await saveFile(imageFile, "news", "news")
      : null;

    // Create news with translation
    const news = await prisma.news.create({
      data: {
        slug: validatedData.slug,
        image: imagePath,
        date: validatedData.date,
        translations: {
          create: {
            locale: locale,
            title: validatedData.title,
            content: validatedData.content,
            excerpt: validatedData.excerpt,
            metaTitle: validatedData.metaTitle || null,
            metaDescription: validatedData.metaDescription || null,
            keywords: validatedData.keywords || null,
          },
        },
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
        },
      },
    });

    if (!news.translations.length) {
      throw new Error("Failed to create news translation");
    }

    const translation = news.translations[0];
    const formattedNews: FormattedNews = {
      id: news.id,
      slug: news.slug,
      title: translation.title,
      content: translation.content,
      excerpt: translation.excerpt,
      image: news.image,
      date: news.date,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords,
    };

    return NextResponse.json(formattedNews, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid news data", errors: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "A news item with this slug already exists." },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while creating the news item." },
      { status: 500 },
    );
  }
}
