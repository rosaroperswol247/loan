import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { fullName, phone, password } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!fullName?.trim() || !normalizedPhone || !password || password.length < 10) {
      return NextResponse.json(
        { success: false, message: 'নাম, সঠিক ফোন নম্বর এবং কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড দিন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.signUp({
      phone: normalizedPhone,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) {
      const duplicate = /already|registered/i.test(error.message);
      return NextResponse.json(
        {
          success: false,
          message: duplicate
            ? 'এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত আছে।'
            : 'নিবন্ধন করা যায়নি। ফোন নম্বর এবং Supabase SMS সেটিংস যাচাই করুন।',
        },
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase-এ Phone confirmation বন্ধ করে আবার চেষ্টা করুন',
        },
        { status: 400 }
      );
    }

    const user = await getPublicUser(supabase, data.user);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
