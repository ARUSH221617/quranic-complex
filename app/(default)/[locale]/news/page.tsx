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

// Define types for news and events with translations
interface FormattedNewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  date: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface FormattedEventItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  image: string | null;
}

async function fetchWithLocale<T>(
  endpoint: string,
  locale: string,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${baseUrl}/api/${endpoint}`);
  url.searchParams.append("locale", locale);

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } }); // Cache for 1 hour

  if (!response.ok) {
    throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("home.news.page");

  // Fetch news and events from API routes
  const [formattedNews, formattedEvents] = await Promise.all([
    fetchWithLocale<FormattedNewsItem[]>("news", locale),
    fetchWithLocale<FormattedEventItem[]>("events", locale),
  ]).catch((error) => {
    console.error("Error fetching data:", error);
    return [[], []]; // Return empty arrays if fetch fails
  });

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
          <h2 className="mb-8 text-3xl font-bold text-secondary-text">
            {t("newsSectionTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {formattedNews.length > 0 ? (
              formattedNews.map((item) => (
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
                        locale === "ar"
                          ? "ar-EG"
                          : locale === "fa"
                            ? "fa-IR"
                            : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
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
              <div className="col-span-3 text-center text-gray-500">
                {t("noNews")}
              </div>
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
                  {formattedEvents.length > 0 ? (
                    formattedEvents.map((event) => (
                      <tr key={event.id} className="border-b border-gray-200">
                        <td className="py-4 text-gray-700">{event.name}</td>
                        <td className="py-4 text-gray-700">
                          {new Date(event.date).toLocaleDateString(
                            locale === "ar"
                              ? "ar-EG"
                              : locale === "fa"
                                ? "fa-IR"
                                : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </td>
                        <td className="py-4 text-gray-700">{event.time}</td>
                        <td className="py-4 text-gray-700">{event.location}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-gray-500"
                      >
                        No upcoming events
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
