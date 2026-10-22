import { NextResponse } from 'next/server';
import { getAuthContext, forbiddenResponse, unauthorizedResponse } from '@/lib/api-auth';
import { getAuthoritySettings, saveAuthoritySettings, DEFAULT_AUTHORITY_SETTINGS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const BUCKET = 'applicant-documents';
const STORAGE_PATH = 'settings/bank_authority_signature.png';

export async function GET() {
  try {
    const authority = getAuthoritySettings();
    return NextResponse.json(
      { success: true, authority },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Get authority settings error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { adminSupabase, supabase, user, staffRole } = await getAuthContext(request);
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const body = await request.json();
    const { officerName, officerTitle, signatureUrl } = body;

    const payload = {};
    if (officerName !== undefined) payload.officerName = String(officerName).trim();
    if (officerTitle !== undefined) payload.officerTitle = String(officerTitle).trim();

    let finalSignatureUrl = signatureUrl;

    // If a base64 dataUrl was uploaded, persist it to Supabase Storage
    if (typeof signatureUrl === 'string' && signatureUrl.startsWith('data:')) {
      const db = adminSupabase || supabase;
      const match = signatureUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,([\s\S]+)$/i);
      if (match) {
        try {
          const buffer = Buffer.from(match[1], 'base64');
          const { error: uploadError } = await db.storage
            .from(BUCKET)
            .upload(STORAGE_PATH, buffer, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
            if (publicData?.publicUrl) {
              finalSignatureUrl = `${publicData.publicUrl}?t=${Date.now()}`;
            }
          } else {
            console.warn('Storage upload error for authority signature, keeping dataUrl:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('Failed to upload authority signature to storage:', storageErr);
        }
      }
    }

    if (finalSignatureUrl !== undefined) {
      payload.signatureUrl = finalSignatureUrl;
    }

    const updated = saveAuthoritySettings(payload);

    return NextResponse.json({
      success: true,
      message: 'ব্যাংক কর্তৃপক্ষের স্বাক্ষর ও তথ্য সফলভাবে আপডেট হয়েছে',
      authority: updated,
    });
  } catch (err) {
    console.error('Update authority settings error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
