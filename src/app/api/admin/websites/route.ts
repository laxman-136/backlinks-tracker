import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const res = await query('SELECT * FROM websites ORDER BY code ASC');
    return NextResponse.json({ success: true, websites: res.rows });
  } catch (error: any) {
    console.error('Fetch Websites Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const { code, domain, propertyUrl } = await request.json();

    if (!code || !domain || !propertyUrl) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await query(`
      INSERT INTO websites (code, domain, property_url)
      VALUES ($1, $2, $3)
    `, [code.toUpperCase().trim(), domain.toLowerCase().trim(), propertyUrl.trim()]);

    return NextResponse.json({ success: true, message: 'Website added successfully' });
  } catch (error: any) {
    console.error('Save Website Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
