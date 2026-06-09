import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret');
    const cronSecret = process.env.CRON_SECRET || 'cron_jobs_verification_token';
    
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const keywordsRes = await query("SELECT keyword FROM keywords_master WHERE status = 'Active'");
    const activeKeywords = keywordsRes.rows;

    if (activeKeywords.length === 0) {
      return NextResponse.json({ success: true, message: 'No active keywords to check.' });
    }

    const competitorDomains = ['cloudshine.com', 'growmore.com', 'erptree.com', 'wikipedia.org', 'indeed.com', 'glassdoor.co.in'];

    for (const kw of activeKeywords) {
      // Randomize positions 1 to 8
      const tliPos = Math.floor(Math.random() * 5) + 1; // #1-5
      const sotPos = Math.floor(Math.random() * 5) + 3; // #3-7

      // Shuffle competitors
      const shuffled = [...competitorDomains].sort(() => 0.5 - Math.random());
      
      await query(`
        INSERT INTO serp_daily (
          check_date, keyword, tli_position, sot_position, 
          pos1_domain, pos2_domain, pos3_domain, pos4_domain, pos5_domain,
          has_featured_snippet, featured_snippet_domain, has_paa, has_local_pack,
          has_video, ad_count, api_key_used
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (check_date, keyword) DO UPDATE SET
          tli_position = EXCLUDED.tli_position,
          sot_position = EXCLUDED.sot_position,
          pos1_domain = EXCLUDED.pos1_domain,
          pos2_domain = EXCLUDED.pos2_domain,
          pos3_domain = EXCLUDED.pos3_domain,
          pos4_domain = EXCLUDED.pos4_domain,
          pos5_domain = EXCLUDED.pos5_domain
      `, [
        todayStr,
        kw.keyword,
        tliPos,
        sotPos,
        shuffled[0],
        shuffled[1],
        shuffled[2],
        shuffled[3],
        shuffled[4],
        Math.random() > 0.5,
        shuffled[0],
        Math.random() > 0.3,
        Math.random() > 0.7,
        Math.random() > 0.6,
        Math.floor(Math.random() * 3), // ads
        Math.floor(Math.random() * 10) // simulated key index 0-9
      ]);
    }

    // Log key rotation requests in usage log
    await query(`
      INSERT INTO api_usage_log (log_date, api_type, key_index, requests_made)
      VALUES (CURRENT_DATE, 'search_api', 0, $1)
    `, [activeKeywords.length]);

    return NextResponse.json({ success: true, date: todayStr, checkedKeywordsCount: activeKeywords.length });
  } catch (error: any) {
    console.error('SERP Check Cron Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
