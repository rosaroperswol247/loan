import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

// Staff -> customer messages are informational only (status updates, document
// requests, reminders). They never request a payment or a fee.
export async function POST(request) {
  try {
    const { userId, loanId, title, message } = await request.json();
    const { supabase, user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    if (!userId || !title) {
      return NextResponse.json({ success: false, message: 'গ্রাহক ও বার্তার শিরোনাম নির্বাচন করুন' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notices')
      .insert({ user_id: userId, loan_id: loanId || null, title, message: message || '' })
      .select('*')
      .single();
    if (error) throw error;

    const newNotice = {
      id: data.id,
      userId: data.user_id,
      loanId: data.loan_id,
      title: data.title,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
    };

    return NextResponse.json({ success: true, message: 'বার্তা সফলভাবে পাঠানো হয়েছে', notice: newNotice });
  } catch (err) {
    console.error('Create message error:', err);
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
      return NextResponse.json({ success: false, message: 'Message ID প্রয়োজন' }, { status: 400 });
    }

    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'বার্তা মুছে ফেলা হয়েছে' });
  } catch (err) {
    console.error('Delete message error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
