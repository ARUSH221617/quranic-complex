import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

// Types for the program data
type ProgramDetails = {
  id: string;
  slug: string;
  image: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
};

// Generate static params for all programs
export async function generateStaticParams() {
  const programs = await prisma.program.findMany({
    select: {
      slug: true,
    },
  });

  return programs.map((program) => ({
    slug: program.slug,
  }));
}

// Function to fetch program data from our API
async function getProgram(
  slug: string,
  locale: string,
): Promise<ProgramDetails | null> {
  try {
    // Using the new API route
    // We need to use absolute URL in server components when fetching internally
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

    const res = await fetch(
      `${protocol}://${host}/api/programs/${slug}?locale=${locale}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch program: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching program:", error);

    // Fallback to direct database access if API fails
    // This ensures the page works even if the API has issues
    try {
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
            },
          },
        },
      });

      if (!program || program.translations.length === 0) {
        return null;
      }

      const translation = program.translations[0];

      return {
        id: program.id,
        slug: program.slug,
        image: program.image as string,
        title: translation.title,
        description: translation.description,
        ageGroup: translation.ageGroup,
        schedule: translation.schedule,
      };
    } catch (dbError) {
      console.error("Database fallback error:", dbError);
      return null;
    }
  }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Get translations
  const t = await getTranslations("home.programs.page");
  const locale = await getLocale();
  const commonT = await getTranslations("home.programs");

  const { slug } = await Promise.resolve(params);

  // Get curriculum translations
  const curriculumT = await getTranslations();

  const program = await getProgram(slug, locale);

  if (!program) {
    notFound();
  }

  // Curriculum modules with translated content
  const curriculumModules = [
    {
      id: 1,
      title: curriculumT.raw(`curriculum.module1.title`) || `Module 1`,
      description:
        curriculumT.raw(`curriculum.module1.description`) ||
        "Detailed description of the module, its contents, and the skills that the student will acquire.",
      lessons: [
        curriculumT.raw(`curriculum.module1.lesson1`) || "Lesson One",
        curriculumT.raw(`curriculum.module1.lesson2`) || "Lesson Two",
        curriculumT.raw(`curriculum.module1.lesson3`) || "Lesson Three",
        curriculumT.raw(`curriculum.module1.lesson4`) || "Lesson Four",
      ],
    },
    {
      id: 2,
      title: curriculumT.raw(`curriculum.module2.title`) || `Module 2`,
      description:
        curriculumT.raw(`curriculum.module2.description`) ||
        "Detailed description of the module, its contents, and the skills that the student will acquire.",
      lessons: [
        curriculumT.raw(`curriculum.module2.lesson1`) || "Lesson One",
        curriculumT.raw(`curriculum.module2.lesson2`) || "Lesson Two",
        curriculumT.raw(`curriculum.module2.lesson3`) || "Lesson Three",
        curriculumT.raw(`curriculum.module2.lesson4`) || "Lesson Four",
      ],
    },
    {
      id: 3,
      title: curriculumT.raw(`curriculum.module3.title`) || `Module 3`,
      description:
        curriculumT.raw(`curriculum.module3.description`) ||
        "Detailed description of the module, its contents, and the skills that the student will acquire.",
      lessons: [
        curriculumT.raw(`curriculum.module3.lesson1`) || "Lesson One",
        curriculumT.raw(`curriculum.module3.lesson2`) || "Lesson Two",
        curriculumT.raw(`curriculum.module3.lesson3`) || "Lesson Three",
        curriculumT.raw(`curriculum.module3.lesson4`) || "Lesson Four",
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{program.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {t("heroDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <div className="relative h-80 w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-secondary-text">
                {program.title}
              </h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <div className="mt-6 space-y-4">
                <p
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: program.description }}
                />
                <div className="rounded-lg bg-gray-50 p-6 shadow-md transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-xl font-semibold text-secondary-text">
                    {t("programsTitle")}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start">
                      <span className="font-semibold text-primary">
                        {commonT("ageGroup")}:
                      </span>
                      <span className="ms-2">{program.ageGroup}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary">
                        {commonT("schedule")}:
                      </span>
                      <span className="ms-2">{program.schedule}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary">
                        {curriculumT.raw("programDetail.duration") ||
                          "Duration"}
                        :
                      </span>
                      <span className="ms-2">
                        {curriculumT.raw("programDetail.durationValue") ||
                          "3 months"}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary">
                        {curriculumT.raw("programDetail.fees") || "Fees"}:
                      </span>
                      <span className="ms-2">
                        {curriculumT.raw("programDetail.feesValue") ||
                          "500 Riyals"}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href={`/${locale}/contact`}>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90 shadow-md transition-all duration-300 hover:shadow-lg"
                      size="lg"
                    >
                      {curriculumT.raw("programDetail.registerNow") ||
                        "Register Now"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/programs`}>
                    <Button
                      variant="outline"
                      className="border-secondary text-secondary-text hover:bg-secondary hover:text-white transition-all duration-300"
                      size="lg"
                    >
                      {curriculumT.raw("programDetail.backToPrograms") ||
                        "Back to Programs"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {curriculumT.raw("curriculum.title") || "Curriculum"}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              {curriculumT.raw("curriculum.description") ||
                "You will learn the following skills in this program through an integrated curriculum"}
            </p>
          </div>
          <div className="mt-12">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="space-y-8">
                {curriculumModules.map((module) => (
                  <div
                    key={module.id}
                    className="border-b border-gray-200 pb-6 last:border-0 last:pb-0 transition-all duration-300 hover:bg-gray-50 p-4 rounded-md"
                  >
                    <h3 className="text-xl font-semibold text-secondary-text">
                      {module.title}
                    </h3>
                    <p className="mt-2 text-gray-700">{module.description}</p>
                    <ul className="mt-4 list-inside list-disc space-y-1 text-gray-700">
                      {module.lessons.map((lesson, index) => (
                        <li
                          key={index}
                          className="transition-colors duration-200 hover:text-primary"
                        >
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              {curriculumT.raw("cta.title") || "Ready to Join Us?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {curriculumT.raw("cta.description") ||
                "Register now and reserve your place in this distinguished educational program"}
            </p>
            <div className="mt-8">
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100 shadow-md transition-all duration-300 hover:shadow-lg"
                >
                  {curriculumT.raw("cta.startRegistration") ||
                    "Start Registration"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
