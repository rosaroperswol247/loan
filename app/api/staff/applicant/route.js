import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export async function PATCH(request) {
  try {
    const { userId, userBalance } = await request.json();
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
    }

    if (userBalance !== undefined) {
      const balance = Number(userBalance);
      if (!Number.isFinite(balance) || balance < 0) {
        return NextResponse.json({ success: false, message: 'অবৈধ ব্যালেন্স' }, { status: 400 });
      }
      const { error } = await supabase
        .from('loans')
        .update({ user_balance: balance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'তথ্য সফলভাবে আপডেট হয়েছে' });
  } catch (err) {
    console.error('Update applicant error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
