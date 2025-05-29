"use client";

import { ExternalLink, FileQuestion, Maximize2, Plus, X } from "lucide-react";
import { Chat } from "./ai-panel-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { UIMessage, type Attachment } from "ai";
import { DataStreamHandler } from "./data-stream-handler";
import { VisibilityType } from "./visibility-selector";
import type { Message as DBMessage } from "@prisma/client";
import { useAIPanel } from "./AIPanelContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  useCallback,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { UseChatHelpers } from "@ai-sdk/react";

export default function AIPanel() {
  const {
    showAIPanel,
    setShowAIPanel,
    chatId,
    chat,
    session,
    messagesFromDb,
    chatModelFromCookie,
    refetchData,
    isLoading,
    error,
  } = useAIPanel();

  const pathname = usePathname()?.replace(/^\//, "") || "";

  const [chatInputSetters, setChatInputSetters] = useState<{
    setInput: UseChatHelpers["setInput"] | null;
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>> | null;
    reload: UseChatHelpers["reload"] | null;
  }>({ setInput: null, setAttachments: null, reload: null });

  const handleInputReady = useCallback(
    (
      setInput: UseChatHelpers["setInput"],
      setAttachments: Dispatch<SetStateAction<Array<Attachment>>>,
      reload: UseChatHelpers["reload"],
    ) => {
      setChatInputSetters({ setInput, setAttachments, reload });
    },
    [],
  );

  useEffect(() => {
    if (!showAIPanel) {
      setChatInputSetters({
        setInput: null,
        setAttachments: null,
        reload: null,
      });
    }
  }, [showAIPanel]);

  if (!showAIPanel) return null;

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role.toLowerCase() as UIMessage["role"],
      content: "",
      createdAt: message.createdAt,
      experimental_attachments: [],
    }));
  }

  const handleNewChat = async () => {
    // Call the DELETE API route to clear the cookie server-side
    try {
      const response = await fetch("/api/ai-panel", {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to clear chat cookie:", response.statusText);
        // Optionally handle the error in the UI
        // Depending on severity, you might still try to refetch
      }

      // After clearing the cookie (or attempting to), refetch the chat data which will create a new chat
      await refetchData();
    } catch (error) {
      console.error("Error calling DELETE API or refetching:", error);
      // Optionally handle network or other errors
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-50 h-full w-full md:w-96 bg-white shadow-lg flex flex-col animate-in slide-in-from-right-full md:slide-in-from-right-10">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex justify-between items-center w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-2 px-4 py-2 text-lg font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  if (
                    chatInputSetters.setInput &&
                    chatInputSetters.setAttachments &&
                    pathname
                  ) {
                    const command = `${process.env.NEXT_PUBLIC_APP_URL}${pathname} what you see in this page ?`;
                    chatInputSetters.setInput(command);
                    chatInputSetters.setAttachments([]);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (
                      chatInputSetters.setInput &&
                      chatInputSetters.setAttachments &&
                      pathname
                    ) {
                      const command = `${process.env.NEXT_PUBLIC_APP_URL}${pathname} what you see in this page ?`;
                      chatInputSetters.setInput(command);
                      chatInputSetters.setAttachments([]);
                    }
                  }
                }}
                aria-label="Ask AI about current page contents"
              >
                <FileQuestion className="w-5 h-5" />
                Ask about this page
              </div>
            </TooltipTrigger>
            <TooltipContent>Ask AI to analyze the current page</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleNewChat}
                  aria-label="Start New Chat"
                >
                  <Plus size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Start a new chat session</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Link only if chatId is available */}
                {chatId ? (
                  <Link
                    href={`/chat/${chatId}`}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink size={20} />
                  </Link>
                ) : (
                  <ExternalLink size={20} className="text-gray-300" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {chatId ? "Open Chat In New Tab" : "Chat ID not available"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAIPanel(false)}
                >
                  <X size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Render chat components only when chat and messages are loaded and no error */}
        {isLoading && <div>Loading chat...</div>}
        {error && <div>Error loading chat: {error}</div>}
        {!isLoading && !error && chat && messagesFromDb && chatId && (
          <>
            <Chat
              id={chat.id}
              initialMessages={convertToUIMessages(messagesFromDb)}
              selectedChatModel={chatModelFromCookie || DEFAULT_CHAT_MODEL} // Use default if cookie is undefined
              selectedVisibilityType={
                chat.visibility === "PRIVATE"
                  ? VisibilityType.PRIVATE
                  : VisibilityType.PUBLIC
              }
              isReadonly={session?.user?.id !== chat.userId}
              onInputReady={handleInputReady}
            />
            <DataStreamHandler id={chatId} />
          </>
        )}
      </div>
    </aside>
  );
}
