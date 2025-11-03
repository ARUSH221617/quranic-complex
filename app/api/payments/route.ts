import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const image = formData.get("image") as File;
  const description = formData.get("description") as string;

  if (!image) {
    return new NextResponse("Image is required", { status: 400 });
  }

  const blob = await put(image.name, image, {
    access: "public",
  });

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      image: blob.url,
      description,
    },
  });

  return NextResponse.json(payment);
}
