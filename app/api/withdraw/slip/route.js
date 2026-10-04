import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthContext();
    const body = await request.json();
    const { slipImage, transactionId, loanId, noticeId, reason, amountToPay, description, userId } = body;

    const effectiveUserId = user?.id || userId;
    if (!effectiveUserId) return unauthorizedResponse();

    if (!slipImage && !transactionId) {
      return NextResponse.json({ success: false, message: 'স্লিপ বা ট্রানজেকশন আইডি প্রদান করুন' }, { status: 400 });
    }

    let finalSlipUrl = slipImage;

    // Try to save to Supabase storage if base64 image
    if (typeof slipImage === 'string' && slipImage.startsWith('data:')) {
      const match = slipImage.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
      if (match) {
        const [, contentType, encoded] = match;
        try {
          const bytes = Buffer.from(encoded, 'base64');
          const extension = contentType === 'image/jpeg' ? 'jpg' : (contentType.split('/')[1] || 'jpg');
          const path = `${effectiveUserId}/slip_${Date.now()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from('applicant-documents')
            .upload(path, bytes, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: signedData } = await supabase.storage
              .from('applicant-documents')
              .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
            if (signedData?.signedUrl) {
              finalSlipUrl = signedData.signedUrl;
            }
          }
        } catch (uploadErr) {
          console.warn('Storage upload warning, fallback to compressed image:', uploadErr);
        }
      }
    }

    // Find the target notice to attach this payment slip to
    let targetNotice = null;

    if (noticeId) {
      const { data: nById } = await supabase
        .from('notices')
        .select('*')
        .eq('id', noticeId)
        .maybeSingle();
      if (nById) targetNotice = nById;
    }

    if (!targetNotice) {
      const { data: latestNotices } = await supabase
        .from('notices')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (latestNotices && latestNotices.length > 0) {
        targetNotice = latestNotices[0];
      }
    }

    if (targetNotice) {
      // Attach the slip image to the active notice
      let payload = {};
      try {
        payload = JSON.parse(targetNotice.message);
        if (!payload || typeof payload !== 'object') {
          payload = { description: targetNotice.message || '' };
        }
      } catch {
        payload = { description: targetNotice.message || '' };
      }

      payload.slipImage = finalSlipUrl;
      payload.slipSubmittedAt = new Date().toISOString();
      payload.hasSlip = true;
      if (transactionId) payload.transactionId = transactionId;

      await supabase
        .from('notices')
        .update({
          message: JSON.stringify(payload)
        })
        .eq('id', targetNotice.id);
    } else {
      // If no notice exists in database yet, create the notice with the attached slip!
      const defaultDesc = description || 'আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।';
      const payload = JSON.stringify({
        amountToPay: Number(amountToPay) || 3740,
        description: defaultDesc,
        status: 'pending',
        slipImage: finalSlipUrl,
        slipSubmittedAt: new Date().toISOString(),
        hasSlip: true,
        transactionId: transactionId || ''
      });

      await supabase
        .from('notices')
        .insert({
          user_id: effectiveUserId,
          loan_id: loanId || null,
          title: reason || 'সঞ্চয়',
          message: payload,
          status: 'pending'
        });
    }

    return NextResponse.json({
      success: true,
      message: 'আপনার লেনদেনের স্লিপটি সফলভাবে জমা দেওয়া হয়েছে! কর্তৃপক্ষ যাচাই করে দ্রুত টাকা ছাড় করবে।'
    });
  } catch (err) {
    console.error('Submit slip error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি: ' + (err?.message || 'স্লিপ জমা দেওয়া যায়নি') }, { status: 500 });
  }
}
