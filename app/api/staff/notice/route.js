import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

// Staff -> customer messages are informational only (status updates, document
// requests, reminders). They never request a payment or a fee.
export async function POST(request) {
  try {
    const { userId, loanId, title, message } = await request.json();

    if (!userId || !title) {
      return NextResponse.json({ success: false, message: 'গ্রাহক ও বার্তার শিরোনাম নির্বাচন করুন' }, { status: 400 });
    }

    const db = getDb();
    if (!db.notices) db.notices = [];

    const noticeId = 'MSG-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newNotice = {
      id: noticeId,
      userId,
      loanId: loanId || null,
      title,
      message: message || '',
      status: 'unread',
      createdAt: now
    };

    db.notices.unshift(newNotice);
    saveDb(db);

    return NextResponse.json({ success: true, message: 'বার্তা সফলভাবে পাঠানো হয়েছে', notice: newNotice });
  } catch (err) {
    console.error('Create message error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const noticeId = searchParams.get('id');

    if (!noticeId) {
      return NextResponse.json({ success: false, message: 'Message ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    db.notices = (db.notices || []).filter(n => n.id !== noticeId);
    saveDb(db);

    return NextResponse.json({ success: true, message: 'বার্তা মুছে ফেলা হয়েছে' });
  } catch (err) {
    console.error('Delete message error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
