import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { fullName, email, phone, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    if (!fullName?.trim() || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !normalizedPhone || !password || password.length < 10) {
      return NextResponse.json(
        { success: false, message: 'নাম, সঠিক ইমেইল, ফোন নম্বর এবং কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড দিন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName.trim(), contact_phone: normalizedPhone },
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=/personal-info`,
      },
    });

    if (error) {
      const duplicate = /already|registered/i.test(error.message);
      return NextResponse.json(
        {
          success: false,
          message: duplicate
            ? 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত আছে।'
            : 'নিবন্ধন করা যায়নি। ইমেইল এবং Supabase Auth সেটিংস যাচাই করুন।',
        },
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: true,
          confirmationRequired: true,
          message: 'আপনার ইমেইলে পাঠানো নিশ্চিতকরণ লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন',
        },
        { status: 200 }
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
