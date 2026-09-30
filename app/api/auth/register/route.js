import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(request) {
  try {
    const { fullName, phone, password } = await request.json();

    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, message: 'সবগুলো ঘর পূরণ করুন' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.users.find(u => u.phone === phone);
    if (existing) {
      return NextResponse.json({ success: false, message: 'এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত আছে।' }, { status: 400 });
    }

    // Generate 4-digit ID
    const newId = String(Math.floor(1000 + Math.random() * 9000));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newUser = {
      id: newId,
      fullName,
      phone,
      password,
      role: 'user',
      createdAt: now
    };

    db.users.push(newUser);
    saveDb(db);

    return NextResponse.json({
      success: true,
      message: 'নিবন্ধন সফল হয়েছে',
      user: { id: newUser.id, fullName: newUser.fullName, phone: newUser.phone, role: newUser.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে' }, { status: 500 });
  }
}
