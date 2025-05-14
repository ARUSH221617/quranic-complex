import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Chat } from "@/components/ai/chat";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { DataStreamHandler } from "@/components/ai/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Message as DBMessage } from "@prisma/client";
import type { Attachment, UIMessage } from "ai";
import { VisibilityType } from "@/components/ai/visibility-selector";
import { getServerSession } from "next-auth";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  if (chat.visibility === "PRIVATE") {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role.toLowerCase() as UIMessage["role"],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: "",
      createdAt: message.createdAt,
      experimental_attachments: [], // Remove the cast, handle attachments correctly
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={
            chat.visibility === "PRIVATE"
              ? VisibilityType.PRIVATE
              : VisibilityType.PUBLIC
          }
          isReadonly={session?.user?.id !== chat.userId}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie.value}
        selectedVisibilityType={
          chat.visibility === "PRIVATE"
            ? VisibilityType.PRIVATE
            : VisibilityType.PUBLIC
        }
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
