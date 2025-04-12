import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const program = await prisma.program.findUnique({
      where: {
        slug: slug,
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
          take: 1, // Explicitly take only the first matching translation
        },
      },
    });

    if (!program || program.translations.length === 0) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
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
    };

    return NextResponse.json(formattedProgram);
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error fetching program:", error);

    // Provide a user-friendly error response
    return NextResponse.json(
      { message: "An error occurred while fetching the program." },
      { status: 500 },
    );
  }
}