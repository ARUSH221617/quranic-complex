import { tool, DataStreamWriter } from "ai";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { put } from "@vercel/blob";
import { Session } from "next-auth";

// Define valid Gemini voices (preset options)
const validVoices = ["Zephyr", "Puck", "Lapetus"] as const;
type VoiceName = (typeof validVoices)[number];

// Define types for stream messages
type StreamMessage = {
  type:
    | "speech_status"
    | "speech_generated"
    | "speech_generation_error"
    | "finish";
  content: string;
};

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

// Define the parameter schema for the generateSpeech tool
const generateSpeechSchema = z.object({
  text: z.string().min(1).describe("The text to convert to speech"),
  voice: z
    .enum(validVoices)
    .optional()
    .default("Lapetus")
    .describe(
      "Optional: The name of the voice to use. Must be one of: Lapetus or Puck"
    ),
});

// Define the properties expected by the tool factory function
interface GenerateSpeechProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Convert raw audio data to WAV format
function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, "base64");
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [_, format] = fileType.split("/");

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 44100, // Default sample rate if not specified
    bitsPerSample: 16, // Default bits per sample if not specified
  };

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write("WAVE", 8); // Format
  buffer.write("fmt ", 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  buffer.write("data", 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

// Create the generateSpeech tool factory function
export const generateSpeechTool = ({
  session,
  dataStream,
}: GenerateSpeechProps) =>
  tool({
    description:
      "Convert text into speech audio using the Google Gemini TTS model. Generates an MP3 audio file and returns its public URL.",
    parameters: generateSpeechSchema,
    execute: async (args) => {
      const { text, voice = "Lapetus" } = args;

      // Validate input text
      if (!text || text.trim().length === 0) {
        dataStream.writeData({
          type: "speech_status",
          content: "Error: No text provided for speech generation.",
        });
        return {
          success: false,
          message: "No text provided for speech generation.",
          errorDetails: "Input text is empty.",
        };
      }

      // Validate session
      if (!session) {
        dataStream.writeData({
          type: "speech_status",
          content: "Error: Unauthorized access.",
        });
        return {
          success: false,
          message: "Unauthorized access.",
          errorDetails: "No valid session found.",
        };
      }

      // Stream initial status
      dataStream.writeData({
        type: "speech_status",
        content: `Starting speech generation for text: "${text.substring(
          0,
          50
        )}${text.length > 50 ? "..." : ""}"`,
      });

      try {
        // Initialize Google Gemini AI
        const genAI = new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });

        // Configure TTS request
        const config = {
          temperature: 1,
          responseModalities: ["audio"],
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Speaker 1",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voice,
                  },
                },
              },
            ],
          },
        };

        const model = "gemini-2.5-flash-preview-tts";
        const contents = [
          {
            role: "user",
            parts: [{ text }],
          },
        ];

        // Generate speech using Gemini
        const response = await genAI.models.generateContentStream({
          model,
          config,
          contents,
        });

        let audioData: string | undefined;
        let audioMimeType: string | undefined;

        for await (const chunk of response) {
          if (!chunk.candidates?.[0]?.content?.parts?.[0]) continue;

          const part = chunk.candidates[0].content.parts[0];
          if ("inlineData" in part && part.inlineData) {
            audioData = part.inlineData.data;
            audioMimeType = part.inlineData.mimeType;
            break;
          }
        }

        if (!audioData || !audioMimeType) {
          throw new Error("No audio data received from Gemini API");
        }

        // Convert audio to WAV if needed
        let buffer: Buffer;
        let fileExtension = mime.getExtension(audioMimeType);

        if (!fileExtension) {
          fileExtension = "wav";
          buffer = convertToWav(audioData, audioMimeType);
        } else {
          buffer = Buffer.from(audioData, "base64");
        }

        // Generate a unique filename
        const filename = `speech-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExtension}`;

        // Stream status update
        dataStream.writeData({
          type: "speech_status",
          content: "Audio data received. Uploading to Blob storage...",
        });

        // Upload to Vercel Blob
        const { url } = await put(filename, buffer, {
          access: "public",
          contentType: audioMimeType,
        });

        // Stream success status and the generated URL
        dataStream.writeData({
          type: "speech_status",
          content: "File uploaded successfully.",
        });
        dataStream.writeData({
          type: "speech_generated",
          content: JSON.stringify({ audioUrl: url }),
        });

        // Return the success result with the audio URL
        return {
          success: true,
          message: "Speech audio generated and saved.",
          audioUrl: url,
        };
      } catch (error) {
        console.error("[generateSpeech Tool Error]:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Stream error status
        dataStream.writeData({
          type: "speech_status",
          content: `Error generating speech: ${errorMessage}`,
        });
        dataStream.writeData({
          type: "speech_generation_error",
          content: errorMessage,
        });

        return {
          success: false,
          message: "Failed to generate speech.",
          errorDetails: errorMessage,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
