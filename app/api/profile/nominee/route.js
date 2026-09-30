import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import {
  attachSignedDocumentUrls,
  NOMINEE_DOCUMENT_FIELDS,
  saveApplicantDocuments,
} from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

function toClientData(record) {
  if (!record) return null;
  return {
    userId: record.user_id,
    nomineeName: record.nominee_name,
    relationship: record.relationship,
    nomineePhone: record.nominee_phone,
    nomineeNid: record.nominee_nid,
    nomineePhoto: record.nomineePhoto,
    nomineeNidFront: record.nomineeNidFront,
    nomineeNidBack: record.nomineeNidBack,
    updatedAt: record.updated_at,
  };
}

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
      .from('nominee_info')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    const withUrls = await attachSignedDocumentUrls(supabase, data, NOMINEE_DOCUMENT_FIELDS);
    return NextResponse.json({ success: true, data: toClientData(withUrls) });
  } catch (error) {
    console.error('Load nominee info error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const { data: existing, error: existingError } = await supabase
      .from('nominee_info')
      .select('nominee_photo_path, nominee_nid_front_path, nominee_nid_back_path')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const documentPaths = await saveApplicantDocuments(
      supabase,
      user.id,
      body,
      existing || {},
      NOMINEE_DOCUMENT_FIELDS.map(([field]) => field)
    );

    const { error } = await supabase.from('nominee_info').upsert({
      user_id: user.id,
      nominee_name: body.nomineeName || '',
      relationship: body.relationship || '',
      nominee_phone: body.nomineePhone || '',
      nominee_nid: body.nomineeNid || '',
      ...documentPaths,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'নমিনীর তথ্য সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (err) {
    console.error('Nominee info error:', err);
    const status = /ছবি|৫ MB/.test(err.message) ? 400 : 500;
    return NextResponse.json({ success: false, message: status === 400 ? err.message : 'সার্ভার ত্রুটি' }, { status });
  }
}
