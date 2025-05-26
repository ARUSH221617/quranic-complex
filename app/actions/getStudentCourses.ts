"use server";

import { prisma } from "@/lib/prisma";

export interface StudentCourseInfo {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

export async function getStudentCourses(
  userId: string
): Promise<StudentCourseInfo[]> {
  if (!userId) {
    console.error("User ID is required to fetch student courses.");
    return [];
  }
  try {
    const courses = await prisma.course.findMany({
      where: { userId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return courses;
  } catch (error) {
    console.error(`Error fetching courses for student ${userId}:`, error);
    return [];
  }
}
