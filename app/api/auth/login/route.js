import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !password) {
      return NextResponse.json(
        { success: false, message: 'সঠিক ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: 'ফোন নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে!' },
        { status: 401 }
      );
    }

    const user = await getPublicUser(supabase, data.user);
    return NextResponse.json({ success: true, message: 'লগইন সফল হয়েছে', user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
