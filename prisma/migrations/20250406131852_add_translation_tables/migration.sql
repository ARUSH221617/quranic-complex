/*
  Warnings:

  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionAr` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionEn` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionFa` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `titleAr` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `titleFa` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `excerpt` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `ageGroupAr` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `ageGroupEn` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionAr` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionEn` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleAr` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleEn` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `titleAr` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `Program` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `News` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Program` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Event_locale_idx";

-- DropIndex
DROP INDEX "Event_slug_idx";

-- DropIndex
DROP INDEX "Event_slug_locale_key";

-- DropIndex
DROP INDEX "News_locale_idx";

-- DropIndex
DROP INDEX "News_slug_idx";

-- DropIndex
DROP INDEX "News_slug_locale_key";

-- DropIndex
DROP INDEX "Program_locale_idx";

-- DropIndex
DROP INDEX "Program_slug_idx";

-- DropIndex
DROP INDEX "Program_slug_locale_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "description",
DROP COLUMN "locale",
DROP COLUMN "metaDescription",
DROP COLUMN "metaTitle",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "descriptionAr",
DROP COLUMN "descriptionEn",
DROP COLUMN "descriptionFa",
DROP COLUMN "titleAr",
DROP COLUMN "titleEn",
DROP COLUMN "titleFa";

-- AlterTable
ALTER TABLE "News" DROP COLUMN "content",
DROP COLUMN "excerpt",
DROP COLUMN "keywords",
DROP COLUMN "locale",
DROP COLUMN "metaDescription",
DROP COLUMN "metaTitle",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "ageGroupAr",
DROP COLUMN "ageGroupEn",
DROP COLUMN "descriptionAr",
DROP COLUMN "descriptionEn",
DROP COLUMN "keywords",
DROP COLUMN "locale",
DROP COLUMN "metaDescription",
DROP COLUMN "metaTitle",
DROP COLUMN "scheduleAr",
DROP COLUMN "scheduleEn",
DROP COLUMN "titleAr",
DROP COLUMN "titleEn";

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
CREATE TABLE "GalleryTranslation" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "GalleryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsTranslation_locale_idx" ON "NewsTranslation"("locale");

-- CreateIndex
CREATE INDEX "NewsTranslation_newsId_idx" ON "NewsTranslation"("newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsTranslation_newsId_locale_key" ON "NewsTranslation"("newsId", "locale");

-- CreateIndex
CREATE INDEX "EventTranslation_locale_idx" ON "EventTranslation"("locale");

-- CreateIndex
CREATE INDEX "EventTranslation_eventId_idx" ON "EventTranslation"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTranslation_eventId_locale_key" ON "EventTranslation"("eventId", "locale");

-- CreateIndex
CREATE INDEX "ProgramTranslation_locale_idx" ON "ProgramTranslation"("locale");

-- CreateIndex
CREATE INDEX "ProgramTranslation_programId_idx" ON "ProgramTranslation"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTranslation_programId_locale_key" ON "ProgramTranslation"("programId", "locale");

-- CreateIndex
CREATE INDEX "GalleryTranslation_locale_idx" ON "GalleryTranslation"("locale");

-- CreateIndex
CREATE INDEX "GalleryTranslation_galleryId_idx" ON "GalleryTranslation"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryTranslation_galleryId_locale_key" ON "GalleryTranslation"("galleryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- AddForeignKey
ALTER TABLE "NewsTranslation" ADD CONSTRAINT "NewsTranslation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTranslation" ADD CONSTRAINT "EventTranslation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramTranslation" ADD CONSTRAINT "ProgramTranslation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryTranslation" ADD CONSTRAINT "GalleryTranslation_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
