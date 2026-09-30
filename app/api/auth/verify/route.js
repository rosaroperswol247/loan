import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { phone, token } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !/^\d{6}$/.test(String(token || ''))) {
      return NextResponse.json(
        { success: false, message: 'ফোন নম্বর এবং ৬ সংখ্যার কোড দিন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: String(token),
      type: 'sms',
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: 'যাচাইকরণ কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে' },
        { status: 400 }
      );
    }

    const user = await getPublicUser(supabase, data.user);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { success: false, message: 'যাচাইকরণ ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}