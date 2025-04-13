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
const createProgramSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  ageGroup: z.string(),
  schedule: z.string(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

// Define the type for the formatted output
interface FormattedProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  image: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
}

// GET handler (existing code)
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const programs = await prisma.program.findMany({
      select: {
        id: true,
        slug: true,
        image: true,
        translations: {
          where: {
            locale: locale,
          },
          select: {
            title: true,
            description: true,
            ageGroup: true,
            schedule: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedPrograms: FormattedProgram[] = programs
      .filter((program) => program.translations.length > 0)
      .map((program) => {
        const translation = program.translations[0];
        return {
          id: program.id,
          slug: program.slug,
          title: translation.title,
          description: translation.description,
          ageGroup: translation.ageGroup,
          schedule: translation.schedule,
          image: program.image,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          keywords: translation.keywords,
        };
      });

    return NextResponse.json(formattedPrograms);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching programs." },
      { status: 500 },
    );
  }
}

// POST handler for creating new programs
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
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          { message: "Invalid image file type. Allowed types: JPEG, PNG, WebP" },
          { status: 400 }
        );
      }
    }

    // Extract and validate program data
    const programData = {
      slug: formData.get("slug"),
      title: formData.get("title"),
      description: formData.get("description"),
      ageGroup: formData.get("ageGroup"),
      schedule: formData.get("schedule"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      keywords: formData.get("keywords"),
    };

    // Validate the data
    const validatedData = createProgramSchema.parse(programData);

    // Check if slug is unique
    const existingProgram = await prisma.program.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProgram) {
      return NextResponse.json(
        { message: `A program with slug "${validatedData.slug}" already exists.` },
        { status: 409 }
      );
    }

    // Save image if provided
    const imagePath = imageFile
      ? await saveFile(imageFile, "programs", "program")
      : null;

    // Create program with translation
    const program = await prisma.program.create({
      data: {
        slug: validatedData.slug,
        image: imagePath,
        translations: {
          create: {
            locale: locale,
            title: validatedData.title,
            description: validatedData.description,
            ageGroup: validatedData.ageGroup,
            schedule: validatedData.schedule,
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
        translations: {
          where: {
            locale: locale,
          },
          select: {
            title: true,
            description: true,
            ageGroup: true,
            schedule: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
          },
        },
      },
    });

    if (!program.translations.length) {
      throw new Error("Failed to create program translation");
    }

    const translation = program.translations[0];
    const formattedProgram: FormattedProgram = {
      id: program.id,
      slug: program.slug,
      title: translation.title,
      description: translation.description,
      ageGroup: translation.ageGroup,
      schedule: translation.schedule,
      image: program.image,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords,
    };

    return NextResponse.json(formattedProgram, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid program data", errors: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "A program with this slug already exists." },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { message: "An error occurred while creating the program." },
      { status: 500 }
    );
  }
}