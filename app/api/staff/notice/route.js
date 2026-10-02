import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function toClientNotice(notice) {
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
  const status = notice.status === 'read' ? 'approved' : (notice.status === 'unread' ? 'pending' : (notice.status || 'pending'));
  return {
    id: notice.id,
    userId: notice.user_id,
    loanId: notice.loan_id,
    title: notice.title,
    reason: notice.title,
    amountToPay,
    description,
    message: description,
    status,
    createdAt: notice.created_at,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, loanId, title, reason, amountToPay, description, message, isUpgrade } = body;
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const noticeTitle = reason || title;
    if (!userId || !noticeTitle) {
      return NextResponse.json({ success: false, message: 'গ্রাহক ও কারণ নির্বাচন করুন' }, { status: 400 });
    }

    // Automatically delete all previous notices for this user so ONLY the current upgraded notice exists
    await supabase
      .from('notices')
      .delete()
      .eq('user_id', userId);

    // Store structured content in message field (JSON format)
    const payload = JSON.stringify({
      amountToPay: Number(amountToPay) || 0,
      description: description || message || '',
      status: 'pending'
    });

    const { data, error } = await supabase
      .from('notices')
      .insert({
        user_id: userId,
        loan_id: loanId || null,
        title: noticeTitle,
        message: payload,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw error;

    const newNotice = toClientNotice(data);

    return NextResponse.json({
      success: true,
      message: isUpgrade
        ? 'সফলভাবে নোটিশ আপগ্রেড করা হয়েছে! পূর্ববর্তী নোটিশ স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়েছে।'
        : 'নতুন নোটিশ সফলভাবে কার্যকর করা হয়েছে!',
      notice: newNotice,
      notices: [newNotice]
    });
  } catch (err) {
    console.error('Create notice error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি: ' + (err?.message || 'নোটিশ সংরক্ষণ করা যায়নি') }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Notice ID ও স্ট্যাটাস প্রয়োজন' }, { status: 400 });
    }

    const nextStatus = status === 'read' ? 'approved' : status;
    const { data, error } = await supabase
      .from('notices')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Fetch all updated notices for this user
    const { data: allNoticesData } = await supabase
      .from('notices')
      .select('*')
      .eq('user_id', data.user_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      message: 'নোটিশ স্ট্যাটাস সফলভাবে আপডেট হয়েছে',
      notice: toClientNotice(data),
      notices: (allNoticesData || []).map(toClientNotice)
    });
  } catch (err) {
    console.error('Update notice error:', err);
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

    const { data: targetNotice } = await supabase
      .from('notices')
      .select('user_id')
      .eq('id', noticeId)
      .maybeSingle();

    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) throw error;

    let remainingNotices = [];
    if (targetNotice?.user_id) {
      const { data: rem } = await supabase
        .from('notices')
        .select('*')
        .eq('user_id', targetNotice.user_id)
        .order('created_at', { ascending: false });
      remainingNotices = (rem || []).map(toClientNotice);
    }

    return NextResponse.json({
      success: true,
      message: 'নোটিশ মুছে ফেলা হয়েছে',
      notices: remainingNotices
    });
  } catch (err) {
    console.error('Delete notice error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
