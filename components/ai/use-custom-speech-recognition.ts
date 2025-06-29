import { useState, useEffect, useRef, useCallback } from "react";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  message?: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;

  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  text: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggleListening: () => void;
  reset: () => void;
}

/**
 * A custom React hook for Web Speech Recognition.
 * Provides functionality to start, stop, and toggle speech recognition,
 * returning the transcribed text, listening status, and any errors.
 *
 * @param lang The language for the recognition, e.g., 'en-US', 'ar-SA'. Defaults to 'en-US'.
 * @param interimResults Whether to return interim results (true) or only final results (false). Defaults to false.
 * @param continuous Whether to continuously listen (true) or stop after a single utterance (false). Defaults to false.
 */
export const useCustomSpeechRecognition = (
  lang: string = "en-US",
  interimResults: boolean = false,
  continuous: boolean = false,
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Use useRef to hold the SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    const getSpeechRecognition = (): typeof SpeechRecognition | null => {
      if (typeof window !== "undefined") {
        return (
          window.SpeechRecognition || window.webkitSpeechRecognition || null
        );
      }
      return null;
    };

    const SpeechRecognitionConstructor = getSpeechRecognition();

    if (SpeechRecognitionConstructor) {
      // Stop and clean up any existing recognition instance before creating a new one
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort(); // Use abort to ensure it stops immediately
          console.debug(
            "Aborted previous speech recognition instance due to config change.",
          );
        } catch (e: unknown) {
          const errorMessage =
            e instanceof Error ? e.message : "Unknown error occurred";
          console.warn(
            "Error aborting previous recognition instance:",
            errorMessage,
          );
        }
        recognitionRef.current = null; // Clear the ref
      }

      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = lang;

      recognitionRef.current.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
        setText("");
        console.debug("Speech recognition started.");
      };

      recognitionRef.current.onresult = (
        event: SpeechRecognitionEvent,
      ): void => {
        let currentOverallTranscript = "";
        // Accumulate all recognized text from the current event's results
        for (let i = 0; i < event.results.length; ++i) {
          currentOverallTranscript += event.results[i][0].transcript;
        }

        if (continuous) {
          // In continuous mode, if the last result is final, append it.
          // Otherwise, for interim results, update the text to reflect the ongoing recognition.
          // This ensures that new segments are added while the current segment's interim text is updated.
          if (event.results[event.results.length - 1].isFinal) {
            setText((prev: string) => prev + currentOverallTranscript);
          } else if (interimResults) {
            // For continuous interim updates, we overwrite with the current full text
            // up to this point, to avoid double appending within a single ongoing utterance.
            setText(currentOverallTranscript);
          }
        } else {
          // In non-continuous mode, each onresult event refines the *single* utterance.
          // Therefore, we always replace the text with the current best transcription
          // for the entire utterance.
          setText(currentOverallTranscript);
        }
      };

      recognitionRef.current.onerror = (
        event: SpeechRecognitionErrorEvent,
      ): void => {
        isListeningRef.current = false;
        setIsListening(false);
        setError(event.error);
        console.error("Speech recognition error:", event.error, event.message);

        // Handle specific errors
        if (event.error === "no-speech" && !continuous) {
          console.warn("No speech was detected. Please try again.");
        } else if (event.error === "not-allowed") {
          setError(
            "Microphone access denied. Please allow microphone permissions.",
          );
        } else if (event.error === "network") {
          setError("Network error occurred during speech recognition.");
        }
      };

      recognitionRef.current.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        console.debug("Speech recognition ended.");
      };
    } else {
      setError("Web Speech API is not supported in this browser.");
      console.error("Web Speech API is not supported in this browser.");
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e: unknown) {
          const errorMessage =
            e instanceof Error ? e.message : "Unknown error occurred";
          console.warn(
            "Error stopping speech recognition during cleanup:",
            errorMessage,
          );
        }
        console.debug("Speech recognition cleaned up.");
      }
    };
  }, [lang, interimResults, continuous]); // Removed isListening from dependencies

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech Recognition API is not available.");
      console.error("Speech Recognition API is not available.");
      return;
    }

    if (isListeningRef.current) {
      console.warn("Speech recognition is already listening.");
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown error occurred";
      console.error("Error starting speech recognition:", errorMessage);
      setError("Failed to start speech recognition.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition is not available.");
      return;
    }

    if (!isListeningRef.current) {
      console.warn("Speech recognition is not active.");
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown error occurred";
      console.warn("Error stopping speech recognition:", errorMessage);
      // Force update the state even if stop() fails
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const reset = useCallback(() => {
    stop();
    setText("");
    setError(null);
  }, [stop]);

  return {
    isListening,
    text,
    error,
    start,
    stop,
    toggleListening,
    reset,
  };
};
