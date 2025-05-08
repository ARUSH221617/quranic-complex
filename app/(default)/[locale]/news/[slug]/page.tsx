import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

interface NewsDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  image: string | null;
  date: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
}

async function fetchNewsDetail(
  slug: string,
  locale: string,
): Promise<NewsDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${baseUrl}/api/news/${slug}`);
  url.searchParams.append("locale", locale);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    }); // Cache for 1 hour

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch news detail: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching news detail for slug ${slug}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const newsItem = await fetchNewsDetail(params.slug, params.locale);

  if (!newsItem)
    return {
      title: "News Not Found",
    };

  return {
    title: newsItem.metaTitle || newsItem.title,
    description: newsItem.metaDescription || newsItem.excerpt,
    keywords: newsItem.keywords?.split(",") || [],
    openGraph: {
      title: newsItem.title,
      description: newsItem.excerpt,
      images: newsItem.image ? [{ url: newsItem.image }] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const t = await getTranslations("home.news.page");
  const newsItem = await fetchNewsDetail(params.slug, params.locale);

  if (!newsItem) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="overflow-hidden shadow-lg">
        {newsItem.image && (
          <div className="relative h-96 w-full">
            <Image
              src={newsItem.image}
              alt={newsItem.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{newsItem.title}</CardTitle>
          <p className="text-sm text-gray-500">
            {new Date(newsItem.date).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </CardHeader>
        <CardContent className="prose max-w-none lg:prose-lg dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: newsItem.content }} />
        </CardContent>
      </Card>
    </div>
  );
}
