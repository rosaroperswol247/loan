import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
  }

  const db = getDb();
  // Find latest loan for user
  const userLoans = db.loans.filter(l => l.userId === userId);
  const latestLoan = userLoans.length > 0 ? userLoans[userLoans.length - 1] : null;

  return NextResponse.json({ success: true, loan: latestLoan, allLoans: userLoans });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, purpose, amount, tenureMonths } = body;

    if (!userId || !amount || !tenureMonths) {
      return NextResponse.json({ success: false, message: 'ঋণের পরিমাণ ও মেয়াদ নির্বাচন করুন' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    const applicantName = user ? user.fullName : 'Applicant';
    const phone = user ? user.phone : '';

    const numAmount = Number(amount);
    const numTenure = Number(tenureMonths);

    // Flat annual interest rate of 2.4% per year.
    // Total Repayment = Principal + (Principal x Tenure/12 x 0.024)
    // Monthly EMI     = Total Repayment / Tenure
    const interestRate = 0.024;
    const interestAmount = numAmount * (numTenure / 12) * interestRate;
    const totalRepayment = Math.round(numAmount + interestAmount);
    const monthlyEmi = Number((totalRepayment / numTenure).toFixed(2));

    const loanId = 'LN-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newLoan = {
      id: loanId,
      userId,
      applicantName,
      phone,
      purpose: purpose || 'personal-loan',
      amount: numAmount,
      tenureMonths: numTenure,
      interestRate,
      monthlyEmi,
      totalRepayment,
      status: 'pending',
      userBalance: 0,
      createdAt: now,
      updatedAt: now
    };

    db.loans.push(newLoan);
    saveDb(db);

    return NextResponse.json({ success: true, message: 'ঋণ আবেদন সফলভাবে জমা হয়েছে', loan: newLoan });
  } catch (err) {
    console.error('Submit loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
