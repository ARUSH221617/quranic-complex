import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { searchNewsByTitle as searchNewsByTitleAction } from "../actions/search-news-by-title";

interface SearchNewsByTitleProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const searchNewsByTitle = ({
  session,
  dataStream,
}: SearchNewsByTitleProps) =>
  tool({
    description: "Search for news items by their title.",
    parameters: z.object({
      titleQuery: z
        .string()
        .min(3)
        .describe(
          "The search query for the news title (minimum 3 characters).",
        ),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .describe(
          "Optional: The locale to filter the search by (e.g., 'en', 'fa', 'ar'). If not provided, searches across all locales.",
        ),
    }),
    execute: async ({ titleQuery, locale }) => {
      dataStream.writeData({
        type: "searching_news_by_title",
        content: `Searching for news items with title containing "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}...`,
      });

      try {
        const result = await searchNewsByTitleAction({ titleQuery, locale });

        if (!result.success) {
          console.error("Error searching news by title:", result.error);
          dataStream.writeData({
            type: "news_search_status",
            content: `Search failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to search for news items: ${result.error}`,
            errorDetails: result.error,
          };
        }

        if (result.data && result.data.length === 0) {
          dataStream.writeData({
            type: "news_search_status",
            content: `No news items found matching "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}.`,
          });
          return {
            success: true,
            message: `No news items found matching "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}.`,
            foundNews: [],
          };
        }

        result.data?.forEach((newsItem, index) => {
          dataStream.writeData({
            type: "news_search_result_item",
            content: JSON.stringify({
              index: index + 1,
              slug: newsItem.slug,
              title: newsItem.title,
              excerpt: newsItem.excerpt,
              date: newsItem.date,
              locale: newsItem.locale,
            }),
          });
        });

        dataStream.writeData({
          type: "news_search_status",
          content: `Search successful! Found ${result.data?.length || 0} item(s).`,
        });

        return {
          success: true,
          message: `Successfully found ${result.data?.length || 0} news item(s) matching "${titleQuery}".`,
          foundNews: result.data?.map((item) => ({
            slug: item.slug,
            title: item.title,
            excerpt: item.excerpt,
            date: item.date,
            image: item.image,
            locale: item.locale,
          })),
        };
      } catch (error) {
        console.error("Error executing news title search tool:", error);
        dataStream.writeData({
          type: "news_search_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
          success: false,
          message: `An error occurred while searching for news items: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });