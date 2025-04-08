import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/error?error=VerificationMissingToken", request.url)
    );
  }

  try {
    // Find the token in the database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/auth/error?error=VerificationInvalidToken", request.url)
      );
    }

    // Check if token has expired
    const hasExpired = new Date() > new Date(verificationToken.expires);
    if (hasExpired) {
      // Optionally delete expired token here or have a cron job clean them up
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL("/auth/error?error=VerificationExpiredToken", request.url)
      );
    }

    // Find the user associated with the token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      // This case should ideally not happen if registration ensures consistency
      return NextResponse.redirect(
        new URL("/auth/error?error=VerificationUserNotFound", request.url)
      );
    }

    // Mark the user's email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Redirect to login page with a success message (or a dedicated success page)
    // You might want to add a query parameter to show a success message on the login page
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("verified", "true");
    return NextResponse.redirect(loginUrl);

  } catch (error) {
    console.error("Email Verification Error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=VerificationFailed", request.url)
    );
  } finally {
    await prisma.$disconnect();
  }
}
