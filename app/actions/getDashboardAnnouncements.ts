"use server";

import { prisma } from "@/lib/prisma";

export interface DashboardAnnouncementInfo {
  id: string;
  title: string;
  content: string | null;
  date: Date;
}

export async function getDashboardAnnouncements(
  limit: number = 5
): Promise<DashboardAnnouncementInfo[]> {
  try {
    const announcements = await prisma.dashboardAnnouncement.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
    });
    return announcements;
  } catch (error) {
    console.error("Error fetching dashboard announcements:", error);
    return [];
  }
}
