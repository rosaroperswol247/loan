import { NextResponse } from 'next/server';
import { getAuthContext, forbiddenResponse, unauthorizedResponse } from '@/lib/api-auth';
import { getAuthoritySettings, saveAuthoritySettings, DEFAULT_AUTHORITY_SETTINGS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const BUCKET = 'applicant-documents';
const STORAGE_PATH = 'settings/bank_authority_signature.png';

export async function GET(request) {
  try {
    const { adminSupabase, supabase } = await getAuthContext(request);
    const db = adminSupabase || supabase;

    // 1. Try reading from Supabase PostgreSQL settings table
    try {
      const { data, error } = await db
        .from('settings')
        .select('value')
        .eq('key', 'authority')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object') {
        const authority = {
          ...DEFAULT_AUTHORITY_SETTINGS,
          ...data.value,
        };
        // Keep in sync with local memory
        saveAuthoritySettings(authority);
        return NextResponse.json(
          { success: true, authority },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
      }
    } catch (dbErr) {
      console.warn('DB settings read error, falling back to local:', dbErr?.message);
    }

    // 2. Fallback to local settings
    const authority = getAuthoritySettings();
    return NextResponse.json(
      { success: true, authority },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('Get authority settings error:', err);
    return NextResponse.json({ success: true, authority: DEFAULT_AUTHORITY_SETTINGS });
  }
}

export async function POST(request) {
  try {
    const { adminSupabase, supabase, user, staffRole } = await getAuthContext(request);
    const db = adminSupabase || supabase;

    // Check staff permissions with generous fallback for staff session header
    const isAuthorized = staffRole === 'staff' || staffRole === 'admin' || !!user;
    if (!isAuthorized) {
      return unauthorizedResponse('অননুমোদিত অ্যাক্সেস');
    }

    const body = await request.json();
    const { officerName, officerTitle, signatureUrl } = body || {};

    const payload = {
      ...DEFAULT_AUTHORITY_SETTINGS,
      ...getAuthoritySettings(),
    };

    if (officerName !== undefined) payload.officerName = String(officerName).trim();
    if (officerTitle !== undefined) payload.officerTitle = String(officerTitle).trim();

    let finalSignatureUrl = signatureUrl;

    // If an image dataUrl was provided, upload to Supabase Storage
    if (typeof signatureUrl === 'string' && signatureUrl.startsWith('data:')) {
      const match = signatureUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/i);
      if (match) {
        try {
          const buffer = Buffer.from(match[2], 'base64');
          const ext = match[1].toLowerCase();
          const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          
          const { error: uploadError } = await db.storage
            .from(BUCKET)
            .upload(STORAGE_PATH, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
            if (publicData?.publicUrl) {
              finalSignatureUrl = `${publicData.publicUrl}?t=${Date.now()}`;
            }
          } else {
            console.warn('Storage upload error for authority signature, keeping dataUrl:', uploadError.message);
            finalSignatureUrl = signatureUrl;
          }
        } catch (storageErr) {
          console.warn('Storage exception for authority signature:', storageErr?.message);
          finalSignatureUrl = signatureUrl;
        }
      }
    }

    if (finalSignatureUrl !== undefined) {
      payload.signatureUrl = finalSignatureUrl;
    }
    payload.updatedAt = new Date().toISOString();

    // 1. Persist to Supabase PostgreSQL settings table
    try {
      const { error: dbError } = await db.from('settings').upsert({
        key: 'authority',
        value: payload,
        updated_at: new Date().toISOString(),
      });
      if (dbError) {
        console.warn('Supabase settings table upsert error:', dbError.message);
      }
    } catch (upsertErr) {
      console.warn('DB upsert exception:', upsertErr?.message);
    }

    // 2. Also persist to local / memory cache
    const updated = saveAuthoritySettings(payload);

    return NextResponse.json({
      success: true,
      message: 'ব্যাংক কর্তৃপক্ষের স্বাক্ষর ও তথ্য সফলভাবে আপডেট হয়েছে',
      authority: {
        ...updated,
        ...payload,
      },
    });
  } catch (err) {
    console.error('Update authority settings error:', err);
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি: ' + (err?.message || 'তথ্য সংরক্ষণ সম্ভব হয়নি') },
      { status: 500 }
    );
  }
}
