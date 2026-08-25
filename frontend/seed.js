require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding dummy data to demonstrate AI features...");

  // 1. Critical Email (Requires Draft)
  await prisma.email.upsert({
    where: { messageId: 'demo-critical-123' },
    update: {},
    create: {
      messageId: 'demo-critical-123',
      sender: 'ceo@company.com',
      receiver: process.env.IMAP_USER || 'you@email.com',
      subject: 'URGENT: Board Meeting Deck Required ASAP',
      body: 'I need the final presentation deck for the board meeting by 5 PM today. The investors are waiting. Please confirm.',
      receivedAt: new Date(),
      status: 'Pending',
      analysis: {
        create: {
          category: 'Work',
          priority: 'Critical',
          sentiment: 'Negative',
          department: 'Executive',
          suggestedReply: 'Hi, I am finalizing the deck now and will have it sent over to you before 5 PM. Thanks.',
          confidenceScore: 0.98
        }
      }
    }
  });

  // 2. High Priority Email
  await prisma.email.upsert({
    where: { messageId: 'demo-high-456' },
    update: {},
    create: {
      messageId: 'demo-high-456',
      sender: 'client@enterprise.com',
      receiver: process.env.IMAP_USER || 'you@email.com',
      subject: 'Contract Revisions Needed',
      body: 'Can we schedule a quick call to go over section 4 of the contract? We are almost ready to sign.',
      receivedAt: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'Pending',
      analysis: {
        create: {
          category: 'Work',
          priority: 'High',
          sentiment: 'Positive',
          department: 'Sales',
          suggestedReply: 'Absolutely. Are you available for a quick call at 2 PM tomorrow to discuss section 4?',
          confidenceScore: 0.92
        }
      }
    }
  });

  // 3. Spam Email
  await prisma.email.upsert({
    where: { messageId: 'demo-spam-789' },
    update: {},
    create: {
      messageId: 'demo-spam-789',
      sender: 'winner@lottery-scam.net',
      receiver: process.env.IMAP_USER || 'you@email.com',
      subject: 'You have won $10,000,000!',
      body: 'Click here immediately to claim your prize before it expires!',
      receivedAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'Resolved',
      analysis: {
        create: {
          category: 'Spam',
          priority: 'Low',
          sentiment: 'Neutral',
          department: 'N/A',
          suggestedReply: '',
          confidenceScore: 0.99
        }
      }
    }
  });

  console.log("Seeding complete!");
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
