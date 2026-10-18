import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    try {
      await supabase.auth.signOut();
    } catch {}

    // Clear user_session and all auth cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach(c => {
      if (c.name.includes('supabase') || c.name.includes('auth') || c.name.includes('token') || c.name.includes('session') || c.name === 'user_session') {
        try {
          cookieStore.delete(c.name);
        } catch {}
      }
    });

    return NextResponse.json({ success: true, message: 'লগআউট সফল হয়েছে' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true });
  }
}