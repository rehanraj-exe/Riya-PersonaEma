import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.imapSettings.findUnique({
      where: { userId },
    });
    
    // Don't send the raw password back to the client for security
    // We just indicate if it exists
    return NextResponse.json({
      hasSettings: !!settings,
      imapUser: settings?.imapUser || '',
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imapUser, imapPassword } = await request.json();

    if (!imapUser || !imapPassword) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const settings = await prisma.imapSettings.upsert({
      where: { userId },
      update: {
        imapUser,
        imapPassword,
      },
      create: {
        userId,
        imapUser,
        imapPassword,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
