import { NextResponse } from 'next/server';
import { getAuthContext, forbiddenResponse, unauthorizedResponse } from '@/lib/api-auth';
import { getAgentNumbers, saveAgentNumbers, DEFAULT_AGENT_NUMBERS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { adminSupabase, supabase } = await getAuthContext(request);
    const db = adminSupabase || supabase;

    try {
      const { data, error } = await db
        .from('settings')
        .select('value')
        .eq('key', 'agentNumbers')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object') {
        const numbers = {
          ...DEFAULT_AGENT_NUMBERS,
          ...data.value,
        };
        saveAgentNumbers(numbers);
        return NextResponse.json(
          { success: true, numbers },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
      }
    } catch (dbErr) {
      console.warn('DB agent numbers read error:', dbErr?.message);
    }

    const numbers = getAgentNumbers();
    return NextResponse.json(
      { success: true, numbers },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('Get agent numbers error:', err);
    return NextResponse.json({ success: true, numbers: DEFAULT_AGENT_NUMBERS });
  }
}

export async function POST(request) {
  try {
    const { adminSupabase, supabase, user, staffRole } = await getAuthContext(request);
    const db = adminSupabase || supabase;

    const isAuthorized = staffRole === 'staff' || staffRole === 'admin' || !!user;
    if (!isAuthorized) {
      return unauthorizedResponse('অননুমোদিত অ্যাক্সেস');
    }

    const body = await request.json();
    const { bkash, nagad, rocket } = body || {};

    const payload = {
      ...DEFAULT_AGENT_NUMBERS,
      ...getAgentNumbers(),
    };
    if (bkash !== undefined) payload.bkash = String(bkash).trim();
    if (nagad !== undefined) payload.nagad = String(nagad).trim();
    if (rocket !== undefined) payload.rocket = String(rocket).trim();
    payload.updatedAt = new Date().toISOString();

    try {
      await db.from('settings').upsert({
        key: 'agentNumbers',
        value: payload,
        updated_at: new Date().toISOString(),
      });
    } catch (upsertErr) {
      console.warn('DB upsert agent numbers error:', upsertErr?.message);
    }

    const updated = saveAgentNumbers(payload);

    return NextResponse.json({
      success: true,
      message: 'কর্পোরেট এজেন্ট নম্বর সফলভাবে আপডেট হয়েছে',
      numbers: updated,
    });
  } catch (err) {
    console.error('Update agent numbers error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
