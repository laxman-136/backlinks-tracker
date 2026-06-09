import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 1. Fetch all active members
    const membersRes = await query("SELECT id, name, username, role, job_role, status FROM members WHERE status = 'Active'");
    const activeMembers = membersRes.rows;

    // 2. Fetch all backlinks for the current month
    const linksRes = await query("SELECT * FROM backlinks WHERE entry_date >= date_trunc('month', CURRENT_DATE)");
    const allLinks = linksRes.rows;

    // Helper to aggregate stats for a list of links
    const getStats = (linksList: any[]) => {
      const todayCount = linksList.filter(l => l.entry_date === todayStr).length;
      const monthCount = linksList.length;
      
      const liveCount = linksList.filter(l => l.status === 'Live').length;
      const liveRate = monthCount > 0 ? Math.round((liveCount / monthCount) * 100) : 0;
      
      const daValues = linksList.map(l => l.da).filter(Boolean);
      const avgDa = daValues.length ? daValues.reduce((a, b) => a + b, 0) / daValues.length : 0;
      
      const spamValues = linksList.map(l => l.spam_score).filter(Boolean);
      const avgSpam = spamValues.length ? spamValues.reduce((a, b) => a + b, 0) / spamValues.length : 0;

      return {
        todayCount,
        monthCount,
        liveRate,
        avgDa: Math.round(avgDa * 10) / 10,
        avgSpam: Math.round(avgSpam * 10) / 10
      };
    };

    // Calculate Combined Team Stats
    const combinedStats = getStats(allLinks);

    // 3. Apply Data Isolation
    if (auth.role === 'admin') {
      // Admin gets full details per member
      const membersData = activeMembers.map(m => {
        const memberLinks = allLinks.filter(l => l.member_id === m.id);
        const memberStats = getStats(memberLinks);
        return {
          id: m.id,
          name: m.name,
          username: m.username,
          jobRole: m.job_role,
          role: m.role,
          ...memberStats
        };
      }).sort((a, b) => b.monthCount - a.monthCount);

      return NextResponse.json({
        success: true,
        mode: 'admin',
        combined: combinedStats,
        membersData
      });
    } else {
      // Team member gets only combined team stats and their own stats
      const myLinks = allLinks.filter(l => l.member_id === auth.memberId);
      const myStatsObj = {
        name: auth.name,
        jobRole: activeMembers.find(m => m.id === auth.memberId)?.job_role || 'Senior SEO',
        ...getStats(myLinks)
      };

      return NextResponse.json({
        success: true,
        mode: 'team',
        combined: combinedStats,
        myStats: myStatsObj
      });
    }

  } catch (error: any) {
    console.error('Team Performance API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
