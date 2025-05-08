import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Helper function to handle file saving and old file deletion
async function saveFile(
  file: File | null,
  uploadSubDir: string,
  fileNamePrefix: string,
  currentPath: string | null | undefined,
): Promise<string | undefined> {
  if (!file) return undefined; // No new file, return undefined

  // --- Delete old file if it exists ---
  if (currentPath) {
    const oldFilePath = path.join(process.cwd(), "public", currentPath);
    try {
      await fs.promises.unlink(oldFilePath);
      console.log(`Deleted old file: ${oldFilePath}`);
    } catch (err: any) {
      // Ignore error if file doesn't exist, log others
      if (err.code !== "ENOENT") {
        console.error(`Error deleting old file ${oldFilePath}:`, err);
      }
    }
  }

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
  return relativePath; // Return the relative path for DB storage
}

// Define the type for the final formatted output
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

// Schema for PATCH request body validation (text fields)
// Keep fields optional as it's a PATCH request
const updateNewsSchema = z.object({
  slug: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  date: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug: id } = await Promise.resolve(params);
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const news = await prisma.news.findUnique({
      where: {
        slug: id,
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
          take: 1,
        },
      },
    });

    if (!news || news.translations.length === 0) {
      return NextResponse.json(
        {
          message:
            "News item not found or no translation available for the specified locale",
        },
        { status: 404 },
      );
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

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the news item." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug: id } = await Promise.resolve(params);
    const locale = request.nextUrl.searchParams.get("locale") || "en";
    const formData = await request.formData();

    // --- 1. Find the existing news item ---
    const existingNews = await prisma.news.findUnique({
      where: { id: id },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
    });

    // --- 2. Handle missing news item ---
    if (!existingNews) {
      return NextResponse.json(
        { message: "News item not found" },
        { status: 404 },
      );
    }
    const existingTranslation = existingNews.translations[0];

    // --- 2. Prepare Text Data for Update ---
    const validatedData: Record<string, any> = {};
    const formDataKeys = Array.from(formData.keys());
    const textFields = [
      "slug",
      "title",
      "content",
      "excerpt",
      "date",
      "metaTitle",
      "metaDescription",
      "keywords",
    ];

    formDataKeys.forEach((key) => {
      if (textFields.includes(key)) {
        const value = formData.get(key);
        if (typeof value === "string") {
          validatedData[key] = value;
        }
      }
    });

    // --- 3. Handle Image Update ---
    // Basic image validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("remove_image") === "true";
    let newImageUrl: string | null | undefined = undefined;

    if (imageFile) {
      // Validate image file if provided
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

    if (removeImage) {
      // Handle image deletion
      if (existingNews.image) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          existingNews.image,
        );
        try {
          await fs.promises.unlink(oldFilePath);
          console.log(`Deleted old image file: ${oldFilePath}`);
        } catch (err: any) {
          // Only log error if file exists but couldn't be deleted
          if (err.code !== "ENOENT") {
            console.error(`Error deleting old image file ${oldFilePath}:`, err);
          }
        }
      }
      newImageUrl = null;
    } else if (imageFile) {
      // Save new image and get its path
      newImageUrl = await saveFile(
        imageFile,
        "news",
        "news",
        existingNews.image,
      );
    }

    // --- 4. Prepare News Data (Slug & Image) ---
    const newsUpdateData: Prisma.NewsUpdateInput = {};
    let hasNewsChanges = false;

    // Only update image if newImageUrl is explicitly set (not undefined)
    if (newImageUrl !== undefined && newImageUrl !== existingNews.image) {
      newsUpdateData.image = newImageUrl;
      hasNewsChanges = true;
    }

    if (validatedData.date) {
      newsUpdateData.date = new Date(validatedData.date);
      hasNewsChanges = true;
    }

    if (validatedData.slug && validatedData.slug !== existingNews.slug) {
      // Check if new slug is unique (important!)
      const slugExists = await prisma.news.findUnique({
        where: { slug: validatedData.slug },
        select: { id: true },
      });
      // Ensure the slug doesn't belong to another news item
      if (slugExists && slugExists.id !== existingNews.id) {
        return NextResponse.json(
          { message: `Slug "${validatedData.slug}" already exists.` },
          { status: 409 },
        );
      }
      newsUpdateData.slug = validatedData.slug;
      hasNewsChanges = true;
    }

    // --- 5. Prepare Translation Data for Upsert ---
    const translationUpdateData: Prisma.NewsTranslationUpdateWithoutNewsInput =
      {};
    const translationFieldsToUpdate: (keyof Prisma.NewsTranslationUpdateWithoutNewsInput)[] =
      [
        "title",
        "content",
        "excerpt",
        "metaTitle",
        "metaDescription",
        "keywords",
      ];
    let hasTranslationChanges = false;

    translationFieldsToUpdate.forEach((field) => {
      if (validatedData[field] !== undefined) {
        const newValue = ["metaTitle", "metaDescription", "keywords"].includes(
          field,
        )
          ? validatedData[field] || undefined
          : (validatedData[field] ?? "");

        if (
          !existingTranslation ||
          newValue !==
            existingTranslation[field as keyof typeof existingTranslation]
        ) {
          translationUpdateData[field] = newValue;
          hasTranslationChanges = true;
        } else if (
          existingTranslation &&
          newValue ===
            existingTranslation[field as keyof typeof existingTranslation]
        ) {
          hasTranslationChanges = true;
        }
      }
    });

    // Prepare data for the 'create' part of upsert
    const translationCreateData: Prisma.NewsTranslationCreateWithoutNewsInput =
      {
        locale: locale,
        title: validatedData.title ?? "",
        content: validatedData.content ?? "",
        excerpt: validatedData.excerpt ?? "",
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        keywords: validatedData.keywords || null,
      };

    // --- 6. Perform Update ---
    const isCreatingTranslation = !existingTranslation && hasTranslationChanges;
    const isUpdatingNews = hasNewsChanges;
    const isUpdatingTranslation =
      existingTranslation && Object.keys(translationUpdateData).length > 0;

    if (!isUpdatingNews && !isCreatingTranslation && !isUpdatingTranslation) {
      const existingFormattedNews: FormattedNews = {
        id: existingNews.id,
        slug: existingNews.slug,
        title: existingTranslation?.title ?? "",
        content: existingTranslation?.content ?? "",
        excerpt: existingTranslation?.excerpt ?? "",
        image: existingNews.image,
        date: existingNews.date,
        metaTitle: existingTranslation?.metaTitle,
        metaDescription: existingTranslation?.metaDescription,
        keywords: existingTranslation?.keywords,
      };
      return NextResponse.json(existingFormattedNews, { status: 200 });
    }

    type UpdatedNewsSelect = Prisma.NewsGetPayload<{
      select: {
        id: true;
        slug: true;
        image: true;
        date: true;
        translations: {
          select: {
            title: true;
            content: true;
            excerpt: true;
            metaTitle: true;
            metaDescription: true;
            keywords: true;
          };
          where: { locale: string };
          take: 1;
        };
      };
    }>;

    const updatedNews = (await prisma.news.update({
      where: { id: existingNews.id },
      data: {
        ...newsUpdateData,
        translations: {
          upsert: {
            where: {
              newsId_locale: {
                newsId: existingNews.id,
                locale: locale,
              },
            },
            create: translationCreateData,
            update: translationUpdateData,
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
          take: 1,
        },
      },
    })) as UpdatedNewsSelect;

    if (!updatedNews?.translations || updatedNews.translations.length === 0) {
      console.error(
        "Failed to retrieve updated translation after upsert for news:",
        updatedNews,
      );
      throw new Error(
        "Failed to update news item or retrieve updated translation.",
      );
    }

    const updatedTranslation = updatedNews.translations[0];
    const formattedNews: FormattedNews = {
      id: updatedNews.id,
      slug: updatedNews.slug,
      title: updatedTranslation.title,
      content: updatedTranslation.content,
      excerpt: updatedTranslation.excerpt,
      image: updatedNews.image,
      date: updatedNews.date,
      metaTitle: updatedTranslation.metaTitle,
      metaDescription: updatedTranslation.metaDescription,
      keywords: updatedTranslation.keywords,
    };

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error updating news:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta as { target?: string[] })?.target?.join(
          ", ",
        );
        const message = target
          ? `A unique constraint violation occurred on field(s): ${target}. The value might already be in use.`
          : "A unique constraint violation occurred. The slug might already be in use.";

        return NextResponse.json({ message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { message: "An error occurred while updating the news item." },
      { status: 500 },
    );
  }
}
