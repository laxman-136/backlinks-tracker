import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, username, password, setupKey } = await request.json();

    if (!name || !username || !password || !setupKey) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const envSetupKey = process.env.ADMIN_SETUP_KEY || 'admin12345';
    if (setupKey !== envSetupKey) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
    }

    // Check if any members exist
    const memberCheck = await query('SELECT COUNT(*) FROM members');
    const memberCount = parseInt(memberCheck.rows[0]?.count || '0');

    if (memberCount > 0) {
      return NextResponse.json({ error: 'Database already initialized. Cannot run setup again.' }, { status: 400 });
    }

    // Hash password and create admin
    const hashedPassword = await hashPassword(password);
    
    await query(`
      INSERT INTO members (name, username, password_hash, role, job_role, assigned_courses, assigned_property, status, must_change_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      name.trim(),
      username.trim().toLowerCase(),
      hashedPassword,
      'admin',
      'Manager',
      [],
      'Both',
      'Active',
      false, // Admin created via setup doesn't need to change password immediately
    ]);

    return NextResponse.json({ success: true, message: 'First Admin created successfully' });
  } catch (error: any) {
    console.error('Setup Admin API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
