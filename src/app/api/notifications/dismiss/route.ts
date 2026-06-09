import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Update notifications to read
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND member_id = $2',
      [id, auth.memberId]
    );

    return NextResponse.json({ success: true, message: 'Notification dismissed' });
  } catch (error: any) {
    console.error('Dismiss Notification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
