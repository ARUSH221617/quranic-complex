"use client";

import {
  AudioPlayer,
  useAudioPlayer,
  AudioVisualizer,
} from "@lobehub/tts/react";
import React from "react"; // Import React if needed for JSX transformation

// Define the expected type for the result prop based on the generateSpeech tool's return
interface GenerateSpeechToolResult {
  success: boolean;
  message: string;
  audioUrl?: string; // URL of the generated audio file on success
  errorDetails?: string; // Error message on failure
}

interface SpeechPlayerPreviewProps {
  result: GenerateSpeechToolResult | any; // Allow any for flexibility but prefer defined type
}

const SpeechPlayerPreview: React.FC<SpeechPlayerPreviewProps> = ({
  result,
}) => {
  // Extract audioUrl and status from the tool result
  const audioUrl = result?.audioUrl as string | undefined;
  const success = result?.success;
  const errorDetails = result?.errorDetails;

  // Use the useAudioPlayer hook with the URL provided by the tool result.
  // Pass the URL within an options object as required by the hook's type definition.
  // If audioUrl is undefined, pass an empty string to avoid type issues.
  const { isLoading: audioLoading, ...audioProps } = useAudioPlayer({
    src: audioUrl || "",
  });

  // Determine if we have valid audio properties to pass to AudioPlayer.
  // audioProps will be an empty object ({}) if src is null/empty when useAudioPlayer is called.
  // Check if audioProps is not empty AND has a valid 'audio' object property, typical for the hook's output
  const hasAudioProps =
    Object.keys(audioProps).length > 0 && (audioProps as any).audio;

  const containerStyle = {
    marginTop: "16px",
    borderRadius: "8px",
    overflow: "hidden", // Ensure content doesn't bleed out of the rounded corners.
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Subtle shadow for depth.
  };

  // Render based on the state of the tool result and audio loading.
  if (success === false) {
    // Enhanced error message with an icon for better UX.
    return (
      <div
        style={{
          ...containerStyle,
          backgroundColor: "#ffe6e6",
          color: "#8B0000", // Darker red for better readability
          padding: "12px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ marginRight: "8px", fontSize: "20px" }}>❌</span>
        <span>
          Error generating speech:{" "}
          {errorDetails || "An unknown error occurred."}
        </span>
      </div>
    );
  }

  // If successful and audioUrl is available, render the player
  if (success === true && audioUrl) {
    // If audio is still loading even after getting the URL, show a loading indicator
    if (audioLoading) {
      return (
        <div
          style={{
            ...containerStyle,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // Center horizontally
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db", // A more modern blue color
              borderRadius: "50%",
              width: "24px", // Slightly larger spinner
              height: "24px",
              animation: "spin 1s linear infinite",
              marginRight: "12px", // Increased spacing
            }}
          />
          <span style={{ color: "#555", fontSize: "16px" }}>
            Loading audio player...
          </span>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      );
    }

    // If successful and audio is loaded, show the player
    return (
      <div style={containerStyle}>
        {/* Pass the collected audio properties and the hook's loading state */}
        <AudioPlayer
          audio={audioProps}
          isLoading={audioLoading} // Pass loading state from hook (though player might have its own)
          style={{ width: "100%" }}
          autoplay={true} // Autoplay the generated speech
          allowPause={true} // Allow user to pause playback
          showSlider={true} // Show progress slider
          showDonload={true} // Allow downloading the audio
          showTime={true} // Show current and total time
          timeStyle={{ color: "#333" }}
        />
      </div>
    );
  }

  // Handle intermediate states (loading, waiting for URL).
  // If success is still undefined, it means the tool is likely still running or streaming data.
  // This block now handles the initial generation loading.
  if (success === undefined) {
    // Show a centered loading message with a simple spinner effect.
    return (
      <div
        style={{
          ...containerStyle,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Center horizontally
        }}
      >
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db", // A more modern blue color
            borderRadius: "50%",
            width: "24px", // Slightly larger spinner
            height: "24px",
            animation: "spin 1s linear infinite",
            marginRight: "12px", // Increased spacing
          }}
        />
        <span style={{ color: "#555", fontSize: "16px" }}>
          Generating audio...
        </span>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Fallback for cases where success is true but audioUrl is missing or not validly processed
  // This state should ideally be rare if the tool result structure is consistent.
  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: "#fff4e6",
        color: "#cc7a00", // A more appropriate orange tone
        padding: "12px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span style={{ marginRight: "8px", fontSize: "16px" }}>⚠️</span>
      <span>Audio data not available. Please try again later.</span>
    </div>
  );
};

export default SpeechPlayerPreview;
