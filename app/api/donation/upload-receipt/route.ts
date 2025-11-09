import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const donationId = formData.get("donationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: "public",
    });

    const donation = await prisma.donation.update({
      where: { id: donationId },
      data: { receipt: blob.url },
    });

    return NextResponse.json({ donation });
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return NextResponse.json({ error: "Error uploading receipt" }, { status: 500 });
  }
}
