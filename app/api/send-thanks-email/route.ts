import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ThanksEmail from '@/emails/thanks-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, name } = body;

    await resend.emails.send({
      from: 'Quranic Complex <onboarding@resend.dev>',
      to,
      subject,
      react: ThanksEmail({ name }),
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}
