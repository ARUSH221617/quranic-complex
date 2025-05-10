import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { nanoid } from "nanoid";

export interface ImageGenerationOptions {
  prompt: string;
  outputDir?: string;
}

export interface ImageGenerationResult {
  imagePath: string;
  modelResponse?: string;
}

export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}

export default async function generateImage({
  prompt,
  outputDir = "public/generated",
}: ImageGenerationOptions): Promise<ImageGenerationResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new ImageGenerationError("Missing Google AI API key");
  }

  if (!prompt.trim()) {
    throw new ImageGenerationError("Prompt cannot be empty");
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new ImageGenerationError("No response content received from API");
    }

    let imagePath: string | null = null;
    let modelResponse: string | null = null;

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        modelResponse = part.text;
      } else if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const filename = `${nanoid()}.png`;
        imagePath = path.join(outputDir, filename);
        fs.writeFileSync(imagePath, buffer);
      }
    }

    if (!imagePath) {
      throw new ImageGenerationError("No image was generated");
    }

    return {
      imagePath: imagePath.replace(/^public/, ""), // Convert to public URL path
      modelResponse: modelResponse ?? undefined,
    };
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }
    throw new ImageGenerationError(
      "Failed to generate image",
      error instanceof Error ? error : undefined,
    );
  }
}
