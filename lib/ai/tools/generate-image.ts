import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import generateImage, {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageGenerationError,
} from "@/lib/ai-image";
import { Session } from "next-auth";

// Tool parameter schema
const generateImageSchema = z.object({
  prompt: z
    .string()
    .describe("The text prompt describing the image to generate."),
  outputDir: z
    .string()
    .optional()
    .default("public/images/ai-generated")
    .describe(
      "Optional: Directory within the project's 'public' folder where the generated image will be saved. Defaults to 'public/generated'.",
    ),
});

interface GenerateImageProps {
  session: Session; // Although not strictly used in the execute function yet, maintaining pattern
  dataStream: DataStreamWriter;
}

export const generateImageTool = ({ dataStream }: GenerateImageProps) =>
  tool({
    description:
      "Generate an image based on a text prompt using an AI model. The image will be saved to a specified directory within the public folder.",
    parameters: generateImageSchema,
    execute: async ({ prompt, outputDir }) => {
      dataStream.writeData({
        type: "image_generation_status",
        content: "Starting image generation...",
      });

      try {
        const result: ImageGenerationResult = await generateImage({
          prompt,
          outputDir, // Pass the potentially undefined outputDir to generateImage
        });

        dataStream.writeData({
          type: "image_generation_status",
          content: "Image generated successfully!",
        });

        dataStream.writeData({
          type: "image_generated",
          content: JSON.stringify({
            imagePath: result.imagePath, // This is the public URL path
          }),
        });

        // Return information about the generated image
        return {
          success: true,
          message: "Image generated successfully.",
          image: {
            path: result.imagePath, // This is the public URL path
            modelResponse: result.modelResponse,
          },
        };
      } catch (error) {
        console.error("Error generating image:", error);

        dataStream.writeData({
          type: "image_generation_error",
          content:
            error instanceof Error ? error.message : "Unknown error occurred",
        });

        // Return a standardized error response for the tool
        return {
          success: false,
          message:
            error instanceof ImageGenerationError
              ? error.message
              : "An unexpected error occurred during image generation.",
          errorDetails:
            error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        // Ensure the finish signal is sent
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
