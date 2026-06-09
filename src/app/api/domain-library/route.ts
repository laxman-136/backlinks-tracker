import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all domains from shared_domains
    const domainsRes = await query('SELECT * FROM shared_domains ORDER BY live_rate DESC');
    const domains = domainsRes.rows;

    // 2. Calculate count summaries
    const totalCount = domains.length;
    const greatCount = domains.filter(d => d.status === 'Great').length;
    const goodCount = domains.filter(d => d.status === 'Good').length;
    const avoidCount = domains.filter(d => d.status === 'Avoid').length;

    // 3. Link Type Performance Stats
    // Group backlinks by type and calculate average live rates
    const linkTypesRes = await query(`
      SELECT 
        link_type,
        COUNT(DISTINCT root_domain) as domain_count,
        ROUND(AVG(CASE WHEN status = 'Live' THEN 100 ELSE 0 END), 2) as avg_live_rate,
        ROUND(AVG(da), 1) as avg_da
      FROM backlinks
      GROUP BY link_type
      ORDER BY avg_live_rate DESC
    `);
    const linkTypeStats = linkTypesRes.rows;

    return NextResponse.json({
      success: true,
      domains,
      summary: {
        total: totalCount,
        great: greatCount,
        good: goodCount,
        avoid: avoidCount
      },
      linkTypeStats
    });
  } catch (error: any) {
    console.error('Fetch Domain Library Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
