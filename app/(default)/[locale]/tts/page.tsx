"use client";

import { useState, useCallback } from "react";
import { AudioPlayer, useAudioPlayer } from "@lobehub/tts/react";

const TextToSpeechPage = () => {
  const [inputText, setInputText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function calls the backend API to generate speech and get the audio URL.
  const fetchAudioUrl = useCallback(async (text: string): Promise<string> => {
    console.log("Fetching audio for text:", text);

    const response = await fetch('/api/generate-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'en-US-GuyNeural' }), // Customize options as needed
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.audioUrl) {
        throw new Error('API response missing audio URL');
    }
    return data.audioUrl;
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to speak.");
      setAudioUrl(null); // Clear previous audio
      return;
    }
    setError(null);
    setIsLoading(true);
    setAudioUrl(null); // Clear previous audio URL while new audio is being generated

    try {
      const url = await fetchAudioUrl(inputText);
      setAudioUrl(url);
    } catch (err) {
      console.error("Error fetching audio:", err);
      setError(
        `Failed to generate speech: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, fetchAudioUrl]);

  // useAudioPlayer hook manages the state and logic for the audio player component
  // It also has its own internal loading state for the audio file itself
  const {
    ref,
    isLoading: audioLoading,
    ...audioProps
  } = useAudioPlayer({ src: audioUrl || "" });

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Text-to-Speech Sample</h1>

      <p>
        This page demonstrates how to integrate a text input with an audio
        player using the <code>@lobehub/tts/react</code> library. The speech
        generation itself is typically done on the server-side, and the URL of
        the generated audio is then provided to the frontend player. This
        example uses a placeholder backend call.
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text here..."
        rows={4}
        style={{
          width: "100%",
          marginBottom: "15px",
          padding: "10px",
          fontSize: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
        disabled={isLoading}
      />

      <button
        onClick={handleSpeak}
        disabled={isLoading || !inputText.trim()}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          cursor: "pointer",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          opacity: isLoading || !inputText.trim() ? 0.6 : 1,
        }}
      >
        {isLoading ? "Generating Speech..." : "Speak"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "15px", fontWeight: "bold" }}>
          Error: {error}
        </p>
      )}

      {/* Render AudioPlayer only if an audioUrl is available */}
      {audioUrl && (
        <div style={{ marginTop: "25px" }}>
          <h2>Playback</h2>
          {/* The AudioPlayer component uses the audioLoading state from useAudioPlayer */}
          <AudioPlayer
            audio={audioProps}
            isLoading={audioLoading}
            style={{ width: "100%" }}
          />
        </div>
      )}

      {/* Optional message while waiting for the API response */}
      {/* isLoading state indicates the API call is in progress, before we even have a URL */}
      {isLoading && !audioUrl && (
        <p style={{ marginTop: "15px" }}>Generating audio...</p>
      )}
    </div>
  );
};

export default TextToSpeechPage;
