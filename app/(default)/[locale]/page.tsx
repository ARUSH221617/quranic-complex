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
import { DonationForm } from "@/components/donation-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      {/* Hero Section */}
      <section className="relative min-h-[80vh] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-primary/90"></div>
        <div className="container relative mx-auto flex h-full min-h-[80vh] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 md:flex-row md:items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-xl text-gray-200 md:mx-0">
                {t("hero.subtitle")}
              </p>
            </div>
            <div className="w-full max-w-md">
              <DonationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("impact.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            <div className="rounded-lg bg-gray-100 p-8">
              <h3 className="text-4xl font-bold text-primary">
                {t("impact.metric1.value")}
              </h3>
              <p className="mt-2 text-lg text-gray-700">
                {t("impact.metric1.label")}
              </p>
            </div>
            <div className="rounded-lg bg-gray-100 p-8">
              <h3 className="text-4xl font-bold text-primary">
                {t("impact.metric2.value")}
              </h3>
              <p className="mt-2 text-lg text-gray-700">
                {t("impact.metric2.label")}
              </p>
            </div>
            <div className="rounded-lg bg-gray-100 p-8">
              <h3 className="text-4xl font-bold text-primary">
                {t("impact.metric3.value")}
              </h3>
              <p className="mt-2 text-lg text-gray-700">
                {t("impact.metric3.label")}
              </p>
            </div>
          </div>
          <div className="mt-16">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl font-bold text-secondary-text">
                {t("impact.story.title")}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                {t("impact.story.content")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof and Trust Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("trust.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-8 shadow-md">
              <p className="text-lg italic text-gray-700">
                {t("trust.testimonial1.content")}
              </p>
              <p className="mt-4 font-bold text-primary">
                {t("trust.testimonial1.author")}
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-md">
              <p className="text-lg italic text-gray-700">
                {t("trust.testimonial2.content")}
              </p>
              <p className="mt-4 font-bold text-primary">
                {t("trust.testimonial2.author")}
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-md">
              <p className="text-lg italic text-gray-700">
                {t("trust.testimonial3.content")}
              </p>
              <p className="mt-4 font-bold text-primary">
                {t("trust.testimonial3.author")}
              </p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-secondary-text">
              {t("trust.partnersTitle")}
            </h3>
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <Image
                src="/partners/partner1.svg"
                alt="Partner 1"
                width={150}
                height={50}
              />
              <Image
                src="/partners/partner2.svg"
                alt="Partner 2"
                width={150}
                height={50}
              />
              <Image
                src="/partners/partner3.svg"
                alt="Partner 3"
                width={150}
                height={50}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("faq.title")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-secondary-text/90"></div>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t("faq.question1.title")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.question1.content")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{t("faq.question2.title")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.question2.content")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>{t("faq.question3.title")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.question3.content")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
