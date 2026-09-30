import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();

    // Map each loan with complete details from personalInfo, nomineeInfo, bankInfo, user credentials, and notices
    const fullLoans = db.loans.map(loan => {
      const user = db.users.find(u => u.id === loan.userId) || {};
      const personal = db.personalInfo[loan.userId] || {};
      const nominee = db.nomineeInfo[loan.userId] || {};
      const bank = db.bankInfo[loan.userId] || {};
      const notices = (db.notices || []).filter(n => n.userId === loan.userId);

      return {
        ...loan,
        user: {
          id: user.id,
          fullName: user.fullName || loan.applicantName,
          phone: user.phone || loan.phone,
          password: user.password
        },
        personal,
        nominee,
        bank,
        notices
      };
    });

    // Stats
    const stats = {
      total: fullLoans.length,
      approved: fullLoans.filter(l => l.status === 'approved').length,
      pending: fullLoans.filter(l => l.status === 'pending').length,
      rejected: fullLoans.filter(l => l.status === 'rejected').length
    };

    return NextResponse.json({ success: true, loans: fullLoans, stats });
  } catch (err) {
    console.error('Staff loans error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { loanId, status, userBalance } = await request.json();

    if (!loanId) {
      return NextResponse.json({ success: false, message: 'Loan ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) {
      return NextResponse.json({ success: false, message: 'ঋণ পাওয়া যায়নি' }, { status: 404 });
    }

    if (status !== undefined) {
      loan.status = status;
    }
    if (userBalance !== undefined) {
      loan.userBalance = Number(userBalance);
    }
    loan.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    saveDb(db);

    return NextResponse.json({ success: true, message: 'স্ট্যাটাস আপডেট সফল হয়েছে', loan });
  } catch (err) {
    console.error('Update loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

// DELETE a loan application
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('id');

    if (!loanId) {
      return NextResponse.json({ success: false, message: 'Loan ID প্রয়োজন' }, { status: 400 });
    }

    const db = getDb();
    const loanIndex = db.loans.findIndex(l => l.id === loanId);

    if (loanIndex === -1) {
      return NextResponse.json({ success: false, message: 'ঋণ আবেদন পাওয়া যায়নি' }, { status: 404 });
    }

    // Remove loan
    const deletedLoan = db.loans.splice(loanIndex, 1)[0];

    // Remove any notices specifically tied to this loan
    if (db.notices) {
      db.notices = db.notices.filter(n => n.loanId !== loanId);
    }

    saveDb(db);

    return NextResponse.json({
      success: true,
      message: 'ঋণ আবেদন সফলভাবে মুছে ফেলা হয়েছে',
      deletedLoan
    });
  } catch (err) {
    console.error('Delete loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
