import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireAdmin, hashPassword } from '@/lib/auth';

// GET: Fetch all members (Admin only)
export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const res = await query('SELECT id, name, username, role, job_role, assigned_courses, assigned_property, status, created_at FROM members ORDER BY name ASC');
    return NextResponse.json({ success: true, members: res.rows });
  } catch (error: any) {
    console.error('Fetch All Members Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create or update a member (Admin only)
export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    requireAdmin(auth);

    const body = await request.json();
    const { 
      id, 
      name, 
      username, 
      password, 
      role, 
      jobRole, 
      assignedCourses, 
      assignedProperty, 
      status 
    } = body;

    if (id) {
      // 1. UPDATE Member
      await query(`
        UPDATE members 
        SET 
          name = $1, 
          role = $2, 
          job_role = $3, 
          assigned_courses = $4, 
          assigned_property = $5, 
          status = $6
        WHERE id = $7
      `, [
        name.trim(),
        role || 'team',
        jobRole || '',
        assignedCourses || [],
        assignedProperty || 'Both',
        status || 'Active',
        id
      ]);

      return NextResponse.json({ success: true, message: 'Member updated successfully' });
    } else {
      // 2. CREATE Member
      if (!name || !username || !password) {
        return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
      }

      // Check if username already exists
      const checkRes = await query('SELECT id FROM members WHERE username = $1', [username.trim().toLowerCase()]);
      if (checkRes.rows.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);

      await query(`
        INSERT INTO members (
          name, username, password_hash, role, job_role, 
          assigned_courses, assigned_property, status, must_change_password
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        name.trim(),
        username.trim().toLowerCase(),
        hashedPassword,
        role || 'team',
        jobRole || 'SEO Intern',
        assignedCourses || [],
        assignedProperty || 'Both',
        'Active',
        true // Force password change on first login
      ]);

      return NextResponse.json({ success: true, message: 'Member created successfully' });
    }
  } catch (error: any) {
    console.error('Save Member Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
