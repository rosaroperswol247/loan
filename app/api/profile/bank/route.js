import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
  }

  const db = getDb();
  const info = db.bankInfo[userId] || null;
  return NextResponse.json({ success: true, data: info });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, method, accountNumber, bankName, accountHolderName } = body;

    if (!userId || !method || !accountNumber) {
      return NextResponse.json({ success: false, message: 'সবগুলো প্রয়োজনীয় ঘর পূরণ করুন' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.bankInfo[userId] = {
      userId,
      method,
      accountNumber,
      bankName: bankName || db.bankInfo[userId]?.bankName || (method === 'bank' ? '' : 'Mobile Wallet'),
      accountHolderName: accountHolderName || db.users.find(u => u.id === userId)?.fullName || 'Account Holder',
      updatedAt: now
    };

    saveDb(db);

    return NextResponse.json({ success: true, message: 'ব্যাংক একাউন্ট তথ্য সংরক্ষিত হয়েছে', data: db.bankInfo[userId] });
  } catch (err) {
    console.error('Bank info error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
