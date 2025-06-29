import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { createProgram as createProgramAction } from "../actions/create-program";
import generateImage from "@/lib/ai-image";

interface CreateProgramProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createProgram = ({ session, dataStream }: CreateProgramProps) =>
  tool({
    description: "Create a new program item on the website.",
    parameters: z.object({
      slug: z
        .string()
        .describe("A unique identifier for the program item, used in the URL."),
      title: z.string().describe("The main title of the program item."),
      description: z
        .string()
        .describe("The full description of the program item (can be in HTML)."),
      ageGroup: z.string().describe("The age group for the program."),
      schedule: z.string().describe("The schedule details for the program."),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .default("en")
        .describe(
          "The locale for the program translation (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
        ),
      metaTitle: z
        .string()
        .optional()
        .nullable()
        .describe("Optional SEO meta title."),
      metaDescription: z
        .string()
        .optional()
        .nullable()
        .describe("Optional SEO meta description."),
      keywords: z
        .string()
        .optional()
        .nullable()
        .describe("Optional SEO keywords (comma-separated)."),
      generateThumbnail: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to generate an AI thumbnail for the program item."),
    }),
    execute: async ({
      slug,
      title,
      description,
      ageGroup,
      schedule,
      locale = "en",
      metaTitle,
      metaDescription,
      keywords,
      generateThumbnail = false,
    }) => {
      let thumbnailUrl: string | undefined;

      // Generate thumbnail if requested
      if (generateThumbnail) {
        dataStream.writeData({
          type: "thumbnail_generation",
          content: "Generating thumbnail image...",
        });

        try {
          // Create an AI prompt based on the program content
          const thumbnailPrompt = `Create a professional program thumbnail image that represents: ${title}. ${
            description ? `Context: ${description}.` : ""
          } Style: Modern, professional program website thumbnail, high quality, clear composition.`;

          const imageResult = await generateImage({
            prompt: thumbnailPrompt,
            filenamePrefix: `program-${slug}-thumbnail`,
          });

          thumbnailUrl = imageResult.imageUrl;

          dataStream.writeData({
            type: "thumbnail_generation_status",
            content: "Thumbnail generated successfully!",
          });
          dataStream.writeData({
            type: "thumbnail_url",
            content: thumbnailUrl,
          });
        } catch (error) {
          console.error("Error generating thumbnail:", error);
          dataStream.writeData({
            type: "thumbnail_generation_status",
            content: `Failed to generate thumbnail: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      }

      // Stream the AI-generated parameters back to the user before making the API call
      dataStream.writeData({
        type: "creating_program_item",
        content: "Preparing to create a program item...",
      });
      dataStream.writeData({
        type: "program_param",
        name: "slug",
        content: slug,
      });
      dataStream.writeData({
        type: "program_param",
        name: "title",
        content: title,
      });
      dataStream.writeData({
        type: "program_param",
        name: "locale",
        content: locale,
      });
      dataStream.writeData({
        type: "program_param",
        name: "ageGroup",
        content: ageGroup,
      });
      dataStream.writeData({
        type: "program_param",
        name: "schedule",
        content: schedule,
      });

      // Include other parameters if they are expected to be streamed
      if (metaTitle)
        dataStream.writeData({
          type: "program_param",
          name: "metaTitle",
          content: metaTitle,
        });
      if (metaDescription)
        dataStream.writeData({
          type: "program_param",
          name: "metaDescription",
          content: metaDescription,
        });
      if (keywords)
        dataStream.writeData({
          type: "program_param",
          name: "keywords",
          content: keywords,
        });
      if (thumbnailUrl)
        dataStream.writeData({
          type: "program_param",
          name: "thumbnailUrl",
          content: thumbnailUrl,
        });

      try {
        // Create form data for the server action
        const formData = new FormData();
        formData.append("slug", slug);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("ageGroup", ageGroup);
        formData.append("schedule", schedule);
        formData.append("locale", locale);
        if (metaTitle !== undefined && metaTitle !== null)
          formData.append("metaTitle", metaTitle);
        if (metaDescription !== undefined && metaDescription !== null)
          formData.append("metaDescription", metaDescription);
        if (keywords !== undefined && keywords !== null)
          formData.append("keywords", keywords);

        // Handle image upload if thumbnailUrl exists
        if (thumbnailUrl) {
          try {
            // Fetch the image from the URL
            const response = await fetch(thumbnailUrl);
            const blob = await response.blob();
            const imageFile = new File(
              [blob],
              `program-thumbnail-${slug}.png`,
              {
                type: "image/png",
              },
            );
            formData.append("image", imageFile);
          } catch (error) {
            console.error("Error fetching or processing thumbnail:", error);
            dataStream.writeData({
              type: "thumbnail_processing_status",
              content: `Failed to process thumbnail for upload: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });
          }
        }

        // Call the server action
        const result = await createProgramAction(formData);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "program_creation_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to create program item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("Program item created successfully:", result.data);
        dataStream.writeData({
          type: "program_creation_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "program_created",
          content: JSON.stringify({
            id: result.data.id,
            slug: result.data.slug,
            title: result.data.title,
            locale: locale,
            thumbnailUrl: thumbnailUrl,
          }),
        });

        // Return success confirmation and data
        return {
          success: true,
          message: "Program item created successfully.",
          programItem: {
            id: result.data.id,
            slug: result.data.slug,
            title: result.data.title,
            locale: locale,
            thumbnailUrl: thumbnailUrl,
          },
        };
      } catch (error) {
        console.error("Error calling program API:", error);
        dataStream.writeData({
          type: "program_creation_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the fetch call
        return {
          success: false,
          message: `An error occurred while trying to create the program item: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
