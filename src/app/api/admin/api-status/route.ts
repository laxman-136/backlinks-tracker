import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    // Query today's api usage logs grouped by type and index
    const res = await query(`
      SELECT 
        api_type, 
        key_index, 
        SUM(requests_made) as total_requests,
        SUM(errors) as total_errors
      FROM api_usage_log
      WHERE log_date = CURRENT_DATE
      GROUP BY api_type, key_index
      ORDER BY api_type ASC, key_index ASC
    `);

    // Fetch raw recent logs
    const historyRes = await query(`
      SELECT * FROM api_usage_log 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      usage: res.rows,
      history: historyRes.rows
    });
  } catch (error: any) {
    console.error('Fetch API Status Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
