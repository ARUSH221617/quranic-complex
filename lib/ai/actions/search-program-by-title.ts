"use server";

import { prisma } from "@/lib/prisma";

interface SearchProgramByTitleParams {
  titleQuery: string;
  locale?: "en" | "fa" | "ar";
}

export async function searchProgramByTitle({
  titleQuery,
  locale,
}: SearchProgramByTitleParams) {
  try {
    if (!titleQuery || titleQuery.trim() === "") {
      return {
        success: false,
        error: "Search query cannot be empty.",
      };
    }

    const whereCondition: any = {
      title: {
        contains: titleQuery,
        mode: "insensitive", // Case-insensitive search
      },
    };

    if (locale) {
      whereCondition.locale = locale;
    }

    const programTranslations = await prisma.programTranslation.findMany({
      where: whereCondition,
      select: {
        title: true,
        description: true,
        ageGroup: true,
        schedule: true,
        locale: true,
        program: {
          // Include the parent Program item
          select: {
            id: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: {
        program: {
          createdAt: "desc", // Order by most recent program
        },
      },
      take: 10, // Limit the number of results to 10
    });

    if (!programTranslations || programTranslations.length === 0) {
      return {
        success: true, // Request was successful, but no items found
        data: [],
        message: `No program items found matching "${titleQuery}".`,
      };
    }

    // Format the results for consistency and to avoid deeply nested objects
    const formattedResults = programTranslations.map((pt) => ({
      id: pt.program.id,
      slug: pt.program.slug,
      image: pt.program.image,
      title: pt.title,
      description: pt.description,
      ageGroup: pt.ageGroup,
      schedule: pt.schedule,
      locale: pt.locale,
    }));

    return {
      success: true,
      data: formattedResults,
    };
  } catch (error) {
    console.error("Error searching program by title:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while searching for program items.",
    };
  }
}
