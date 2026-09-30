import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function toClientLoan(loan) {
  if (!loan) return null;
  return {
    id: loan.id,
    userId: loan.user_id,
    applicantName: loan.applicant_name,
    phone: loan.phone,
    purpose: loan.purpose,
    amount: Number(loan.amount),
    tenureMonths: loan.tenure_months,
    interestRate: Number(loan.interest_rate),
    monthlyEmi: Number(loan.monthly_emi),
    totalRepayment: Number(loan.total_repayment),
    status: loan.status,
    userBalance: Number(loan.user_balance),
    createdAt: loan.created_at,
    updatedAt: loan.updated_at,
  };
}

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const allLoans = (data || []).map(toClientLoan);
    return NextResponse.json({ success: true, loan: allLoans[0] || null, allLoans });
  } catch (error) {
    console.error('Load loans error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { purpose, amount, tenureMonths } = body;
    const { supabase, user, profile } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const numAmount = Number(amount);
    const numTenure = Number(tenureMonths);
    if (!Number.isFinite(numAmount) || numAmount <= 0 || !Number.isInteger(numTenure) || numTenure <= 0) {
      return NextResponse.json({ success: false, message: 'ঋণের পরিমাণ ও মেয়াদ নির্বাচন করুন' }, { status: 400 });
    }

    // Flat annual interest rate of 2.4% per year.
    // Total Repayment = Principal + (Principal x Tenure/12 x 0.024)
    // Monthly EMI     = Total Repayment / Tenure
    const interestRate = 0.024;
    const interestAmount = numAmount * (numTenure / 12) * interestRate;
    const totalRepayment = Math.round(numAmount + interestAmount);
    const monthlyEmi = Number((totalRepayment / numTenure).toFixed(2));

    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: user.id,
        applicant_name: profile?.fullName || user.user_metadata?.full_name || 'Applicant',
        phone: profile?.phone || user.phone || '',
        purpose: purpose || 'personal-loan',
        amount: numAmount,
        tenure_months: numTenure,
        interest_rate: interestRate,
        monthly_emi: monthlyEmi,
        total_repayment: totalRepayment,
      })
      .select('*')
      .single();

    if (error) throw error;
    const loan = toClientLoan(data);

    return NextResponse.json({ success: true, message: 'ঋণ আবেদন সফলভাবে জমা হয়েছে', loan });
  } catch (err) {
    console.error('Submit loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
