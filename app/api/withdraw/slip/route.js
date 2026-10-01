import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthContext();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { slipImage, transactionId, note } = body;

    if (!slipImage && !transactionId) {
      return NextResponse.json({ success: false, message: 'স্লিপ বা ট্রানজেকশন আইডি প্রদান করুন' }, { status: 400 });
    }

    // Try to upload to supabase storage if base64 image
    let slipPath = null;
    if (typeof slipImage === 'string' && slipImage.startsWith('data:')) {
      const match = slipImage.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
      if (match) {
        const [, contentType, encoded] = match;
        const bytes = Buffer.from(encoded, 'base64');
        const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
        const path = `${user.id}/slip_${Date.now()}.${extension}`;
        
        try {
          const uploadRes = await supabase.storage.from('applicant-documents').upload(path, bytes, {
            contentType,
            upsert: true,
          });
          if (!uploadRes.error) {
            slipPath = path;
          }
        } catch (uploadErr) {
          console.warn('Storage upload warning:', uploadErr);
        }
      }
    }

    // Create confirmation notice so staff sees it
    try {
      await supabase.from('notices').insert({
        user_id: user.id,
        title: 'স্লিপ জমা দেওয়া হয়েছে',
        message: JSON.stringify({
          type: 'slip_submission',
          slipPath: slipPath || '',
          transactionId: transactionId || '',
          submittedAt: new Date().toISOString(),
          description: 'গ্রাহক লেনদেনের নিশ্চিতকরণ স্লিপ জমা দিয়েছেন।'
        })
      });
    } catch (dbErr) {
      console.warn('DB record warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'আপনার লেনদেনের স্লিপটি সফলভাবে জমা দেওয়া হয়েছে! কর্তৃপক্ষ যাচাই করে দ্রুত টাকা ছাড় করবে।'
    });
  } catch (err) {
    console.error('Submit slip error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
