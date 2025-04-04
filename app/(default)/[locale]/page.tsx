import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Program, News } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";

async function getFeaturedPrograms(locale: string) {
  noStore();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/programs?locale=${locale}`
    );
    if (!res.ok) throw new Error("Failed to fetch programs");
    const data = await res.json();
    return data.slice(0, 3);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}

async function getLatestNews(locale: string) {
  noStore();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/news?locale=${locale}`
    );
    if (!res.ok) throw new Error(`Failed to fetch news`);
    const data = await res.json();
    return data.slice(0, 3);
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export default async function Home() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const [featuredPrograms, latestNews] = await Promise.all([
    getFeaturedPrograms(locale),
    getLatestNews(locale),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        className="relative py-20 text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(223, 207, 159, 0.9), rgba(223, 207, 159, 0.9)), url('/pattern/islamic-geometric-pattern.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-xl">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/programs">
                  <Button
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {t("hero.browsePrograms")}
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white bg-transparent text-white hover:bg-white/10"
                  >
                    {t("hero.contactUs")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
                <Image
                  src="/masged.webp?height=400&width=600"
                  alt="مجمع قرآنی خرمشهر"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Snippet */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("about.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-8 text-center">
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700">
              {t("about.description")}
            </p>
            <div className="mt-8">
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-secondary text-secondary-text hover:bg-secondary hover:text-white"
                >
                  {t("about.moreAboutUs")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("programs.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.map((program: Program) => (
              <Card
                key={program.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={program.image || "/placeholder.svg"}
                    alt={locale === "ar" ? program.titleAr : program.titleEn}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>
                    {locale === "ar" ? program.titleAr : program.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {locale === "ar"
                      ? program.descriptionAr
                      : program.descriptionEn}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">
                        {t("programs.ageGroup")}:
                      </span>{" "}
                      {locale === "ar"
                        ? program.ageGroupAr
                        : program.ageGroupEn}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("programs.schedule")}:
                      </span>{" "}
                      {locale === "ar"
                        ? program.scheduleAr
                        : program.scheduleEn}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href="/programs"
                    className="text-primary hover:underline"
                  >
                    {t("programs.viewDetails")}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/programs">
              <Button className="bg-primary text-white hover:bg-primary/90">
                {t("programs.viewAllPrograms")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("news.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((item: News) => (
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
                    {new Date(item.date).toLocaleDateString("ar-EG", {
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
                  <Link
                    href={`/news/${item.id}`}
                    className="text-primary hover:underline"
                  >
                    {t("news.readMore", {
                      title: `${item.title.slice(0, 10)}...`,
                    })}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/news">
              <Button className="bg-primary text-white hover:bg-primary/90">
                {t("news.viewAllNews")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">{t("cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {t("cta.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/programs">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  {t("cta.browsePrograms")}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white hover:text-primary"
                >
                  {t("cta.contactUs")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
