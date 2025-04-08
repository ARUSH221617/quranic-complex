import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendLoginCodeEmail } from "@/lib/email";
import { z } from "zod";

const prisma = new PrismaClient();

const requestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

// Function to generate a 6-digit code
const generateLoginCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generate code and expiry time
    const loginCode = generateLoginCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (user) {
      // User exists: Update their record and attempt to send email
      try {
        await prisma.user.update({
          where: { email: user.email }, // Use user.email to be safe
          data: {
            loginCode,
            loginCodeExpires: expires,
          },
        });

        await sendLoginCodeEmail(user.email, loginCode);
      } catch (error) {
        // Log error during update or email sending, but proceed to generic response
        console.error(
          "Error updating user or sending login code email:",
          error
        );
        // Consider more robust error handling/retries in production.
      }
    } else {
      // User does not exist: Log it but do nothing else that reveals existence.
      console.log(
        `Login code request for non-existent user: ${email}. Code not stored or sent.`
      );
    }

    // Always return a generic success message to prevent email enumeration
    return NextResponse.json(
      {
        message:
          "If your email is registered, you will receive a login code shortly.",
      },
      { status: 200 }
    );
  } catch (error) {
    // Catch potential errors during request parsing or Zod validation
    console.error("Request Login Code Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    // Catch any other unexpected errors
    return NextResponse.json(
      {
        message: "An unexpected error occurred while processing your request.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
