import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, loanId, title, reason, amountToPay, description, message } = body;
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const noticeTitle = reason || title;
    if (!userId || !noticeTitle) {
      return NextResponse.json({ success: false, message: 'গ্রাহক ও কারণ নির্বাচন করুন' }, { status: 400 });
    }

    // Store structured content in message field (JSON format) so amountToPay is preserved in Supabase
    const payload = JSON.stringify({
      amountToPay: Number(amountToPay) || 0,
      description: description || message || ''
    });

    const { data, error } = await supabase
      .from('notices')
      .insert({
        user_id: userId,
        loan_id: loanId || null,
        title: noticeTitle,
        message: payload
      })
      .select('*')
      .single();

    if (error) throw error;

    const newNotice = {
      id: data.id,
      userId: data.user_id,
      loanId: data.loan_id,
      title: data.title,
      reason: data.title,
      amountToPay: Number(amountToPay) || 0,
      description: description || message || '',
      message: description || message || '',
      status: data.status,
      createdAt: data.created_at,
    };

    return NextResponse.json({ success: true, message: 'নোটিশ সফলভাবে পাঠানো হয়েছে', notice: newNotice });
  } catch (err) {
    console.error('Create notice error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const noticeId = searchParams.get('id');

    if (!noticeId) {
      return NextResponse.json({ success: false, message: 'Notice ID প্রয়োজন' }, { status: 400 });
    }

    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'নোটিশ মুছে ফেলা হয়েছে' });
  } catch (err) {
    console.error('Delete notice error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
