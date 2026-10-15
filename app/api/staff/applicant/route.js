import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import { saveApplicantDocuments } from '@/lib/supabase-storage';

export async function PATCH(request) {
  try {
    const { userId, userBalance, docType, docKey, dataUrl } = await request.json();
    const { supabase, user, staffRole } = await getAuthContext(request);
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

    if (docKey && dataUrl) {
      const isNominee = docType === 'nominee';
      const table = isNominee ? 'nominee_info' : 'personal_info';

      const { data: existing } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const savedPaths = await saveApplicantDocuments(
        supabase,
        userId,
        { [docKey]: dataUrl },
        existing || {},
        [docKey]
      );

      if (existing) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ ...savedPaths, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from(table)
          .insert({ user_id: userId, ...savedPaths, updated_at: new Date().toISOString() });
        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ success: true, message: 'তথ্য সফলভাবে আপডেট হয়েছে' });
  } catch (err) {
    console.error('Update applicant error:', err);
    return NextResponse.json({ success: false, message: err.message || 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
