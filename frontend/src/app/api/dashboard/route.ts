import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const totalEmails = await prisma.email.count({ where: { userId } });
    const criticalCount = await prisma.email.count({
      where: {
        userId,
        analysis: { priority: "Critical" }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resolvedToday = await prisma.email.count({
      where: {
        userId,
        status: "Resolved",
        updatedAt: { gte: today }
      }
    });

    // Simple priority distribution aggregation
    const allAnalyses = await prisma.analysis.findMany({ 
      where: { email: { userId } },
      select: { priority: true } 
    });
    const priorityCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    allAnalyses.forEach(a => { if (a.priority in priorityCounts) priorityCounts[a.priority]++; });

    const priorityDistribution = Object.keys(priorityCounts).map(name => ({
      name,
      count: priorityCounts[name]
    })).filter(p => p.count > 0);

    // Compute traffic for the last 7 days
    const traffic = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      
      const dayName = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      
      const emailsCount = await prisma.email.count({
        where: {
          userId,
          receivedAt: { gte: dayStart, lte: dayEnd }
        }
      });
      
      const resolvedCount = await prisma.email.count({
        where: {
          userId,
          status: "Resolved",
          updatedAt: { gte: dayStart, lte: dayEnd }
        }
      });
      
      traffic.push({ name: dayName, emails: emailsCount, resolved: resolvedCount });
    }

    return NextResponse.json({
      totalEmails,
      criticalCount,
      avgResolution: "14m",
      resolvedToday,
      traffic,
      priorityDistribution
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
