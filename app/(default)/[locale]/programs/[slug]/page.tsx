import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { programs } from "@/lib/placeholder-data"

export function generateStaticParams() {
  return programs.map((program) => ({
    slug: program.id.toString(),
  }))
}

export default function ProgramDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
  const programId = Number.parseInt(slug)
  const program = programs.find((p) => p.id === programId)

  if (!program) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{program.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">{locale === "ar" ? "تفاصيل البرنامج" : "Program Details"}</p>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <div className="relative h-80 w-full overflow-hidden rounded-lg">
                <Image src={program.image || "/placeholder.svg"} alt={program.title} fill className="object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-secondary">{program.title}</h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <div className="mt-6 space-y-4">
                <p className="text-gray-700">{program.description}</p>
                <div className="rounded-lg bg-gray-50 p-6">
                  <h3 className="text-xl font-semibold text-secondary">
                    {locale === "ar" ? "تفاصيل البرنامج" : "Program Details"}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start">
                      <span className="font-semibold">{locale === "ar" ? "الفئة العمرية:" : "Age Group:"}</span>
                      <span className="ms-2">{program.ageGroup}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold">{locale === "ar" ? "المواعيد:" : "Schedule:"}</span>
                      <span className="ms-2">{program.schedule}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold">{locale === "ar" ? "المدة:" : "Duration:"}</span>
                      <span className="ms-2">{locale === "ar" ? "3 أشهر" : "3 months"}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold">{locale === "ar" ? "الرسوم:" : "Fees:"}</span>
                      <span className="ms-2">{locale === "ar" ? "500 ريال" : "500 Riyals"}</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link href={`/${locale}/contact`}>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      {locale === "ar" ? "التسجيل الآن" : "Register Now"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/programs`}>
                    <Button
                      variant="outline"
                      className="border-secondary text-secondary hover:bg-secondary hover:text-white"
                    >
                      {locale === "ar" ? "العودة إلى البرامج" : "Back to Programs"}
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
            <h2 className="text-3xl font-bold text-secondary">{locale === "ar" ? "المنهج الدراسي" : "Curriculum"}</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="space-y-8">
                {/* Sample curriculum items */}
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-secondary">
                      {locale === "ar" ? `الوحدة ${item}` : `Module ${item}`}
                    </h3>
                    <p className="mt-2 text-gray-700">
                      {locale === "ar"
                        ? "وصف تفصيلي للوحدة الدراسية ومحتوياتها والمهارات التي سيكتسبها الطالب."
                        : "Detailed description of the module, its contents, and the skills that the student will acquire."}
                    </p>
                    <ul className="mt-4 list-inside list-disc space-y-1 text-gray-700">
                      <li>{locale === "ar" ? "الدرس الأول" : "Lesson One"}</li>
                      <li>{locale === "ar" ? "الدرس الثاني" : "Lesson Two"}</li>
                      <li>{locale === "ar" ? "الدرس الثالث" : "Lesson Three"}</li>
                      <li>{locale === "ar" ? "الدرس الرابع" : "Lesson Four"}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

