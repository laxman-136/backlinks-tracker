import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken, JWTPayload } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Query database for member
    const res = await query('SELECT * FROM members WHERE username = $1', [username.trim()]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const member = res.rows[0];

    // Check status
    if (member.status === 'Inactive') {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    // Verify password
    const isValid = await verifyPassword(password, member.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create JWT token payload
    const payload: JWTPayload = {
      memberId: member.id,
      name: member.name,
      username: member.username,
      role: member.role,
      assignedCourses: member.assigned_courses || [],
      assignedProperty: member.assigned_property || 'Both',
      mustChangePassword: member.must_change_password || false,
    };

    const token = generateToken(payload);

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      mustChangePassword: member.must_change_password 
    });

    response.cookies.set('seo_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Update last login (fire and forget)
    query('UPDATE members SET last_login = NOW() WHERE id = $1', [member.id]).catch(err => {
      console.error('Failed to update last login:', err);
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
