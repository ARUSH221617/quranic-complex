import type { UIMessage } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useConditionalScrollToBottom } from "./use-conditional-scroll-to-bottom";
import { Greeting } from "./greeting";
import { memo } from "react";
import type { Vote } from "@prisma/client";
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers["status"];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const shouldAutoScroll = status === "streaming" || status === "submitted";
  const [messagesContainerRef, messagesEndRef] =
    useConditionalScrollToBottom<HTMLDivElement>(shouldAutoScroll);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === "streaming" && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />}

      <div ref={messagesEndRef} className="shrink-0 min-w-[24px]" />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // Check for changes in primitive props first
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.isArtifactVisible !== nextProps.isArtifactVisible) return false;

  // Then check for changes in array/object props using deep comparison
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  // If none of the above conditions returned false, it means no relevant props have changed.
  return true;
});
