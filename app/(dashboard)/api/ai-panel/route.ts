// quranic-complex/app/(dashboard)/api/ai-panel/route.ts
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getChatById, getMessagesByChatId, saveChat } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import { NextResponse } from "next/server";
import type { Message as DBMessage, Chat as DBChat } from "@prisma/client";
import type { Session } from "next-auth";

interface ResponseData {
  chatId: string | undefined;
  chat: DBChat | null;
  messagesFromDb: DBMessage[];
  chatModelFromCookie: string | undefined;
  session: Session;
}

export async function GET(): Promise<
  NextResponse<ResponseData | { error: string }>
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();

  let chatIdFromCookie = cookieStore.get("dashboard:chat")?.value;
  let chat: DBChat | null = null;
  let messagesFromDb: DBMessage[] = [];
  let chatIdToUse: string | undefined = chatIdFromCookie;
  let cookieNeedsUpdate = false;

  if (chatIdFromCookie) {
    const fetchedChat = await getChatById({ id: chatIdFromCookie });

    if (fetchedChat && fetchedChat.userId === session.user.id) {
      chat = fetchedChat;
      chatIdToUse = fetchedChat.id;
    } else {
      // Chat not found or user doesn't own it, invalidate cookie
      chatIdToUse = undefined;
      cookieNeedsUpdate = true;
    }
  } else {
    // No cookie, need to create a new chat and set cookie
    cookieNeedsUpdate = true;
  }

  if (!chatIdToUse) {
    // If no valid chatId was found or we need a new one
    const newChatId = generateUUID();
    chatIdToUse = newChatId;
    // Create a new chat in the database
    const newChat = await saveChat({
      id: newChatId,
      userId: session.user.id,
      title: "Ai Panel Assistant", // Or a more dynamic title
    });
    chat = newChat;
    // Mark cookie for update to set the new chatId
    cookieNeedsUpdate = true;
  } else if (!chat) {
    // This case should ideally not happen if getChatById is successful,
    // but as a fallback, if we have a chatIdToUse but no chat object yet,
    // try to create a new one (might indicate an issue with the DB query
    // or initial state, but better to handle than fail).
    const newChat = await saveChat({
      id: chatIdToUse,
      userId: session.user.id,
      title: "Ai Panel Assistant",
    });
    chat = newChat;
    cookieNeedsUpdate = true;
  }

  // Fetch messages for the determined chat ID
  if (chat?.id) {
    messagesFromDb = await getMessagesByChatId({ id: chat.id });
  } else {
    // Should not happen if chat is properly created, but as a fallback
    messagesFromDb = [];
  }

  const chatModelFromCookie = cookieStore.get("chat-model")?.value;

  const responseData: ResponseData = {
    chatId: chatIdToUse,
    chat,
    messagesFromDb,
    chatModelFromCookie,
    session: session, // Use the fetched session
  };

  const response = NextResponse.json(responseData);

  // Set or update the cookie if necessary
  if (cookieNeedsUpdate && chatIdToUse) {
    response.cookies.set("dashboard:chat", chatIdToUse, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

// Add a DELETE method to clear the chat cookie
export async function DELETE(): Promise<NextResponse<{ success: boolean }>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Optionally return an error if only logged-in users can delete cookies
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete("dashboard:chat"); // Delete the cookie

  // Respond with success
  return NextResponse.json({ success: true });
}
