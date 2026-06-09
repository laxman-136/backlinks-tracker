import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query("SELECT * FROM websites WHERE status = 'Active' ORDER BY code ASC");
    return NextResponse.json({ success: true, websites: res.rows });
  } catch (error: any) {
    console.error('Fetch Websites API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
