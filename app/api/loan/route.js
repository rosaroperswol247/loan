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
    const { supabase, user } = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const targetUserId = user?.id || searchParams.get('userId');
    if (!targetUserId) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', targetUserId)
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
    const { purpose, amount, tenureMonths, userId } = body;
    const { supabase, user, profile } = await getAuthContext(request);
    const targetUserId = user?.id || userId;
    if (!targetUserId) return unauthorizedResponse();

    const [personalResult, nomineeResult, bankResult] = await Promise.all([
      supabase.from('personal_info')
        .select('applicant_name, father_name, mother_name, nid_number')
        .eq('user_id', targetUserId)
        .maybeSingle(),
      supabase.from('nominee_info')
        .select('nominee_name, relationship, nominee_phone')
        .eq('user_id', targetUserId)
        .maybeSingle(),
      supabase.from('bank_info')
        .select('method, account_number')
        .eq('user_id', targetUserId)
        .maybeSingle(),
    ]);

    for (const result of [personalResult, nomineeResult, bankResult]) {
      if (result.error) throw result.error;
    }

    const missingSections = [];
    if (!personalResult.data?.applicant_name?.trim()
      || !personalResult.data?.father_name?.trim()
      || !personalResult.data?.mother_name?.trim()
      || !personalResult.data?.nid_number?.trim()) {
      missingSections.push('personal');
    }
    if (!nomineeResult.data?.nominee_name?.trim()
      || !nomineeResult.data?.relationship?.trim()
      || !nomineeResult.data?.nominee_phone?.trim()) {
      missingSections.push('nominee');
    }
    if (!bankResult.data?.method?.trim() || !bankResult.data?.account_number?.trim()) {
      missingSections.push('bank');
    }

    if (missingSections.length) {
      return NextResponse.json({
        success: false,
        code: 'PROFILE_INCOMPLETE',
        missingSections,
        message: 'ঋণের আবেদন করার আগে প্রয়োজনীয় ব্যক্তিগত, নমিনী ও ব্যাংক তথ্য পূরণ করুন',
      }, { status: 409 });
    }

    const numAmount = Number(amount);
    const numTenure = Number(tenureMonths);
    if (!Number.isFinite(numAmount) || numAmount <= 0 || !Number.isInteger(numTenure) || numTenure <= 0) {
      return NextResponse.json({ success: false, message: 'ঋণের পরিমাণ ও মেয়াদ নির্বাচন করুন' }, { status: 400 });
    }

    if (numAmount < 50000 || numAmount > 2000000) {
      return NextResponse.json({ success: false, message: 'গ্রাহকের আবেদনের ক্ষেত্রে ঋণের পরিমাণ ৫০,০০০ টাকা থেকে ২০,০০,০০০ টাকার মধ্যে হতে হবে' }, { status: 400 });
    }

    if (numTenure < 12 || numTenure > 60) {
      return NextResponse.json({ success: false, message: 'গ্রাহকের আবেদনের ক্ষেত্রে ঋণের মেয়াদ ১২ মাস থেকে ৬০ মাসের মধ্যে হতে হবে' }, { status: 400 });
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
        user_id: targetUserId,
        applicant_name: profile?.fullName || user?.user_metadata?.full_name || personalResult.data?.applicant_name || 'Applicant',
        phone: profile?.phone || user?.phone || '',
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
