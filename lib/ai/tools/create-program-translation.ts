import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { createProgramTranslation as createProgramTranslationAction } from "../actions/create-program-translation";

interface CreateProgramTranslationProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Define the schema for the tool parameters
const createProgramTranslationToolSchema = z.object({
  slug: z.string().describe("The unique slug identifier for the program item to translate."),
  locale: z
    .enum(["en", "fa", "ar"])
    .describe(
      "The locale for the new translation (must be one of: 'en', 'fa', 'ar').",
    ),
  title: z.string().describe("The title of the program item in the new locale."),
  description: z.string().describe("The full description of the program item in the new locale (can be in Markdown or HTML)."),
  ageGroup: z.string().describe("The age group for the program in the new locale."),
  schedule: z.string().describe("The schedule details for the program in the new locale."),
  metaTitle: z.string().optional().nullable().describe("Optional SEO meta title in the new locale."),
  metaDescription: z.string().optional().nullable().describe("Optional SEO meta description in the new locale."),
  keywords: z.string().optional().nullable().describe("Optional SEO keywords (comma-separated) in the new locale."),
});

export const createProgramTranslation = ({ session, dataStream }: CreateProgramTranslationProps) =>
  tool({
    description: "Create a new translation for an existing program item.",
    parameters: createProgramTranslationToolSchema,
    execute: async ({ slug, locale, title, description, ageGroup, schedule, metaTitle, metaDescription, keywords }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "creating_program_translation",
        content: `Preparing to create a translation for program item with slug "${slug}" in ${locale} language...`,
      });

      try {
        // Prepare data for the server action
        const dataForAction = {
            slug,
            locale,
            title,
            description,
            ageGroup,
            schedule,
            metaTitle,
            metaDescription,
            keywords,
        };

        // Call the server action
        const result = await createProgramTranslationAction(dataForAction);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "program_translation_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to create program translation: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("Program translation created successfully:", result.data);
        dataStream.writeData({
          type: "program_translation_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "program_translation_created",
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
          message: `Program translation for slug "${slug}" created successfully in locale "${locale}".`,
          createdProgramTranslation: {
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
            slug: slug,
          },
        };
      } catch (error) {
        console.error("Error calling program translation API:", error);
        dataStream.writeData({
          type: "program_translation_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the creation call
        return {
          success: false,
          message: `An error occurred while trying to create the program translation: ${error instanceof Error ? error.message : String(error)}`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
