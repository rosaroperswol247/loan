import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPublicUser } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/phone';
import { saveUserCredentials } from '@/lib/credentials';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();
    const cleanPhone = String(phone || '').replace(/[\s()-]/g, '');
    const normalizedPhone = normalizePhone(cleanPhone) || cleanPhone;
    const stripped = cleanPhone.replace(/^\+88/, '').replace(/^88/, '');

    if (!cleanPhone || !password) {
      return NextResponse.json(
        { success: false, message: 'সঠিক ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Try standard Supabase Auth signInWithPassword
    let authUser = null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password,
      });
      if (data?.user) authUser = data.user;
    } catch (e) {
      // Continue to fallback
    }

    if (!authUser && cleanPhone !== normalizedPhone) {
      try {
        const { data } = await supabase.auth.signInWithPassword({
          phone: cleanPhone,
          password,
        });
        if (data?.user) authUser = data.user;
      } catch {}
    }

    // 2. Fallback check: profiles table for credentials set by staff or during registration
    const phoneVariants = Array.from(new Set([
      phone.trim(),
      cleanPhone,
      normalizedPhone,
      stripped,
      '0' + stripped,
      '+88' + (stripped.startsWith('0') ? stripped : '0' + stripped),
      '88' + (stripped.startsWith('0') ? stripped : '0' + stripped),
    ])).filter(Boolean);

    let matchedProfile = null;
    try {
      const { data: profilesByIn } = await supabase
        .from('profiles')
        .select('*')
        .in('phone', phoneVariants);

      if (profilesByIn && profilesByIn.length > 0) {
        matchedProfile = profilesByIn.find(p => p.password === password) || profilesByIn[0];
      }
    } catch (profErr) {
      console.warn('Error fetching profiles by in:', profErr?.message);
    }

    if (!matchedProfile) {
      try {
        const { data: allProfiles } = await supabase.from('profiles').select('*');
        if (allProfiles && allProfiles.length > 0) {
          matchedProfile = allProfiles.find(p => {
            const pClean = String(p.phone || '').replace(/[\s()-]/g, '').replace(/^\+88/, '').replace(/^88/, '');
            return pClean === stripped && p.password === password;
          });
        }
      } catch {}
    }

    if (matchedProfile && matchedProfile.password === password) {
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

      cookieStore.set('user_session', JSON.stringify({
        id: matchedProfile.id,
        phone: matchedProfile.phone,
        fullName: matchedProfile.full_name,
        role,
      }), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });

      saveUserCredentials({
        [matchedProfile.id]: password,
        [matchedProfile.phone]: password,
        [normalizedPhone]: password,
        [cleanPhone]: password,
      });

      return NextResponse.json({
        success: true,
        message: 'লগইন সফল হয়েছে',
        user: clientUser,
      });
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'ফোন নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে' },
        { status: 401 }
      );
    }

    // Set user_session cookie for standard Supabase Auth too
    const userRole = authUser.user_metadata?.role || 'user';
    cookieStore.set('user_session', JSON.stringify({
      id: authUser.id,
      phone: normalizedPhone,
      fullName: authUser.user_metadata?.full_name || '',
      role: userRole,
    }), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    saveUserCredentials({
      [authUser.id]: password,
      [normalizedPhone]: password,
      [cleanPhone]: password,
    });

    // Update password in profiles table on each successful login
    try {
      await supabase.from('profiles').update({ password }).eq('id', authUser.id);
    } catch (e) {
      console.error('Error syncing password to profile on login:', e);
    }

    const publicUser = await getPublicUser(supabase, authUser);
    return NextResponse.json({ success: true, message: 'লগইন সফল হয়েছে', user: publicUser });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
