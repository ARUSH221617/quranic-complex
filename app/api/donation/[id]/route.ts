import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { receipt } = body;

    const updatedDonation = await prisma.donation.update({
      where: { id },
      data: {
        receipt,
      },
    });

    return NextResponse.json(updatedDonation);
  } catch (error) {
    console.error(`Error updating donation ${params.id}:`, error);
    return NextResponse.json({ error: 'Error updating donation' }, { status: 500 });
  }
}
