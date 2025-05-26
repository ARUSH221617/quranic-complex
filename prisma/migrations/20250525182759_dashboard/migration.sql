-- CreateTable
CREATE TABLE "StudentCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLesson" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCourseProgress" (
    "id" TEXT NOT NULL,
    "completionPercentage" INTEGER NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "studentCourseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgressItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "grade" TEXT,
    "courseProgressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProgressItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentCourse_userId_idx" ON "StudentCourse"("userId");

-- CreateIndex
CREATE INDEX "StudentLesson_courseId_idx" ON "StudentLesson"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCourseProgress_studentCourseId_key" ON "StudentCourseProgress"("studentCourseId");

-- CreateIndex
CREATE INDEX "StudentCourseProgress_userId_idx" ON "StudentCourseProgress"("userId");

-- CreateIndex
CREATE INDEX "StudentCourseProgress_studentCourseId_idx" ON "StudentCourseProgress"("studentCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCourseProgress_userId_studentCourseId_key" ON "StudentCourseProgress"("userId", "studentCourseId");

-- CreateIndex
CREATE INDEX "StudentProgressItem_courseProgressId_idx" ON "StudentProgressItem"("courseProgressId");

-- AddForeignKey
ALTER TABLE "StudentCourse" ADD CONSTRAINT "StudentCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLesson" ADD CONSTRAINT "StudentLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "StudentCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCourseProgress" ADD CONSTRAINT "StudentCourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCourseProgress" ADD CONSTRAINT "StudentCourseProgress_studentCourseId_fkey" FOREIGN KEY ("studentCourseId") REFERENCES "StudentCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgressItem" ADD CONSTRAINT "StudentProgressItem_courseProgressId_fkey" FOREIGN KEY ("courseProgressId") REFERENCES "StudentCourseProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
