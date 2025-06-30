"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  FileIcon,
  LoaderIcon,
  PencilEditIcon,
  TrashIcon,
  ShareIcon,
} from "./icons";
import { cn, fetcher } from "@/lib/utils";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";

interface PreviewNewsData {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  date?: string; // Should be string or parsable by new Date()
  locale?: string;
  image?: string;
  thumbnailPath?: string;
}

interface NewsCardProps {
  isReadonly: boolean; // This prop is declared but not used. Consider removing if not needed.
  result?: any;
  args?: any;
}

interface NewsCardLoadingProps {
  title?: string;
}

// Helper function to extract primary news information and initial data
function getProcessedNewsInfo(
  args?: any,
  result?: any,
): {
  slug?: string;
  locale?: string;
  title?: string;
  initialData?: PreviewNewsData | null;
} {
  let slug: string | undefined;
  let locale: string | undefined = "en";
  let title: string | undefined;
  let initialData: PreviewNewsData | null = null;

  if (args) {
    slug = args.slug;
    locale = args.locale || "en";
    title = args.title;
    initialData = {
      slug: args.slug || "",
      title: args.title || "Loading title...",
      excerpt: args.excerpt,
      content: args.content,
      locale: args.locale || "en",
      date: args.date ? String(args.date) : undefined,
      image: args.image,
      thumbnailPath: args.thumbnailPath,
    };
  } else if (result) {
    if (result.toolName === "createNews" && result.newsItem) {
      const item = result.newsItem;
      slug = item.slug;
      locale = item.locale || "en";
      title = item.title;
      initialData = { ...item, id: String(item.id), date: String(item.date) };
    } else if (
      result.toolName === "updateNews" &&
      result.updatedNewsTranslation
    ) {
      slug = result.slug; // Expecting slug to be on the root of the result object for updateNews
      locale = result.updatedNewsTranslation.locale || "en";
      title = result.updatedNewsTranslation.title;
      initialData = {
        slug: result.slug || "",
        title: result.updatedNewsTranslation.title,
        id: String(result.updatedNewsTranslation.id), // This is likely the translation ID
        locale: result.updatedNewsTranslation.locale || "en",
        // Other fields (excerpt, content, image, date) will be missing until SWR loads
      };
    } else if (result.toolName === "getNewsBySlug" && result.news) {
      const item = result.news; // result.news is an object
      slug = item.slug;
      locale = result.locale || item.locale || "en"; // Tool should ideally return locale in item
      title = item.title;
      initialData = {
        ...item,
        id: String(item.id),
        date: String(item.date),
        locale,
      };
    } else if (
      result.toolName === "getLatestNews" &&
      result.news &&
      result.news.length > 0
    ) {
      const item = result.news[0]; // result.news is an array
      slug = item.slug;
      locale = result.locale || item.locale || "en"; // Tool should ideally return locale in item
      title = item.title;
      initialData = {
        ...item,
        id: String(item.id),
        date: String(item.date),
        locale,
      };
    } else if (result.slug && result.title) {
      // Fallback for a simple/flat result object
      slug = result.slug;
      locale = result.locale || "en";
      title = result.title;
      initialData = {
        id: result.id ? String(result.id) : undefined,
        slug: result.slug,
        title: result.title,
        excerpt: result.excerpt,
        content: result.content,
        date: result.date ? String(result.date) : undefined,
        locale: result.locale || "en",
        image: result.image,
        thumbnailPath: result.thumbnailPath,
      };
    } else if (result?.news?.[0]?.slug) {
      // Original pattern as a last resort
      const item = result.news[0];
      slug = item.slug;
      locale = item.locale || "en";
      title = item.title;
      initialData = {
        ...item,
        id: item.id ? String(item.id) : undefined,
        date: item.date ? String(item.date) : undefined,
        locale: item.locale || "en",
      };
    } else {
      // Attempt to get title from a generic result object if other conditions didn't match
      title =
        result.title ||
        result.newsItem?.title ||
        result.updatedNewsTranslation?.title ||
        result.news?.title;
    }
  }

  return { slug, locale, title, initialData };
}

