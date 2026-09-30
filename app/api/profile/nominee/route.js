import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
  }

  const db = getDb();
  const info = db.nomineeInfo[userId] || null;
  return NextResponse.json({ success: true, data: info });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, nomineeName, relationship, nomineePhone, nomineeNid, nomineePhoto, nomineeNidFront, nomineeNidBack } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.nomineeInfo[userId] = {
      userId,
      nomineeName,
      relationship,
      nomineePhone,
      nomineeNid,
      nomineePhoto: nomineePhoto || db.nomineeInfo[userId]?.nomineePhoto || "",
      nomineeNidFront: nomineeNidFront || db.nomineeInfo[userId]?.nomineeNidFront || "",
      nomineeNidBack: nomineeNidBack || db.nomineeInfo[userId]?.nomineeNidBack || "",
      updatedAt: now
    };

    saveDb(db);

    return NextResponse.json({ success: true, message: 'নমিনীর তথ্য সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (err) {
    console.error('Nominee info error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
