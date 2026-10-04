import { NextResponse } from 'next/server';
import { getAuthContext, forbiddenResponse, unauthorizedResponse } from '@/lib/api-auth';
import { getAgentNumbers, saveAgentNumbers } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const numbers = getAgentNumbers();
    return NextResponse.json(
      { success: true, numbers },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Get agent numbers error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, staffRole } = await getAuthContext();
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const body = await request.json();
    const { bkash, nagad, rocket } = body;

    const payload = {};
    if (bkash !== undefined) payload.bkash = String(bkash).trim();
    if (nagad !== undefined) payload.nagad = String(nagad).trim();
    if (rocket !== undefined) payload.rocket = String(rocket).trim();

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
