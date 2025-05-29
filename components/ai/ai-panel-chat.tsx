"use client";

import type { Attachment, UIMessage } from "ai";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import useSWR from "swr";
import type { Vote } from "@prisma/client";
import { fetcher, generateUUID } from "@/lib/utils";
import { MultimodalInput } from "./ai-panel-multimodal-input";
import { Messages } from "./messages";
import type { VisibilityType } from "./visibility-selector";
import { toast } from "sonner";

interface ChatProps {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  onInputReady?: (
    setInput: UseChatHelpers["setInput"],
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>>,
    reload: UseChatHelpers["reload"],
  ) => void;
}

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  onInputReady,
}: ChatProps) {
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onError: () => {
      toast.error("An error occurred, please try again!");
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = false;

  useEffect(() => {
    if (onInputReady) {
      onInputReady(setInput, setAttachments, reload);
    }
  }, [onInputReady]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
          />
        </div>

        <div className="border-t border-gray-200 bg-white">
          <form className="flex mx-auto px-4 py-4 gap-2 w-full md:max-w-3xl">
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            )}
          </form>
        </div>
      </div>
    </>
  );
}
