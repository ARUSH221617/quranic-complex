import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { getNewsBySlug as getNewsBySlugAction } from "../actions/get-news-by-slug";

interface GetNewsBySlugProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const getNewsBySlug = ({ session, dataStream }: GetNewsBySlugProps) =>
  tool({
    description: "Get a news item from the website by its slug.",
    parameters: z.object({
      slug: z.string().describe("The unique slug identifier for the news item."),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .default("en")
        .describe(
          "The locale for the news translation (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
        ),
    }),
    execute: async ({ slug, locale = "en" }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "fetching_news_by_slug",
        content: `Fetching news for slug "${slug}" in ${locale} language...`,
      });

      try {
        const result = await getNewsBySlugAction(slug);

        if (!result.success || !result.data) {
          console.error("Error fetching news by slug:", result.error);
          dataStream.writeData({
            type: "news_fetch_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to fetch news item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        const translation = result.data.translations.find((t) => t.locale === locale);

        if (!translation) {
          dataStream.writeData({
            type: "news_fetch_status",
            content: `No translation found for locale "${locale}".`,
          });
          return {
            success: false,
            message: `No translation found for the specified locale: "${locale}".`,
          };
        }

        dataStream.writeData({
          type: "news_item",
          content: JSON.stringify({
            slug: result.data.slug,
            title: translation.title,
            date: result.data.date,
            excerpt: translation.excerpt,
            content: translation.content,
          }),
        });

        dataStream.writeData({
          type: "news_fetch_status",
          content: "Success!",
        });

        return {
          success: true,
          message: "Successfully fetched the news item.",
          news: {
            slug: result.data.slug,
            title: translation.title,
            date: result.data.date,
            excerpt: translation.excerpt,
            content: translation.content,
            image: result.data.image,
            metaTitle: translation.metaTitle,
            metaDescription: translation.metaDescription,
            keywords: translation.keywords,
          },
        };
      } catch (error) {
        console.error("Error fetching news by slug:", error);
        dataStream.writeData({
          type: "news_fetch_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
          success: false,
          message: `An error occurred while fetching the news item: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });