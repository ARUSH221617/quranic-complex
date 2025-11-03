import { describe, it, expect, vi } from "vitest";
import { getDashboardData } from "../actions";
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../../auth";

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../../../../../lib/prisma", () => ({
  prisma: {
    enrollment: {
      count: vi.fn(),
    },
    lesson: {
      count: vi.fn(),
    },
    notification: {
      count: vi.fn(),
    },
  },
}));

vi.mock("auth", () => ({
  auth: vi.fn(),
}));

describe("getDashboardData", () => {
  it("should return the correct dashboard data", async () => {
    const session = {
      user: {
        id: "1",
      },
    };

    auth.mockResolvedValue(session);

    prisma.enrollment.count.mockResolvedValue(5);
    prisma.lesson.count.mockResolvedValue(10);
    prisma.notification.count.mockResolvedValue(3);

    const data = await getDashboardData();

    expect(data).toEqual({
      enrolledPrograms: 5,
      upcomingLessons: 10,
      notifications: 3,
    });
  });

  it("should return 0 for all fields when there is no session", async () => {
    auth.mockResolvedValue(null);

    const data = await getDashboardData();

    expect(data).toEqual({
      enrolledPrograms: 0,
      upcomingLessons: 0,
      notifications: 0,
    });
  });
});
