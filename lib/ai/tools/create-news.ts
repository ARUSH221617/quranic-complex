import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { createNews as createNewsAction } from "../actions/create-news";
import generateImage from "@/lib/ai-image";
import * as fs from "fs";
import * as path from "path";

interface CreateNewsProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createNews = ({ session, dataStream }: CreateNewsProps) =>
  tool({
    description: "Create a new news item on the website.",
    parameters: z.object({
      slug: z
        .string()
        .describe("A unique identifier for the news item, used in the URL."),
      title: z.string().describe("The main title of the news item."),
      content: z
        .string()
        .describe("The full content of the news item (can be in HTML)."),
      excerpt: z.string().describe("A short summary of the news item."),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .default("en")
        .describe(
          "The locale for the news translation (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
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
        .describe("Whether to generate an AI thumbnail for the news item."),
    }),
    execute: async ({
      slug,
      title,
      content,
      excerpt,
      locale = "en",
      metaTitle,
      metaDescription,
      keywords,
      generateThumbnail = false,
    }) => {
      // Automatically set the date to the current date in YYYY-MM-DD format
      const date = new Date().toISOString().split("T")[0];

      let thumbnailPath: string | undefined;

      // Generate thumbnail if requested
      if (generateThumbnail) {
        dataStream.writeData({
          type: "thumbnail_generation",
          content: "Generating thumbnail image...",
        });

        try {
          // Create an AI prompt based on the news content
          const thumbnailPrompt = `Create a professional news thumbnail image that represents: ${title}. ${
            excerpt ? `Context: ${excerpt}.` : ""
          } Style: Modern, professional news website thumbnail, high quality, clear composition.`;

          const imageResult = await generateImage({
            prompt: thumbnailPrompt,
            outputDir: "public/news/thumbnails",
          });

          thumbnailPath = imageResult.imagePath;

          dataStream.writeData({
            type: "thumbnail_generation_status",
            content: "Thumbnail generated successfully!",
          });
          dataStream.writeData({
            type: "thumbnail_path",
            content: thumbnailPath,
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
        type: "creating_news_item",
        content: "Preparing to create a news item...",
      });
      dataStream.writeData({ type: "news_param", name: "slug", content: slug });
      dataStream.writeData({
        type: "news_param",
        name: "title",
        content: title,
      });
      dataStream.writeData({ type: "news_param", name: "date", content: date });
      dataStream.writeData({
        type: "news_param",
        name: "locale",
        content: locale,
      });
      // Include other parameters if they are expected to be streamed
      if (excerpt)
        dataStream.writeData({
          type: "news_param",
          name: "excerpt",
          content: excerpt,
        });
      if (metaTitle)
        dataStream.writeData({
          type: "news_param",
          name: "metaTitle",
          content: metaTitle,
        });
      if (metaDescription)
        dataStream.writeData({
          type: "news_param",
          name: "metaDescription",
          content: metaDescription,
        });
      if (keywords)
        dataStream.writeData({
          type: "news_param",
          name: "keywords",
          content: keywords,
        });
      if (thumbnailPath)
        dataStream.writeData({
          type: "news_param",
          name: "thumbnailPath",
          content: thumbnailPath,
        });

      try {
        // Create form data for the server action
        const formData = new FormData();
        formData.append("slug", slug);
        formData.append("title", title);
        formData.append("content", content);
        formData.append("excerpt", excerpt);
        formData.append("date", date);
        formData.append("locale", locale);
        if (metaTitle !== undefined && metaTitle !== null)
          formData.append("metaTitle", metaTitle);
        if (metaDescription !== undefined && metaDescription !== null)
          formData.append("metaDescription", metaDescription);
        if (keywords !== undefined && keywords !== null)
          formData.append("keywords", keywords);

        // Handle image upload if thumbnailPath exists
        if (thumbnailPath) {
          try {
            const imagePath = `public${thumbnailPath}`; // Convert back to filesystem path
            const imageBuffer = fs.readFileSync(imagePath);
            const imageBlob = new Blob([imageBuffer], { type: "image/png" });
            const imageFile = new File([imageBlob], path.basename(imagePath), {
              type: "image/png",
            });
            formData.append("image", imageFile);
          } catch (error) {
            console.error("Error reading image file:", error);
            // Optionally, inform the user about the failure to attach the image
            dataStream.writeData({
              type: "thumbnail_processing_status",
              content: `Failed to process thumbnail for upload: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });
          }
        }

        // Call the server action
        const result = await createNewsAction(formData);

        if (!result.success || !result.data) {
          console.error("Server Action Error:", result.error);
          dataStream.writeData({
            type: "news_creation_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to create news item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        console.log("News item created successfully:", result.data);
        dataStream.writeData({
          type: "news_creation_status",
          content: "Success!",
        });
        dataStream.writeData({
          type: "news_created",
          content: JSON.stringify({
            id: result.data.id,
            slug: result.data.slug,
            title: result.data.title,
            date: result.data.date,
            locale: locale,
            thumbnailPath: thumbnailPath,
          }),
        });

        // Return success confirmation and data
        return {
          success: true,
          message: "News item created successfully.",
          newsItem: {
            id: result.data.id,
            slug: result.data.slug,
            title: result.data.title,
            date: result.data.date,
            locale: locale,
            thumbnailPath: thumbnailPath,
          },
        };
      } catch (error) {
        console.error("Error calling news API:", error);
        dataStream.writeData({
          type: "news_creation_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        // Handle exceptions during the fetch call
        return {
          success: false,
          message: `An error occurred while trying to create the news item: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
