'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DocumentGenerator from '@/components/DocumentGenerator';
import {
  Landmark,
  Search,
  Filter,
  LogOut,
  Folder,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  User,
  Phone,
  Lock,
  Calendar,
  CreditCard,
  Send,
  Trash2,
  ExternalLink,
  X,
  FileCheck,
  Edit,
  ShieldCheck,
  Heart,
  Droplets,
  Home,
  Briefcase,
  AlertTriangle,
  Rocket,
  CheckCircle,
  RefreshCw,
  Upload,
  Save
} from 'lucide-react';

function AttachmentTile({ src, label, onOpen, onUpload, contain, heightClass = 'h-24' }) {
  const has = !!src;
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div
      className={`group bg-[#09132c] border border-blue-900/40 rounded-xl p-2.5 flex flex-col justify-between transition-all hover:border-cyan-400 shadow-sm`}
    >
      <div
        onClick={() => has && onOpen(src)}
        className={`w-full ${heightClass} rounded-lg overflow-hidden flex items-center justify-center relative ${contain ? 'bg-white p-2' : 'bg-slate-900'} ${has ? 'cursor-pointer' : ''}`}
        title={has ? "Click to view full size" : "No image uploaded"}
      >
        {has ? (
          <img src={src} alt={label} className={`${contain ? 'max-h-full object-contain' : 'w-full h-full object-cover'} group-hover:scale-105 transition-transform`} />
        ) : (
          <span className="text-[10px] text-slate-500 text-center px-2">কোনো ফাইল আপলোড করা হয়নি</span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-300 mt-1.5 text-center truncate w-full">{label}</span>

      {/* Admin Image Edit & Replace Action */}
      {onUpload && (
        <div className="w-full mt-1.5 pt-1.5 border-t border-blue-900/40">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full py-1 bg-blue-950 hover:bg-blue-900 active:scale-95 text-cyan-300 hover:text-cyan-100 text-[10px] font-bold rounded border border-blue-800/70 flex items-center justify-center space-x-1 transition-all shadow-sm"
            title="ছবি পরিবর্তন বা নতুন ছবি আপলোড করুন"
          >
            <Upload size={11} />
            <span>{has ? 'ছবি পরিবর্তন' : 'আপলোড করুন'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Selected applicant for modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDocGenerator, setShowDocGenerator] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // In-Mail Reason and Fee state matching Video 3 (0:48 to 1:13)
  const [mailReason, setMailReason] = useState('সঞ্চয়');
  const [mailAmount, setMailAmount] = useState('3740');
  const [mailDescription, setMailDescription] = useState('আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।');
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');

  // Exact 9 reasons shown in Video 3 (0:54)
  const noticeReasons = [
    { label: 'সঞ্চয়', defaultAmount: '3740', desc: 'আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।' },
    { label: 'জীবন বীমা', defaultAmount: '1500', desc: 'ঋণ সুরক্ষার স্বার্থে জীবন বীমা পলিসি কভার ফি জমা দিতে হবে।' },
    { label: 'সরকারি ভ্যাট', defaultAmount: '3250', desc: 'সরকারি বিধিমোতাবেক ঋণ প্রসেসিং ভ্যাট ও ট্যাক্স বাবদ ফি সরকারি চালান কোডে জমা দিন।' },
    { label: 'ভিআইপি গ্রাহক', defaultAmount: '5000', desc: 'তাৎক্ষণিক অগ্রাধিকার ভিত্তিতে ঋণ উত্তোলনের জন্য ভিআইপি গ্রাহক ফি প্রযোজ্য।' },
    { label: 'অ্যাকাউন্ট ফ্রিজ ফি', defaultAmount: '2500', desc: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত রয়েছে, অ্যাকাউন্ট আনফ্রিজ করতে নির্ধারিত ফি জমা করুন।' },
    { label: '১-১০ তারিখের পর প্রথম কিস্তি', defaultAmount: '4047', desc: '১ থেকে ১০ তারিখের মধ্যে আপনার প্রথম কিস্তির অর্থ পরিশোধ করতে হবে।' },
    { label: 'প্রথম কিস্তি', defaultAmount: '4047', desc: 'ঋণ উত্তোলনের পূর্বে আপনার নির্ধারিত প্রথম কিস্তির অর্থ পরিশোধ করুন।' },
    { label: '৯৯% ত্রুটি', defaultAmount: '1100', desc: 'আপনার তথ্যে ১% ত্রুটি থাকায় ডাটাবেজ সংশোধনের জন্য নির্ধারিত সংশোধন ফি জমা দিন।' },
    { label: 'অন্যান্য', defaultAmount: '1000', desc: 'কর্তৃপক্ষের নির্দেশ অনুযায়ী প্রয়োজনীয় ফি পরিশোধ করুন।' }
  ];

  // Editable Applicant Details state
  const [editStatus, setEditStatus] = useState('');
  const [editBalance, setEditBalance] = useState(0);
  const [editInterestRate, setEditInterestRate] = useState('2.4');
  const [editAmount, setEditAmount] = useState(50000);
  const [editTenureMonths, setEditTenureMonths] = useState(12);
  const [editOtherFee, setEditOtherFee] = useState(0);
  const [editTotalRepayment, setEditTotalRepayment] = useState(0);
  const [editMonthlyEmi, setEditMonthlyEmi] = useState(0);
  const [editUpdating, setEditUpdating] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  // Editable Applicant Credentials & Profile Details
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [editFatherName, setEditFatherName] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editNidNumber, setEditNidNumber] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editPresentAddress, setEditPresentAddress] = useState('');
  const [editPermanentAddress, setEditPermanentAddress] = useState('');
  const [editProfession, setEditProfession] = useState('');

  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeRelationship, setEditNomineeRelationship] = useState('');
  const [editNomineePhone, setEditNomineePhone] = useState('');
  const [editNomineeNid, setEditNomineeNid] = useState('');

  const [editBankMethod, setEditBankMethod] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountHolderName, setEditAccountHolderName] = useState('');

  const [savingApplicantDetails, setSavingApplicantDetails] = useState(false);
  const [applicantSaveSuccess, setApplicantSaveSuccess] = useState('');
  const [applicantSaveError, setApplicantSaveError] = useState('');

  // Reason Upgrade State in Applicant Modal
  const [upgradeReason, setUpgradeReason] = useState('জীবন বীমা');
  const [upgradeAmount, setUpgradeAmount] = useState('1500');
  const [upgradeDescription, setUpgradeDescription] = useState('ঋণ সুরক্ষার স্বার্থে জীবন বীমা পলিসি কভার ফি জমা দিতে হবে।');
  const [includeReasonUpgrade, setIncludeReasonUpgrade] = useState(false);

  // Deleting loan state
  const [deletingId, setDeletingId] = useState(null);

  // Full-size slip preview modal state
  const [previewSlipImage, setPreviewSlipImage] = useState(null);

  // Corporate Agent Numbers state for general dashboard
  const [agentNumbers, setAgentNumbers] = useState({
    bkash: '01318047404',
    nagad: '01706329691',
    rocket: '18577394046',
  });
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentSaveSuccess, setAgentSaveSuccess] = useState('');

  useEffect(() => {
    // Fetch live agent numbers for admin management
    fetch('/api/settings/agent-numbers', { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.numbers) {
          setAgentNumbers({
            bkash: res.numbers.bkash || '01318047404',
            nagad: res.numbers.nagad || '01706329691',
            rocket: res.numbers.rocket || '18577394046',
          });
        }
      })
      .catch(() => {});

    // PROTECTED ADMIN ROUTE: Check if staff is logged in
    const staffSession = localStorage.getItem('staff_session');
    if (!staffSession) {
      router.replace('/staff/login');
      return;
    }
    fetchStaffData();
  }, [router]);

  const getStaffHeaders = () => {
    let session = '';
    try {
      session = localStorage.getItem('staff_session') || JSON.stringify({ role: 'staff' });
    } catch {}
    return {
      'Content-Type': 'application/json',
      'x-staff-session': session
    };
  };

  const fetchStaffData = async () => {
    try {
      const res = await fetch('/api/staff/loans', {
        headers: getStaffHeaders(),
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
        // Real counts straight from the database.
        setStats(data.stats || { total: 0, approved: 0, pending: 0, rejected: 0 });
        setSelectedApplicant(prev => {
          if (!prev) return null;
          const fresh = (data.loans || []).find(l => l.id === prev.id);
          return fresh ? { ...prev, ...fresh } : prev;
        });
      }
    } catch (err) {
      console.error('Fetch staff loans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const recalculateRepayment = (amt, tenure, rate, otherFee, isUpgrade, upAmt) => {
    const p = Number(amt) || 0;
    const t = Number(tenure) || 12;
    const r = (Number(rate) || 0) / 100;
    const f = (Number(otherFee) || 0) + (isUpgrade ? (Number(upAmt) || 0) : 0);
    const interest = p * (t / 12) * r;
    const total = Math.round(p + interest + f);
    const emi = t > 0 ? Number((total / t).toFixed(2)) : 0;
    setEditTotalRepayment(total);
    setEditMonthlyEmi(emi);
  };

  const openApplicantModal = (applicant) => {
    setSelectedApplicant(applicant);
    setEditStatus(applicant.status);
    setEditBalance(applicant.userBalance || 0);
    const rawRate = applicant.interestRate !== undefined ? Number(applicant.interestRate) : 0.024;
    const rateStr = rawRate <= 1 ? (rawRate * 100).toFixed(1) : rawRate.toString();
    setEditInterestRate(rateStr);

    const initialAmt = applicant.amount !== undefined ? Number(applicant.amount) : 50000;
    const initialTenure = applicant.tenureMonths !== undefined ? Number(applicant.tenureMonths) : 12;
    const initialFees = Number(applicant.otherFees || applicant.processingFees || 0);
    setEditAmount(initialAmt);
    setEditTenureMonths(initialTenure);
    setEditOtherFee(initialFees);

    const rateDec = (Number(rateStr) || 0) / 100;
    const interest = initialAmt * (initialTenure / 12) * rateDec;
    const computedTotal = applicant.totalRepayment
      ? Number(applicant.totalRepayment)
      : Math.round(initialAmt + interest + initialFees);
    const computedEmi = applicant.monthlyEmi
      ? Number(applicant.monthlyEmi)
      : (initialTenure > 0 ? Number((computedTotal / initialTenure).toFixed(2)) : 0);

    setEditTotalRepayment(computedTotal);
    setEditMonthlyEmi(computedEmi);

    setNoticeSuccess('');
    setEditSuccess('');
    setEditError('');

    // Initialize detailed applicant editable fields
    const u = applicant.user || {};
    const p = applicant.personal || {};
    const n = applicant.nominee || {};
    const b = applicant.bank || {};

    setEditFullName(u.fullName || applicant.applicantName || '');
    setEditPhone(u.phone || applicant.phone || '');
    setEditPassword(u.password || applicant.password || '');

    setEditFatherName(p.fatherName || '');
    setEditMotherName(p.motherName || '');
    setEditNidNumber(p.nidNumber || '');
    setEditBloodGroup(p.bloodGroup || '');
    setEditPresentAddress(p.presentAddress || '');
    setEditPermanentAddress(p.permanentAddress || '');
    setEditProfession(p.profession || '');

    setEditNomineeName(n.nomineeName || '');
    setEditNomineeRelationship(n.relationship || '');
    setEditNomineePhone(n.nomineePhone || '');
    setEditNomineeNid(n.nomineeNid || '');

    setEditBankMethod(b.method || '');
    setEditBankAccountNumber(b.accountNumber || '');
    setEditBankName(b.bankName || '');
    setEditAccountHolderName(b.accountHolderName || u.fullName || applicant.applicantName || '');
    setApplicantSaveSuccess('');
    setApplicantSaveError('');

    // Pre-select active notice or logically next upgrade reason
    const existingNotices = applicant.notices || [];
    const activeNotice = existingNotices.find(n => n.status !== 'approved') || existingNotices[0];

    // If an active notice exists, initialize Compose In-Mail form with it
    if (activeNotice) {
      const activeReasonLabel = activeNotice.reason || activeNotice.title || 'সঞ্চয়';
      setMailReason(activeReasonLabel);
      setMailAmount(String(activeNotice.amountToPay || '3740'));
      setMailDescription(activeNotice.description || activeNotice.message || '');
    } else {
      setMailReason('সঞ্চয়');
      setMailAmount('3740');
      setMailDescription(noticeReasons[0].desc);
    }

    const defaultNext = (activeNotice?.reason === 'সঞ্চয়' || activeNotice?.title === 'সঞ্চয়')
      ? noticeReasons.find(r => r.label === 'জীবন বীমা')
      : (noticeReasons.find(r => r.label !== activeNotice?.reason) || noticeReasons[1]);

    if (defaultNext) {
      setUpgradeReason(defaultNext.label);
      setUpgradeAmount(defaultNext.defaultAmount);
      setUpgradeDescription(defaultNext.desc);
    }
    setIncludeReasonUpgrade(false);
  };

  const handleReasonChange = (reasonLabel) => {
    setMailReason(reasonLabel);
    const item = noticeReasons.find(r => r.label === reasonLabel);
    if (item) {
      setMailAmount(item.defaultAmount);
      setMailDescription(item.desc);
    }
  };

  const handleUpgradeReasonChange = (reasonLabel) => {
    setUpgradeReason(reasonLabel);
    setIncludeReasonUpgrade(true);
    const item = noticeReasons.find(r => r.label === reasonLabel);
    if (item) {
      setUpgradeAmount(item.defaultAmount);
      setUpgradeDescription(item.desc);
      recalculateRepayment(editAmount, editTenureMonths, editInterestRate, editOtherFee, true, item.defaultAmount);
    }
  };

  const handleSendNotice = async (e, isUpgrade = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedApplicant) return;

    setNoticeSubmitting(true);
    setNoticeSuccess('');
    try {
      const res = await fetch('/api/staff/notice', {
        method: 'POST',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          userId: selectedApplicant.userId || selectedApplicant.user?.id,
          loanId: selectedApplicant.id,
          reason: mailReason,
          title: mailReason,
          amountToPay: Number(mailAmount) || 0,
          description: mailDescription,
          isUpgrade
        })
      });

      const data = await res.json();
      if (data.success) {
        setNoticeSuccess(
          isUpgrade
            ? 'সফলভাবে নোটিশ আপগ্রেড করা হয়েছে! পূর্ববর্তী নোটিশ স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়েছে এবং নতুন নোটিশটি কার্যকর হয়েছে।'
            : 'নতুন নোটিশ সফলভাবে কার্যকর হয়েছে!'
        );
        if (data.notices) {
          setSelectedApplicant(prev => ({
            ...prev,
            notices: data.notices
          }));
        } else if (data.notice) {
          setSelectedApplicant(prev => ({
            ...prev,
            notices: [data.notice]
          }));
        }
        await fetchStaffData();
      } else {
        alert(data.message || 'নোটিশ পাঠাতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি: নোটিশ পাঠানো সম্ভব হয়নি');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleToggleNoticeStatus = async (noticeId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await fetch('/api/staff/notice', {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({ id: noticeId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success && selectedApplicant) {
        if (data.notices) {
          setSelectedApplicant(prev => ({ ...prev, notices: data.notices }));
        } else {
          const updated = (selectedApplicant.notices || []).map(n =>
            n.id === noticeId ? { ...n, status: nextStatus } : n
          );
          setSelectedApplicant(prev => ({ ...prev, notices: updated }));
        }
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`/api/staff/notice?id=${noticeId}`, {
        method: 'DELETE',
        headers: getStaffHeaders()
      });
      const data = await res.json();
      if (data.success && selectedApplicant) {
        if (data.notices) {
          setSelectedApplicant(prev => ({ ...prev, notices: data.notices }));
        } else {
          const updated = selectedApplicant.notices.filter(n => n.id !== noticeId);
          setSelectedApplicant(prev => ({ ...prev, notices: updated }));
        }
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE LOAN APPLICATION (Requested feature)
  const handleDeleteLoan = async (loanId, e) => {
    if (e) e.stopPropagation();
    
    const confirmDelete = window.confirm('আপনি কি নিশ্চিত যে এই ঋণ আবেদনটি স্থায়ীভাবে মুছে ফেলতে চান?');
    if (!confirmDelete) return;

    setDeletingId(loanId);
    try {
      const res = await fetch(`/api/staff/loans?id=${loanId}`, {
        method: 'DELETE',
        headers: getStaffHeaders()
      });
      const data = await res.json();

      if (data.success) {
        if (selectedApplicant && selectedApplicant.id === loanId) {
          setSelectedApplicant(null);
        }
        fetchStaffData();
      } else {
        alert(data.message || 'মুছে ফেলতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper: Compress/resize image on client to ensure ultra-fast upload under 300KB
  const compressClientImage = (file, maxDim = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (!dataUrl) return resolve(null);
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Handle Admin Editing/Uploading Any Document Image
  const handleAdminDocumentUpload = async (docKey, file, isNominee = false) => {
    if (!file || !selectedApplicant) return;
    setApplicantSaveError('');
    setApplicantSaveSuccess('ছবি প্রসেসিং ও সংরক্ষণ হচ্ছে...');

    try {
      const dataUrl = await compressClientImage(file);
      if (!dataUrl) {
        setApplicantSaveError('ছবি লোড করা সম্ভব হয়নি');
        return;
      }

      // Update selectedApplicant locally immediately
      setSelectedApplicant(prev => {
        if (!prev) return prev;
        if (isNominee) {
          return {
            ...prev,
            nominee: {
              ...(prev.nominee || {}),
              [docKey]: dataUrl
            }
          };
        } else {
          return {
            ...prev,
            personal: {
              ...(prev.personal || {}),
              [docKey]: dataUrl
            }
          };
        }
      });

      // Update loans state as well
      setLoans(prevLoans => prevLoans.map(loan => {
        if (loan.id === selectedApplicant.id) {
          if (isNominee) {
            return {
              ...loan,
              nominee: { ...(loan.nominee || {}), [docKey]: dataUrl }
            };
          } else {
            return {
              ...loan,
              personal: { ...(loan.personal || {}), [docKey]: dataUrl }
            };
          }
        }
        return loan;
      }));

      // Call API to persist to backend
      const userId = selectedApplicant.userId || selectedApplicant.user?.id || selectedApplicant.user_id;
      const res = await fetch('/api/staff/applicant', {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          userId,
          docType: isNominee ? 'nominee' : 'personal',
          docKey: docKey,
          dataUrl: dataUrl
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { message: res.statusText || 'সার্ভার ত্রুটি' };
      }

      if (res.ok && data.success) {
        setApplicantSaveSuccess('ছবি সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে!');
        setTimeout(() => setApplicantSaveSuccess(''), 4000);
        fetchStaffData();
      } else {
        setApplicantSaveError(data.message || 'ছবি সংরক্ষণ করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Failed to persist document to server:', err);
      setApplicantSaveError(err?.message || 'সার্ভার ত্রুটি: ছবি সংরক্ষণ করা সম্ভব হয়নি');
    }
  };

  const handleSaveAllApplicantInfo = async () => {
    if (!selectedApplicant) return;
    setSavingApplicantDetails(true);
    setApplicantSaveSuccess('');
    setApplicantSaveError('');
    try {
      const userId = selectedApplicant.userId || selectedApplicant.user?.id || selectedApplicant.user_id;
      const res = await fetch('/api/staff/applicant', {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          userId,
          fullName: editFullName,
          phone: editPhone,
          password: editPassword,
          personal: {
            fatherName: editFatherName,
            motherName: editMotherName,
            nidNumber: editNidNumber,
            bloodGroup: editBloodGroup,
            presentAddress: editPresentAddress,
            permanentAddress: editPermanentAddress,
            profession: editProfession,
            applicantPhoto: selectedApplicant.personal?.applicantPhoto,
            signature: selectedApplicant.personal?.signature,
            nidFront: selectedApplicant.personal?.nidFront,
            nidBack: selectedApplicant.personal?.nidBack,
          },
          nominee: {
            nomineeName: editNomineeName,
            relationship: editNomineeRelationship,
            nomineePhone: editNomineePhone,
            nomineeNid: editNomineeNid,
            nomineePhoto: selectedApplicant.nominee?.nomineePhoto,
            nomineeNidFront: selectedApplicant.nominee?.nomineeNidFront,
            nomineeNidBack: selectedApplicant.nominee?.nomineeNidBack,
          },
          bank: {
            method: editBankMethod,
            accountNumber: editBankAccountNumber,
            bankName: editBankName,
            accountHolderName: editAccountHolderName,
          },
          userBalance: Number(editBalance) || 0,
          loanId: selectedApplicant.id,
          amount: Number(editAmount),
          tenureMonths: Number(editTenureMonths),
          interestRate: Number(editInterestRate),
          status: editStatus,
          otherFees: Number(editOtherFee) || 0,
          totalRepayment: Number(editTotalRepayment),
          monthlyEmi: Number(editMonthlyEmi)
        })
      });

      const data = await res.json();
      if (data.success) {
        setApplicantSaveSuccess('সকল গ্রাহক ও নমিনী তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        setSelectedApplicant(prev => ({
          ...prev,
          applicantName: editFullName,
          phone: editPhone,
          password: editPassword,
          user: {
            ...(prev?.user || {}),
            fullName: editFullName,
            phone: editPhone,
            password: editPassword,
          },
          personal: {
            ...(prev?.personal || {}),
            fatherName: editFatherName,
            motherName: editMotherName,
            nidNumber: editNidNumber,
            bloodGroup: editBloodGroup,
            presentAddress: editPresentAddress,
            permanentAddress: editPermanentAddress,
            profession: editProfession,
          },
          nominee: {
            ...(prev?.nominee || {}),
            nomineeName: editNomineeName,
            relationship: editNomineeRelationship,
            nomineePhone: editNomineePhone,
            nomineeNid: editNomineeNid,
          },
          bank: {
            ...(prev?.bank || {}),
            method: editBankMethod,
            accountNumber: editBankAccountNumber,
            bankName: editBankName,
            accountHolderName: editAccountHolderName,
          }
        }));

        setLoans(prevLoans =>
          prevLoans.map(l =>
            l.id === selectedApplicant.id
              ? {
                  ...l,
                  applicantName: editFullName,
                  phone: editPhone,
                  password: editPassword,
                  user: {
                    ...(l.user || {}),
                    fullName: editFullName,
                    phone: editPhone,
                    password: editPassword,
                  },
                  personal: {
                    ...(l.personal || {}),
                    fatherName: editFatherName,
                    motherName: editMotherName,
                    nidNumber: editNidNumber,
                    bloodGroup: editBloodGroup,
                    presentAddress: editPresentAddress,
                    permanentAddress: editPermanentAddress,
                    profession: editProfession,
                  },
                  nominee: {
                    ...(l.nominee || {}),
                    nomineeName: editNomineeName,
                    relationship: editNomineeRelationship,
                    nomineePhone: editNomineePhone,
                    nomineeNid: editNomineeNid,
                  },
                  bank: {
                    ...(l.bank || {}),
                    method: editBankMethod,
                    accountNumber: editBankAccountNumber,
                    bankName: editBankName,
                    accountHolderName: editAccountHolderName,
                  }
                }
              : l
          )
        );

        fetchStaffData();
      } else {
        setApplicantSaveError(data.message || 'সংরক্ষণ করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setApplicantSaveError('সার্ভার ত্রুটি: তথ্য সংরক্ষণ করা সম্ভব হয়নি');
    } finally {
      setSavingApplicantDetails(false);
    }
  };

  const handleUpdateInformation = async (doUpgrade = false) => {
    if (!selectedApplicant) return;
    setEditUpdating(true);
    setEditSuccess('');
    setEditError('');

    const body = {
      loanId: selectedApplicant.id,
      userId: selectedApplicant.userId || selectedApplicant.user?.id || selectedApplicant.user_id,
      fullName: editFullName,
      phone: editPhone,
      password: editPassword,
      personal: {
        fatherName: editFatherName,
        motherName: editMotherName,
        nidNumber: editNidNumber,
        bloodGroup: editBloodGroup,
        presentAddress: editPresentAddress,
        permanentAddress: editPermanentAddress,
        profession: editProfession,
      },
      nominee: {
        nomineeName: editNomineeName,
        relationship: editNomineeRelationship,
        nomineePhone: editNomineePhone,
        nomineeNid: editNomineeNid,
      },
      bank: {
        method: editBankMethod,
        accountNumber: editBankAccountNumber,
        bankName: editBankName,
        accountHolderName: editAccountHolderName,
      },
      status: editStatus,
      userBalance: Number(editBalance),
      interestRate: Number(editInterestRate),
      amount: Number(editAmount),
      tenureMonths: Number(editTenureMonths),
      otherFees: Number(editOtherFee) || 0,
      totalRepayment: Number(editTotalRepayment),
      monthlyEmi: Number(editMonthlyEmi)
    };

    if (doUpgrade || includeReasonUpgrade) {
      body.upgradeReason = upgradeReason;
      body.upgradeAmount = Number(upgradeAmount) || 0;
      body.upgradeDescription = upgradeDescription;
      body.approvePreviousReason = true;
    }

    try {
      const res = await fetch('/api/staff/loans', {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (resData.success && resData.loan) {
        const savedLoan = resData.loan;
        setSelectedApplicant(prev => ({
          ...prev,
          amount: savedLoan.amount,
          tenureMonths: savedLoan.tenureMonths,
          status: savedLoan.status,
          userBalance: savedLoan.userBalance,
          interestRate: savedLoan.interestRate,
          monthlyEmi: savedLoan.monthlyEmi,
          totalRepayment: savedLoan.totalRepayment,
          otherFees: savedLoan.otherFees,
          notices: resData.notices || prev.notices
        }));

        setLoans(prevLoans =>
          prevLoans.map(l =>
            l.id === selectedApplicant.id
              ? {
                  ...l,
                  amount: savedLoan.amount,
                  tenureMonths: savedLoan.tenureMonths,
                  status: savedLoan.status,
                  userBalance: savedLoan.userBalance,
                  interestRate: savedLoan.interestRate,
                  monthlyEmi: savedLoan.monthlyEmi,
                  totalRepayment: savedLoan.totalRepayment,
                  otherFees: savedLoan.otherFees,
                  notices: resData.notices || l.notices
                }
              : l
          )
        );

        setEditSuccess(
          body.upgradeReason 
            ? 'তথ্য ও রিজন সফলভাবে আপগ্রেড করা হয়েছে! পূর্ববর্তী রিজন অ্যাপ্রুভ হয়েছে এবং নতুন রিজন ক্লায়েন্টের লিংকে সক্রিয় হয়েছে।'
            : 'লোন তথ্য সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে!'
        );
        fetchStaffData();
      } else {
        setEditError(resData.message || 'আপডেট করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setEditError('সার্ভার ত্রুটি: আপডেট করা সম্ভব হয়নি');
    } finally {
      setEditUpdating(false);
    }
  };

  const handleSaveAgentNumbers = async (e) => {
    e.preventDefault();
    setAgentSaving(true);
    setAgentSaveSuccess('');
    try {
      const res = await fetch('/api/settings/agent-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentNumbers)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAgentSaveSuccess('নম্বর সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setAgentSaveSuccess(''), 3500);
      } else {
        alert(data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন');
    } finally {
      setAgentSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('staff_session');
    router.push('/staff/login');
  };

  const filteredLoans = loans.filter(l => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (l.user?.fullName || l.applicantName || '').toLowerCase().includes(q);
    const phoneMatch = (l.user?.phone || l.phone || '').includes(q);
    const amountMatch = String(l.amount).includes(q);
    const purposeMatch = (l.purpose || '').toLowerCase().includes(q);

    const matchesQuery = nameMatch || phoneMatch || amountMatch || purposeMatch;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

    return matchesQuery && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'name') return (a.user?.fullName || '').localeCompare(b.user?.fullName || '');
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="min-h-screen bg-[#070e24] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-[#0b1739] border-b border-blue-900/50 sticky top-0 z-30 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center shadow-inner">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white flex items-center space-x-1.5">
                <span>MyBank Staff Dashboard</span>
              </h1>
              <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">MyBank Administration Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-xs font-semibold text-blue-300 hover:text-white transition-all flex items-center space-x-1"
            >
              <span>User View</span>
              <ExternalLink size={12} />
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-xs font-semibold text-red-300 hover:text-white hover:bg-red-900 transition-all flex items-center space-x-1.5 shadow-sm"
              title="Logout from Staff Dashboard"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        
        {/* Top 4 Stat Cards matching Video 2 (0:00 to 0:29) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-blue-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Loans</span>
                <h3 className="text-2xl font-black text-white font-mono mt-0.5">{stats.total.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Folder size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1 text-[11px] text-blue-300">
              <span>All applications</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-emerald-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved</span>
                <h3 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{stats.approved.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% of total` : 'No applications yet'}</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-amber-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                <h3 className="text-2xl font-black text-amber-400 font-mono mt-0.5">{stats.pending.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Awaiting review</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-red-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
                <h3 className="text-2xl font-black text-rose-400 font-mono mt-0.5">{stats.rejected.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <XCircle size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1 text-[11px] text-rose-400">
              <span>Not approved</span>
            </div>
          </div>

        </div>

        {/* Corporate Mobile Banking Agent Numbers Settings Panel */}
        <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-blue-900/40 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>কর্পোরেট এজেন্ট নম্বর সেটিংস (Mobile Banking Agent Numbers)</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-600/50 px-2 py-0.5 rounded-full font-medium">
                    গ্রাহক উইথড্র পেইজে প্রদর্শিত হবে
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  এখানে নম্বর পরিবর্তন করলে গ্রাহক উইথড্র পেইজে সরাসরি নতুন নম্বর দেখতে পাবে এবং সেখানে টাকা পাঠাতে পারবে।
                </p>
              </div>
            </div>

            {agentSaveSuccess && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-lg flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle size={14} />
                <span>{agentSaveSuccess}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveAgentNumbers} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* বিকাশ */}
            <div className="bg-[#09132c] border border-pink-900/50 rounded-xl p-3 space-y-1.5 focus-within:border-pink-500 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-pink-400 flex items-center space-x-1.5">
                  <Phone size={13} />
                  <span>বিকাশ এজেন্ট নম্বর (bKash)</span>
                </label>
                <span className="text-[10px] text-pink-400/80 bg-pink-950/60 px-1.5 py-0.5 rounded">bKash</span>
              </div>
              <input
                type="text"
                value={agentNumbers.bkash}
                onChange={(e) => setAgentNumbers(prev => ({ ...prev, bkash: e.target.value }))}
                placeholder="01318047404"
                className="w-full bg-[#070e24] border border-pink-950 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* নগদ */}
            <div className="bg-[#09132c] border border-orange-900/50 rounded-xl p-3 space-y-1.5 focus-within:border-orange-500 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-400 flex items-center space-x-1.5">
                  <Phone size={13} />
                  <span>নগদ এজেন্ট নম্বর (Nagad)</span>
                </label>
                <span className="text-[10px] text-orange-400/80 bg-orange-950/60 px-1.5 py-0.5 rounded">Nagad</span>
              </div>
              <input
                type="text"
                value={agentNumbers.nagad}
                onChange={(e) => setAgentNumbers(prev => ({ ...prev, nagad: e.target.value }))}
                placeholder="01706329691"
                className="w-full bg-[#070e24] border border-orange-950 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* রকেট */}
            <div className="bg-[#09132c] border border-purple-900/50 rounded-xl p-3 space-y-1.5 focus-within:border-purple-500 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                  <Rocket size={13} />
                  <span>রকেট এজেন্ট নম্বর (Rocket)</span>
                </label>
                <span className="text-[10px] text-purple-400/80 bg-purple-950/60 px-1.5 py-0.5 rounded">Rocket</span>
              </div>
              <input
                type="text"
                value={agentNumbers.rocket}
                onChange={(e) => setAgentNumbers(prev => ({ ...prev, rocket: e.target.value }))}
                placeholder="18577394046"
                className="w-full bg-[#070e24] border border-purple-950 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={agentSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {agentSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{agentSaving ? 'সংরক্ষণ হচ্ছে...' : 'নম্বর পরিবর্তন / আপডেট সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-3.5 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute inset-y-0 left-3 my-auto text-blue-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, amount, purpose..."
              className="w-full pl-9 pr-3 py-2 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-36 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs font-semibold px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-36 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs font-semibold px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 appearance-none"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="amount">Sort by: Amount</option>
                <option value="name">Sort by: Name</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>
        </div>

        {/* Applications Table / Cards */}
        <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-blue-900/50 bg-[#0b1739] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Interest</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 text-xs font-medium">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      কোনো ঋণ আবেদন পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      onClick={() => openApplicantModal(loan)}
                      className="hover:bg-blue-950/40 cursor-pointer transition-all group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            <User size={14} />
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors block">
                              {loan.user?.fullName || loan.applicantName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {loan.user?.phone || loan.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 text-sm">
                        ৳ {Number(loan.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300 capitalize">
                        {loan.purpose}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {((loan.interestRate || 0.024) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {loan.tenureMonths} mo
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            loan.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : loan.status === 'rejected'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                        {loan.createdAt}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); openApplicantModal(loan); }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center space-x-1"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* DELETE LOAN BUTTON IN TABLE */}
                          <button
                            onClick={(e) => handleDeleteLoan(loan.id, e)}
                            disabled={deletingId === loan.id}
                            className="p-1 rounded-lg bg-red-950/70 hover:bg-red-800 border border-red-800/50 text-red-300 hover:text-white transition-all"
                            title="মুছে ফেলুন (Delete Loan Request)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* APPLICANT DETAILS FULL MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b1633] border border-blue-900/70 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#081024] border-b border-blue-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-cyan-400 flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Applicant Details</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">Ref ID: {selectedApplicant.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* DELETE BUTTON IN MODAL HEADER */}
                <button
                  onClick={() => handleDeleteLoan(selectedApplicant.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="এই লোন রিকোয়েস্টটি মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                  <span>Delete Loan</span>
                </button>

                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TOP CONTAINER: Left = Personal Information, Right = Login Credentials + Loan Details & Upgrade Option */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                
                {/* LEFT SIDE DIV: Personal Information (বড় ও স্পষ্ট ফন্ট, এডিটেবল ইনপুট) */}
                <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-md h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
                      <span className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                        <User size={17} className="text-cyan-400" />
                        <span>Personal Information (ব্যক্তিগত তথ্য)</span>
                      </span>
                      <span className="text-xs text-blue-300 font-semibold bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800/60">
                        Editable
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 text-xs">
                      {/* Full Name */}
                      <div className="sm:col-span-2 bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">গ্রাহকের নাম (Applicant Full Name)</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="গ্রাহকের পূর্ণ নাম"
                        />
                      </div>

                      {/* Father's Name */}
                      <div className="bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">পিতার নাম (Father's Name)</label>
                        <input
                          type="text"
                          value={editFatherName}
                          onChange={(e) => setEditFatherName(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="পিতার নাম"
                        />
                      </div>

                      {/* Mother's Name */}
                      <div className="bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">মাতার নাম (Mother's Name)</label>
                        <input
                          type="text"
                          value={editMotherName}
                          onChange={(e) => setEditMotherName(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="মাতার নাম"
                        />
                      </div>

                      {/* NID Number */}
                      <div className="bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">এনআইডি নম্বর (NID Number)</label>
                        <input
                          type="text"
                          value={editNidNumber}
                          onChange={(e) => setEditNidNumber(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="NID নম্বর"
                        />
                      </div>

                      {/* Blood Group */}
                      <div className="bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">রক্তের গ্রুপ (Blood Group)</label>
                        <input
                          type="text"
                          value={editBloodGroup}
                          onChange={(e) => setEditBloodGroup(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-rose-300 font-bold text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="যেমন: A+, B+, O+"
                        />
                      </div>

                      {/* Present Address */}
                      <div className="sm:col-span-2 bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">বর্তমান ঠিকানা (Present Address)</label>
                        <textarea
                          rows="2"
                          value={editPresentAddress}
                          onChange={(e) => setEditPresentAddress(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 leading-relaxed"
                          placeholder="বর্তমান ঠিকানা লিখুন"
                        />
                      </div>

                      {/* Permanent Address */}
                      <div className="sm:col-span-2 bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">স্থায়ী ঠিকানা (Permanent Address)</label>
                        <textarea
                          rows="2"
                          value={editPermanentAddress}
                          onChange={(e) => setEditPermanentAddress(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 leading-relaxed"
                          placeholder="স্থায়ী ঠিকানা লিখুন"
                        />
                      </div>

                      {/* Profession */}
                      <div className="sm:col-span-2 bg-[#09132c] p-3 rounded-lg border border-blue-800/50">
                        <label className="text-slate-300 text-xs font-bold block mb-1">পেশা (Profession)</label>
                        <input
                          type="text"
                          value={editProfession}
                          onChange={(e) => setEditProfession(e.target.value)}
                          className="w-full bg-slate-900/90 border border-blue-700/60 rounded-md px-3 py-2 text-white font-medium text-sm focus:outline-none focus:border-cyan-400"
                          placeholder="পেশা"
                        />
                      </div>
                    </div>
                    <div className="pt-3.5 border-t border-blue-900/40 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">ব্যক্তিগত তথ্যে পরিবর্তন করলে সেভ করুন:</span>
                      <button
                        type="button"
                        onClick={handleSaveAllApplicantInfo}
                        disabled={savingApplicantDetails}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                      >
                        <Save size={13} />
                        <span>{savingApplicantDetails ? 'সেভ হচ্ছে...' : 'ব্যক্তিগত তথ্য সেভ করুন'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE DIV: Login Credentials + Loan Details & Upgrade Option */}
                <div className="space-y-4">
                  {/* 1. Login Credentials (Editable phone and password!) */}
                  <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <Lock size={14} className="text-cyan-400" />
                        <span>Login Credentials (লগইন তথ্য)</span>
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        পরিবর্তনযোগ্য
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] text-blue-300 font-semibold uppercase">ID Number</span>
                        <span className="font-mono font-black text-lg text-blue-400 mt-1">
                          {selectedApplicant.user?.id || selectedApplicant.userId}
                        </span>
                      </div>

                      <div className="bg-purple-600/20 border border-purple-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                        <label className="text-[10px] text-purple-300 font-semibold uppercase">Login Name</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="mt-1 bg-slate-900/90 border border-purple-700/60 rounded px-2.5 py-1 text-purple-200 font-bold text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                        <label className="text-[10px] text-emerald-300 font-semibold uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="mt-1 bg-slate-900/90 border border-emerald-700/60 rounded px-2.5 py-1 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="bg-amber-600/20 border border-amber-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                        <label className="text-[10px] text-amber-300 font-semibold uppercase">Password</label>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="mt-1 bg-slate-900/90 border border-amber-700/60 rounded px-2.5 py-1 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div className="pt-2.5 border-t border-blue-900/40 flex items-center justify-between">
                      <span className="text-[11px] text-amber-300/80">ফোন ও পাসওয়ার্ড পরিবর্তন করলে সেভ করুন:</span>
                      <button
                        type="button"
                        onClick={handleSaveAllApplicantInfo}
                        disabled={savingApplicantDetails}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                      >
                        <Save size={13} />
                        <span>{savingApplicantDetails ? 'সেভ হচ্ছে...' : 'লগইন তথ্য ও ফোন নম্বর সেভ করুন'}</span>
                      </button>
                    </div>
                  </div>

              {/* SECTION 2: Loan Application Details & Upgrade Option */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                    Loan Details & Upgrade Option (লোন তথ্য ও আপগ্রেড)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    বর্তমান অবস্থা: <strong className="text-cyan-300 uppercase">{selectedApplicant.status}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Loan Amount */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-800/60 ring-1 ring-blue-500/20">
                    <span className="text-blue-300 text-[10px] font-bold block">Loan Amount (লোন অংক ৳)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-xs text-blue-400 font-bold">৳</span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => {
                          setEditAmount(e.target.value);
                          recalculateRepayment(e.target.value, editTenureMonths, editInterestRate, editOtherFee, includeReasonUpgrade, upgradeAmount);
                        }}
                        className="bg-transparent font-mono font-bold text-white text-sm focus:outline-none w-full border-b border-blue-500/50"
                      />
                    </div>
                  </div>

                  {/* Tenure Months */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-800/60 ring-1 ring-blue-500/20">
                    <span className="text-blue-300 text-[10px] font-bold block">Tenure (মেয়াদ - মাস)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        value={editTenureMonths}
                        onChange={(e) => {
                          setEditTenureMonths(e.target.value);
                          recalculateRepayment(editAmount, e.target.value, editInterestRate, editOtherFee, includeReasonUpgrade, upgradeAmount);
                        }}
                        className="bg-transparent font-mono font-bold text-white text-sm focus:outline-none w-full border-b border-blue-500/50"
                      />
                      <span className="text-xs text-slate-400 font-semibold flex-shrink-0">মাস</span>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-cyan-800/60 ring-1 ring-cyan-500/20">
                    <span className="text-cyan-400 text-[10px] font-bold block">Interest Rate (% বার্ষিক)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        step="0.1"
                        value={editInterestRate}
                        onChange={(e) => {
                          setEditInterestRate(e.target.value);
                          recalculateRepayment(editAmount, editTenureMonths, e.target.value, editOtherFee, includeReasonUpgrade, upgradeAmount);
                        }}
                        className="bg-transparent font-mono font-bold text-cyan-300 text-sm focus:outline-none w-full border-b border-cyan-500/50"
                      />
                      <span className="text-xs text-cyan-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Other Fees */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-amber-800/60 ring-1 ring-amber-500/20">
                    <span className="text-amber-400 text-[10px] font-bold block">Other Fees (অন্যান্য ফি ৳)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-xs text-amber-400 font-bold">৳</span>
                      <input
                        type="number"
                        value={editOtherFee}
                        onChange={(e) => {
                          setEditOtherFee(e.target.value);
                          recalculateRepayment(editAmount, editTenureMonths, editInterestRate, e.target.value, includeReasonUpgrade, upgradeAmount);
                        }}
                        placeholder="0"
                        className="bg-transparent font-mono font-bold text-amber-300 text-sm focus:outline-none w-full border-b border-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* EMI per Month (Dynamic) */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-[#09132c]">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 text-[10px] font-bold">EMI per Month (মাসিক কিস্তি)</span>
                      <span className="text-[9px] text-amber-500/80 font-mono">Dynamic</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-xs text-amber-400 font-bold">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editMonthlyEmi}
                        onChange={(e) => setEditMonthlyEmi(e.target.value)}
                        className="bg-transparent font-mono font-bold text-amber-300 text-sm focus:outline-none w-full border-b border-amber-500/30"
                      />
                    </div>
                  </div>

                  {/* Total Repayment (Dynamic) */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-[#09132c]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-[10px] font-bold">Total Repayment (মোট পরিশোধ)</span>
                      <span className="text-[9px] text-emerald-500/80 font-mono">Dynamic</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-xs text-emerald-400 font-bold">৳</span>
                      <input
                        type="number"
                        value={editTotalRepayment}
                        onChange={(e) => {
                          setEditTotalRepayment(e.target.value);
                          const t = Number(editTenureMonths) || 12;
                          if (t > 0) setEditMonthlyEmi(Number((Number(e.target.value) / t).toFixed(2)));
                        }}
                        className="bg-transparent font-mono font-bold text-emerald-300 text-sm focus:outline-none w-full border-b border-emerald-500/30"
                      />
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block font-semibold">Loan Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none mt-1 cursor-pointer uppercase tracking-wider w-full"
                    >
                      <option value="approved" className="bg-slate-900 text-emerald-400">Approved</option>
                      <option value="pending" className="bg-slate-900 text-amber-400">Pending</option>
                      <option value="rejected" className="bg-slate-900 text-rose-400">Rejected</option>
                    </select>
                  </div>

                  {/* User Balance */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block font-semibold">User Balance (৳)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-xs text-emerald-400 font-bold">৳</span>
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="bg-transparent font-mono font-bold text-emerald-400 text-sm focus:outline-none w-full border-b border-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Calculation Breakdown Helper */}
                <div className="p-2.5 bg-blue-950/60 border border-blue-800/40 rounded-lg flex flex-wrap items-center justify-between text-[11px] text-blue-200 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">💡 হিসাব সূত্র:</span>
                    <span>
                      মূল লোন ৳{(Number(editAmount) || 0).toLocaleString()} + সুদ ৳{Math.round((Number(editAmount) || 0) * ((Number(editTenureMonths) || 12) / 12) * ((Number(editInterestRate) || 0) / 100)).toLocaleString()} {((Number(editOtherFee) || 0) + (includeReasonUpgrade ? (Number(upgradeAmount) || 0) : 0)) > 0 ? `+ ফি ৳${((Number(editOtherFee) || 0) + (includeReasonUpgrade ? (Number(upgradeAmount) || 0) : 0)).toLocaleString()}` : ''} = <strong>মোট পরিশোধ ৳{(Number(editTotalRepayment) || 0).toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="font-mono font-bold text-amber-300">
                    মাসিক কিস্তি: ৳{(Number(editMonthlyEmi) || 0).toLocaleString()}/মাস ({editTenureMonths} কিস্তি)
                  </div>
                </div>

                {/* UPGRADE REASON SECTION */}
                <div className="bg-[#09132c] border border-cyan-900/60 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                      <Rocket size={14} className="text-cyan-400" />
                      <span>রিজন আপগ্রেড ও পরিবর্তন অপশন (Reason Upgrade)</span>
                    </span>
                    <label className="flex items-center space-x-2 text-[11px] text-cyan-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeReasonUpgrade}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIncludeReasonUpgrade(checked);
                          recalculateRepayment(editAmount, editTenureMonths, editInterestRate, editOtherFee, checked, upgradeAmount);
                        }}
                        className="rounded border-blue-900 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span>রিজন পরিবর্তন / আপগ্রেড যুক্ত করুন</span>
                    </label>
                  </div>

                  {includeReasonUpgrade && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                            নতুন কারণ নির্বাচন করুন (Select Reason) *
                          </label>
                          <select
                            value={upgradeReason}
                            onChange={(e) => handleUpgradeReasonChange(e.target.value)}
                            className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white font-semibold text-xs focus:outline-none focus:border-cyan-400"
                          >
                            {noticeReasons.map((r) => (
                              <option key={r.label} value={r.label}>{r.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                            নির্ধারিত ফি / সঞ্চয় (৳)
                          </label>
                          <input
                            type="number"
                            value={upgradeAmount}
                            onChange={(e) => {
                              setUpgradeAmount(e.target.value);
                              recalculateRepayment(editAmount, editTenureMonths, editInterestRate, editOtherFee, includeReasonUpgrade, e.target.value);
                            }}
                            className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                          নির্দেশনা বার্তা (Description) *
                        </label>
                        <textarea
                          rows="2"
                          value={upgradeDescription}
                          onChange={(e) => setUpgradeDescription(e.target.value)}
                          className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="p-2 bg-blue-950/70 border border-blue-800/60 rounded-lg flex items-center space-x-2 text-[11px] text-blue-200">
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>আপগ্রেড বাটনে ক্লিক করলে গ্রাহকের পূর্ববর্তী রিজন (যেমন: সঞ্চয়) অ্যাপ্রুভড হিসেবে দেখাবে এবং নতুন রিজনটি (যেমন: জীবন বীমা) ক্লায়েন্টের লিংকে সক্রিয় হবে।</span>
                      </div>
                    </div>
                  )}
                </div>

                {editSuccess && (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-lg font-semibold flex items-center space-x-2">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                {editError && (
                  <div className="p-2.5 bg-red-950/80 border border-red-500/50 text-red-300 text-xs rounded-lg font-semibold flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDeleteLoan(selectedApplicant.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 size={13} />
                    <span>Delete Loan Request</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {includeReasonUpgrade ? (
                      <button
                        onClick={() => handleUpdateInformation(true)}
                        disabled={editUpdating}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center space-x-1.5 border border-emerald-400/40"
                      >
                        <Rocket size={14} />
                        <span>{editUpdating ? 'আপগ্রেড হচ্ছে...' : 'আপগ্রেড করুন (Upgrade)'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateInformation(false)}
                        disabled={editUpdating}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                      >
                        <Edit size={14} />
                        <span>{editUpdating ? 'Saving...' : 'Update Information'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* BOTTOM CONTAINER: Left = Applicant Upload Details (2 Rows), Right = Nominee Info & Upload Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                
                {/* LEFT SIDE DIV: Applicant Upload Details (Row 1: Image, Signature; Row 2: NID 2 images) */}
                <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-blue-900/50 pb-2.5">
                    <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block">
                      গ্রাহকের আপলোডকৃত ডকুমেন্টস (Applicant Upload Details)
                    </span>
                    <span className="text-[10px] text-cyan-300 font-medium bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
                      Click to Enlarge / Change
                    </span>
                  </div>

                  {/* Row 1: Applicant Photo then Signature */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 block">Row 1: গ্রাহকের ছবি ও স্বাক্ষর</span>
                    <div className="grid grid-cols-2 gap-3">
                      <AttachmentTile
                        src={selectedApplicant.personal?.applicantPhoto}
                        label="গ্রাহকের ছবি (Photo)"
                        heightClass="h-40"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('applicantPhoto', file, false)}
                      />
                      <AttachmentTile
                        src={selectedApplicant.personal?.signature}
                        label="গ্রাহকের স্বাক্ষর (Signature)"
                        heightClass="h-40"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('signature', file, false)}
                        contain
                      />
                    </div>
                  </div>

                  {/* Row 2: NID Front & NID Back */}
                  <div className="space-y-1.5 pt-2 border-t border-blue-900/40">
                    <span className="text-xs font-bold text-slate-300 block">Row 2: গ্রাহকের এনআইডি কার্ড (NID Front & Back)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <AttachmentTile
                        src={selectedApplicant.personal?.nidFront}
                        label="এনআইডি ফ্রন্ট সাইড (NID Front)"
                        heightClass="h-40"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('nidFront', file, false)}
                      />
                      <AttachmentTile
                        src={selectedApplicant.personal?.nidBack}
                        label="এনআইডি ব্যাক সাইড (NID Back)"
                        heightClass="h-40"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('nidBack', file, false)}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE DIV: Nominee Information with Upload Details as like Applicant Details */}
                <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-blue-900/50 pb-2.5">
                    <span className="text-xs font-extrabold text-pink-400 uppercase tracking-wider block">
                      নমিনীর তথ্য ও আপলোডকৃত ডকুমেন্টস (Nominee Information)
                    </span>
                    <span className="text-[10px] text-pink-300 font-semibold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800/40">
                      Editable
                    </span>
                  </div>

                  {/* Nominee Editable Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#09132c] p-2.5 rounded-lg border border-pink-900/50">
                      <label className="text-slate-300 text-xs font-bold block mb-1">নমিনীর নাম (Nominee Name)</label>
                      <input
                        type="text"
                        value={editNomineeName}
                        onChange={(e) => setEditNomineeName(e.target.value)}
                        className="w-full bg-slate-900/90 border border-pink-800/60 rounded px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-pink-400"
                        placeholder="নমিনীর নাম"
                      />
                    </div>

                    <div className="bg-[#09132c] p-2.5 rounded-lg border border-pink-900/50">
                      <label className="text-slate-300 text-xs font-bold block mb-1">সম্পর্ক (Relationship)</label>
                      <input
                        type="text"
                        value={editNomineeRelationship}
                        onChange={(e) => setEditNomineeRelationship(e.target.value)}
                        className="w-full bg-slate-900/90 border border-pink-800/60 rounded px-2.5 py-1.5 text-pink-300 font-semibold text-xs focus:outline-none focus:border-pink-400"
                        placeholder="যেমন: পিতা/মাতা/স্ত্রী/ভাই"
                      />
                    </div>

                    <div className="bg-[#09132c] p-2.5 rounded-lg border border-pink-900/50">
                      <label className="text-slate-300 text-xs font-bold block mb-1">মোবাইল নম্বর (Phone)</label>
                      <input
                        type="text"
                        value={editNomineePhone}
                        onChange={(e) => setEditNomineePhone(e.target.value)}
                        className="w-full bg-slate-900/90 border border-pink-800/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-pink-400"
                        placeholder="মোবাইল নম্বর"
                      />
                    </div>

                    <div className="bg-[#09132c] p-2.5 rounded-lg border border-pink-900/50">
                      <label className="text-slate-300 text-xs font-bold block mb-1">এনআইডি নম্বর (NID)</label>
                      <input
                        type="text"
                        value={editNomineeNid}
                        onChange={(e) => setEditNomineeNid(e.target.value)}
                        className="w-full bg-slate-900/90 border border-pink-800/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-pink-400"
                        placeholder="এনআইডি নম্বর"
                      />
                    </div>
                  </div>

                  {/* Nominee Uploaded Documents */}
                  <div className="pt-2 border-t border-pink-900/40 space-y-2">
                    <span className="text-xs font-bold text-pink-300 block">
                      নমিনীর আপলোডকৃত ফাইলসমূহ (Click to Enlarge / Change):
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <AttachmentTile
                        src={selectedApplicant.nominee?.nomineePhoto}
                        label="নমিনীর ছবি"
                        heightClass="h-36"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('nomineePhoto', file, true)}
                      />
                      <AttachmentTile
                        src={selectedApplicant.nominee?.nomineeNidFront}
                        label="এনআইডি ফ্রন্ট"
                        heightClass="h-36"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('nomineeNidFront', file, true)}
                      />
                      <AttachmentTile
                        src={selectedApplicant.nominee?.nomineeNidBack}
                        label="এনআইডি ব্যাক"
                        heightClass="h-36"
                        onOpen={setEnlargedImage}
                        onUpload={(file) => handleAdminDocumentUpload('nomineeNidBack', file, true)}
                      />
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-pink-900/40 flex items-center justify-between">
                    <span className="text-[11px] text-pink-300/80">নমিনী তথ্যে পরিবর্তন করলে সেভ করুন:</span>
                    <button
                      type="button"
                      onClick={handleSaveAllApplicantInfo}
                      disabled={savingApplicantDetails}
                      className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                    >
                      <Save size={13} />
                      <span>{savingApplicantDetails ? 'সেভ হচ্ছে...' : 'নমিনী তথ্য সেভ করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: Bank Details (Editable) + Unified Save All Details Button */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                  <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block">
                    Bank & Withdrawal Information (ব্যাংক ও উত্তোলন তথ্য)
                  </span>
                  <span className="text-[10px] text-cyan-300 font-semibold bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
                    Editable
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/50">
                    <label className="text-slate-300 text-xs font-bold block mb-1">Account Type / Method</label>
                    <input
                      type="text"
                      value={editBankMethod}
                      onChange={(e) => setEditBankMethod(e.target.value)}
                      className="w-full bg-slate-900/90 border border-blue-800/60 rounded px-2.5 py-1.5 text-cyan-300 font-bold text-xs uppercase focus:outline-none focus:border-cyan-400"
                      placeholder="bKash / Nagad / Bank"
                    />
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/50">
                    <label className="text-slate-300 text-xs font-bold block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editBankAccountNumber}
                      onChange={(e) => setEditBankAccountNumber(e.target.value)}
                      className="w-full bg-slate-900/90 border border-blue-800/60 rounded px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                      placeholder="অ্যাকাউন্ট বা মোবাইল নম্বর"
                    />
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/50">
                    <label className="text-slate-300 text-xs font-bold block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full bg-slate-900/90 border border-blue-800/60 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                      placeholder="ব্যাংকের নাম"
                    />
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/50">
                    <label className="text-slate-300 text-xs font-bold block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={editAccountHolderName}
                      onChange={(e) => setEditAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900/90 border border-blue-800/60 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                      placeholder="হিসাবধারীর নাম"
                    />
                  </div>
                </div>

                {/* Save All Details Button */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-blue-900/40">
                  <div className="flex flex-col space-y-1">
                    {applicantSaveSuccess && (
                      <span className="text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                        <CheckCircle size={15} />
                        <span>{applicantSaveSuccess}</span>
                      </span>
                    )}
                    {applicantSaveError && (
                      <span className="text-red-400 text-xs font-bold flex items-center space-x-1.5">
                        <AlertTriangle size={15} />
                        <span>{applicantSaveError}</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAllApplicantInfo}
                    disabled={savingApplicantDetails}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-900/40 transition-all flex items-center space-x-2"
                  >
                    <Save size={15} />
                    <span>{savingApplicantDetails ? 'সংরক্ষণ হচ্ছে...' : 'সকল এডিটকৃত তথ্য ও ক্রেডেনশিয়াল সংরক্ষণ করুন (Save All Details)'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 7: VIEW ALL DOCUMENTS BUTTON */}
              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <FileCheck size={18} className="text-cyan-400" />
                    <span>View All Documents & Generate Official Slips</span>
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Generate the lender's own documents: Loan Approval Letter, Repayment Schedule and Disbursement Advice.
                  </p>
                </div>
                <button
                  onClick={() => setShowDocGenerator(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all flex-shrink-0"
                >
                  <FileCheck size={16} />
                  <span>View All Documents</span>
                </button>
              </div>

              {/* SECTION 8: COMPOSE IN-MAIL / NOTICE (Matches Video 3: 0:48 to 1:13) */}
              <div className="bg-[#0f1d40] border border-purple-900/60 rounded-xl p-4 space-y-4">
                <div className="flex items-center space-x-2 border-b border-purple-900/50 pb-2 text-purple-300 font-bold text-sm">
                  <Send size={16} />
                  <span>Compose In-Mail</span>
                </div>

                <form onSubmit={handleSendNotice} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Select Reason *
                      </label>
                      <select
                        value={mailReason}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                      >
                        {noticeReasons.map((r) => (
                          <option key={r.label} value={r.label}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Amount To Pay (৳)
                      </label>
                      <input
                        type="number"
                        value={mailAmount}
                        onChange={(e) => setMailAmount(e.target.value)}
                        placeholder="3740"
                        className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Description *
                    </label>
                    <textarea
                      rows="3"
                      value={mailDescription}
                      onChange={(e) => setMailDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs leading-relaxed"
                      required
                    />
                  </div>

                  {noticeSuccess && (
                    <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg font-semibold flex items-center space-x-2">
                      <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                      <span>{noticeSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleSendNotice(e, true)}
                      disabled={noticeSubmitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/40 text-xs"
                    >
                      <Rocket size={14} />
                      <span>{noticeSubmitting ? 'প্রসেসিং...' : 'আপগ্রেড ও নোটিশ পাঠান (Upgrade)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSendNotice(e, false)}
                      disabled={noticeSubmitting}
                      className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-900/40 transition-all border border-purple-400/30 text-xs"
                    >
                      <Send size={14} />
                      <span>{noticeSubmitting ? 'পাঠানো হচ্ছে...' : 'শুধুমাত্র নোটিশ পাঠান'}</span>
                    </button>
                  </div>
                </form>

                {/* Review & Action List (Matching User Reference Image: Image | Title | Amount | Description) */}
                <div className="pt-2 border-t border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">📗</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Review & Action
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-300 font-medium">
                      মোট নোটিশ: {selectedApplicant.notices?.length || 0}
                    </span>
                  </div>

                  {selectedApplicant.notices && selectedApplicant.notices.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-purple-950/80 bg-[#080f1e] shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-purple-950/80 text-slate-400 bg-[#0b1426] text-[11px]">
                            <th className="py-2.5 px-3 font-semibold w-24">Image</th>
                            <th className="py-2.5 px-3 font-semibold w-28">Title</th>
                            <th className="py-2.5 px-3 font-semibold w-28">Amount</th>
                            <th className="py-2.5 px-3 font-semibold">Description</th>
                            <th className="py-2.5 px-3 font-semibold text-right w-24">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-950/50">
                          {selectedApplicant.notices.map((n) => (
                            <tr key={n.id} className="hover:bg-purple-950/20 transition-colors">
                              {/* Image Column: Slip thumbnail or placeholder */}
                              <td className="py-3 px-3 align-top">
                                {n.slipImage ? (
                                  <div className="space-y-1">
                                    <div
                                      onClick={() => setPreviewSlipImage(n.slipImage)}
                                      className="relative group cursor-pointer w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-purple-500/70 hover:border-purple-300 bg-slate-950 flex-shrink-0 transition-transform hover:scale-105 shadow-md shadow-purple-950/60"
                                      title="ক্লিক করে বড় আকারে দেখুন"
                                    >
                                      <img
                                        src={n.slipImage}
                                        alt="Payment Slip"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye size={18} className="text-white drop-shadow" />
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-1.5 py-0.5 rounded inline-block text-center whitespace-nowrap">
                                      স্লিপ জমা
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                                    <span className="text-slate-600 text-xs">—</span>
                                    <span className="text-[8px] text-slate-600">ছবি নেই</span>
                                  </div>
                                )}
                              </td>

                              {/* Title Column */}
                              <td className="py-3 px-3 align-top">
                                <span className="font-bold text-purple-200 block text-xs sm:text-sm">
                                  {n.reason || n.title}
                                </span>
                                <div className="mt-1">
                                  {n.status === 'approved' ? (
                                    <span className="text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                                      <CheckCircle size={10} className="text-emerald-400" />
                                      <span>অ্যাপ্রুভড</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full inline-block">
                                      সক্রিয় (Pending)
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Amount Column */}
                              <td className="py-3 px-3 align-top font-mono font-bold text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                                {n.amountToPay > 0 ? (
                                  <span>৳ {Number(n.amountToPay).toLocaleString()}</span>
                                ) : (
                                  <span className="text-slate-500">৳ 0</span>
                                )}
                              </td>

                              {/* Description Column */}
                              <td className="py-3 px-3 align-top text-xs text-slate-300 leading-relaxed font-sans">
                                <p className="whitespace-pre-line text-justify text-[11px] sm:text-xs">
                                  {n.description || n.message}
                                </p>
                              </td>

                              {/* Action Column */}
                              <td className="py-3 px-3 align-top text-right">
                                <div className="flex flex-col items-end space-y-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleNoticeStatus(n.id, n.status)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all border whitespace-nowrap ${
                                      n.status === 'approved'
                                        ? 'bg-amber-950/60 hover:bg-amber-900 border-amber-700 text-amber-300'
                                        : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                                    }`}
                                    title={n.status === 'approved' ? 'পুনরায় সক্রিয় করুন' : 'অ্যাপ্রুভ করুন'}
                                  >
                                    {n.status === 'approved' ? 'সক্রিয় করুন' : 'অ্যাপ্রুভ করুন'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNotice(n.id)}
                                    className="p-1.5 rounded bg-red-950 hover:bg-red-900 text-red-400 hover:text-white transition-all border border-red-900"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-1 italic">No notices found.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* FULL-SIZE SLIP PREVIEW LIGHTBOX */}
      {previewSlipImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewSlipImage(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] bg-slate-900 border border-purple-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-purple-900/50 bg-[#0c1527]">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">গ্রাহকের লেনদেনের স্লিপ</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                  পেমেন্ট স্লিপ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSlipImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/60 min-h-[300px]">
              <img
                src={previewSlipImage}
                alt="Submitted Slip Full Size"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-700"
              />
            </div>
            <div className="p-3 border-t border-purple-900/50 bg-[#0c1527] flex justify-between items-center text-xs text-slate-400">
              <span>লেনদেন স্লিপ ও টাকার পরিমাণ সতর্কতার সাথে যাচাই করুন</span>
              <a
                href={previewSlipImage}
                target="_blank"
                rel="noreferrer"
                download="payment-slip.jpg"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs flex items-center space-x-1"
              >
                <ExternalLink size={14} />
                <span>নতুন ট্যাবে দেখুন</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT GENERATOR MODAL */}
      {showDocGenerator && selectedApplicant && (
        <DocumentGenerator
          applicantData={{
            ...selectedApplicant,
            amount: editAmount !== undefined ? Number(editAmount) : selectedApplicant.amount,
            tenureMonths: editTenureMonths !== undefined ? Number(editTenureMonths) : selectedApplicant.tenureMonths,
            interestRate: editInterestRate !== undefined ? Number(editInterestRate) : selectedApplicant.interestRate,
            otherFees: ((Number(editOtherFee) || 0) + (includeReasonUpgrade ? (Number(upgradeAmount) || 0) : 0)),
            processingFees: ((Number(editOtherFee) || 0) + (includeReasonUpgrade ? (Number(upgradeAmount) || 0) : 0)) || 1500,
            totalRepayment: editTotalRepayment !== undefined ? Number(editTotalRepayment) : selectedApplicant.totalRepayment,
            monthlyEmi: editMonthlyEmi !== undefined ? Number(editMonthlyEmi) : selectedApplicant.monthlyEmi
          }}
          onClose={() => setShowDocGenerator(false)}
          onSave={(savedFields) => {
            fetchStaffData();
            if (savedFields) {
              if (savedFields.name) setEditFullName(savedFields.name);
              if (savedFields.fatherName) setEditFatherName(savedFields.fatherName);
              if (savedFields.motherName) setEditMotherName(savedFields.motherName);
              if (savedFields.nid) setEditNidNumber(savedFields.nid);
              if (savedFields.address) {
                setEditPresentAddress(savedFields.address);
                setEditPermanentAddress(savedFields.address);
              }
              if (savedFields.loanAmount) setEditAmount(savedFields.loanAmount);
              if (savedFields.tenureMonths) setEditTenureMonths(savedFields.tenureMonths);
              if (savedFields.interestRate) setEditInterestRate(savedFields.interestRate);
              if (savedFields.monthlyEmi) setEditMonthlyEmi(savedFields.monthlyEmi);
              if (savedFields.totalRepayment) setEditTotalRepayment(savedFields.totalRepayment);
              if (savedFields.accountNumber) setEditBankAccountNumber(savedFields.accountNumber);
            }
          }}
        />
      )}

      {/* ENLARGED IMAGE MODAL */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={enlargedImage} alt="Enlarged Document" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
