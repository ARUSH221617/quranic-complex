"use server";

import { prisma } from "@/lib/prisma";

// Define the function to get a single program item by slug
export async function getProgramBySlug(slug: string) {
  try {
    // Fetch the program item from the database
    const program = await prisma.program.findUnique({
      where: { slug },
      include: {
        translations: {
          select: {
            locale: true,
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

    // Check if the program item exists
    if (!program) {
      return {
        success: false,
        error: `No program item found with slug "${slug}".`,
      };
    }

    // Return the program item in a formatted structure
    return {
      success: true,
      data: {
        id: program.id,
        slug: program.slug,
        image: program.image,
        translations: program.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          description: translation.description,
          ageGroup: translation.ageGroup,
          schedule: translation.schedule,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          keywords: translation.keywords,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching program by slug:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching the program item.",
    };
  }
}
