"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export interface StudentDetails {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  nationalCode: string;
  dateOfBirth: Date;
  quranicStudyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  nationalCardPicture: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export async function getStudentDetails(): Promise<StudentDetails | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("No active session or user ID found.");
      return null;
    }
    const userId = session.user.id;
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        nationalCode: true,
        dateOfBirth: true,
        quranicStudyLevel: true,
        nationalCardPicture: true,
        status: true,
      },
    });
    if (!student) {
      console.error(`Student with ID ${userId} not found.`);
      return null;
    }
    return student;
  } catch (error) {
    console.error("Error fetching student details:", error);
    return null;
  }
}
