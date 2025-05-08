import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { getLatestNews as getLatestNewsAction } from "../actions/get-news";

interface GetLatestNewsProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const getLatestNews = ({ session, dataStream }: GetLatestNewsProps) =>
  tool({
    description: "Get the latest news items from the website.",
    parameters: z.object({
      limit: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe("Number of news items to fetch (max 20). Defaults to 5."),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .default("en")
        .describe(
          "The locale for the news translations (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
        ),
    }),
    execute: async ({ limit = 5, locale = "en" }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "fetching_news",
        content: `Fetching the latest ${limit} news items in ${locale} language...`,
      });

      try {
        const result = await getLatestNewsAction({ limit, locale });

        if (!result.success || !result.data) {
          console.error("Error fetching news:", result.error);
          dataStream.writeData({
            type: "news_fetch_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to fetch news items: ${result.error}`,
            errorDetails: result.error,
          };
        }

        // Stream each news item's basic info
        result.data.forEach((newsItem, index) => {
          dataStream.writeData({
            type: "news_item",
            content: JSON.stringify({
              index: index + 1,
              title: newsItem.title,
              date: newsItem.date,
              excerpt: newsItem.excerpt,
            }),
          });
        });

        dataStream.writeData({
          type: "news_fetch_status",
          content: "Success!",
        });

        // Return success with the full data
        return {
          success: true,
          message: `Successfully fetched ${result.data.length} news items.`,
          news: result.data.map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            date: item.date,
            excerpt: item.excerpt,
            content: item.content,
            image: item.image,
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            keywords: item.keywords,
          })),
        };
      } catch (error) {
        console.error("Error fetching news:", error);
        dataStream.writeData({
          type: "news_fetch_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
          success: false,
          message: `An error occurred while fetching news items: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
