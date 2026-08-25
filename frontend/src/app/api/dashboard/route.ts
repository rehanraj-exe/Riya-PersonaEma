import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalEmails = await prisma.email.count();
    const criticalCount = await prisma.email.count({
      where: {
        analysis: { priority: "Critical" }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resolvedToday = await prisma.email.count({
      where: {
        status: "resolved",
        updatedAt: { gte: today }
      }
    });

    // Simple priority distribution aggregation
    const allAnalyses = await prisma.analysis.findMany({ select: { priority: true } });
    const priorityCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    allAnalyses.forEach(a => { if (a.priority in priorityCounts) priorityCounts[a.priority]++; });

    const priorityDistribution = Object.keys(priorityCounts).map(name => ({
      name,
      count: priorityCounts[name]
    })).filter(p => p.count > 0);

    return NextResponse.json({
      totalEmails,
      criticalCount,
      avgResolution: "45m",
      resolvedToday,
      traffic: [
        { name: 'Mon', emails: 400, resolved: 240 },
        { name: 'Tue', emails: 300, resolved: 139 },
        { name: 'Wed', emails: 200, resolved: 980 },
        { name: 'Thu', emails: 278, resolved: 390 },
        { name: 'Fri', emails: 189, resolved: 480 },
        { name: 'Sat', emails: 239, resolved: 380 },
        { name: 'Sun', emails: 349, resolved: 430 },
      ],
      priorityDistribution
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
