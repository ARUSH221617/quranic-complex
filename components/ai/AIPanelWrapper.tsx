"use client";

import React from "react";
import AIPanel from "./AIPanel";
import { useAIPanel } from "./AIPanelContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip"; // Import TooltipProvider

interface AIPanelWrapperProps {
  children: React.ReactNode;
}

export default function AIPanelWrapper({ children }: AIPanelWrapperProps) {
  const {
    showAIPanel,
    chatId,
    chat,
    session,
    messagesFromDb,
    isLoading,
    error,
  } = useAIPanel();

  // Determine if we have enough data to render the AIPanel
  // Use != null to check for both null and undefined
  const canRenderAIPanel =
    !isLoading &&
    !error &&
    showAIPanel &&
    chatId != null &&
    chat != null &&
    messagesFromDb != null &&
    session != null;

  return (
    <div className="flex size-full">
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${showAIPanel ? "md:pr-96" : ""}`}
      >
        {children}
      </div>

      {/* AI Panel area */}
      {showAIPanel && (
        <aside className="fixed right-0 top-0 z-50 h-full w-full md:w-96 bg-white shadow-lg flex flex-col animate-in slide-in-from-right-full md:slide-in-from-right-10">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <svg
                className="animate-spin"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="ml-2 text-gray-600">Loading AI Panel...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-1 items-center justify-center p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Render the AIPanel component only when data is ready and there's no error */}
          {canRenderAIPanel && (
            <TooltipProvider>
              <AIPanel />
            </TooltipProvider>
          )}
        </aside>
      )}
    </div>
  );
}
