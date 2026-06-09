import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    // Fetch backlinks without member_id filter (Admin Auditor role)
    const res = await query('SELECT * FROM backlinks ORDER BY entry_date DESC LIMIT 500');
    return NextResponse.json({ success: true, backlinks: res.rows });
  } catch (error: any) {
    console.error('Fetch All Members Data Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
