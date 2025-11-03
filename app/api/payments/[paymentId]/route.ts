import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { status } = await req.json();

  if (!Object.values(UserStatus).includes(status)) {
    return new NextResponse("Invalid status", { status: 400 });
  }

  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status,
    },
  });

  return NextResponse.json(payment);
}
