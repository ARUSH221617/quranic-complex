import "server-only";

import { genSaltSync, hashSync } from "bcryptjs"; // Changed from bcrypt-ts
import { prisma } from "@/lib/prisma"; // Import Prisma client
import type {
  User,
  Chat,
  Message,
  Vote,
  Document,
  Suggestion,
  ChatVisibility,
  DocumentKind,
  MessageRole,
} from "@prisma/client"; // Import Prisma types
import { Prisma } from "@prisma/client"; // Import Prisma for types like JsonValue

// Type alias for the expected structure of DBMessage based on Prisma schema
// Note: Prisma generates types, but we might need specific structures sometimes.
// For now, we'll rely on Prisma's generated Message type.
type DBMessage = Omit<Message, "chat" | "votes">; // Example if needed, adjust based on usage

// Type alias for ArtifactKind based on Prisma enum
type ArtifactKindPrisma = DocumentKind;

export async function getUser(email: string): Promise<User | null> {
  try {
    // Prisma returns a single user or null for findUnique
    return await prisma.user.findUnique({
      where: { email },
    });
    // Prisma returns null if not found, no need for array check
  } catch (error) {
    console.error("Failed to get user from database", error);
    throw error;
  }
}

// Note: createUser might already exist elsewhere if using NextAuth adapter.
// This assumes direct user creation. Adjust if using an adapter.
export async function createUser(
  email: string,
  password?: string, // Make password optional if using OAuth/other methods
  name?: string, // Add other required fields from your Prisma User model
  nationalCode?: string,
  dateOfBirth?: Date,
  quranicStudyLevel?: any, // Use correct enum type if available
  nationalCardPicture?: string,
): Promise<User> {
  let hashedPassword = null;
  if (password) {
    const salt = genSaltSync(10);
    hashedPassword = hashSync(password, salt);
  }

  try {
    // Ensure all required fields for your Prisma User model are provided
    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Store the hash
        name: name || email, // Default name to email if not provided
        // Add other required fields here based on your prisma schema
        nationalCode: nationalCode || `TEMP-${Date.now()}`, // Provide a default or ensure it's passed
        dateOfBirth: dateOfBirth || new Date(0), // Provide a default or ensure it's passed
        quranicStudyLevel: quranicStudyLevel || "BEGINNER", // Provide a default or ensure it's passed
        nationalCardPicture: nationalCardPicture || "/placeholder-user.jpg", // Provide a default or ensure it's passed
      },
    });
  } catch (error) {
    console.error("Failed to create user in database", error);
    // Consider more specific error handling, e.g., for unique constraint violations
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Unique constraint violation (e.g., email or nationalCode already exists)
      console.error("User with this email or national code already exists.");
      // You might want to throw a custom error or return a specific indicator
    }
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string; // Prisma uses cuid strings by default, ensure this matches
  userId: string;
  title: string;
}): Promise<Chat> {
  try {
    // First verify that the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new Error(`User with id ${userId} does not exist`);
    }

    return await prisma.chat.create({
      data: {
        id: id, // Use the provided ID if needed, otherwise Prisma generates one
        userId: userId,
        title: title,
        // createdAt is handled by @default(now()) in Prisma schema
      },
    });
  } catch (error) {
    console.error("Failed to save chat in database", error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }): Promise<Chat> {
  try {
    // Prisma handles cascading deletes if set up in the schema (onDelete: Cascade)
    // No need to manually delete votes and messages first if cascade is defined.
    // Ensure `onDelete: Cascade` is set on the relations in prisma.schema.
    return await prisma.chat.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete chat by id from database", error);
    throw error;
  }
}

