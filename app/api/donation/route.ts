import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, amount } = body;

    const donation = await prisma.donation.create({
      data: {
        name,
        email,
        phone,
        amount,
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json({ error: 'Error creating donation' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json({ error: 'Error fetching donations' }, { status: 500 });
  }
}
