import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/ai/gemini';

export async function GET() {
  try {
    const emails = await prisma.email.findMany({
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
        sender,
        subject,
        body: emailBody,
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
