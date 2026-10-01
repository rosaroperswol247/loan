import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || !password) {
      return NextResponse.json(
        { success: false, message: 'সঠিক ইমেইল এবং পাসওয়ার্ড প্রদান করুন' },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে!' },
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
