import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, message: 'ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.phone === phone && u.password === password);

    if (!user) {
      return NextResponse.json({ success: false, message: 'ফোন নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে!' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'লগইন সফল হয়েছে',
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে' }, { status: 500 });
  }
}
