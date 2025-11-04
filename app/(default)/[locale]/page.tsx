import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLatestNews } from "@/lib/ai/actions/get-news";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

// Define the shape of the FeaturedProgram and LatestNews objects for type safety
interface FeaturedProgram {
  id: string;
  image: string | null;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  slug: string; // Add slug for linking
}

interface LatestNews {
  id: string;
  image: string | null;
  title: string;
  excerpt: string;
  date: Date;
  slug: string; // Add slug for linking
}

export default async function Home() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  // Fetch featured programs and latest news from the database
  const latestNews = await getLatestNews({ locale });

  return (
    <div>
      {/* Hero Section -- UPDATED SECTION */}
      <section
        className="relative min-h-[60vh] bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/pattern/islamic-pattern.svg')" }}
      >
        {/* Adds a semi-transparent overlay for better text readability */}
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="container relative mx-auto flex h-full min-h-[60vh] items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-xl text-gray-200 md:mx-0">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                <Link href={`/${locale}/programs`}>
                  {" "}
                 {/* Add locale to link */}
                  <Button
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {t("hero.browsePrograms")}
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  {" "}
                  {/* Add locale to link */}
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
                  // Ensure image path is correct
                  src="/masged.webp" // Removed query params unless specifically needed for optimization tool
                  alt="Quranic Complex Hero Image" // More descriptive alt text
                  fill
                  className="object-cover"
                  priority // Keep priority for LCP element
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes attribute
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Snippet (No changes needed here) */}
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
              <Link href={`/${locale}/about`}>
                {" "}
                {/* Add locale to link */}
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

      {/* Latest News -- UPDATED SECTION (assuming similar API structure) */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("news.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Use the LatestNews type */}
            {latestNews.data.map((item: LatestNews) => (
              <Card
                key={item.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                {item.image && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={item.image}
                      alt={item.title} // Use direct title
                      fill
                      className="object-cover"
                      // Add sizes attribute for optimization
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Use direct excerpt */}
                  <p className="line-clamp-3 text-gray-700">
                    {item.excerpt}
                  </p>{" "}
                  {/* Add line-clamp */}
                </CardContent>
                <CardFooter>
                  {/* Link to specific news item using slug */}
                  <Link
                    href={`/${locale}/news/${item.slug}`} // Use slug for news link
                    className="text-primary hover:underline"
                  >
                    {t("news.readMore", { title: item.title })}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href={`/${locale}/news`}>
              {" "}
              {/* Add locale to link */}
              <Button className="bg-primary text-white hover:bg-primary/90">
                {t("news.viewAllNews")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action (No changes needed here, but added locale to links) */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">{t("cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              {t("cta.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={`/${locale}/programs`}>
                {" "}
                {/* Add locale to link */}
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  {t("cta.browsePrograms")}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                {" "}
                {/* Add locale to link */}
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
