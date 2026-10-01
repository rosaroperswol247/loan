import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import {
  attachSignedDocumentUrls,
  NOMINEE_DOCUMENT_FIELDS,
  PERSONAL_DOCUMENT_FIELDS,
} from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

function toClientLoan(loan) {
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

function toClientPersonal(record) {
  if (!record) return null;
  return {
    userId: record.user_id,
    applicantName: record.applicant_name,
    fatherName: record.father_name,
    motherName: record.mother_name,
    nidNumber: record.nid_number,
    bloodGroup: record.blood_group,
    presentAddress: record.present_address,
    permanentAddress: record.permanent_address,
    profession: record.profession,
    nidFront: record.nidFront,
    nidBack: record.nidBack,
    applicantPhoto: record.applicantPhoto,
    signature: record.signature,
    updatedAt: record.updated_at,
  };
}

function toClientNominee(record) {
  if (!record) return null;
  return {
    userId: record.user_id,
    nomineeName: record.nominee_name,
    relationship: record.relationship,
    nomineePhone: record.nominee_phone,
    nomineeNid: record.nominee_nid,
    nomineePhoto: record.nomineePhoto,
    nomineeNidFront: record.nomineeNidFront,
    nomineeNidBack: record.nomineeNidBack,
    updatedAt: record.updated_at,
  };
}

function toClientBank(record) {
  if (!record) return null;
  return {
    userId: record.user_id,
    method: record.method,
    accountNumber: record.account_number,
    bankName: record.bank_name,
    accountHolderName: record.account_holder_name,
    updatedAt: record.updated_at,
  };
}

export async function GET(request) {
  try {
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const { data: loanRows, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });
    if (loanError) throw loanError;

    const userIds = [...new Set((loanRows || []).map(loan => loan.user_id))];
    const [profilesResult, personalResult, nomineeResult, bankResult, noticesResult] = userIds.length
      ? await Promise.all([
          supabase.from('profiles').select('id, full_name, phone').in('id', userIds),
          supabase.from('personal_info').select('*').in('user_id', userIds),
          supabase.from('nominee_info').select('*').in('user_id', userIds),
          supabase.from('bank_info').select('*').in('user_id', userIds),
          supabase.from('notices').select('*').in('user_id', userIds).order('created_at', { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

    for (const result of [profilesResult, personalResult, nomineeResult, bankResult, noticesResult]) {
      if (result.error) throw result.error;
    }

    const profiles = new Map((profilesResult.data || []).map(row => [row.id, row]));
    const personalRows = await Promise.all((personalResult.data || []).map(async row => [
      row.user_id,
      toClientPersonal(await attachSignedDocumentUrls(supabase, row, PERSONAL_DOCUMENT_FIELDS)),
    ]));
    const nomineeRows = await Promise.all((nomineeResult.data || []).map(async row => [
      row.user_id,
      toClientNominee(await attachSignedDocumentUrls(supabase, row, NOMINEE_DOCUMENT_FIELDS)),
    ]));
    const personals = new Map(personalRows);
    const nominees = new Map(nomineeRows);
    const banks = new Map((bankResult.data || []).map(row => [row.user_id, toClientBank(row)]));
    const notices = (noticesResult.data || []).map(notice => {
      let amountToPay = 0;
      let description = notice.message || '';
      try {
        const parsed = JSON.parse(notice.message);
        if (parsed && typeof parsed === 'object') {
          if (parsed.amountToPay !== undefined) amountToPay = Number(parsed.amountToPay);
          if (parsed.description !== undefined) description = parsed.description;
        }
      } catch {
        description = notice.message || '';
      }
      return {
        id: notice.id,
        userId: notice.user_id,
        loanId: notice.loan_id,
        title: notice.title,
        reason: notice.title,
        amountToPay,
        description,
        message: description,
        status: notice.status,
        createdAt: notice.created_at,
      };
    });

    const fullLoans = (loanRows || []).map(row => {
      const loan = toClientLoan(row);
      const profile = profiles.get(row.user_id);
      return {
        ...loan,
        user: {
          id: row.user_id,
          fullName: profile?.full_name || row.applicant_name,
          phone: profile?.phone || row.phone,
        },
        personal: personals.get(row.user_id) || {},
        nominee: nominees.get(row.user_id) || {},
        bank: banks.get(row.user_id) || {},
        notices: notices.filter(notice => notice.userId === row.user_id),
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
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    if (!loanId) {
      return NextResponse.json({ success: false, message: 'Loan ID প্রয়োজন' }, { status: 400 });
    }

    if (status !== undefined && !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'অবৈধ স্ট্যাটাস' }, { status: 400 });
    }
    if (userBalance !== undefined && (!Number.isFinite(Number(userBalance)) || Number(userBalance) < 0)) {
      return NextResponse.json({ success: false, message: 'অবৈধ ব্যালেন্স' }, { status: 400 });
    }

    const changes = { updated_at: new Date().toISOString() };
    if (status !== undefined) changes.status = status;
    if (userBalance !== undefined) changes.user_balance = Number(userBalance);
    const { data, error } = await supabase
      .from('loans')
      .update(changes)
      .eq('id', loanId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, message: 'ঋণ পাওয়া যায়নি' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'স্ট্যাটাস আপডেট সফল হয়েছে', loan: toClientLoan(data) });
  } catch (err) {
    console.error('Update loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

// DELETE a loan application
export async function DELETE(request) {
  try {
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('id');

    if (!loanId) {
      return NextResponse.json({ success: false, message: 'Loan ID প্রয়োজন' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, message: 'ঋণ আবেদন পাওয়া যায়নি' }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: 'ঋণ আবেদন সফলভাবে মুছে ফেলা হয়েছে',
      deletedLoan: toClientLoan(data)
    });
  } catch (err) {
    console.error('Delete loan error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
