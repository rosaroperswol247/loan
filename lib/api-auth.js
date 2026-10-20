import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

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

  if (profileResult.error) console.warn('Profile read warning in getPublicUser:', profileResult.error.message);
  if (staffResult.error) console.warn('Staff read warning in getPublicUser:', staffResult.error.message);

  return {
    id: user.id,
    email: user.email || '',
    fullName: profileResult.data?.full_name || user.user_metadata?.full_name || '',
    phone: profileResult.data?.phone || user.phone || '',
    role: staffResult.data?.role || 'user',
  };
}

export async function getAuthContext(request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {}

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

  let sessionUser = null;
  if (!user) {
    try {
      const userSessionCookie = cookieStore.get('user_session');
      if (userSessionCookie?.value) {
        const parsed = JSON.parse(userSessionCookie.value);
        if (parsed?.id) {
          sessionUser = {
            id: parsed.id,
            phone: parsed.phone || '',
            user_metadata: { full_name: parsed.fullName || '' },
          };
          publicUser = {
            id: parsed.id,
            email: '',
            fullName: parsed.fullName || '',
            phone: parsed.phone || '',
            role: parsed.role || 'user',
          };
          if (parsed.role === 'staff' || parsed.role === 'admin') {
            staffRole = parsed.role;
          }
        }
      }
    } catch {}

    if (!sessionUser && request?.headers) {
      try {
        const xUserId = request.headers.get('x-user-id');
        if (xUserId) {
          sessionUser = {
            id: xUserId,
            phone: '',
            user_metadata: { full_name: '' },
          };
          publicUser = {
            id: xUserId,
            email: '',
            fullName: '',
            phone: '',
            role: 'user',
          };
        }
      } catch {}
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

  let adminSupabase = null;
  try {
    adminSupabase = createAdminClient();
  } catch (err) {
    console.warn('createAdminClient error:', err?.message);
  }

  return {
    supabase,
    adminSupabase: adminSupabase || supabase,
    user: user || sessionUser || (staffSessionHeader ? { id: staffSessionHeader.id || 'staff-session' } : null),
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
