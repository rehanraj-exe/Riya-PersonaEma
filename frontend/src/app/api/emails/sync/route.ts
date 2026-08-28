import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/ai/openrouter';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60; // 60 seconds

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.imapSettings.findUnique({
      where: { userId }
    });
    
    if (!settings || !settings.imapUser || !settings.imapPassword) {
      return NextResponse.json({ error: "IMAP credentials not configured." }, { status: 400 });
    }

    const config = {
      imap: {
        user: settings.imapUser,
        password: settings.imapPassword,
        host: 'imap.gmail.com', // Change this if not using Gmail
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    let processedCount = 0;

    try {
      const connection = await Imap.connect(config);
      // Search options

      // Fetch the last 10 emails instead of just UNSEEN, to ensure we grab them even if already seen
      // by the user's main device or Gmail app.
      const searchCriteria = ['ALL'];
      const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
      
      // search() can take a sequence like '1:*' or just use search criteria.
      // To get latest 10, it's better to fetch by sequence or UID, but Imap-simple supports fetching all and slicing.
      // Or we can search 'UNSEEN' and 'SINCE' a date. Let's just fetch recent messages by seq.
      const box = await connection.openBox('INBOX');
      const totalMessages = box.messages.total;
      
      let messages = [];
      if (totalMessages > 0) {
        const start = Math.max(1, totalMessages - 10);
        messages = await connection.search([`${start}:*`], fetchOptions);
      }

      for (const item of messages) {
        try {
          const all = item.parts.find(part => part.which === 'TEXT');
          const header = item.parts.find(part => part.which === 'HEADER');
          
          if (!all || !header) continue;

          const parsed = await simpleParser(all.body);
          const from = (header.body as any)?.from?.[0] || "Unknown Sender";
          const subjectRaw = (header.body as any)?.subject?.[0] || "No Subject";
          const originalMessageId = (header.body as any)?.['message-id']?.[0] || `${Date.now()}-${Math.random()}`;
          const messageId = `${originalMessageId}-${settings.userId}`;
          const dateRaw = item.attributes.date ? new Date(item.attributes.date) : new Date();
          const to = (header.body as any)?.to?.[0] || settings.imapUser || "Unknown Receiver";
          
          const bodyText = parsed.text || parsed.html || "No Body";

          // Only analyze if it doesn't already exist in our DB
          const existing = await prisma.email.findUnique({ where: { messageId } });
          if (existing) continue;

          // Analyze with Gemini
          const analysis = await analyzeEmail(subjectRaw, bodyText, from);

          // Save to DB
          await prisma.email.create({
            data: {
              messageId,
              sender: from,
              receiver: to,
              receivedAt: dateRaw,
              subject: subjectRaw,
              body: bodyText,
              userId: settings.userId,
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
          console.error(`Error processing an email for user ${settings.imapUser}:`, err);
        }
      }

      connection.end();
      return NextResponse.json({ success: true, count: processedCount });
    } catch (userError) {
      console.error(`IMAP Error for user ${settings.imapUser}:`, userError);
      return NextResponse.json({ error: "Failed to connect to IMAP server" }, { status: 500 });
    }

  } catch (error) {
    console.error("Manual sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
