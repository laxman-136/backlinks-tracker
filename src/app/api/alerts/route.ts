import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET: Fetch all alerts
export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query('SELECT * FROM alerts ORDER BY created_at DESC');
    return NextResponse.json({ success: true, alerts: res.rows });
  } catch (error: any) {
    console.error('Fetch Alerts API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Resolve an alert
export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Update alert status
    await query(
      `UPDATE alerts 
       SET status = 'resolved', resolved_at = NOW(), resolved_by = $1 
       WHERE id = $2`,
      [auth.name, alertId]
    );

    return NextResponse.json({ success: true, message: 'Alert resolved successfully' });
  } catch (error: any) {
    console.error('Resolve Alert API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
