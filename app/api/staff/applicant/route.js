import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import { saveApplicantDocuments } from '@/lib/supabase-storage';
import { normalizePhone } from '@/lib/phone';
import { saveUserCredentials } from '@/lib/credentials';

export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      userId,
      phone,
      password,
      fullName,
      personal,
      nominee,
      bank,
      userBalance,
      docType,
      docKey,
      dataUrl
    } = body;
    const { supabase, user, staffRole } = await getAuthContext(request);
    if (!user) return unauthorizedResponse();
    if (!staffRole) return forbiddenResponse();

    const targetUserId = userId || body.id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'User ID প্রয়োজন' }, { status: 400 });
    }

    // 1. Update Profile (Phone, Password, Full Name)
    if (phone || password || fullName) {
      const profileUpdates = {};
      if (fullName) profileUpdates.full_name = fullName.trim();
      if (phone) {
        const norm = normalizePhone(phone) || phone.trim();
        profileUpdates.phone = norm;
      }
      if (password) profileUpdates.password = password;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId);

      if (profileError) {
        console.warn('Profile update error:', profileError);
      }

      // Also persist to credentials map
      if (password) {
        const credMap = { [targetUserId]: password };
        if (phone) {
          credMap[phone] = password;
          const norm = normalizePhone(phone);
          if (norm) credMap[norm] = password;
        }
        saveUserCredentials(credMap);
      }

      // Also update applicant_name / phone in loans table
      const loanUpdates = {};
      if (fullName) loanUpdates.applicant_name = fullName.trim();
      if (phone) loanUpdates.phone = phone.trim();
      if (Object.keys(loanUpdates).length > 0) {
        await supabase
          .from('loans')
          .update(loanUpdates)
          .eq('user_id', targetUserId);
      }
    }

    // 2. Update Personal Information
    if (personal && typeof personal === 'object') {
      const personalUpdates = {
        updated_at: new Date().toISOString()
      };
      if (personal.applicantName !== undefined) personalUpdates.applicant_name = personal.applicantName;
      if (personal.fatherName !== undefined) personalUpdates.father_name = personal.fatherName;
      if (personal.motherName !== undefined) personalUpdates.mother_name = personal.motherName;
      if (personal.nidNumber !== undefined) personalUpdates.nid_number = personal.nidNumber;
      if (personal.bloodGroup !== undefined) personalUpdates.blood_group = personal.bloodGroup;
      if (personal.presentAddress !== undefined) personalUpdates.present_address = personal.presentAddress;
      if (personal.permanentAddress !== undefined) personalUpdates.permanent_address = personal.permanentAddress;
      if (personal.profession !== undefined) personalUpdates.profession = personal.profession;
      if (personal.applicantPhoto) personalUpdates.applicant_photo_path = personal.applicantPhoto;
      if (personal.signature) personalUpdates.signature_path = personal.signature;
      if (personal.nidFront) personalUpdates.nid_front_path = personal.nidFront;
      if (personal.nidBack) personalUpdates.nid_back_path = personal.nidBack;

      const { data: existingPersonal } = await supabase
        .from('personal_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingPersonal) {
        await supabase.from('personal_info').update(personalUpdates).eq('user_id', targetUserId);
      } else {
        await supabase.from('personal_info').insert({ user_id: targetUserId, ...personalUpdates });
      }
    }

    // 3. Update Nominee Information
    if (nominee && typeof nominee === 'object') {
      const nomineeUpdates = {
        updated_at: new Date().toISOString()
      };
      if (nominee.nomineeName !== undefined) nomineeUpdates.nominee_name = nominee.nomineeName;
      if (nominee.relationship !== undefined) nomineeUpdates.relationship = nominee.relationship;
      if (nominee.nomineePhone !== undefined) nomineeUpdates.nominee_phone = nominee.nomineePhone;
      if (nominee.nomineeNid !== undefined) nomineeUpdates.nominee_nid = nominee.nomineeNid;
      if (nominee.nomineePhoto) nomineeUpdates.nominee_photo_path = nominee.nomineePhoto;
      if (nominee.nomineeNidFront) nomineeUpdates.nominee_nid_front_path = nominee.nomineeNidFront;
      if (nominee.nomineeNidBack) nomineeUpdates.nominee_nid_back_path = nominee.nomineeNidBack;

      const { data: existingNominee } = await supabase
        .from('nominee_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingNominee) {
        await supabase.from('nominee_info').update(nomineeUpdates).eq('user_id', targetUserId);
      } else {
        await supabase.from('nominee_info').insert({ user_id: targetUserId, ...nomineeUpdates });
      }
    }

    // 4. Update Bank Information
    if (bank && typeof bank === 'object') {
      const bankUpdates = {
        updated_at: new Date().toISOString()
      };
      if (bank.method !== undefined) bankUpdates.method = bank.method;
      if (bank.accountNumber !== undefined) bankUpdates.account_number = bank.accountNumber;
      if (bank.bankName !== undefined) bankUpdates.bank_name = bank.bankName;
      if (bank.accountHolderName !== undefined) bankUpdates.account_holder_name = bank.accountHolderName;

      const { data: existingBank } = await supabase
        .from('bank_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingBank) {
        await supabase.from('bank_info').update(bankUpdates).eq('user_id', targetUserId);
      } else {
        await supabase.from('bank_info').insert({ user_id: targetUserId, ...bankUpdates });
      }
    }

    // 5. Update User Balance in loans
    if (userBalance !== undefined) {
      const balance = Number(userBalance);
      if (Number.isFinite(balance) && balance >= 0) {
        await supabase
          .from('loans')
          .update({ user_balance: balance, updated_at: new Date().toISOString() })
          .eq('user_id', targetUserId);
      }
    }

    // 6. Handle Direct Document Upload from Staff Modal
    if (docKey && dataUrl) {
      const isNominee = docType === 'nominee';
      const table = isNominee ? 'nominee_info' : 'personal_info';

      const { data: existing } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      const savedPaths = await saveApplicantDocuments(
        supabase,
        targetUserId,
        { [docKey]: dataUrl },
        existing || {},
        [docKey]
      );

      if (existing) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ ...savedPaths, updated_at: new Date().toISOString() })
          .eq('user_id', targetUserId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from(table)
          .insert({ user_id: targetUserId, ...savedPaths, updated_at: new Date().toISOString() });
        if (insertError) throw insertError;
      }

      return NextResponse.json({
        success: true,
        message: 'ডকুমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে',
        savedPaths
      });
    }

    return NextResponse.json({ success: true, message: 'তথ্য সফলভাবে আপডেট হয়েছে' });
  } catch (err) {
    console.error('Update applicant error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
