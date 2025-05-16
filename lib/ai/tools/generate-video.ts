import { Session } from "next-auth";
import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import generateVideo, { VideoGenerationError } from "../../ai-video";

// Tool parameter schema
const generateVideoSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(1000)
    .describe("The text prompt describing the video to generate."),
  aspectRatio: z
    .enum(["16:9", "9:16"])
    .default("16:9")
    .describe("Aspect ratio of the video."),
  personGeneration: z
    .enum(["dont_allow", "allow_adult"])
    .default("dont_allow")
    .describe("Whether to allow people in the video."),
  numberOfVideos: z
    .number()
    .int()
    .min(1)
    .max(2)
    .default(1)
    .describe("Number of videos to generate (1 or 2)."),
  durationSeconds: z
    .number()
    .int()
    .min(5)
    .max(8)
    .optional()
    .describe("Length of each video in seconds (5-8)."),
  negativePrompt: z
    .string()
    .max(1000)
    .optional()
    .describe("Describe what you want to discourage in the video."),
  outputDir: z
    .string()
    .default("public/videos/ai-generated")
    .describe("Directory where to save the generated videos."),
});

interface GenerateVideoProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateVideoTool = ({
  session,
  dataStream,
}: GenerateVideoProps) =>
  tool({
    description:
      "Generate a video using Google's Veo model. Provide a descriptive prompt and configuration.",
    parameters: generateVideoSchema,
    execute: async (params) => {
      try {
        console.log('Starting video generation with parameters:', params);
        
        dataStream.writeData({
          type: "video_generation_status",
          content: "Starting video generation with Veo...",
        });

        dataStream.writeData({
          type: "video_generation_status",
          content: "This may take 2-3 minutes to complete...",
        });

        const result = await generateVideo(params);

        // Send progress updates for each video
        result.videos.forEach((video, idx) => {
          dataStream.writeData({
            type: "video_generated",
            content: JSON.stringify({
              index: idx,
              path: video.path,
            }),
          });
        });

        dataStream.writeData({
          type: "video_generation_complete",
          content: `Successfully generated ${result.videos.length} video(s)`,
        });

        return {
          success: true,
          message: `Generated ${result.videos.length} video(s) successfully.`,
          videos: result.videos,
        };
      } catch (error) {
        console.error("Error generating video:", error);
        let errorMessage = "Unknown error occurred";
        
        if (error instanceof VideoGenerationError) {
          errorMessage = error.message;
          if (error.cause) {
            console.error("Error cause:", error.cause);
            errorMessage += ` (Cause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)})`;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        dataStream.writeData({
          type: "video_generation_status",
          content: `Error: ${errorMessage}`,
        });

        dataStream.writeData({
          type: "video_generation_error",
          content: errorMessage,
        });

        return {
          success: false,
          message: "Failed to generate video",
          error: errorMessage,
          details: error instanceof VideoGenerationError ? error.cause : undefined,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
