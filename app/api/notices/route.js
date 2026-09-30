import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('notices')
      .select('id, user_id, loan_id, title, message, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const notices = (data || []).map(notice => ({
      id: notice.id,
      userId: notice.user_id,
      loanId: notice.loan_id,
      title: notice.title,
      message: notice.message,
      status: notice.status,
      createdAt: notice.created_at,
    }));

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    console.error('Load notices error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
