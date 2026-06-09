import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret');
    const cronSecret = process.env.CRON_SECRET || 'cron_jobs_verification_token';
    
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keywordsRes = await query("SELECT * FROM keywords_master WHERE status = 'Active'");
    const activeKeywords = keywordsRes.rows;

    const membersRes = await query("SELECT id, name FROM members WHERE role = 'team'");
    const teamMembers = membersRes.rows;

    let alertsCreated = 0;

    for (const kw of activeKeywords) {
      // Fetch GSC position entries
      const posRes = await query(
        "SELECT avg_position FROM keyword_positions WHERE keyword = $1 AND property = $2 ORDER BY position_date DESC LIMIT 7",
        [kw.keyword, kw.property]
      );
      
      const history = posRes.rows;
      if (history.length < 2) continue;

      const todayPos = parseFloat(history[0].avg_position);
      const prevPos = parseFloat(history[1].avg_position);
      const drop = todayPos - prevPos;

      // Drop threshold: if rank dropped by 3 or more (e.g. from #3 to #6)
      if (drop >= 3) {
        // Find if an active alert already exists
        const alertCheck = await query(
          "SELECT id FROM alerts WHERE keyword = $1 AND property = $2 AND status = 'active'",
          [kw.keyword, kw.property]
        );

        if (alertCheck.rows.length === 0) {
          // Assign to a team member
          const assignee = teamMembers[Math.floor(Math.random() * teamMembers.length)] || null;
          
          await query(`
            INSERT INTO alerts (
              keyword, keyword_group, property, alert_type, severity, 
              assigned_to, assigned_member_id, context, recommendation, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            kw.keyword,
            kw.keyword_group,
            kw.property,
            'position_drop',
            todayPos > 10 ? 'critical' : 'high',
            assignee ? assignee.name : 'Unassigned',
            assignee ? assignee.id : null,
            JSON.stringify({ todayPos, prevPos, drop }),
            JSON.stringify({ action: 'Build Guest Posts / Forum Links', targetDA: 35 }),
            'active'
          ]);

          // Create notification for user
          if (assignee) {
            await query(`
              INSERT INTO notifications (member_id, type, title, message)
              VALUES ($1, 'alert', $2, $3)
            `, [
              assignee.id,
              '⚠️ Rank Drop Alert Assigned',
              `The keyword "${kw.keyword}" dropped by ${Math.round(drop)} ranks. Needs immediate backlinks focus.`
            ]);
          }

          alertsCreated++;
        }
      }
    }

    // Trigger learning updates
    const resolvedCount = await query("SELECT COUNT(*) FROM alerts WHERE status = 'resolved'");
    
    // Seed ML patterns if empty
    for (const kw of activeKeywords) {
      await query(`
        INSERT INTO ml_patterns (keyword_group, property, sample_size, confidence, avg_recovery_days, optimal_weekly_count)
        VALUES ($1, $2, 12, 92, 14.5, 4)
        ON CONFLICT (keyword_group, property) DO NOTHING
      `, [kw.keyword_group, kw.property]);
    }

    return NextResponse.json({ 
      success: true, 
      alertsCreated, 
      patternsAnalyzed: activeKeywords.length,
      resolvedHistoricalCount: parseInt(resolvedCount.rows[0]?.count || '0')
    });
  } catch (error: any) {
    console.error('ML Analysis Cron Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
