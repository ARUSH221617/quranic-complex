import * as fs from "node:fs";
import * as path from "node:path";
import { nanoid } from "nanoid";

export interface VideoGenerationOptions {
  prompt: string;
  aspectRatio?: "16:9" | "9:16";
  personGeneration?: "dont_allow" | "allow_adult";
  numberOfVideos?: number;
  durationSeconds?: number;
  negativePrompt?: string;
  outputDir?: string;
}

export interface VideoGenerationResult {
  videos: Array<{
    path: string;
    uri: string;
  }>;
  modelResponse?: string;
}

export class VideoGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "VideoGenerationError";
  }
}

async function downloadVideo(
  videoUri: string,
  apiKey: string,
  outputPath: string,
): Promise<void> {
  const resp = await fetch(`${videoUri}&key=${apiKey}`);
  if (!resp.ok) {
    throw new VideoGenerationError(
      `Failed to download video: ${resp.statusText}`,
    );
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  await fs.promises.writeFile(outputPath, buffer);
}

export default async function generateVideo({
  prompt,
  aspectRatio = "16:9",
  personGeneration = "dont_allow",
  numberOfVideos = 1,
  durationSeconds,
  negativePrompt,
  outputDir = "public/videos/generated",
}: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new VideoGenerationError("Missing Google AI API key");
  }

  if (!prompt.trim()) {
    throw new VideoGenerationError("Prompt cannot be empty");
  }

  const BASE_URL = "https://generativelanguage.googleapis.com/v1";

  try {
    // Ensure output directory exists
    const fullOutputDir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true });
    }

    // Validate directory is within project
    if (!fullOutputDir.startsWith(process.cwd())) {
      throw new VideoGenerationError(
        "Output directory must be within project directory",
      );
    }

    // Start video generation
    console.log('Sending video generation request...');
    const response = await fetch(
      `${BASE_URL}/models/veo-2.0-generate-001:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt,
            },
          ],
          parameters: {
            aspectRatio,
            personGeneration,
            numberOfVideos,
            ...(durationSeconds && { durationSeconds }),
            ...(negativePrompt && { negativePrompt }),
          },
        }),
      },
    );

    // Log raw response for debugging
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const error = JSON.parse(responseText);
        errorMessage = `API request failed: ${error.error?.message || response.statusText}`;
      } catch (parseError) {
        errorMessage += ` - Raw response: ${responseText}`;
      }
      throw new VideoGenerationError(errorMessage);
    }

    const operationData = JSON.parse(responseText);
    const operationName = operationData.name;

    if (!operationName) {
      throw new VideoGenerationError("No operation name received from API");
    }

    // Poll for completion
    let pollCount = 0;
    const maxPolls = 36; // 6 minutes maximum wait time
    let operation;

    while (pollCount < maxPolls) {
      const checkResponse = await fetch(
        `${BASE_URL}/${operationName}?key=${apiKey}`,
      );
      const checkResponseText = await checkResponse.text();
      console.log('Operation status response:', checkResponseText);

      if (!checkResponse.ok) {
        let errorMessage = `Failed to check operation status: ${checkResponse.statusText}`;
        try {
          const error = JSON.parse(checkResponseText);
          errorMessage += ` - ${error.error?.message || 'No additional error info'}`;
        } catch (parseError) {
          errorMessage += ` - Raw response: ${checkResponseText}`;
        }
        throw new VideoGenerationError(errorMessage);
      }

      operation = JSON.parse(checkResponseText);

      if (operation.done) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
      pollCount++;
    }

    if (pollCount >= maxPolls) {
      throw new VideoGenerationError(
        "Video generation timed out after 6 minutes",
      );
    }

    if (!operation?.response?.generatedVideos?.length) {
      throw new VideoGenerationError("No videos were generated");
    }

    // Download and save videos
    const savedVideos = await Promise.all(
      operation.response.generatedVideos.map(
        async (video: { video?: { uri: string } }, idx: number) => {
          if (!video.video?.uri) {
            throw new VideoGenerationError(`No URI found for video ${idx + 1}`);
          }

          const filename = `${nanoid()}.mp4`;
          const outputPath = path.join(fullOutputDir, filename);

          await downloadVideo(video.video.uri, apiKey, outputPath);

          return {
            path: path
              .join("/", path.relative("public", outputPath))
              .replace(/\\/g, "/"),
            uri: video.video.uri,
          };
        },
      ),
    );

    return {
      videos: savedVideos,
      modelResponse: operation.response.modelResponse,
    };
  } catch (error) {
    if (error instanceof VideoGenerationError) {
      throw error;
    }
    throw new VideoGenerationError(
      "Failed to generate video",
      error instanceof Error ? error : undefined,
    );
  }
}
