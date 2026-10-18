import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';
import { saveUserCredentials } from '@/lib/credentials';

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

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    let { data, error } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    });

    if (error || !data?.user) {
      // Check if admin changed credentials directly in profiles table
      const { data: matchedProfile } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
        .maybeSingle();

      if (matchedProfile && matchedProfile.password === password) {
        cookieStore.set('user_session', JSON.stringify({
          id: matchedProfile.id,
          phone: matchedProfile.phone,
          fullName: matchedProfile.full_name,
        }), {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30,
        });

        const { data: staffMember } = await supabase
          .from('staff_members')
          .select('role')
          .eq('user_id', matchedProfile.id)
          .maybeSingle();

        const role = staffMember?.role || 'user';
        const clientUser = {
          id: matchedProfile.id,
          phone: matchedProfile.phone,
          fullName: matchedProfile.full_name,
          role,
        };

        saveUserCredentials({
          [matchedProfile.id]: password,
          [matchedProfile.phone]: password,
          [normalizedPhone]: password,
          [phone]: password,
        });

        return NextResponse.json({
          success: true,
          message: 'লগইন সফল হয়েছে',
          user: clientUser,
        });
      }

      if (error) console.error('Supabase phone/password login failed', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { success: false, message: 'ফোন নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে' },
        { status: 401 }
      );
    }

    // Set user_session cookie for standard Supabase Auth too
    cookieStore.set('user_session', JSON.stringify({
      id: data.user.id,
      phone: normalizedPhone,
      fullName: data.user.user_metadata?.full_name || '',
    }), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    saveUserCredentials({
      [data.user.id]: password,
      [normalizedPhone]: password,
      [phone]: password
    });

    // Update password in profiles table on each successful login
    try {
      await supabase.from('profiles').update({ password }).eq('id', data.user.id);
    } catch (e) {
      console.error('Error syncing password to profile on login:', e);
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