const NewsCardLoading = ({ title }: NewsCardLoadingProps) => (
  <motion.div
    className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="p-4 flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] border-b dark:border-zinc-700">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="size-4 animate-pulse">
            <FileIcon size={16} />
          </div>
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-3/4">
          {title || "Loading news..."}
        </div>
      </div>
    </div>
    <div className="p-4 bg-muted dark:bg-muted/50">
      <div className="animate-pulse rounded-lg h-20 bg-muted-foreground/20 w-full mb-2" />
      <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-full" />
      <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-3/4 mt-1" />
    </div>
  </motion.div>
);

export function NewsCard({ result, args }: NewsCardProps) {
  const {
    slug: derivedSlug,
    locale: derivedLocale,
    title: derivedTitle,
    initialData: derivedInitialData,
  } = getProcessedNewsInfo(args, result);

  const newsSlug = derivedSlug;
  const newsLocale = derivedLocale || "en";

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""); // Ensure no trailing slash
  const swrKey = newsSlug
    ? `${apiBaseUrl}/api/news/${newsSlug}?locale=${newsLocale}`
    : null;

  const { data: fetchedNewsData, isLoading: isFetchingSWR } =
    useSWR<PreviewNewsData>(swrKey, fetcher, {
      shouldRetryOnError: false, // Good practice
    });

  let newsData: PreviewNewsData | null = null;

  if (fetchedNewsData) {
    newsData = fetchedNewsData;
  } else if (derivedInitialData) {
    newsData = derivedInitialData;
  }

  const isLoading = (swrKey && isFetchingSWR) || (!newsData && !!newsSlug);

  if (isLoading) {
    return (
      <NewsCardLoading title={derivedTitle || args?.title || result?.title} />
    );
  }

  if (!newsData) {
    // If still no news data after loading checks (e.g. no slug, or fetch failed and no initial data)
    return <NewsCardLoading title="News item not available" />;
  }

  const displayImage = newsData.thumbnailPath || newsData.image;
  const isCreateOrUpdate =
    args || (result && ["createNews", "updateNews"].includes(result.toolName));

  return (
    <motion.div
      className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="p-4 flex flex-row gap-2 items-center justify-between dark:bg-muted border-b dark:border-zinc-700">
        <div className="flex flex-row items-start sm:items-center gap-3">
          <div className="text-muted-foreground mt-1 sm:mt-0">
            {isCreateOrUpdate ? (
              <div className="animate-spin">
                <div className="size-4">
                  <LoaderIcon size={16} />
                </div>
              </div>
            ) : (
              <div className="size-4">
                <FileIcon size={16} />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1">
            <div className="font-medium leading-tight">{newsData.title}</div>
            {newsData.date && (
              <div className="text-xs text-muted-foreground">
                {new Date(newsData.date).toLocaleDateString()}
              </div>
            )}
            {newsData.locale && (
              <div className="text-xs text-muted-foreground">
                Language: {newsData.locale.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/news/${newsData.slug}`}
            className="p-2 hover:bg-muted-foreground/10 rounded-lg transition-colors"
            title="View full article"
          >
            <ShareIcon size={16} />
          </Link>
          <Link
            href={`/admin/news`}
            className="p-2 hover:bg-muted-foreground/10 rounded-lg transition-colors"
            title="Edit article"
          >
            <PencilEditIcon size={16} />
          </Link>
          <Link
            href={`/admin/news`}
            className="p-2 hover:bg-muted-foreground/10 rounded-lg transition-colors text-destructive"
            title="Delete article"
          >
            <TrashIcon size={16} />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "p-4 bg-muted dark:bg-muted/50",
          displayImage ? "grid grid-cols-[2fr_3fr] gap-4 items-start" : "block",
        )}
      >
        {displayImage && (
          <div className="aspect-video w-full bg-muted-foreground/10 rounded overflow-hidden">
            <Image
              src={
                displayImage.startsWith("http")
                  ? displayImage
                  : `${displayImage}`
              }
              alt={newsData.title}
              width={500}
              height={300}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {newsData.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {newsData.excerpt}
            </p>
          )}
          {!newsData.excerpt && newsData.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {newsData.content.replace(/<[^>]+>/g, "").substring(0, 150)}...
            </p>
          )}
          {isCreateOrUpdate && (
            <p className="text-xs text-muted-foreground mt-2">
              {args ? "Creating" : "Updating"} news article...
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(NewsCard);
