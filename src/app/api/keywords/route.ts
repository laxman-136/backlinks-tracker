import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all keywords from keywords_master
    const kwRes = await query('SELECT * FROM keywords_master ORDER BY added_date DESC');
    const keywords = kwRes.rows;

    // 2. Fetch all position history from keyword_positions
    const posRes = await query('SELECT * FROM keyword_positions ORDER BY position_date DESC');
    const positions = posRes.rows;

    // 3. Map positions and compute trends
    const mappedKeywords = keywords.map(kw => {
      // Get history ordered chronologically
      const history = positions
        .filter(p => p.keyword === kw.keyword && p.property === kw.property)
        .slice(0, 15) // last 15 days
        .reverse();

      const latestPos = history[history.length - 1]?.avg_position || null;
      const baselinePos = history[0]?.avg_position || null;

      let change = 0;
      if (latestPos !== null && baselinePos !== null) {
        change = latestPos - baselinePos; // Negative is good (moved from #5 to #2)
      }

      return {
        ...kw,
        currentPos: latestPos,
        change,
        history: history.map(p => ({
          date: p.position_date,
          pos: p.avg_position,
          clicks: p.clicks,
          impressions: p.impressions
        }))
      };
    });

    return NextResponse.json({
      success: true,
      keywords: mappedKeywords
    });
  } catch (error: any) {
    console.error('Fetch Keywords Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
