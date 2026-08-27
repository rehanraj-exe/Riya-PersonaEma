import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/ai/openrouter';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const emails = await prisma.email.findMany({
      where: { userId },
      include: { analysis: true },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sender, subject, body: emailBody } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Run AI analysis
    const analysis = await analyzeEmail(subject, emailBody, sender);

    // Save to database
    const email = await prisma.email.create({
      data: {
        userId,
        sender,
        subject,
        body: emailBody,
        receiver: 'me',
        messageId: `api-${Date.now()}`,
        receivedAt: new Date(),
        analysis: {
          create: {
            category: analysis.category,
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            suggestedReply: analysis.suggestedReply,
            confidenceScore: analysis.confidenceScore,
            department: analysis.department
          }
        }
      },
      include: { analysis: true }
    });

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error("Failed to ingest email:", error);
    return NextResponse.json({ error: "Failed to ingest email" }, { status: 500 });
  }
}
