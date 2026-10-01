import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { fullName, phone } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!fullName?.trim() || !normalizedPhone) {
      return NextResponse.json(
        { success: false, message: 'নাম এবং সঠিক ফোন নম্বর দিন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      console.error('Supabase phone signup failed', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'SMS কোড পাঠানো যায়নি। Supabase Phone provider এবং SMS provider সেটিংস যাচাই করুন।',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      message: 'আপনার ফোনে পাঠানো OTP কোডটি লিখুন',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
