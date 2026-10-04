'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  CreditCard,
  Building,
  AlertTriangle,
  Wallet,
  Bookmark,
  Phone,
  Rocket,
  Info,
  UploadCloud,
  CheckCircle,
  Copy,
  Check,
  X
} from 'lucide-react';

export default function WithdrawPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loan, setLoan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bank, setBank] = useState(null);
  const [notices, setNotices] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Slip upload state
  const [slipImage, setSlipImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Copy state for agent numbers
  const [copiedKey, setCopiedKey] = useState(null);

  // Dynamic Agent numbers loaded from server settings (with fallbacks)
  const [dynamicAgentNumbers, setDynamicAgentNumbers] = useState({
    bkash: '01318047404',
    nagad: '01706329691',
    rocket: '18577394046',
  });

  const agentNumbers = [
    { key: 'bkash', name: 'বিকাশ', number: dynamicAgentNumbers.bkash || '01318047404', icon: Phone, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { key: 'nagad', name: 'নগদ', number: dynamicAgentNumbers.nagad || '01706329691', icon: Phone, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { key: 'rocket', name: 'রকেট', number: dynamicAgentNumbers.rocket || '18577394046', icon: Rocket, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  useEffect(() => {
    // Fetch live agent numbers
    fetch('/api/settings/agent-numbers', { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.numbers) {
          setDynamicAgentNumbers(res.numbers);
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem('loan_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);

    Promise.all([
      fetch(`/api/loan?userId=${user.id}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/profile/personal?userId=${user.id}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/profile/bank?userId=${user.id}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/notices?userId=${user.id}`, { cache: 'no-store' }).then(r => r.json()),
    ])
      .then(([loanRes, profileRes, bankRes, noticesRes]) => {
        if (loanRes.success && loanRes.loan) {
          setLoan(loanRes.loan);
        }
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (bankRes.success && bankRes.data) {
          setBank(bankRes.data);
        }
        if (noticesRes.success) {
          setNotices(noticesRes.notices || []);
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [router]);

  const handleCopy = (key, number) => {
    navigator.clipboard.writeText(number);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('ছবি লোড করা যায়নি'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadError('');
        const compressed = await compressImage(file);
        setSlipImage(compressed);
      } catch (err) {
        console.error('Image compression error:', err);
        setUploadError('ছবি প্রসেস করা যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন');
      }
    }
  };

  const handleUploadSlip = async () => {
    if (!slipImage) {
      setUploadError('অনুগ্রহ করে লেনদেনের স্লিপ বা স্ক্রিনশট নির্বাচন করুন');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await fetch('/api/withdraw/slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slipImage,
          loanId: loan?.id || null,
          userId: currentUser?.id || loan?.userId || null,
          noticeId: activeNotice?.id || null,
          reason: activeNotice?.reason || activeNotice?.title || 'সঞ্চয়',
          amountToPay: activeNotice?.amountToPay || 3740,
          description: activeNotice?.description || ''
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setUploadSuccess(data.message || 'আপনার লেনদেনের স্লিপটি সফলভাবে জমা দেওয়া হয়েছে! কর্তৃপক্ষ যাচাই করে দ্রুত টাকা ছাড় করবে।');
        setSlipImage('');
        if (currentUser?.id) {
          fetch(`/api/notices?userId=${currentUser.id}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(resData => {
              if (resData.success && resData.notices) {
                setNotices(resData.notices);
              }
            })
            .catch(() => {});
        }
      } else {
        setUploadError(data?.message || 'স্লিপ আপলোড ব্যর্থ হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন');
      }
    } catch (err) {
      console.error(err);
      setUploadError('সার্ভার ত্রুটি, অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন');
    } finally {
      setUploading(false);
    }
  };

  const formatBanglaNumber = (num) => {
    return Number(num || 0).toLocaleString('bn-BD');
  };

  // Separate approved notices and active pending notice
  const approvedNotices = (notices || []).filter(n => n.status === 'approved');
  const pendingNotices = (notices || []).filter(n => n.status !== 'approved');

  // Active notice is the newest pending notice; if none pending but notices exist, take notices[0]
  const activeNotice = pendingNotices.length > 0
    ? pendingNotices[0]
    : (notices && notices.length > 0 ? notices[0] : {
        title: 'সঞ্চয়',
        reason: 'সঞ্চয়',
        amountToPay: 3740,
        description: 'আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।'
      });

  const hasPendingNotice = pendingNotices.length > 0 || notices.length === 0;
  const displayAmount = activeNotice.amountToPay || 3740;

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12 font-sans">
      
      {/* Top Header matching Video 4 (0:01) */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-extrabold text-lg tracking-tight">উইথড্র</h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto px-4 py-4 space-y-4">

        {/* If loan is NOT approved, block withdrawal completely! */}
        {(!loan || loan.status !== 'approved') ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center space-y-4 my-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-black text-base text-slate-900">
                {loan?.status === 'rejected' ? 'ঋণ আবেদন বাতিল করা হয়েছে' : 'ঋণ এখনও অনুমোদিত হয়নি (Pending)'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                {loan?.status === 'rejected'
                  ? 'আপনার ঋণ আবেদনটি ব্যাংক কর্তৃপক্ষ কর্তৃক বাতিল করা হয়েছে। বিস্তারিত তথ্যের জন্য গ্রাহক সেবায় যোগাযোগ করুন।'
                  : 'ব্যাংক কর্তৃপক্ষ এখনও আপনার ঋণ অনুমোদন করেনি। আপনার আবেদন বর্তমানে পর্যালোচনায় (Pending) রয়েছে। এডমিন কর্তৃক ঋণ অনুমোদনের পরেই কেবল টাকা উত্তোলনের সুবিধা সক্রিয় হবে।'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>ড্যাশবোর্ডে ফিরে যান</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* CARD 1: ব্যবহারকারীর তথ্য (User Information Card matching Video 4 0:14) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User size={15} />
            </div>
            <span>ব্যবহারকারীর তথ্য</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">নাম:</span>
              <span className="font-bold text-slate-800">
                {profile?.applicantName || currentUser?.fullName || loan?.applicantName || 'আতিয়ার রহমান'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">পেমেন্ট টাইপ:</span>
              <span className="font-bold text-blue-600 uppercase">
                {bank?.method || 'bkash'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">নাম:</span>
              <span className="font-medium text-slate-700">
                {bank?.bankName || 'Non-Bank Account'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">লোন ব্যালেন্স:</span>
              <span className="font-bold text-emerald-600 font-mono text-sm">
                ৳ {formatBanglaNumber(loan?.amount || 100000)}.০০
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2A: APPROVED NOTICES / REASONS CARD (Shows when reasons like সঞ্চয় were approved by admin) */}
        {approvedNotices.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm border-b border-emerald-200/80 pb-2">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>অনুমোদিত ধাপসমূহ (Approved Steps)</span>
            </div>
            <div className="space-y-2">
              {approvedNotices.map((an) => (
                <div
                  key={an.id}
                  className="bg-white border border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />
                      <span className="font-extrabold text-xs text-slate-800">
                        {an.reason || an.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block pl-5">
                      যাচাইকরণ সম্পন্ন ও ফি অনুমোদিত হয়েছে
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-0.5">
                      APPROVED
                    </span>
                    {an.amountToPay > 0 && (
                      <span className="font-mono font-bold text-xs text-slate-700 block">
                        ৳ {formatBanglaNumber(an.amountToPay)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CARD 2B: Active Emergency Notice Box (Active upgraded reason like জীবন বীমা / সঞ্চয় matching Video 4 0:16) */}
        {hasPendingNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <AlertTriangle size={18} className="text-amber-600" />
                <span>{activeNotice.reason || activeNotice.title || 'সঞ্চয়'}</span>
              </div>
              <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                পরিশোধযোগ্য
              </span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed text-justify">
              {activeNotice.description || activeNotice.message || 'আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।'}
            </p>

            {/* Large Green Payment Badge matching Video 4 0:19 */}
            <div className="pt-1">
              <div className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 px-4 shadow-md flex items-center justify-center space-x-2 font-mono font-black text-lg transition-all">
                <Wallet size={20} />
                <span>৳ {formatBanglaNumber(displayAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 3: আমাদের কর্পোরেট এজেন্ট নাম্বার (Matching Video 4 0:21 to 0:38) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
            <Bookmark size={16} className="text-blue-600" />
            <span>আমাদের কর্পোরেট এজেন্ট নাম্বার</span>
          </div>

          <div className="space-y-2.5">
            {agentNumbers.map((agent) => {
              const Icon = agent.icon;
              const isCopied = copiedKey === agent.key;
              return (
                <div
                  key={agent.key}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-blue-50/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${agent.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{agent.name}</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">{agent.number}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(agent.key, agent.number)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center space-x-1 shadow-sm transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>কপি</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 4: নির্দেশনা (Instructions matching Video 4 0:39) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
            <Info size={16} className="text-blue-600" />
            <span>নির্দেশনা</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-slate-600 pt-1">
            <CheckCircle size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p>টাকা পাঠানোর পর লেনদেনের নিশ্চিতকরণের স্লিপটি দিন।</p>
          </div>
        </div>

        {/* CARD 5: স্লিপটি আপলোড করুন (Upload Slip matching Video 4 0:41 to 0:47) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
            <UploadCloud size={17} className="text-blue-600" />
            <span>স্লিপটি আপলোড করুন</span>
          </div>

          {uploadError && (
            <div className="p-2.5 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold space-y-1">
              <div className="flex items-center space-x-1.5">
                <CheckCircle size={16} className="text-emerald-600" />
                <span>স্লিপ জমা সফল হয়েছে!</span>
              </div>
              <p className="text-[11px] text-emerald-700">{uploadSuccess}</p>
            </div>
          )}

          {activeNotice?.slipImage && !slipImage && (
            <div className="border border-emerald-300/80 bg-emerald-50/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-14 h-14 rounded-lg border border-emerald-400 bg-white overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={activeNotice.slipImage} alt="Submitted Slip" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-emerald-800 font-bold text-xs">
                    <CheckCircle size={13} className="text-emerald-600" />
                    <span>পূর্বে স্লিপ জমা দেওয়া হয়েছে</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">কর্তৃপক্ষ যাচাই করে দ্রুত আপডেট করবে</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/90 border border-emerald-300 px-2 py-1 rounded-md flex-shrink-0">
                গৃহীত হয়েছে
              </span>
            </div>
          )}

          {slipImage ? (
            <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0">
                  <img src={slipImage} alt="Payment Slip" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">লেনদেনের স্লিপ নির্বাচিত</p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                    <CheckCircle size={12} />
                    <span>আপলোডের জন্য প্রস্তুত</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlipImage('')}
                className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center transition-all bg-blue-50/30 hover:bg-blue-50/60">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-sm">
                <UploadCloud size={24} />
              </div>
              <span className="text-xs font-bold text-blue-700 text-center">
                স্লিপটি আপলোড করতে এখানে ক্লিক করুন
              </span>
              <span className="text-[11px] text-slate-400 text-center mt-0.5">
                (PNG, JPG ফাইল সাপোর্টেড)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <button
            type="button"
            onClick={handleUploadSlip}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/25 disabled:opacity-70 text-xs"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>আপলোড করুন</span>
              </>
            )}
          </button>
        </div>
        </>
      )}
      </main>
    </div>
  );
}
