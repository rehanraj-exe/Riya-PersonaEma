import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/ai/openrouter';

// Set standard timeout for Vercel Cron
export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
  // Add a basic security check (Vercel Cron sends a special header)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const settingsList = await prisma.imapSettings.findMany();
    
    if (settingsList.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No users configured." });
    }

    let totalProcessedCount = 0;

    // Process each user's inbox
    for (const settings of settingsList) {
      if (!settings.imapUser || !settings.imapPassword) continue;

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

      try {
        const connection = await Imap.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const item of messages) {
          try {
            const all = item.parts.find(part => part.which === 'TEXT');
            const header = item.parts.find(part => part.which === 'HEADER');
            
            if (!all || !header) continue;

            const parsed = await simpleParser(all.body);
            const from = (header.body as any)?.from?.[0] || "Unknown Sender";
            const subjectRaw = (header.body as any)?.subject?.[0] || "No Subject";
            const messageId = (header.body as any)?.['message-id']?.[0] || `${Date.now()}-${Math.random()}`;
            const dateRaw = item.attributes.date ? new Date(item.attributes.date) : new Date();
            const to = (header.body as any)?.to?.[0] || settings.imapUser || "Unknown Receiver";
            
            const bodyText = parsed.text || parsed.html || "No Body";

            // Analyze with Gemini
            const analysis = await analyzeEmail(subjectRaw, bodyText, from);

            // Save to DB
            await prisma.email.upsert({
              where: { messageId },
              update: {},
              create: {
                messageId,
                sender: from,
                receiver: to,
                receivedAt: dateRaw,
                subject: subjectRaw,
                body: bodyText,
                userId: settings.userId, // Link email to the specific user
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

            totalProcessedCount++;
          } catch (err) {
            console.error(`Error processing an email for user ${settings.imapUser}:`, err);
          }
        }

        connection.end();
      } catch (userError) {
        console.error(`IMAP Error for user ${settings.imapUser}:`, userError);
        // Continue to the next user even if this one fails
      }
    }

    return NextResponse.json({ success: true, count: totalProcessedCount });

  } catch (error) {
    console.error("Global IMAP Cron Error:", error);
    return NextResponse.json({ error: "Failed to process emails" }, { status: 500 });
  }
}
