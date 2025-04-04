-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "ageGroupEn" TEXT NOT NULL,
    "ageGroupAr" TEXT NOT NULL,
    "scheduleEn" TEXT NOT NULL,
    "scheduleAr" TEXT NOT NULL,
    "image" TEXT,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Program_locale_idx" ON "Program"("locale");

-- CreateIndex
CREATE INDEX "Program_slug_idx" ON "Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_locale_key" ON "Program"("slug", "locale");
