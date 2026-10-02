import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const { supabase, user } = await getAuthContext();
    const effectiveUserId = user?.id || queryUserId;
    if (!effectiveUserId) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('notices')
      .select('id, user_id, loan_id, title, message, status, created_at')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const notices = (data || []).map(notice => {
      let amountToPay = 0;
      let description = notice.message || '';
      let noticeStatus = notice.status === 'read' ? 'approved' : (notice.status === 'unread' ? 'pending' : (notice.status || 'pending'));

      try {
        const parsed = JSON.parse(notice.message);
        if (parsed && typeof parsed === 'object') {
          if (parsed.amountToPay !== undefined) amountToPay = Number(parsed.amountToPay);
          if (parsed.description !== undefined) description = parsed.description;
          if (parsed.status !== undefined && notice.status === 'pending') {
            noticeStatus = parsed.status;
          }
        }
      } catch {
        // Plain text fallback
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
        status: noticeStatus,
        createdAt: notice.created_at,
      };
    });

    return NextResponse.json(
      { success: true, notices },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Load notices error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
