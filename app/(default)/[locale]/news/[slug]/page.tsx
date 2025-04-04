import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/news/${params.slug}?locale=${params.locale}`
  );
  const newsItem = await res.json();

  if (!newsItem) return {};

  return {
    title: newsItem.metaTitle || newsItem.title,
    description: newsItem.metaDescription || newsItem.excerpt,
    keywords: newsItem.keywords?.split(",") || [],
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/news/${params.slug}?locale=${params.locale}`
  );
  const newsItem = await res.json();

  if (!newsItem) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card>
        {newsItem.image && (
          <div className="relative h-96 w-full">
            <Image
              src={newsItem.image}
              alt={newsItem.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle>{newsItem.title}</CardTitle>
          <p className="text-sm text-gray-500">
            {new Date(newsItem.date).toLocaleDateString(
              params.locale === "ar" ? "ar-EG" : "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: newsItem.content }} />
        </CardContent>
      </Card>
    </div>
  );
}
