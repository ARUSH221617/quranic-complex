import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Program {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ageGroupEn: string;
  ageGroupAr: string;
  scheduleEn: string;
  scheduleAr: string;
  image: string | null;
}

interface FormattedProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  image: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    const programs = await prisma.program.findMany({
      where: {
        locale,
      },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleAr: true,
        descriptionEn: true,
        descriptionAr: true,
        ageGroupEn: true,
        ageGroupAr: true,
        scheduleEn: true,
        scheduleAr: true,
        image: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedPrograms = programs.map((program: Program) => ({
      id: program.id,
      slug: program.slug,
      title: locale === "ar" ? program.titleAr : program.titleEn,
      description:
        locale === "ar" ? program.descriptionAr : program.descriptionEn,
      ageGroup: locale === "ar" ? program.ageGroupAr : program.ageGroupEn,
      schedule: locale === "ar" ? program.scheduleAr : program.scheduleEn,
      image: program.image,
    }));

    return NextResponse.json(formattedPrograms);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
