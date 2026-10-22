import { NextResponse } from 'next/server';
import { forbiddenResponse, getAuthContext, unauthorizedResponse } from '@/lib/api-auth';
import { saveApplicantDocuments, PERSONAL_DOCUMENT_FIELDS, NOMINEE_DOCUMENT_FIELDS } from '@/lib/supabase-storage';
import { normalizePhone } from '@/lib/phone';
import { saveUserCredentials } from '@/lib/credentials';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      userId,
      loanId,
      phone,
      password,
      fullName,
      personal,
      nominee,
      bank,
      userBalance,
      amount,
      tenureMonths,
      interestRate,
      status,
      totalRepayment,
      monthlyEmi,
      docType,
      docKey,
      dataUrl
    } = body;

    const { supabase, adminSupabase, user, staffRole } = await getAuthContext(request);
    const db = adminSupabase || supabase;

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

      const { error: profileError } = await db
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId);

      if (profileError) {
        console.warn('Profile update error:', profileError.message);
      }

      // Also sync to Supabase Auth if admin client is available
      try {
        if (adminSupabase?.auth?.admin) {
          const authUpdates = {};
          if (profileUpdates.phone) authUpdates.phone = profileUpdates.phone;
          if (password) authUpdates.password = password;
          if (fullName) authUpdates.user_metadata = { full_name: fullName.trim() };
          if (Object.keys(authUpdates).length > 0) {
            await adminSupabase.auth.admin.updateUserById(targetUserId, authUpdates);
          }
        }
      } catch (authErr) {
        console.warn('Auth admin update warning (ignorable for non-auth users):', authErr?.message);
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
      const loanProfileUpdates = {};
      if (fullName) loanProfileUpdates.applicant_name = fullName.trim();
      if (phone) loanProfileUpdates.phone = profileUpdates.phone || phone.trim();
      if (Object.keys(loanProfileUpdates).length > 0) {
        if (loanId) {
          await db.from('loans').update(loanProfileUpdates).eq('id', loanId);
        } else {
          await db.from('loans').update(loanProfileUpdates).eq('user_id', targetUserId);
        }
      }
    }

    // 2. Update Personal Information
    if (personal && typeof personal === 'object') {
      const personalUpdates = {
        updated_at: new Date().toISOString()
      };
      if (personal.applicantName !== undefined) personalUpdates.applicant_name = personal.applicantName;
      else if (fullName) personalUpdates.applicant_name = fullName.trim();

      if (personal.fatherName !== undefined) personalUpdates.father_name = personal.fatherName;
      if (personal.motherName !== undefined) personalUpdates.mother_name = personal.motherName;
      if (personal.nidNumber !== undefined) personalUpdates.nid_number = personal.nidNumber;
      if (personal.bloodGroup !== undefined) personalUpdates.blood_group = personal.bloodGroup;
      if (personal.presentAddress !== undefined) personalUpdates.present_address = personal.presentAddress;
      if (personal.permanentAddress !== undefined) personalUpdates.permanent_address = personal.permanentAddress;
      if (personal.profession !== undefined) personalUpdates.profession = personal.profession;

      // Handle photos: only update path if it's a data: URL or explicit value (avoid signed URLs overwriting clean paths)
      for (const [key, col] of [
        ['applicantPhoto', 'applicant_photo_path'],
        ['signature', 'signature_path'],
        ['nidFront', 'nid_front_path'],
        ['nidBack', 'nid_back_path']
      ]) {
        const val = personal[key];
        if (typeof val === 'string' && val.startsWith('data:')) {
          try {
            const saved = await saveApplicantDocuments(db, targetUserId, { [key]: val }, {}, [key]);
            if (saved[col]) personalUpdates[col] = saved[col];
          } catch (e) {
            console.warn(`Failed to save document ${key}:`, e?.message);
          }
        }
      }

      const { data: existingPersonal } = await db
        .from('personal_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingPersonal) {
        await db.from('personal_info').update(personalUpdates).eq('user_id', targetUserId);
      } else {
        await db.from('personal_info').insert({ user_id: targetUserId, ...personalUpdates });
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

      for (const [key, col] of [
        ['nomineePhoto', 'nominee_photo_path'],
        ['nomineeNidFront', 'nominee_nid_front_path'],
        ['nomineeNidBack', 'nominee_nid_back_path']
      ]) {
        const val = nominee[key];
        if (typeof val === 'string' && val.startsWith('data:')) {
          try {
            const saved = await saveApplicantDocuments(db, targetUserId, { [key]: val }, {}, [key]);
            if (saved[col]) nomineeUpdates[col] = saved[col];
          } catch (e) {
            console.warn(`Failed to save nominee document ${key}:`, e?.message);
          }
        }
      }

      const { data: existingNominee } = await db
        .from('nominee_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingNominee) {
        await db.from('nominee_info').update(nomineeUpdates).eq('user_id', targetUserId);
      } else {
        await db.from('nominee_info').insert({ user_id: targetUserId, ...nomineeUpdates });
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

      const { data: existingBank } = await db
        .from('bank_info')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingBank) {
        await db.from('bank_info').update(bankUpdates).eq('user_id', targetUserId);
      } else {
        await db.from('bank_info').insert({ user_id: targetUserId, ...bankUpdates });
      }
    }

    // 5. Update Loan Details if provided
    const loanFields = {};
    if (userBalance !== undefined) {
      const balance = Number(userBalance);
      if (Number.isFinite(balance) && balance >= 0) {
        loanFields.user_balance = balance;
      }
    }
    if (amount !== undefined && Number(amount) > 0) loanFields.amount = Number(amount);
    if (tenureMonths !== undefined && Number(tenureMonths) > 0) loanFields.tenure_months = Number(tenureMonths);
    if (interestRate !== undefined && interestRate !== null && interestRate !== '') {
      const rNum = Number(interestRate);
      if (Number.isFinite(rNum) && rNum >= 0) {
        loanFields.interest_rate = rNum > 1 ? Number((rNum / 100).toFixed(5)) : Number(rNum.toFixed(5));
      }
    }
    if (status && ['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
      loanFields.status = status.toLowerCase();
    }
    if (totalRepayment !== undefined && Number(totalRepayment) > 0) {
      loanFields.total_repayment = Math.round(Number(totalRepayment));
    }
    if (monthlyEmi !== undefined && Number(monthlyEmi) > 0) {
      loanFields.monthly_emi = Number(Number(monthlyEmi).toFixed(2));
    }

    if (Object.keys(loanFields).length > 0) {
      loanFields.updated_at = new Date().toISOString();
      if (loanId) {
        await db.from('loans').update(loanFields).eq('id', loanId);
      } else {
        await db.from('loans').update(loanFields).eq('user_id', targetUserId);
      }
    }

    // 6. Handle Direct Document Upload from Staff Modal
    if (docKey && dataUrl) {
      const isNominee = docType === 'nominee';
      const table = isNominee ? 'nominee_info' : 'personal_info';

      const { data: existing } = await db
        .from(table)
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      const savedPaths = await saveApplicantDocuments(
        db,
        targetUserId,
        { [docKey]: dataUrl },
        existing || {},
        [docKey]
      );

      if (existing) {
        const { error: updateError } = await db
          .from(table)
          .update({ ...savedPaths, updated_at: new Date().toISOString() })
          .eq('user_id', targetUserId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await db
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

    return NextResponse.json({ success: true, message: 'সকল তথ্য সফলভাবে ডাটাবেজে স্থায়ীভাবে সংরক্ষণ হয়েছে' });
  } catch (err) {
    console.error('Update applicant error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
