import { Session } from "next-auth";
import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import { GoogleGenAI } from "@google/genai";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import * as path from "path";
import * as fs from "fs";

// Tool parameter schema
const generateVideoSchema = z.object({
  prompt: z
    .string()
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
    .min(1)
    .max(2)
    .default(1)
    .describe("Number of videos to generate (1 or 2)."),
  durationSeconds: z
    .number()
    .min(5)
    .max(8)
    .optional()
    .describe("Length of each video in seconds (5-8)."),
  negativePrompt: z
    .string()
    .optional()
    .describe("Describe what you want to discourage in the video."),
  outputDir: z
    .string()
    .default("public/videos/ai-generated")
    .describe("Directory where to save the generated videos."),
});

interface VideoGenerationConfig {
  aspectRatio?: "16:9" | "9:16";
  personGeneration?: "dont_allow" | "allow_adult";
  numberOfVideos?: number;
  durationSeconds?: number;
  negativePrompt?: string;
}

async function downloadVideo(
  videoUri: string,
  apiKey: string,
  outputPath: string,
): Promise<void> {
  const resp = await fetch(`${videoUri}&key=${apiKey}`);
  if (!resp.ok) {
    throw new Error(`Failed to download video: ${resp.statusText}`);
  }

  const writer = createWriteStream(outputPath);
  // @ts-ignore - Readable.fromWeb is available in Node.js but TypeScript doesn't recognize it
  Readable.fromWeb(resp.body).pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

interface GenerateVideoProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateVideo = ({ session, dataStream }: GenerateVideoProps) =>
  tool({
    description:
      "Generate a video using Google's Veo 2 model. Provide a descriptive prompt and configuration.",
    parameters: generateVideoSchema,
    execute: async ({
      prompt,
      aspectRatio = "16:9",
      personGeneration = "dont_allow",
      numberOfVideos = 1,
      durationSeconds,
      negativePrompt,
      outputDir,
    }) => {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Create output directory if it doesn't exist
      const fullOutputDir = path.join(process.cwd(), outputDir);
      await fs.promises.mkdir(fullOutputDir, { recursive: true });

      // Stream start
      dataStream.writeData({
        type: "video_generation_status",
        content: "Starting video generation with Veo 2...",
      });

      // Prepare configuration
      const config: VideoGenerationConfig = {
        aspectRatio,
        personGeneration,
        numberOfVideos,
        ...(durationSeconds && { durationSeconds }),
        ...(negativePrompt && { negativePrompt }),
      };

      try {
        let operation = await ai.models.generateVideos({
          model: "veo-2.0-generate-001",
          prompt,
          config,
        });

        // Poll for completion
        while (!operation.done) {
          dataStream.writeData({
            type: "video_generation_status",
            content:
              "Video generation in progress... This may take 2-3 minutes.",
          });
          await new Promise((resolve) => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        if (!operation.response?.generatedVideos?.length) {
          dataStream.writeData({
            type: "video_generation_status",
            content: "No video was generated. Please try again.",
          });
          return { success: false, message: "No video generated." };
        }

        // Download and save videos
        const savedVideos = await Promise.all(
          operation.response.generatedVideos.map(async (video, idx) => {
            if (!video.video?.uri) {
              throw new Error(`No URI found for video ${idx + 1}`);
            }

            const timestamp = Date.now();
            const filename = `video_${timestamp}_${idx + 1}.mp4`;
            const outputPath = path.join(fullOutputDir, filename);

            await downloadVideo(video.video.uri, apiKey, outputPath);

            const relativePath = path
              .join("/", outputDir, filename)
              .replace(/\\/g, "/");

            dataStream.writeData({
              type: "video_generated",
              content: JSON.stringify({
                index: idx,
                path: relativePath,
              }),
            });

            return {
              path: relativePath,
              uri: video.video.uri,
            };
          }),
        );

        dataStream.writeData({
          type: "video_generation_complete",
          content: "All videos generated and saved successfully!",
        });

        dataStream.writeData({ type: "finish", content: "" });

        return {
          success: true,
          message: `Generated ${savedVideos.length} video(s) successfully.`,
          videos: savedVideos,
        };
      } catch (error) {
        console.error("Error generating video:", error);
        dataStream.writeData({
          type: "video_generation_error",
          content:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        return {
          success: false,
          message: "Failed to generate video",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  });
