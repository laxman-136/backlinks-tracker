import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, getAuthFromRequest, generateToken, JWTPayload } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update member password in database
    await query(
      'UPDATE members SET password_hash = $1, must_change_password = $2 WHERE id = $3',
      [hashedPassword, false, auth.memberId]
    );

    // Regenerate the JWT payload with mustChangePassword = false
    const newPayload: JWTPayload = {
      ...auth,
      mustChangePassword: false,
    };

    const token = generateToken(newPayload);

    const response = NextResponse.json({ success: true, message: 'Password updated successfully' });

    // Set updated cookie
    response.cookies.set('seo_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Change Password API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
