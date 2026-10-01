import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { phone } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, message: 'সঠিক ফোন নম্বর প্রদান করুন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { shouldCreateUser: false },
    });

    if (error) {
      console.error('Supabase phone login OTP failed', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { success: false, message: 'SMS কোড পাঠানো যায়নি। ফোন নম্বর এবং SMS provider সেটিংস যাচাই করুন।' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, phone: normalizedPhone, message: 'আপনার ফোনে পাঠানো OTP কোডটি লিখুন' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
