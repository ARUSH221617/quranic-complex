import { GoogleGenAI, Modality } from "@google/genai";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export interface ImageGenerationOptions {
  prompt: string;
  /** An optional filename prefix for the generated image */
  filenamePrefix?: string;
}

export interface ImageGenerationResult {
  /** The URL where the image can be accessed */
  imageUrl: string;
  /** Optional response from the model */
  modelResponse?: string;
}

export class ImageGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ImageGenerationError";
  }
}

export default async function generateImage({
  prompt,
  filenamePrefix = "ai-generated",
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

    let imageData: string | null = null;
    let modelResponse: string | null = null;

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        modelResponse = part.text;
      } else if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
      }
    }

    if (!imageData) {
      throw new ImageGenerationError("No image was generated");
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, "base64");

    // Generate a unique filename
    const filename = `${filenamePrefix}-${nanoid()}.png`;

    // Upload to Vercel Blob storage
    const { url } = await put(filename, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return {
      imageUrl: url,
      modelResponse: modelResponse ?? undefined,
    };
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }
    throw new ImageGenerationError(
      "Failed to generate image",
      error instanceof Error ? error : undefined
    );
  }
}
