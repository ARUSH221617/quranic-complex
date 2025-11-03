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
      <section className="bg-primary py-16 text-white">
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
          <h2 className="mb-8 text-3xl font-bold text-gray-800 dark:text-white">
            {t("newsSectionTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {formattedNews.length > 0 ? (
              formattedNews.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-800"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={item.image || "/placeholder.jpg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.excerpt}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/${locale}/news/${item.slug}`}
                      className="font-semibold text-primary hover:underline dark:text-accent"
                    >
                      {t("readMore")}
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 dark:text-gray-400">
                {t("noNews")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-gray-100 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t("eventsSectionTitle")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t("eventsTable.event")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t("eventsTable.date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t("eventsTable.time")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t("eventsTable.location")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {formattedEvents.length > 0 ? (
                    formattedEvents.map((event) => (
                      <tr
                        key={event.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {event.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {event.time}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {event.location}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
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
