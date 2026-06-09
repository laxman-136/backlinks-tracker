import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await params;

    // 1. Fetch domain from shared_domains
    const domainRes = await query('SELECT * FROM shared_domains WHERE domain = $1', [domain.toLowerCase()]);
    if (domainRes.rows.length === 0) {
      return NextResponse.json({ error: 'Domain not found in library' }, { status: 404 });
    }

    const sharedDomain = domainRes.rows[0];

    // 2. Fetch usage stats from backlinks (aggregate counts only)
    const usageRes = await query(`
      SELECT 
        COUNT(DISTINCT member_id) as member_count, 
        MIN(entry_date) as first_used_date,
        COUNT(CASE WHEN status = 'Live' THEN 1 END) as live_count,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
        COUNT(*) as total_uses
      FROM backlinks 
      WHERE root_domain = $1
    `, [domain.toLowerCase()]);
    
    const usage = usageRes.rows[0];

    return NextResponse.json({
      success: true,
      domain: sharedDomain,
      usage: {
        memberCount: parseInt(usage.member_count || '0'),
        firstUsedDate: usage.first_used_date || sharedDomain.first_used_date,
        liveCount: parseInt(usage.live_count || '0'),
        pendingCount: parseInt(usage.pending_count || '0'),
        rejectedCount: parseInt(usage.rejected_count || '0'),
        totalUses: parseInt(usage.total_uses || '0')
      }
    });
  } catch (error: any) {
    console.error('Fetch Domain Details Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
