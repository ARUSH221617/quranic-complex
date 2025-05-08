-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuranicStudyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ChatVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('TEXT', 'CODE', 'IMAGE', 'SHEET');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "nationalCode" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "quranicStudyLevel" "QuranicStudyLevel" NOT NULL,
    "nationalCardPicture" TEXT NOT NULL,
    "loginCode" TEXT,
    "loginCodeExpires" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsTranslation" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,

    CONSTRAINT "NewsTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTranslation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,

    CONSTRAINT "EventTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTranslation" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,

    CONSTRAINT "ProgramTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryTranslation" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "GalleryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visibility" "ChatVisibility" NOT NULL DEFAULT 'PRIVATE',

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "parts" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("chatId","messageId")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "Did" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "kind" "DocumentKind" NOT NULL DEFAULT 'TEXT',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentCreatedAt" TIMESTAMP(3) NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalCode_key" ON "User"("nationalCode");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE INDEX "NewsTranslation_locale_idx" ON "NewsTranslation"("locale");

-- CreateIndex
CREATE INDEX "NewsTranslation_newsId_idx" ON "NewsTranslation"("newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsTranslation_newsId_locale_key" ON "NewsTranslation"("newsId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "EventTranslation_locale_idx" ON "EventTranslation"("locale");

-- CreateIndex
CREATE INDEX "EventTranslation_eventId_idx" ON "EventTranslation"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTranslation_eventId_locale_key" ON "EventTranslation"("eventId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE INDEX "ProgramTranslation_locale_idx" ON "ProgramTranslation"("locale");

-- CreateIndex
CREATE INDEX "ProgramTranslation_programId_idx" ON "ProgramTranslation"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTranslation_programId_locale_key" ON "ProgramTranslation"("programId", "locale");

-- CreateIndex
CREATE INDEX "Gallery_category_idx" ON "Gallery"("category");

-- CreateIndex
CREATE INDEX "GalleryTranslation_locale_idx" ON "GalleryTranslation"("locale");

-- CreateIndex
CREATE INDEX "GalleryTranslation_galleryId_idx" ON "GalleryTranslation"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryTranslation_galleryId_locale_key" ON "GalleryTranslation"("galleryId", "locale");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

-- CreateIndex
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Vote_messageId_idx" ON "Vote"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_Did_key" ON "Document"("Did");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Suggestion_documentId_documentCreatedAt_idx" ON "Suggestion"("documentId", "documentCreatedAt");

-- CreateIndex
CREATE INDEX "Suggestion_userId_idx" ON "Suggestion"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsTranslation" ADD CONSTRAINT "NewsTranslation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTranslation" ADD CONSTRAINT "EventTranslation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramTranslation" ADD CONSTRAINT "ProgramTranslation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryTranslation" ADD CONSTRAINT "GalleryTranslation_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
