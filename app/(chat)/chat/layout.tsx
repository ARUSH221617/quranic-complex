"use client";

import { generateUUID } from "@/lib/utils";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { useChat } from "@ai-sdk/react";
import { DataStreamHandler } from "@/components/ai/data-stream-handler";
import { Artifact } from "@/components/ai/artifact";
import { useCookies } from "next-client-cookies";

// export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  const cookies = useCookies();

  const id = generateUUID();
  const modelIdFromCookie = cookies.get("chat-model");
  const selectedChatModel = modelIdFromCookie || DEFAULT_CHAT_MODEL;
  const isReadonly = false;

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
    initialMessages: [],
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
  });

  return (
    <div className="flex-1">
      {children}
      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={[]}
        setAttachments={() => {}}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={[]}
        isReadonly={isReadonly}
      />
    </div>
  );
}
