"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";

// Schema for request validation
const createNewsSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  date: z.string().transform((str) => new Date(str)),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  locale: z.enum(["en", "fa", "ar"]).default("en"),
});

// Helper function to handle file saving
async function saveFile(
  file: File | null,
  uploadSubDir: string,
  fileNamePrefix: string,
): Promise<string | undefined> {
  if (!file) return undefined;

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

export async function createNews(data: FormData) {
  try {
    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = data.get("image") as File | null;
    if (imageFile) {
      if (imageFile.size > MAX_FILE_SIZE) {
        throw new Error("Image must be less than 5MB");
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        throw new Error("Invalid image file type. Allowed types: JPEG, PNG, WebP");
      }
    }

    // Extract and validate news data
    const newsData = {
      slug: data.get("slug"),
      title: data.get("title"),
      content: data.get("content"),
      excerpt: data.get("excerpt"),
      date: data.get("date"),
      metaTitle: data.get("metaTitle"),
      metaDescription: data.get("metaDescription"),
      keywords: data.get("keywords"),
      locale: data.get("locale") || "en",
    };

    // Validate the data
    const validatedData = createNewsSchema.parse(newsData);

    // Check if slug is unique
    const existingNews = await prisma.news.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingNews) {
      throw new Error(`A news item with slug "${validatedData.slug}" already exists.`);
    }

    // Save image if provided
    const imagePath = imageFile ? await saveFile(imageFile, "news", "news") : null;

    // Create news with translation
    const news = await prisma.news.create({
      data: {
        slug: validatedData.slug,
        image: imagePath,
        date: validatedData.date,
        translations: {
          create: {
            locale: validatedData.locale,
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
            locale: validatedData.locale,
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

    // Revalidate the news pages
    revalidatePath("/news");
    revalidatePath("/news/[slug]");

    return {
      success: true,
      data: {
        id: news.id,
        slug: news.slug,
        title: news.translations[0].title,
        content: news.translations[0].content,
        excerpt: news.translations[0].excerpt,
        image: news.image,
        date: news.date,
        metaTitle: news.translations[0].metaTitle,
        metaDescription: news.translations[0].metaDescription,
        keywords: news.translations[0].keywords,
      },
    };
  } catch (error) {
    console.error("Error creating news:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while creating the news item.",
    };
  }
}