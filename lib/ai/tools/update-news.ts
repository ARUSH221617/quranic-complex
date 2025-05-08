import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { updateNews as updateNewsAction } from "../actions/update-news";

interface UpdateNewsProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Define the schema for the tool parameters
const updateNewsToolSchema = z.object({
  slug: z.string().describe("The unique slug identifier for the news item to update."),
  locale: z
    .enum(["en", "fa", "ar"])
    .optional()
    .default("en")
    .describe(
      "The locale of the news translation to update (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
    ),
  title: z.string().optional().describe("The new title for the news item translation."),
  content: z.string().optional().describe("The new full content for the news item translation (can be in Markdown or HTML)."),
  excerpt: z.string().optional().describe("The new short summary for the news item translation."),
  metaTitle: z.string().optional().nullable().describe("Optional new SEO meta title for the news item translation."),
  metaDescription: z.string().optional().nullable().describe("Optional new SEO meta description for the news item translation."),
  keywords: z.string().optional().nullable().describe("Optional new SEO keywords (comma-separated) for the news item translation."),
});

export const updateNews = ({ session, dataStream }: UpdateNewsProps) =>
  tool({
    description: "Update an existing news item on the website.",
    parameters: updateNewsToolSchema,
    execute: async ({ slug, locale = "en", ...updateFields }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "updating_news_item",
        content: `Preparing to update news item with slug "${slug}" in ${locale} language...`,
      });

      // Check if any fields are provided for update
      const fieldsToUpdateCount = Object.values(updateFields).filter(value => value !== undefined).length;

      if (fieldsToUpdateCount === 0) {
          dataStream.writeData({
              type: "news_update_status",
              content: "Failed: No fields provided for update."
          });
          return {
              success: false,
              message: "No fields provided for update."
          };
      }

      try {
        // Prepare data for the server action, including slug and locale
        const dataForAction = {
            slug,
            locale,
            ...updateFields,
        };

        // Call the server action
        const result = await updateNewsAction(dataForAction);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "news_update_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to update news item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("News item updated successfully:", result.data);
        dataStream.writeData({
          type: "news_update_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "news_updated",
          content: JSON.stringify({
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
          }),
        });

        // Return success confirmation and data
        return {
          success: true,
          message: "News item updated successfully.",
          updatedNewsTranslation: {
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
          },
        };
      } catch (error) {
        console.error("Error calling news update API:", error);
        dataStream.writeData({
          type: "news_update_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the update call
        return {
          success: false,
          message: `An error occurred while trying to update the news item: ${error instanceof Error ? error.message : String(error)}`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
