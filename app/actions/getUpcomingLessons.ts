"use server";

import { prisma } from "@/lib/prisma";

export interface StudentLessonInfo {
  id: string;
  topic: string;
  date: Date;
  time: string;
  courseName: string;
}

export async function getUpcomingLessons(
  userId: string
): Promise<StudentLessonInfo[]> {
  if (!userId) {
    console.error("User ID is required to fetch student lessons.");
    return [];
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studentCoursesWithLessons = await prisma.course.findMany({
      where: { userId: userId },
      include: {
        lessons: {
          where: {
            date: {
              gte: today,
            },
          },
          select: {
            id: true,
            topic: true,
            date: true,
            time: true,
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    const upcomingLessons: StudentLessonInfo[] = [];
    studentCoursesWithLessons.forEach((course) => {
      course.lessons.forEach((lesson) => {
        upcomingLessons.push({
          ...lesson,
          courseName: course.title,
        });
      });
    });

    upcomingLessons.sort((a, b) => {
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });

    return upcomingLessons;
  } catch (error) {
    console.error(
      `Error fetching upcoming lessons for student ${userId}:`,
      error
    );
    return [];
  }
}
