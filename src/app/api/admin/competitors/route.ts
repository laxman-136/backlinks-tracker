import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const res = await query('SELECT * FROM competitors ORDER BY display_name ASC');
    return NextResponse.json({ success: true, competitors: res.rows });
  } catch (error: any) {
    console.error('Fetch Competitors Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const { domain, displayName, threatLevel, notes } = await request.json();

    if (!domain || !displayName) {
      return NextResponse.json({ error: 'Domain and display name are required' }, { status: 400 });
    }

    await query(`
      INSERT INTO competitors (domain, display_name, threat_level, notes)
      VALUES ($1, $2, $3, $4)
    `, [domain.toLowerCase().trim(), displayName.trim(), threatLevel || 'Medium', notes || '']);

    return NextResponse.json({ success: true, message: 'Competitor added successfully' });
  } catch (error: any) {
    console.error('Save Competitor Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
