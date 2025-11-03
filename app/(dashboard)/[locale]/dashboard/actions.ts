"use server";

import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../auth";

export async function getDashboardData() {
  const session = await auth();

  if (!session) {
    return {
      enrolledPrograms: 0,
      upcomingLessons: 0,
      notifications: 0,
    };
  }

  const enrolledPrograms = await prisma.enrollment.count({
    where: {
      studentId: session.user.id,
    },
  });

  const upcomingLessons = await prisma.lesson.count({
    where: {
      enrollment: {
        studentId: session.user.id,
      },
      date: {
        gte: new Date(),
      },
    },
  });

  const notifications = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return {
    enrolledPrograms,
    upcomingLessons,
    notifications,
  };
}
