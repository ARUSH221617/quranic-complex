import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, email, bankName, bankCardNumber } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      bankName,
      bankCardNumber,
    },
  });

  return NextResponse.json(user);
}
