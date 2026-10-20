import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import {
  attachSignedDocumentUrls,
  PERSONAL_DOCUMENT_FIELDS,
  saveApplicantDocuments,
} from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

function toClientData(record) {
  if (!record) return null;
  return {
    userId: record.user_id,
    applicantName: record.applicant_name,
    fatherName: record.father_name,
    motherName: record.mother_name,
    nidNumber: record.nid_number,
    bloodGroup: record.blood_group,
    presentAddress: record.present_address,
    permanentAddress: record.permanent_address,
    profession: record.profession,
    nidFront: record.nidFront,
    nidBack: record.nidBack,
    applicantPhoto: record.applicantPhoto,
    signature: record.signature,
    updatedAt: record.updated_at,
  };
}

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const targetUserId = user?.id || searchParams.get('userId');
    if (!targetUserId) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('personal_info')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) console.warn('Load personal info warning:', error.message);

    const withUrls = await attachSignedDocumentUrls(supabase, data, PERSONAL_DOCUMENT_FIELDS);
    return NextResponse.json({ success: true, data: toClientData(withUrls) });
  } catch (error) {
    console.error('Load personal info error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { supabase, adminSupabase, user } = await getAuthContext(request);
    const db = adminSupabase || supabase;
    const targetUserId = user?.id || body.userId;
    if (!targetUserId) return unauthorizedResponse();

    let existing = null;
    try {
      const { data } = await db
        .from('personal_info')
        .select('nid_front_path, nid_back_path, applicant_photo_path, signature_path')
        .eq('user_id', targetUserId)
        .maybeSingle();
      existing = data;
    } catch (e) {
      console.warn('Read existing personal info warning:', e?.message);
    }

    const documentPaths = await saveApplicantDocuments(
      db,
      targetUserId,
      body,
      existing || {},
      PERSONAL_DOCUMENT_FIELDS.map(([field]) => field)
    );

    const payload = {
      user_id: targetUserId,
      applicant_name: body.applicantName || '',
      father_name: body.fatherName || '',
      mother_name: body.motherName || '',
      nid_number: body.nidNumber || '',
      blood_group: body.bloodGroup || '',
      present_address: body.presentAddress || '',
      permanent_address: body.permanentAddress || '',
      profession: body.profession || '',
      ...documentPaths,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from('personal_info').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.warn('Upsert personal_info fallback to update/insert:', error.message);
      if (existing) {
        await db.from('personal_info').update(payload).eq('user_id', targetUserId);
      } else {
        await db.from('personal_info').insert(payload);
      }
    }

    if (body.applicantName) {
      try {
        await db
          .from('profiles')
          .update({ full_name: body.applicantName })
          .eq('id', targetUserId);
      } catch (pe) {
        console.warn('Update profile full_name warning:', pe?.message);
      }
    }

    return NextResponse.json({ success: true, message: 'ব্যক্তিগত তথ্য সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (err) {
    console.error('Personal info error:', err);
    const status = /ছবি|৫ MB/.test(err.message) ? 400 : 500;
    return NextResponse.json({ success: false, message: status === 400 ? err.message : 'সার্ভার ত্রুটি' }, { status });
  }
}
