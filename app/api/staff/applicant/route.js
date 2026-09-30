import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function PATCH(request) {
  try {
    const { userId, fullName, phone, password, userBalance } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' }, { status: 404 });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    // Also update loans user balance if provided
    if (userBalance !== undefined) {
      db.loans.forEach(loan => {
        if (loan.userId === userId) {
          loan.userBalance = Number(userBalance);
        }
      });
    }

    saveDb(db);

    return NextResponse.json({ success: true, message: 'তথ্য সফলভাবে আপডেট হয়েছে', user });
  } catch (err) {
    console.error('Update applicant error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
