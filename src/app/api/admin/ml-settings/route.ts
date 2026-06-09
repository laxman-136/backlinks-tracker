import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const res = await query('SELECT * FROM ml_patterns ORDER BY keyword_group ASC');
    return NextResponse.json({ success: true, patterns: res.rows });
  } catch (error: any) {
    console.error('Fetch ML Settings Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const { id, keywordGroup, property, optimalWeeklyCount, notes } = await request.json();

    if (id) {
      await query(`
        UPDATE ml_patterns
        SET 
          optimal_weekly_count = $1,
          notes = $2,
          last_updated = NOW()
        WHERE id = $3
      `, [parseInt(optimalWeeklyCount) || 0, notes || '', id]);
    } else {
      // Create new settings entry
      await query(`
        INSERT INTO ml_patterns (keyword_group, property, optimal_weekly_count, notes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (keyword_group, property) DO UPDATE SET
          optimal_weekly_count = EXCLUDED.optimal_weekly_count,
          notes = EXCLUDED.notes,
          last_updated = NOW()
      `, [keywordGroup, property, parseInt(optimalWeeklyCount) || 0, notes || '']);
    }

    return NextResponse.json({ success: true, message: 'ML settings saved successfully' });
  } catch (error: any) {
    console.error('Save ML Settings Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
