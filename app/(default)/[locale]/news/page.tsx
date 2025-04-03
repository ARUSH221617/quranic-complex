import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { news } from "@/lib/placeholder-data"

export default function NewsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{locale === "ar" ? "الأخبار والفعاليات" : "News & Events"}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {locale === "ar"
                ? "آخر أخبار وفعاليات مجمع قرآنی خرمشهر"
                : "Latest news and events from Khorramshahr Quranic Complex"}
            </p>
          </div>
        </div>
      </section>

      {/* News Listing */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="relative h-48 w-full">
                  <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{item.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/${locale}/news/${item.id}`} className="text-primary hover:underline">
                    {locale === "ar" ? "قراءة المزيد" : "Read More"}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {locale === "ar" ? "الفعاليات القادمة" : "Upcoming Events"}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 rounded-lg bg-white p-8 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 text-right font-bold text-gray-700">
                      {locale === "ar" ? "الفعالية" : "Event"}
                    </th>
                    <th className="py-3 text-right font-bold text-gray-700">{locale === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="py-3 text-right font-bold text-gray-700">{locale === "ar" ? "الوقت" : "Time"}</th>
                    <th className="py-3 text-right font-bold text-gray-700">
                      {locale === "ar" ? "المكان" : "Location"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 text-gray-700">
                      {locale === "ar" ? "مسابقة حفظ القرآن الكريم" : "Quran Memorization Competition"}
                    </td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "10 أبريل 2025" : "April 10, 2025"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "10:00 صباحاً" : "10:00 AM"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "القاعة الرئيسية" : "Main Hall"}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 text-gray-700">
                      {locale === "ar" ? "محاضرة عن فضل تلاوة القرآن" : "Lecture on the Virtues of Quran Recitation"}
                    </td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "25 مارس 2025" : "March 25, 2025"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "7:00 مساءً" : "7:00 PM"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "قاعة المحاضرات" : "Lecture Hall"}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 text-gray-700">
                      {locale === "ar" ? "دورة صيفية مكثفة" : "Intensive Summer Course"}
                    </td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "1 يونيو 2025" : "June 1, 2025"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "9:00 صباحاً" : "9:00 AM"}</td>
                    <td className="py-4 text-gray-700">{locale === "ar" ? "جميع القاعات" : "All Halls"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

