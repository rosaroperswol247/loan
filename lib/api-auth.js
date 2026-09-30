import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function getPublicUser(supabase, user) {
  const [profileResult, staffResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('staff_members')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (staffResult.error) throw staffResult.error;

  return {
    id: user.id,
    fullName: profileResult.data?.full_name || user.user_metadata?.full_name || '',
    phone: profileResult.data?.phone || user.phone || '',
    role: staffResult.data?.role || 'user',
  };
}

export async function getAuthContext() {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, profile: null, staffRole: null };
  }

  const publicUser = await getPublicUser(supabase, user);
  return {
    supabase,
    user,
    profile: publicUser,
    staffRole: publicUser.role === 'user' ? null : publicUser.role,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: 'অনুগ্রহ করে সাইন ইন করুন' },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { success: false, message: 'এই কাজের অনুমতি নেই' },
    { status: 403 }
  );
}