require('dotenv').config({ path: '.env.local' });
const Imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({});

async function analyzeEmail(subject, body, sender) {
  const prompt = `Analyze this email and provide a JSON response.
Sender: ${sender}
Subject: ${subject}
Body: ${body.substring(0, 500)}

Determine:
1. category: (e.g. Work, Personal, Spam, Newsletter)
2. priority: (Critical, High, Medium, Low)
3. sentiment: (Positive, Neutral, Negative)
4. department: (e.g. HR, Sales, IT, N/A)
5. suggestedReply: A 1-2 sentence draft reply. If spam, output empty string.
6. confidenceScore: 0 to 100

Output MUST be raw JSON only, no markdown formatting.
`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    const text = response.text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
  } catch (error) {
    console.log("AI Analysis failed:", error);
    return {
      category: "Uncategorized",
      priority: "Low",
      sentiment: "Neutral",
      department: "N/A",
      suggestedReply: "",
      confidenceScore: 0
    };
  }
}

async function sync() {
  console.log("Starting IMAP sync...");
  const config = {
    imap: {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await Imap.connect(config);
    const box = await connection.openBox('INBOX');
    const total = box.messages.total;
    const start = Math.max(1, total - 9);
    
    // Only search the absolute 10 most recent messages by sequence number, not unbounded UNSEEN
    const searchCriteria = [String(start) + ':*'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    console.log(`Inbox has ${total} total messages. Processing the 10 most recent emails...`);
    
    let count = 0;

    for (const item of messages) {
      try {
        const all = item.parts.find(part => part.which === 'TEXT');
        const header = item.parts.find(part => part.which === 'HEADER');
        if (!all || !header) continue;

        const parsed = await simpleParser(all.body);
        const from = header.body.from?.[0] || "Unknown Sender";
        const subjectRaw = header.body.subject?.[0] || "No Subject";
        const messageId = header.body['message-id']?.[0] || `${Date.now()}-${Math.random()}`;
        const dateRaw = item.attributes.date ? new Date(item.attributes.date) : new Date();
        const to = header.body.to?.[0] || process.env.IMAP_USER || "Unknown Receiver";
        const bodyText = parsed.text || parsed.html || "No Body";

        console.log(`Analyzing: ${subjectRaw}`);
        const analysis = await analyzeEmail(subjectRaw, bodyText, from);

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
        count++;
        console.log(`Saved: ${subjectRaw}`);
      } catch (err) {
        console.error("Error processing an email:", err);
      }
    }
    connection.end();
    console.log(`Sync complete. Processed ${count} emails.`);
  } catch (error) {
    console.error("IMAP Error:", error);
  }
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
