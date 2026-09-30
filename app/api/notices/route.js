import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
  }

  const db = getDb();
  const userNotices = (db.notices || []).filter(n => n.userId === userId);

  return NextResponse.json({ success: true, notices: userNotices });
}
