import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('bank_info')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data ? {
        userId: data.user_id,
        method: data.method,
        accountNumber: data.account_number,
        bankName: data.bank_name,
        accountHolderName: data.account_holder_name,
        updatedAt: data.updated_at,
      } : null,
    });
  } catch (error) {
    console.error('Load bank info error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { method, accountNumber, bankName, accountHolderName } = body;
    const { supabase, user, profile } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    if (!method || !accountNumber) {
      return NextResponse.json({ success: false, message: 'সবগুলো প্রয়োজনীয় ঘর পূরণ করুন' }, { status: 400 });
    }

    const { data, error } = await supabase.from('bank_info').upsert({
      user_id: user.id,
      method,
      account_number: accountNumber,
      bank_name: bankName || (method === 'bank' ? '' : 'Mobile Wallet'),
      account_holder_name: accountHolderName || profile?.fullName || 'Account Holder',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'ব্যাংক একাউন্ট তথ্য সংরক্ষিত হয়েছে',
      data: {
        userId: data.user_id,
        method: data.method,
        accountNumber: data.account_number,
        bankName: data.bank_name,
        accountHolderName: data.account_holder_name,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error('Bank info error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
