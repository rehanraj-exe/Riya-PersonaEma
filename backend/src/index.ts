import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { analyzeEmail } from './ai/gemini';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'riya-backend' });
});

// Get all emails for Inbox
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await prisma.email.findMany({
      include: { analysis: true, assignedTo: true },
      orderBy: { receivedAt: 'desc' },
    });
    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Ingest a new email (simulated webhook)
app.post('/api/emails', async (req, res) => {
  try {
    const { subject, body, sender, receiver } = req.body;
    
    // 1. Analyze with AI
    const analysisResult = await analyzeEmail(subject, body);
    
    // 2. Save to DB
    const newEmail = await prisma.email.create({
      data: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        subject,
        body,
        snippet: body.substring(0, 100),
        sender,
        receiver: receiver || "support@riya.com",
        receivedAt: new Date(),
        analysis: {
          create: {
            category: analysisResult.category,
            sentiment: analysisResult.sentiment,
            priority: analysisResult.priority,
            confidenceScore: analysisResult.confidenceScore,
            department: analysisResult.department,
            suggestedReply: analysisResult.suggestedReply,
          }
        }
      },
      include: { analysis: true }
    });

    res.json(newEmail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to ingest email' });
  }
});

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalEmails = await prisma.email.count();
    
    const criticalCount = await prisma.analysis.count({
      where: { priority: 'Critical' }
    });

    const resolvedToday = await prisma.email.count({
      where: { 
        status: 'Resolved',
        updatedAt: {
          gte: new Date(new Date().setHours(0,0,0,0))
        }
      }
    });

    // Mock graph data for now since we don't have historical data
    const mockTraffic = [
      { name: 'Mon', emails: 400, resolved: 240 },
      { name: 'Tue', emails: 300, resolved: 139 },
      { name: 'Wed', emails: 200, resolved: 980 },
      { name: 'Thu', emails: 278, resolved: 390 },
      { name: 'Fri', emails: 189, resolved: 480 },
      { name: 'Sat', emails: 239, resolved: 380 },
      { name: 'Sun', emails: Math.max(10, totalEmails), resolved: Math.max(5, resolvedToday) },
    ];

    const priorities = await prisma.analysis.groupBy({
      by: ['priority'],
      _count: { priority: true }
    });

    const priorityData = ['Critical', 'High', 'Medium', 'Low'].map(p => {
      const found = priorities.find(x => x.priority === p);
      return {
        name: p,
        count: found ? found._count.priority : 0
      };
    });

    res.json({
      totalEmails,
      criticalCount,
      resolvedToday,
      avgResolution: "1.2h",
      traffic: mockTraffic,
      priorityDistribution: priorityData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
