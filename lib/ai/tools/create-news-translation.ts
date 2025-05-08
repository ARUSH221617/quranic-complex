import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { createNewsTranslation as createNewsTranslationAction } from "../actions/create-news-translation";

interface CreateNewsTranslationProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Define the schema for the tool parameters
const createNewsTranslationToolSchema = z.object({
  slug: z.string().describe("The unique slug identifier for the news item to translate."),
  locale: z
    .enum(["en", "fa", "ar"])
    .describe(
      "The locale for the new translation (must be one of: 'en', 'fa', 'ar').",
    ),
  title: z.string().describe("The title of the news item in the new locale."),
  content: z.string().describe("The full content of the news item in the new locale (can be in Markdown or HTML)."),
  excerpt: z.string().describe("A short summary of the news item in the new locale."),
  metaTitle: z.string().optional().nullable().describe("Optional SEO meta title in the new locale."),
  metaDescription: z.string().optional().nullable().describe("Optional SEO meta description in the new locale."),
  keywords: z.string().optional().nullable().describe("Optional SEO keywords (comma-separated) in the new locale."),
});

export const createNewsTranslation = ({ session, dataStream }: CreateNewsTranslationProps) =>
  tool({
    description: "Create a new translation for an existing news item.",
    parameters: createNewsTranslationToolSchema,
    execute: async ({ slug, locale, title, content, excerpt, metaTitle, metaDescription, keywords }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "creating_news_translation",
        content: `Preparing to create a translation for news item with slug "${slug}" in ${locale} language...`,
      });

      try {
        // Prepare data for the server action
        const dataForAction = {
            slug,
            locale,
            title,
            content,
            excerpt,
            metaTitle,
            metaDescription,
            keywords,
        };

        // Call the server action
        const result = await createNewsTranslationAction(dataForAction);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "news_translation_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to create news translation: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("News translation created successfully:", result.data);
        dataStream.writeData({
          type: "news_translation_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "news_translation_created",
          content: JSON.stringify({
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
            slug: slug, // Include slug for reference
          }),
        });

        // Return success confirmation and data
        return {
          success: true,
          message: `News translation for slug "${slug}" created successfully in locale "${locale}".`,
          createdNewsTranslation: {
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
            slug: slug,
          },
        };
      } catch (error) {
        console.error("Error calling news translation API:", error);
        dataStream.writeData({
          type: "news_translation_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the creation call
        return {
          success: false,
          message: `An error occurred while trying to create the news translation: ${error instanceof Error ? error.message : String(error)}`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
