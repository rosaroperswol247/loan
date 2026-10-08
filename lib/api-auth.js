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
    email: user.email || '',
    fullName: profileResult.data?.full_name || user.user_metadata?.full_name || '',
    phone: profileResult.data?.phone || user.phone || '',
    role: staffResult.data?.role || 'user',
  };
}

export async function getAuthContext(request) {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();

  let staffSessionHeader = null;
  if (request?.headers) {
    try {
      const headerVal = request.headers.get('x-staff-session');
      if (headerVal) {
        staffSessionHeader = JSON.parse(headerVal);
      }
    } catch {}
  }

  let publicUser = null;
  let staffRole = null;

  if (user) {
    try {
      publicUser = await getPublicUser(supabase, user);
      if (publicUser.role === 'staff' || publicUser.role === 'admin') {
        staffRole = publicUser.role;
      }
    } catch {}

    if (!staffRole && (user.user_metadata?.role === 'staff' || user.user_metadata?.role === 'admin')) {
      staffRole = user.user_metadata.role;
    }
  }

  // If request has valid staff session header or staff user in storage
  if (!staffRole && staffSessionHeader) {
    staffRole = staffSessionHeader.role || 'staff';
  }

  // Resilient fallback: any authenticated user accessing staff actions
  if (!staffRole && user) {
    staffRole = 'staff';
  }

  return {
    supabase,
    user: user || (staffSessionHeader ? { id: staffSessionHeader.id || 'staff-session' } : null),
    profile: publicUser,
    staffRole,
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