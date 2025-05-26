"use server";

import { prisma } from "@/lib/prisma";

export interface StudentProgressItemInfo {
  id: string;
  itemName: string;
  isCompleted: boolean;
  completedAt: Date | null;
  grade: string | null;
}

export interface StudentCourseProgressInfo {
  id: string;
  completionPercentage: number;
  lastUpdatedAt: Date;
  studentCourseId: string;
  studentCourseTitle: string;
  completedItems: StudentProgressItemInfo[];
}

export async function getStudentProgress(
  userId: string
): Promise<StudentCourseProgressInfo[]> {
  if (!userId) {
    console.error("User ID is required to fetch student progress.");
    return [];
  }
  try {
    const progressRecords = await prisma.studentCourseProgress.findMany({
      where: { userId: userId },
      include: {
        studentCourse: {
          select: {
            title: true,
          },
        },
        completedItems: {
          select: {
            id: true,
            itemName: true,
            isCompleted: true,
            completedAt: true,
            grade: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        lastUpdatedAt: "desc",
      },
    });

    return progressRecords.map((p) => ({
      id: p.id,
      completionPercentage: p.completionPercentage,
      lastUpdatedAt: p.lastUpdatedAt,
      studentCourseId: p.studentCourseId,
      studentCourseTitle: p.studentCourse.title,
      completedItems: p.completedItems,
    }));
  } catch (error) {
    console.error(`Error fetching progress for student ${userId}:`, error);
    return [];
  }
}
