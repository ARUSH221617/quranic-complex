import { EdgeSpeechTTS } from '@lobehub/tts';
import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Define the expected request body type
interface GenerateSpeechRequestBody {
  text: string;
  // Add other options like voice if needed from the frontend
  // options?: { voice?: string; otherParams?: any };
}

export async function POST(request: Request) {
  try {
    const body: GenerateSpeechRequestBody = await request.json();
    const { text /*, options */ } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Missing text in request body" },
        { status: 400 },
      );
    }

    // You can instantiate different TTS providers here based on configuration or request
    // For this example, we use EdgeSpeechTTS
    const tts = new EdgeSpeechTTS({ locale: "en-US" }); // Configure locale as needed

    // Create speech synthesis request payload
    const payload = {
      input: text,
      options: {
        voice: "en-US-GuyNeural", // Default voice, can be made configurable via options in body
        // Spread other options from body if implemented
        // ...options,
      },
    };

    // Call create method to synthesize speech
    const ttsResponse = await tts.create(payload);

    if (!ttsResponse.ok) {
      // Attempt to read error from response if available
      let errorDetail = ttsResponse.statusText;
      try {
        const errorBody = await ttsResponse.text();
        errorDetail = `${ttsResponse.statusText}: ${errorBody}`;
      } catch (parseError) {
        // Ignore parsing errors, use statusText
      }

      console.error(`TTS API error: ${ttsResponse.status} ${errorDetail}`);
      return NextResponse.json(
        {
          error: `Failed to generate speech: TTS API returned status ${ttsResponse.status}`,
        },
        { status: 500 },
      );
    }

    // Get the audio data as an ArrayBuffer
    const audioArrayBuffer = await ttsResponse.arrayBuffer();

    // Convert ArrayBuffer to Buffer
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // Generate a unique filename (Consider using a UUID library like 'uuid' for production)
    const filename = `speech-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.mp3`;
    const publicDir = path.join(process.cwd(), 'public');
    const speechDir = path.join(publicDir, 'speech');
    const filePath = path.join(speechDir, filename);

    // Ensure the speech directory exists (optional, you might create it manually beforehand)
    await fs.mkdir(speechDir, { recursive: true }).catch(() => {}); // Ignore error if dir already exists

    // Save the file
    await fs.writeFile(filePath, audioBuffer);

    // Construct the public URL
    const publicUrl = `/speech/${filename}`;

    // Return the public URL in a JSON response
    return NextResponse.json({ audioUrl: publicUrl }, { status: 200 });

  } catch (error) {
    console.error("Error in generate-speech API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
