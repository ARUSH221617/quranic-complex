import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Event } from "@prisma/client";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  date: string;
  locale: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("home.news.page");

  const [news, events] = await Promise.all([
    prisma.news.findMany({
      where: { locale },
    }),
    prisma.event.findMany({
      where: { locale },
    }),
  ]);
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

      {/* News Listing */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-secondary-text mb-8">
            {t("newsSectionTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.length > 0 ? (
              news.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {new Date(item.date).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{item.excerpt}</p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/${locale}/news/${item.slug}`}
                      className="text-primary hover:underline"
                    >
                      {t("readMore")}
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div>{t("noNews")}</div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("eventsSectionTitle")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 rounded-lg bg-white p-8 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 text-right font-bold text-gray-700">
                      {t("eventsTable.event")}
                    </th>
                    <th className="py-3 text-right font-bold text-gray-700">
                      {t("eventsTable.date")}
                    </th>
                    <th className="py-3 text-right font-bold text-gray-700">
                      {t("eventsTable.time")}
                    </th>
                    <th className="py-3 text-right font-bold text-gray-700">
                      {t("eventsTable.location")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 text-gray-700">{event.name}</td>
                      <td className="py-4 text-gray-700">
                        {new Date(event.date).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-4 text-gray-700">{event.time}</td>
                      <td className="py-4 text-gray-700">{event.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
