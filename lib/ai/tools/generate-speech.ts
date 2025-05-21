import { tool, DataStreamWriter } from "ai";
import { z } from "zod";
import { EdgeSpeechTTS, EdgeSpeechPayload } from "@lobehub/tts";
import { put } from "@vercel/blob";
import { Session } from "next-auth";

// Define valid Microsoft Azure voices (subset - expand as needed)
const validVoices = ["en-US-JennyNeural", "en-US-JasonNeural", "en-US-AriaNeural"] as const;
type VoiceName = (typeof validVoices)[number];

// Define types for stream messages
type StreamMessage = {
  type: "speech_status" | "speech_generated" | "speech_generation_error" | "finish";
  content: string;
};

// Define the parameter schema for the generateSpeech tool
const generateSpeechSchema = z.object({
  text: z.string().min(1).describe("The text to convert to speech"),
  voice: z.enum(validVoices).optional().default("en-US-AriaNeural").describe("Optional: The name of the voice to use. Must be one of the supported Microsoft voices")
});

// Define the properties expected by the tool factory function
interface GenerateSpeechProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Create the generateSpeech tool factory function
export const generateSpeechTool = ({ session, dataStream }: GenerateSpeechProps) =>
  tool({
    description:
      "Convert text into speech audio using a Text-to-Speech model. Generates an MP3 audio file and returns its public URL.",
    parameters: generateSpeechSchema,
    execute: async (args) => {
      const { text, voice = "en-US-AriaNeural" as VoiceName } = args as {
        text: string;
        voice?: VoiceName;
      };

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
        // Instantiate the TTS provider
        const tts = new EdgeSpeechTTS({ locale: 'en-US' });

        // Create the payload for the TTS request
        const payload: EdgeSpeechPayload = {
          input: text,
          options: {
            voice: voice,
          },
        };

        // Call the TTS provider's create method
        const ttsResponse = await tts.create(payload);

        // Check for non-OK response from the TTS API
        if (!ttsResponse.ok) {
          let errorDetail = ttsResponse.statusText;
          try {
            const errorBody = await ttsResponse.text();
            errorDetail = `${ttsResponse.statusText}: ${errorBody}`;
          } catch (parseError) {
            // If reading body fails, just use the status text
          }

          console.error(`TTS API error: ${ttsResponse.status} ${errorDetail}`);
          dataStream.writeData({
            type: "speech_status",
            content: `TTS API Error: ${ttsResponse.status} ${ttsResponse.statusText}`,
          });
          return {
            success: false,
            message: `Failed to generate speech: TTS API returned status ${ttsResponse.status}`,
            errorDetails: errorDetail,
          };
        }

        // Get the audio data as an ArrayBuffer
        const audioArrayBuffer = await ttsResponse.arrayBuffer();

        // Generate a unique filename
        const filename = `speech-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.mp3`;

        // Stream status update
        dataStream.writeData({
          type: "speech_status",
          content: "Audio data received. Uploading to Blob storage...",
        });

        // Upload to Vercel Blob
        const { url } = await put(filename, audioArrayBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
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
        const errorMessage = error instanceof Error ? error.message : String(error);

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