// Prisma cursor-based pagination is different from Drizzle's offset/limit approach here.
// This implements cursor-based pagination.
export async function getChatsByUserId({
  userId, // Renamed from 'id' for clarity
  limit,
  cursor, // Use a single cursor (the ID of the chat to start after/before)
  direction = "backward", // 'forward' or 'backward'
}: {
  userId: string;
  limit: number;
  cursor?: string | null;
  direction?: "forward" | "backward";
}): Promise<{ chats: Chat[]; nextCursor: string | null }> {
  try {
    const take = limit + 1; // Fetch one extra to check if there are more
    const orderBy: Prisma.ChatOrderByWithRelationInput = {
      createdAt: direction === "backward" ? "desc" : "asc",
    };

    const chats = await prisma.chat.findMany({
      where: { userId },
      take: take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // Skip the cursor itself
      orderBy,
    });

    let nextCursor: string | null = null;
    if (chats.length > limit) {
      // If we fetched more than the limit, there's a next page
      const nextItem = chats.pop(); // Remove the extra item
      nextCursor = nextItem!.id; // The ID of the extra item is the next cursor
    }

    // If fetching backward, reverse the results to show newest first
    const orderedChats = direction === "backward" ? chats.reverse() : chats;

    return {
      chats: orderedChats,
      nextCursor,
    };
  } catch (error) {
    console.error("Failed to get chats by user from database", error);
    throw error;
  }
}

export async function getChatById({
  id,
}: {
  id: string;
}): Promise<Chat | null> {
  try {
    return await prisma.chat.findUnique({
      where: { id: id },
    });
  } catch (error) {
    console.error("Failed to get chat by id from database", error);
    throw error;
  }
}

// Prisma's createMany is suitable here.
// Ensure the input `messages` match the Prisma `Message` schema structure.
export async function saveMessages({
  messages,
}: {
  messages: Array<Omit<DBMessage, "id" | "createdAt">>; // Input shouldn't have id/createdAt
}): Promise<Prisma.BatchPayload> {
  // Map input to ensure correct structure if necessary, especially for Json fields
  const dataToSave = messages.map((msg) => ({
    ...msg,
    // Prisma handles createdAt automatically with @default(now())
    // Ensure parts and attachments are valid JSON according to Prisma
    // Cast to 'any' to bypass stricter InputJsonValue checks for now
    parts: msg.parts as any,
    attachments: msg.attachments as any,
    role: msg.role as MessageRole, // Cast to enum type
  }));

  try {
    return await prisma.message.createMany({
      data: dataToSave,
      skipDuplicates: true, // Optional: useful if retrying might insert duplicates
    });
  } catch (error) {
    console.error("Failed to save messages in database", error);
    throw error;
  }
}

