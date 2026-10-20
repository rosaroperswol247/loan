import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

export const createClient = (cookieStore) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncoimejxtvkkuguyglmw.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb2ltZWp4dHZra3VndXlnbG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjM5MTIsImV4cCI6MjEwNzE5OTkxMn0.ybvF9QwEe2cN-ZkEx6MPVYWLOZqnTD3h7CNBRT-UUoI',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot write cookies; middleware refreshes sessions.
          }
        },
      },
    }
  );

export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncoimejxtvkkuguyglmw.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb2ltZWp4dHZra3VndXlnbG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYyMzkxMiwiZXhwIjoyMTA3MTk5OTEyfQ.gZpT6n56YJG4s2eqT54xYMy-5azIDtlo0EGuyIpfFkQ';
  return createSupabaseJsClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
