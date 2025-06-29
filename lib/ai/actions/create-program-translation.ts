"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Schema for request validation
const createProgramTranslationSchema = z.object({
  slug: z.string().describe("The slug of the program item to translate."),
  locale: z
    .enum(["en", "fa", "ar"])
    .describe(
      "The locale for the new translation (must be one of: 'en', 'fa', 'ar').",
    ),
  title: z
    .string()
    .describe("The title of the program item in the new locale."),
  description: z
    .string()
    .describe(
      "The full description of the program item in the new locale (can be in Markdown or HTML).",
    ),
  ageGroup: z
    .string()
    .describe("The age group for the program in the new locale."),
  schedule: z
    .string()
    .describe("The schedule details for the program in the new locale."),
  metaTitle: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO meta title in the new locale."),
  metaDescription: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO meta description in the new locale."),
  keywords: z
    .string()
    .optional()
    .nullable()
    .describe("Optional SEO keywords (comma-separated) in the new locale."),
});

type CreateProgramTranslationData = z.infer<
  typeof createProgramTranslationSchema
>;

export async function createProgramTranslation(
  data: CreateProgramTranslationData,
) {
  try {
    // Validate the data
    const validatedData = createProgramTranslationSchema.parse(data);

    const { slug, locale, ...translationData } = validatedData;

    // Find the program item by slug
    const existingProgram = await prisma.program.findUnique({
      where: { slug: slug },
      select: { id: true }, // Select id for relation creation
    });

    if (!existingProgram) {
      return {
        success: false,
        error: `Program item with slug "${slug}" not found.`,
      };
    }

    // Check if a translation for this locale already exists for this program item
    const existingTranslation = await prisma.programTranslation.findUnique({
      where: {
        programId_locale: {
          programId: existingProgram.id,
          locale: locale,
        },
      },
      select: { id: true },
    });

    if (existingTranslation) {
      return {
        success: false,
        error: `Translation for locale "${locale}" already exists for program item with slug "${slug}".`,
      };
    }

    // Create the new program translation
    const newTranslation = await prisma.programTranslation.create({
      data: {
        programId: existingProgram.id,
        locale: locale,
        title: translationData.title,
        description: translationData.description,
        ageGroup: translationData.ageGroup,
        schedule: translationData.schedule,
        metaTitle: translationData.metaTitle || null,
        metaDescription: translationData.metaDescription || null,
        keywords: translationData.keywords || null,
      },
      select: {
        id: true,
        locale: true,
        title: true,
      },
    });

    // Revalidate the program pages
    revalidatePath("/programs");
    revalidatePath(`/programs/${slug}`); // Revalidate the specific program page

    return {
      success: true,
      data: newTranslation,
    };
  } catch (error) {
    console.error("Error creating program translation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating the program translation.",
    };
  }
}
