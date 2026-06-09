import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const res = await query('SELECT * FROM courses ORDER BY course_name ASC');
    return NextResponse.json({ success: true, courses: res.rows });
  } catch (error: any) {
    console.error('Fetch Courses Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const { courseName, keywordGroup, property, priority } = await request.json();

    if (!courseName || !keywordGroup) {
      return NextResponse.json({ error: 'Course name and keyword group are required' }, { status: 400 });
    }

    await query(`
      INSERT INTO courses (course_name, keyword_group, property, priority)
      VALUES ($1, $2, $3, $4)
    `, [courseName.trim(), keywordGroup.trim(), property || 'Both', priority || 'Medium']);

    return NextResponse.json({ success: true, message: 'Course added successfully' });
  } catch (error: any) {
    console.error('Save Course Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
