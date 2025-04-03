import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { news } from "@/lib/placeholder-data"

export function generateStaticParams() {
  return news.map((item) => ({
    slug: item.id.toString(),
  }))
}

export default function NewsDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
  const newsId = Number.parseInt(slug)
  const newsItem = news.find((item) => item.id === newsId)

  if (!newsItem) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{newsItem.title}</h1>
            <p className="mx-auto mt-4 text-lg">
              {new Date(newsItem.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* News Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="relative mb-8 h-96 w-full overflow-hidden rounded-lg">
              <Image src={newsItem.image || "/placeholder.svg"} alt={newsItem.title} fill className="object-cover" />
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-xl font-semibold">{newsItem.excerpt}</p>
              <div className="mt-6 space-y-4">
                <p>{newsItem.content}</p>
                {/* Additional paragraphs for longer content */}
                <p>
                  {locale === "ar"
                    ? "نتطلع إلى مشاركتكم الفعالة في هذا الحدث المهم. لمزيد من المعلومات والاستفسارات، يرجى التواصل مع إدارة المجمع."
                    : "We look forward to your active participation in this important event. For more information and inquiries, please contact the complex administration."}
                </p>
                <p>
                  {locale === "ar"
                    ? "يسعدنا دائماً استقبال اقتراحاتكم وملاحظاتكم لتطوير برامجنا وأنشطتنا بما يخدم طلابنا ويحقق رسالتنا في نشر تعاليم القرآن الكريم."
                    : "We are always happy to receive your suggestions and feedback to develop our programs and activities in a way that serves our students and achieves our mission in spreading the teachings of the Holy Quran."}
                </p>
              </div>
            </div>
            <div className="mt-12">
              <Link href={`/${locale}/news`}>
                <Button
                  variant="outline"
                  className="border-secondary text-secondary hover:bg-secondary hover:text-white"
                >
                  {locale === "ar" ? "العودة إلى الأخبار" : "Back to News"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related News */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">{locale === "ar" ? "أخبار ذات صلة" : "Related News"}</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {news
              .filter((item) => item.id !== newsItem.id)
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                >
                  <div className="relative h-48 w-full">
                    <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-secondary">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(item.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-4 text-gray-700">{item.excerpt}</p>
                    <div className="mt-6">
                      <Link href={`/${locale}/news/${item.id}`} className="text-primary hover:underline">
                        {locale === "ar" ? "قراءة المزيد" : "Read More"}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}

