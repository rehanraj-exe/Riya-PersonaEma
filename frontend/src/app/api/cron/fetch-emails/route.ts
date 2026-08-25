import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/ai/gemini';

// Set standard timeout for Vercel Cron
export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
  // Add a basic security check (Vercel Cron sends a special header)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { IMAP_USER, IMAP_PASSWORD } = process.env;

  if (!IMAP_USER || !IMAP_PASSWORD || IMAP_USER === 'your-email@gmail.com') {
    return NextResponse.json({ error: "IMAP credentials not configured in .env.local" }, { status: 500 });
  }

  const config = {
    imap: {
      user: IMAP_USER,
      password: IMAP_PASSWORD,
      host: 'imap.gmail.com', // Change this if not using Gmail
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await Imap.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    let processedCount = 0;

    for (const item of messages) {
      try {
        const all = item.parts.find(part => part.which === 'TEXT');
        const header = item.parts.find(part => part.which === 'HEADER');
        
        if (!all || !header) continue;

        // Note: mailparser expects a buffer/string. 
        // This is a simplified extraction; full production uses standard `simpleParser` stream.
        const parsed = await simpleParser(all.body);
        const from = item.attributes.date ? item.attributes.date.toISOString() : "Unknown Sender";
        const subjectRaw = (header.body as any)?.subject?.[0] || "No Subject";
        
        const bodyText = parsed.text || "No Body";

        // Analyze with Gemini
        const analysis = await analyzeEmail(subjectRaw, bodyText, from);

        // Save to DB
        await prisma.email.create({
          data: {
            sender: from,
            subject: subjectRaw,
            body: bodyText,
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
          }
        });

        processedCount++;
      } catch (err) {
        console.error("Error processing an email:", err);
      }
    }

    connection.end();
    return NextResponse.json({ success: true, count: processedCount });

  } catch (error) {
    console.error("IMAP Connection Error:", error);
    return NextResponse.json({ error: "Failed to fetch emails via IMAP" }, { status: 500 });
  }
}
