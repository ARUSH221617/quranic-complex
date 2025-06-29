import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { searchProgramByTitle as searchProgramByTitleAction } from "../actions/search-program-by-title";

interface SearchProgramByTitleProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const searchProgramByTitle = ({
  session,
  dataStream,
}: SearchProgramByTitleProps) =>
  tool({
    description: "Search for program items by their title.",
    parameters: z.object({
      titleQuery: z
        .string()
        .min(3)
        .describe(
          "The search query for the program title (minimum 3 characters).",
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
        type: "searching_program_by_title",
        content: `Searching for program items with title containing "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}...`,
      });

      try {
        const result = await searchProgramByTitleAction({ titleQuery, locale });

        if (!result.success) {
          console.error("Error searching program by title:", result.error);
          dataStream.writeData({
            type: "program_search_status",
            content: `Search failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to search for program items: ${result.error}`,
            errorDetails: result.error,
          };
        }

        if (result.data && result.data.length === 0) {
          dataStream.writeData({
            type: "program_search_status",
            content: `No program items found matching "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}.`,
          });
          return {
            success: true,
            message: `No program items found matching "${titleQuery}"${locale ? ` in locale "${locale}"` : ""}.`,
            foundPrograms: [],
          };
        }

        result.data?.forEach((programItem, index) => {
          dataStream.writeData({
            type: "program_search_result_item",
            content: JSON.stringify({
              index: index + 1,
              slug: programItem.slug,
              title: programItem.title,
              description: programItem.description,
              ageGroup: programItem.ageGroup,
              schedule: programItem.schedule,
              locale: programItem.locale,
            }),
          });
        });

        dataStream.writeData({
          type: "program_search_status",
          content: `Search successful! Found ${result.data?.length || 0} item(s).`,
        });

        return {
          success: true,
          message: `Successfully found ${result.data?.length || 0} program item(s) matching "${titleQuery}".`,
          foundPrograms: result.data?.map((item) => ({
            slug: item.slug,
            title: item.title,
            description: item.description,
            ageGroup: item.ageGroup,
            schedule: item.schedule,
            image: item.image,
            locale: item.locale,
          })),
        };
      } catch (error) {
        console.error("Error executing program title search tool:", error);
        dataStream.writeData({
          type: "program_search_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
          success: false,
          message: `An error occurred while searching for program items: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
