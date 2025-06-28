"use client";

import { AudioPlayer, useAudioPlayer } from "@lobehub/tts/react";
import React, { memo, useMemo } from "react";
import equal from "fast-deep-equal";

interface GenerateSpeechToolResult {
  success: boolean;
  message: string;
  audioUrl?: string;
  errorDetails?: string;
}

interface SpeechPlayerPreviewProps {
  result: GenerateSpeechToolResult | null;
  isLoading?: boolean;
}

const SpeechPlayerPreview: React.FC<SpeechPlayerPreviewProps> = ({
  result,
  isLoading,
}) => {
  const audioUrl = result?.audioUrl as string | undefined;
  const success = result?.success;
  const errorDetails = result?.errorDetails;

  // Create a stable key that only changes when audioUrl actually changes
  const stableKey = useMemo(() => {
    return audioUrl ? `audio-player-${audioUrl}` : "no-audio";
  }, [audioUrl]);

  const { isLoading: audioLoading, ...audioProps } = useAudioPlayer({
    src: audioUrl || "",
  });

  const containerStyle = {
    marginTop: "16px",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  if (isLoading) {
    return (
      <div
        style={{
          ...containerStyle,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            animation: "spin 1s linear infinite",
            marginRight: "12px",
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

  if (success === false) {
    return (
      <div
        style={{
          ...containerStyle,
          backgroundColor: "#ffe6e6",
          color: "#8B0000",
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

  if (success === true && audioUrl) {
    if (audioLoading) {
      return (
        <div
          style={{
            ...containerStyle,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              animation: "spin 1s linear infinite",
              marginRight: "12px",
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
          `}</style>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <AudioPlayer
          key={stableKey}
          audio={audioProps}
          isLoading={audioLoading}
          style={{ width: "100%" }}
          autoplay={false}
          allowPause={true}
          showSlider={true}
          showDonload={true}
          showTime={true}
          timeStyle={{ color: "#333" }}
        />
      </div>
    );
  }

  if (success === undefined) {
    return (
      <div
        style={{
          ...containerStyle,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            animation: "spin 1s linear infinite",
            marginRight: "12px",
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

  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: "#fff4e6",
        color: "#cc7a00",
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

export default memo(SpeechPlayerPreview, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    equal(prevProps.result, nextProps.result)
  );
});
