import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocale, getTranslations } from "next-intl/server";

interface Program {
  id: string
  title: string
  description: string
  ageGroup: string
  schedule: string
  image: string | null
}

export default async function ProgramsPage() {
  const locale = await getLocale();
  const t = await getTranslations("home.programs.page");
  
  let programs = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/programs?locale=${locale}`);
    if (!response.ok) throw new Error('Failed to fetch programs');
    programs = await response.json();
  } catch (error) {
    console.error('Error fetching programs:', error);
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{t("heroTitle")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {t("heroDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Programs Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("programsTitle")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mx-auto mt-6 max-w-3xl text-gray-700">
              {t("programsDescription")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program: Program) => (
              <Card
                key={program.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={program.image || "/placeholder.svg"}
                    alt={program.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{program.description}</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">
                        {locale === "ar" ? "الفئة العمرية:" : "Age Group:"}
                      </span>{" "}
                      {program.ageGroup}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {locale === "ar" ? "المواعيد:" : "Schedule:"}
                      </span>{" "}
                      {program.schedule}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    {locale === "ar" ? "التسجيل متاح" : "Registration Open"}
                  </span>
                  <Link
                    href={`/${locale}/programs/${program.id}`}
                    className="text-primary hover:underline"
                  >
                    {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Info */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-secondary-text">
              {locale === "ar" ? "معلومات التسجيل" : "Registration Information"}
            </h2>
            <div className="mt-4 h-1 w-20 bg-accent"></div>
            <div className="mt-6 space-y-4 text-gray-700">
              <p>
                {locale === "ar"
                  ? "للتسجيل في أي من برامجنا، يرجى زيارة مقر المجمع أو التواصل معنا عبر الهاتف أو البريد الإلكتروني."
                  : "To register for any of our programs, please visit the complex headquarters or contact us by phone or email."}
              </p>
              <p>
                <span className="font-semibold">
                  {locale === "ar"
                    ? "المستندات المطلوبة للتسجيل:"
                    : "Documents required for registration:"}
                </span>
              </p>
              <ul className="list-inside list-disc space-y-2 pr-4">
                <li>
                  {locale === "ar"
                    ? "صورة من الهوية الشخصية أو جواز السفر"
                    : "A copy of personal ID or passport"}
                </li>
                <li>
                  {locale === "ar" ? "صورتان شخصيتان" : "Two personal photos"}
                </li>
                <li>
                  {locale === "ar"
                    ? "استمارة التسجيل (متوفرة في مقر المجمع أو يمكن تحميلها من موقعنا)"
                    : "Registration form (available at the complex headquarters or can be downloaded from our website)"}
                </li>
                <li>
                  {locale === "ar"
                    ? "سداد رسوم التسجيل"
                    : "Payment of registration fees"}
                </li>
              </ul>
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/${locale}/contact`}
                className="inline-block rounded-md bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
              >
                {locale === "ar"
                  ? "تواصل معنا للتسجيل"
                  : "Contact Us for Registration"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
