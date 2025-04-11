import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma namespace for types

// Define the type for the final formatted output
interface FormattedProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  image: string | null;
}

// Define the expected structure returned by the Prisma query
// This uses Prisma's generated types for better accuracy and maintainability
type ProgramWithTranslationSelect = Prisma.ProgramGetPayload<{
  select: {
    id: true;
    slug: true;
    image: true;
    translations: {
      select: {
        title: true;
        description: true;
        ageGroup: true;
        schedule: true;
      };
      take: 1; // Ensure we only expect one translation
    };
  };
}>;

export async function GET(request: NextRequest) {
  // Use NextRequest type
  try {
    // Use nextUrl for easier search param handling
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
          },
          take: 1, // Explicitly take only the first matching translation
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Filter programs where a translation for the specified locale was found
    // and format the output.
    const formattedPrograms: FormattedProgram[] = programs
      // Type assertion helps ensure we only process programs with translations
      .filter(
        (
          program,
        ): program is ProgramWithTranslationSelect & {
          translations: [
            NonNullable<ProgramWithTranslationSelect["translations"][0]>,
          ];
        } => program.translations.length > 0,
      )
      .map((program) => {
        // Since we filtered, translations[0] exists
        const translation = program.translations[0];
        return {
          id: program.id,
          slug: program.slug,
          title: translation.title,
          description: translation.description,
          ageGroup: translation.ageGroup,
          schedule: translation.schedule,
          image: program.image,
        };
      });

    return NextResponse.json(formattedPrograms);
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error fetching programs:", error);

    // Provide a user-friendly error response
    // Avoid leaking internal error details
    return NextResponse.json(
      { message: "An error occurred while fetching programs." }, // Use 'message' for consistency?
      { status: 500 },
    );
  }
}
