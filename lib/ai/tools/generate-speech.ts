import { tool, DataStreamWriter } from "ai";
import { z } from "zod";
import { EdgeSpeechTTS, EdgeSpeechPayload } from "@lobehub/tts";
import { Buffer } from "buffer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Session } from "next-auth";

// Define valid Microsoft Azure voices (subset - expand as needed)
const validVoices = ["en-US-JennyNeural", "en-US-JasonNeural", "en-US-AriaNeural"] as const;
type VoiceName = (typeof validVoices)[number];

// Define the parameter schema for the generateSpeech tool
const generateSpeechSchema = z.object({
  text: z.string().min(1).describe("The text to convert to speech."),
  voice: z
    .enum(validVoices)
    .optional()
    .default("en-US-AriaNeural")
    .describe(
      "Optional: The name of the voice to use. Must be one of the supported Microsoft voices."
    ),
});

// Define the properties expected by the tool factory function
interface GenerateSpeechProps {
  session: Session; // Included for consistency with other tools, though not strictly used here yet
  dataStream: DataStreamWriter; // Required for streaming status updates and results
}

// Create the generateSpeech tool factory function
export const generateSpeechTool = ({ dataStream }: GenerateSpeechProps) =>
  tool({
    description:
      "Convert text into speech audio using a Text-to-Speech model. Generates an MP3 audio file and returns its public URL.",
    parameters: generateSpeechSchema,
    // Ensure correctly typed destructured parameters
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
        // Return a structured error result
        return {
          success: false,
          message: "No text provided for speech generation.",
          errorDetails: "Input text is empty.",
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
        // Instantiate the TTS provider (Using MicrosoftSpeechTTS)
        const tts = new EdgeSpeechTTS({ locale: 'en-US' });

        // Create the payload for the TTS request
        const payload: EdgeSpeechPayload = {
          input: text,
          options: {
            voice: voice, // Ensure voice is correctly typed as string
          },
        };

        // Call the TTS provider's create method
        const ttsResponse = await tts.create(payload);

        // Check for non-OK response from the TTS API
        if (!ttsResponse.ok) {
          // Attempt to read the error message from the response body for better debugging
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
          // Return a structured error result
          return {
            success: false,
            message: `Failed to generate speech: TTS API returned status ${ttsResponse.status}`,
            errorDetails: errorDetail,
          };
        }

        // Get the audio data as an ArrayBuffer
        const audioArrayBuffer = await ttsResponse.arrayBuffer();

        // Convert ArrayBuffer to Node.js Buffer
        const audioBuffer = Buffer.from(audioArrayBuffer);

        // Stream status update
        dataStream.writeData({
          type: "speech_status",
          content: "Audio data received. Saving file...",
        });

        // --- Save the audio file to the public directory ---
        // Generate a unique filename (simple timestamp + random string)
        const filename = `speech-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.mp3`;
        const publicDir = path.join(process.cwd(), "public"); // Get path to the public directory
        const speechSubDir = "speech"; // Subdirectory within public
        const speechDir = path.join(publicDir, speechSubDir);
        const filePath = path.join(speechDir, filename); // Full path to save the file

        // Ensure the target directory exists, create if not
        await fs.mkdir(speechDir, { recursive: true }).catch(() => {}); // recursive: true creates parent dirs if needed

        // Write the audio buffer to the file
        await fs.writeFile(filePath, audioBuffer);

        // Construct the public URL for the saved file
        const publicUrl = `/${speechSubDir}/${filename}`; // URL relative to the public directory

        // Stream success status and the generated URL
        dataStream.writeData({
          type: "speech_status",
          content: "File saved successfully.",
        });
        dataStream.writeData({
          type: "speech_generated", // Custom type to signal completion and provide the URL
          content: JSON.stringify({ audioUrl: publicUrl }), // Send the URL in the content
        });

        // Return the success result with the audio URL
        return {
          success: true,
          message: "Speech audio generated and saved.",
          audioUrl: publicUrl, // Include the URL in the tool's return value
        };
      } catch (error) {
        // Handle any errors during the process (TTS call, file saving, etc.)
        console.error("[generateSpeech Tool Error]:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Stream error status
        dataStream.writeData({
          type: "speech_status",
          content: `Error generating speech: ${errorMessage}`,
        });
        dataStream.writeData({
          type: "speech_generation_error", // Specific error type
          content: errorMessage,
        });

        // Return a structured error result
        return {
          success: false,
          message: "Failed to generate speech.",
          errorDetails: errorMessage,
        };
      } finally {
        // Always send the finish signal regardless of success or failure
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
