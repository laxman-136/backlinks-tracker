import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET: Fetch work logs for the logged-in member
export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query(
      'SELECT * FROM work_log WHERE member_id = $1 ORDER BY log_date DESC LIMIT 30',
      [auth.memberId]
    );

    return NextResponse.json({ success: true, logs: res.rows });
  } catch (error: any) {
    console.error('Fetch Work Logs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save a new work log entry
export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      logDate,
      courseWorkedOn,
      freeNotes,
      websitesResearched,
      daPaChecked,
      contentWritten,
      socialPostsShared,
      quoraRedditPosts,
      hoursSpent
    } = await request.json();

    if (!logDate || !courseWorkedOn) {
      return NextResponse.json({ error: 'Log date and course are required' }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO work_log (
        log_date, member_id, member_name, course_worked_on, free_notes,
        websites_researched, da_pa_checked, content_written,
        social_posts_shared, quora_reddit_posts, hours_spent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      logDate,
      auth.memberId,
      auth.name,
      courseWorkedOn,
      freeNotes || '',
      parseInt(websitesResearched) || 0,
      parseInt(daPaChecked) || 0,
      parseInt(contentWritten) || 0,
      parseInt(socialPostsShared) || 0,
      parseInt(quoraRedditPosts) || 0,
      parseFloat(hoursSpent) || 0
    ]);

    return NextResponse.json({ success: true, log: res.rows[0] });
  } catch (error: any) {
    console.error('Save Work Log Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
