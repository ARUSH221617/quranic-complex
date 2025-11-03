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
// Remove direct Program import if no longer needed elsewhere, keep News if used
import type { News } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

// Define the expected structure for a program returned by the API
interface FeaturedProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  ageGroup: string;
  schedule: string;
  image: string | null;
}

// Define the expected structure for a news item returned by the API
// Assuming the /api/news route returns a similar flat structure
interface LatestNews {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  date: Date; // API returns a Date object that we'll format
  metaTitle: string | null;
  metaDescription: string | null;
}

async function getFeaturedPrograms(locale: string): Promise<FeaturedProgram[]> {
  return [];
}

async function getLatestNews(locale: string): Promise<LatestNews[]> {
  return [];
}

export default async function Home() {
  const t = await getTranslations("home");
  const locale = await getLocale(); // locale is already available here

  // Fetch data concurrently
  const [featuredPrograms, latestNews] = await Promise.all([
    getFeaturedPrograms(locale),
    getLatestNews(locale), // Assuming getLatestNews also needs locale
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        className="relative py-20 text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/placeholder.jpg')",
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
                <Link href={`/${locale}/donate`}>
                  <Button
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {t("hero.donateNow")}
                  </Button>
                </Link>
                <Link href={`/${locale}/volunteer`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white bg-transparent text-white hover:bg-white/10"
                  >
                    {t("hero.volunteer")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
                <Image
                  src="/placeholder.jpg"
                  alt="Tehran Charity"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

      {/* Featured Programs -- UPDATED SECTION */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("programs.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Use the FeaturedProgram type */}
            {featuredPrograms.map((program: FeaturedProgram) => (
              <Card
                key={program.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={program.image as string}
                    // Use the direct title from the API response
                    alt={program.title}
                    fill
                    className="object-cover"
                    // Add sizes attribute for optimization
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <CardHeader>
                  {/* Use the direct title */}
                  <CardTitle>{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Use the direct description */}
                  <p
                    className="line-clamp-3 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: program.description }}
                  />
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">
                        {t("programs.ageGroup")}:
                      </span>{" "}
                      {/* Use the direct ageGroup */}
                      {program.ageGroup}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("programs.schedule")}:
                      </span>{" "}
                      {/* Use the direct schedule */}
                      {program.schedule}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {/* Link to the specific program page using its slug */}
                  <Link
                    href={`/${locale}/programs/${program.slug}`}
                    className="text-primary hover:underline"
                  >
                    {t("programs.viewDetails")}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            {/* Link to the main programs page */}
            <Link href={`/${locale}/programs`}>
              {" "}
              {/* Add locale to link */}
              <Button className="bg-primary text-white hover:bg-primary/90">
                {t("programs.viewAllPrograms")}
              </Button>
            </Link>
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
            {latestNews.map((item: LatestNews) => (
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
