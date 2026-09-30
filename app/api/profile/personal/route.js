import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
  }

  const db = getDb();
  const info = db.personalInfo[userId] || null;
  return NextResponse.json({ success: true, data: info });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, applicantName, fatherName, motherName, nidNumber, bloodGroup, presentAddress, permanentAddress, profession, nidFront, nidBack, applicantPhoto, signature } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.personalInfo[userId] = {
      userId,
      applicantName,
      fatherName,
      motherName,
      nidNumber,
      bloodGroup,
      presentAddress,
      permanentAddress,
      profession,
      nidFront: nidFront || db.personalInfo[userId]?.nidFront || "",
      nidBack: nidBack || db.personalInfo[userId]?.nidBack || "",
      applicantPhoto: applicantPhoto || db.personalInfo[userId]?.applicantPhoto || "",
      signature: signature || db.personalInfo[userId]?.signature || "",
      updatedAt: now
    };

    // Also update full name if provided
    const user = db.users.find(u => u.id === userId);
    if (user && applicantName) {
      user.fullName = applicantName;
    }

    saveDb(db);

    return NextResponse.json({ success: true, message: 'ব্যক্তিগত তথ্য সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (err) {
    console.error('Personal info error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
