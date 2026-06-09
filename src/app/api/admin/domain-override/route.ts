import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth); // Blocks non-admin requests

    const { domain, adminOverride, adminNote } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    const overrideVal = adminOverride === 'None' ? null : adminOverride;

    // Update shared_domains record
    await query(`
      UPDATE shared_domains 
      SET 
        admin_override = $1, 
        admin_note = $2,
        status = CASE 
          WHEN $1 IS NOT NULL THEN $1 
          ELSE status 
        END,
        updated_at = NOW()
      WHERE domain = $3
    `, [overrideVal, adminNote || '', domain.toLowerCase()]);

    // Recalculate domain status if override was removed (reset to system default calculations)
    if (adminOverride === 'None') {
      await query(`
        UPDATE shared_domains
        SET
          status = CASE
            WHEN avg_spam > 30 THEN 'Avoid'
            WHEN total_uses < 2 THEN 'Ok'
            WHEN live_count::decimal / total_uses >= 0.80
              AND avg_da >= 35 THEN 'Great'
            WHEN live_count::decimal / total_uses >= 0.65 THEN 'Good'
            WHEN live_count::decimal / total_uses >= 0.40 THEN 'Ok'
            ELSE 'Avoid'
          END
        WHERE domain = $1
      `, [domain.toLowerCase()]);
    }

    return NextResponse.json({ success: true, message: 'Domain overrides updated successfully' });
  } catch (error: any) {
    console.error('Domain Override API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
