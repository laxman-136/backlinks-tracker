import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthName = searchParams.get('month') || new Date().toLocaleString('en-IN', { month: 'long' });
    const yearNum = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // 1. Fetch backlinks for this member
    const linksRes = await query(
      'SELECT * FROM backlinks WHERE member_id = $1 ORDER BY entry_date DESC',
      [auth.memberId]
    );
    const allLinks = linksRes.rows;

    // Filter backlinks for the selected month/year
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.indexOf(monthName);

    const monthlyLinks = allLinks.filter(link => {
      const date = new Date(link.entry_date);
      return date.getMonth() === monthIndex && date.getFullYear() === yearNum;
    });

    // 2. Fetch target from monthly_plans
    const planMonthStr = `${monthName} ${yearNum}`;
    const planRes = await query(
      'SELECT * FROM monthly_plans WHERE plan_month = $1 AND plan_year = $2',
      [monthName, yearNum]
    );

    let targetCount = 100; // default fallback if no plan generated
    let assignedCourses: string[] = auth.assignedCourses || [];

    if (planRes.rows.length > 0) {
      const plan = planRes.rows[0];
      const memberPlans = typeof plan.member_plans === 'string' ? JSON.parse(plan.member_plans) : plan.member_plans;
      if (memberPlans && memberPlans[auth.name]) {
        targetCount = memberPlans[auth.name].totalTarget || 100;
        assignedCourses = memberPlans[auth.name].assignedCourses || assignedCourses;
      }
    }

    // 3. Aggregate stats
    const totalBuilt = monthlyLinks.length;
    const liveLinks = monthlyLinks.filter(l => l.status === 'Live').length;
    const pendingLinks = monthlyLinks.filter(l => l.status === 'Pending').length;
    
    // Average DA
    const daValues = monthlyLinks.map(l => l.da).filter(Boolean);
    const avgDa = daValues.length ? daValues.reduce((a, b) => a + b, 0) / daValues.length : 0;

    // Average Spam
    const spamValues = monthlyLinks.map(l => l.spam_score).filter(Boolean);
    const avgSpam = spamValues.length ? spamValues.reduce((a, b) => a + b, 0) / spamValues.length : 0;

    // Link Type Distribution
    const typeDistribution: { [key: string]: number } = {};
    monthlyLinks.forEach(l => {
      typeDistribution[l.link_type] = (typeDistribution[l.link_type] || 0) + 1;
    });

    // Course Distribution
    const courseDistribution: { [key: string]: number } = {};
    monthlyLinks.forEach(l => {
      courseDistribution[l.course] = (courseDistribution[l.course] || 0) + 1;
    });

    // Daily volume (last 30 days)
    const dailyVolume: { [date: string]: number } = {};
    // Seed last 15 days of the month with 0
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyVolume[dateStr] = 0;
    }

    monthlyLinks.forEach(l => {
      const dateStr = new Date(l.entry_date).toISOString().split('T')[0];
      if (dailyVolume[dateStr] !== undefined) {
        dailyVolume[dateStr]++;
      }
    });

    const dailyChartData = Object.entries(dailyVolume).map(([date, count]) => ({
      date: date.substring(8, 10) + ' ' + new Date(date).toLocaleString('en-IN', { month: 'short' }),
      count
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalBuilt,
        targetCount,
        liveLinks,
        pendingLinks,
        avgDa: Math.round(avgDa * 10) / 10,
        avgSpam: Math.round(avgSpam * 10) / 10,
        typeDistribution,
        courseDistribution,
        dailyChartData,
        assignedCourses,
        cumulativeTotal: allLinks.length
      }
    });
  } catch (error: any) {
    console.error('Fetch Performance Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