export async function getMessagesByChatId({
  id,
}: {
  id: string;
}): Promise<Message[]> {
  try {
    return await prisma.message.findMany({
      where: { chatId: id },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

// Prisma's upsert is perfect for this logic.
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}): Promise<Vote> {
  const isUpvoted = type === "up";
  try {
    return await prisma.vote.upsert({
      where: {
        // Use the composite @@id defined in the schema
        chatId_messageId: {
          chatId: chatId,
          messageId: messageId,
        },
      },
      update: {
        isUpvoted,
      },
      create: {
        chatId,
        messageId,
        isUpvoted,
      },
    });
  } catch (error) {
    console.error("Failed to vote message in database", error);
    throw error;
  }
}

export async function getVotesByChatId({
  id,
}: {
  id: string;
}): Promise<Vote[]> {
  try {
    return await prisma.vote.findMany({
      where: { chatId: id },
    });
  } catch (error) {
    console.error("Failed to get votes by chat id from database", error);
    throw error;
  }
}

// Note: Drizzle schema had composite PK (id, createdAt). Prisma schema uses single 'id'.
// This function now creates a new Document record each time it's called,
// effectively creating versions identified by their unique 'id' and creation time.
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKindPrisma; // Use Prisma enum type
  content: string | null; // Allow null content based on schema
  userId: string;
}): Promise<Document> {
  try {
    // In Prisma, each 'save' creates a new row with a unique cuid.
    return await prisma.document.create({
      data: {
        Did: id,
        title: title,
        kind: kind,
        content: content,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("Failed to save document in database", error);
    throw error;
  }
}

// This function likely needs to fetch all versions of a document,
// assuming the 'id' passed refers to a logical grouping, not the PK.
// This requires a schema change (e.g., adding `versionGroupId`) or clarification.
// For now, assuming 'id' IS the unique Prisma PK.
export async function getDocumentsById({
  id,
}: {
  id: string;
}): Promise<Document[]> {
  try {
    // If 'id' is the unique PK, this fetches only one document.
    // If 'id' is a grouping ID, change `where: { id }` to `where: { versionGroupId: id }`
    // and adjust the return type.
    const doc = await prisma.document.findUnique({
      where: { Did: id },
    });
    return doc ? [doc] : []; // Return array for consistency with original return type
  } catch (error) {
    console.error("Failed to get documents by id from database", error);
    throw error;
  }
}

// Gets the most recent version of a document based on the unique ID.
// If 'id' is a grouping ID, this needs adjustment (e.g., findMany + orderBy + take).
export async function getDocumentById({
  id,
}: {
  id: string;
}): Promise<Document | null> {
  try {
    // Assuming 'id' is the unique PK.
    // If 'id' is a grouping ID, use findFirst with appropriate where and orderBy.
    return await prisma.document.findUnique({
      where: { Did: id },
    });
  } catch (error) {
    console.error("Failed to get document by id from database", error);
    throw error;
  }
}

// This function needs adjustment based on whether 'id' is PK or grouping ID.
// Assuming 'id' is the unique PK of the *specific document version* to delete suggestions for.
// The original Drizzle logic deleted suggestions AND document versions newer than timestamp.
// Prisma's cascade delete might handle suggestion deletion if configured.
// This implementation focuses on deleting document versions.
export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
  userId, // Need userId for authorization/filtering
}: {
  id: string;
  timestamp: Date;
  userId: string;
}): Promise<Prisma.BatchPayload> {
  // This is complex with the single PK change. The original logic implies
  // deleting *versions* of a document group.
  // A robust solution might require fetching all related documents first.
  // Simplified approach: Delete documents matching userId created after timestamp.
  // WARNING: This might not perfectly match the original logic if 'id' was a group ID.
  try {
    // First, delete related suggestions (if cascade delete isn't set up)
    // This requires knowing which documents will be deleted.
    // Let's assume cascade delete handles suggestions.

    // Delete document versions created after the timestamp for the user
    return await prisma.document.deleteMany({
      where: {
        Did: id,
        userId: userId, // Ensure we only delete user's documents
        createdAt: {
          gt: timestamp, // Delete documents created AFTER the timestamp
        },
      },
    });
  } catch (error) {
    console.error(
      "Failed to delete documents by id after timestamp from database",
      error,
    );
    throw error;
  }
}

// Assumes input suggestions match Prisma schema structure.
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Omit<Suggestion, "id" | "createdAt">>; // Input shouldn't have id/createdAt
}): Promise<Prisma.BatchPayload> {
  const dataToSave = suggestions.map((s) => ({
    ...s,
    // Prisma handles id and createdAt
  }));
  try {
    return await prisma.suggestion.createMany({
      data: dataToSave,
      skipDuplicates: true, // Optional
    });
  } catch (error) {
    console.error("Failed to save suggestions in database", error);
    throw error;
  }
}

// Assuming 'documentId' is the unique PK of the Document version.
// If it's a group ID, adjust the `where` clause.
export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId: documentId },
      // Add orderBy if needed
    });
  } catch (error) {
    console.error(
      "Failed to get suggestions by document id from database",
      error,
    );
    throw error;
  }
}

export async function getMessageById({
  id,
}: {
  id: string;
}): Promise<Message | null> {
  try {
    return await prisma.message.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to get message by id from database", error);
    throw error;
  }
}

// Assumes cascade delete is set for Votes when Messages are deleted.
export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}): Promise<Prisma.BatchPayload> {
  try {
    // Delete messages created at or after the timestamp
    return await prisma.message.deleteMany({
      where: {
        chatId: chatId,
        createdAt: {
          gte: timestamp, // gte: greater than or equal
        },
      },
    });
  } catch (error) {
    console.error(
      "Failed to delete messages by chat id after timestamp from database",
      error,
    );
    throw error;
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: ChatVisibility; // Use Prisma enum type
}): Promise<Chat> {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { visibility: visibility },
    });
  } catch (error) {
    console.error("Failed to update chat visibility in database", error);
    throw error;
  }
}
