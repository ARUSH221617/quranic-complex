import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { updateProgram as updateProgramAction } from "../actions/update-program";

interface UpdateProgramProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Define the schema for the tool parameters
const updateProgramToolSchema = z.object({
  slug: z
    .string()
    .describe("The unique slug identifier for the program item to update."),
  locale: z
    .enum(["en", "fa", "ar"])
    .optional()
    .default("en")
    .describe(
      "The locale of the program translation to update (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
    ),
  title: z
    .string()
    .optional()
    .describe("The new title for the program item translation."),
  description: z
    .string()
    .optional()
    .describe(
      "The new full description for the program item translation (can be in Markdown or HTML).",
    ),
  ageGroup: z
    .string()
    .optional()
    .describe("The new age group for the program item translation."),
  schedule: z
    .string()
    .optional()
    .describe("The new schedule details for the program item translation."),
  metaTitle: z
    .string()
    .optional()
    .nullable()
    .describe("Optional new SEO meta title for the program item translation."),
  metaDescription: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Optional new SEO meta description for the program item translation.",
    ),
  keywords: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Optional new SEO keywords (comma-separated) for the program item translation.",
    ),
});

export const updateProgram = ({ session, dataStream }: UpdateProgramProps) =>
  tool({
    description: "Update an existing program item on the website.",
    parameters: updateProgramToolSchema,
    execute: async ({ slug, locale = "en", ...updateFields }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "updating_program_item",
        content: `Preparing to update program item with slug "${slug}" in ${locale} language...`,
      });

      // Check if any fields are provided for update
      const fieldsToUpdateCount = Object.values(updateFields).filter(
        (value) => value !== undefined,
      ).length;

      if (fieldsToUpdateCount === 0) {
        dataStream.writeData({
          type: "program_update_status",
          content: "Failed: No fields provided for update.",
        });
        return {
          success: false,
          message: "No fields provided for update.",
        };
      }

      try {
        // Create FormData for the server action
        const formData = new FormData();
        formData.append("slug", slug);
        formData.append("locale", locale);

        // Add all update fields to FormData if they are defined
        Object.entries(updateFields).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value === null) {
              formData.append(key, "");
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Stream the parameters being sent
        dataStream.writeData({
          type: "program_param",
          name: "slug",
          content: slug,
        });
        dataStream.writeData({
          type: "program_param",
          name: "locale",
          content: locale,
        });

        // Stream other parameters if they exist
        Object.entries(updateFields).forEach(([key, value]) => {
          if (value !== undefined) {
            dataStream.writeData({
              type: "program_param",
              name: key,
              content: String(value),
            });
          }
        });

        // Call the server action with FormData
        const result = await updateProgramAction(formData);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "program_update_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to update program item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("Program item updated successfully:", result.data);
        dataStream.writeData({
          type: "program_update_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "program_updated",
          content: JSON.stringify({
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
            slug: result.data.slug,
            image: result.data.image,
          }),
        });

        // Return success confirmation and data
        return {
          success: true,
          message: "Program item updated successfully.",
          updatedProgramTranslation: {
            id: result.data.id,
            locale: result.data.locale,
            title: result.data.title,
            slug: result.data.slug,
            image: result.data.image,
          },
        };
      } catch (error) {
        console.error("Error calling program update API:", error);
        dataStream.writeData({
          type: "program_update_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the update call
        return {
          success: false,
          message: `An error occurred while trying to update the program item: ${error instanceof Error ? error.message : String(error)}`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
