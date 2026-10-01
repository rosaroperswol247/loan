'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientHeader from '@/components/ClientHeader';
import {
  ShieldCheck,
  Zap,
  Calculator,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  Bell,
  ChevronRight,
  UserCheck,
  ArrowDownToLine,
  Landmark,
  User,
  Phone,
  Eye,
  PlusCircle,
  X,
  BadgeAlert,
  Wallet
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loan, setLoan] = useState(null);
  const [notices, setNotices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [nominee, setNominee] = useState(null);
  const [bank, setBank] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Toggle between Dashboard view and New Loan Application form
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Form states
  const [purpose, setPurpose] = useState('Personal Loan (ব্যক্তিগত ঋণ)');
  const [amount, setAmount] = useState(50000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [message, setMessage] = useState('');

  // Loan amount options (50,000 to 20,00,000 BDT)
  const amountOptions = [
    50000, 100000, 150000, 200000, 300000, 400000, 500000, 600000,
    700000, 800000, 900000, 1000000, 1100000, 1200000, 1300000,
    1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000
  ];

  // Tenure options (12 to 60 months)
  const tenureOptions = [12, 24, 36, 48, 60];

  // Dynamic EMI Calculation
  const totalRepayment = Math.round(amount + (amount * (tenureMonths / 12) * 0.024));
  const monthlyEmi = (totalRepayment / tenureMonths).toFixed(2);

  const requiredInfo = [
    {
      href: '/personal-info',
      title: 'ব্যক্তিগত তথ্য',
      complete: Boolean(profile?.applicantName?.trim()
        && profile?.fatherName?.trim()
        && profile?.motherName?.trim()
        && profile?.nidNumber?.trim()),
    },
    {
      href: '/nominee-info',
      title: 'নমিনীর তথ্য',
      complete: Boolean(nominee?.nomineeName?.trim()
        && nominee?.relationship?.trim()
        && nominee?.nomineePhone?.trim()),
    },
    {
      href: '/bank',
      title: 'ব্যাংক বা মোবাইল ওয়ালেট',
      complete: Boolean(bank?.method?.trim() && bank?.accountNumber?.trim()),
    },
  ];
  const applicationReady = requiredInfo.every(section => section.complete);

  // Banner slides
  const slides = [
    {
      title: "সহজ কিস্তি পরিশোধ",
      subtitle: "মাই ব্যাংক স্বল্প সুদে দীর্ঘ মেয়াদে ঋণ সুবিধা",
      bgGradient: "from-blue-700 via-indigo-800 to-slate-900"
    },
    {
      title: "তাৎক্ষণিক ঋণ ছাড়",
      subtitle: "অনলাইনে যাচাই সম্পন্ন হলে ব্যাংক অথবা মোবাইল ব্যাংকিংয়ে টাকা",
      bgGradient: "from-emerald-700 via-teal-800 to-slate-900"
    },
    {
      title: "১০০% নিরাপদ ও সুরক্ষিত",
      subtitle: "মাই ব্যাংক অনুমোদিত ডিজিটাল মাইক্রো-ক্রেডিট পোর্টাল",
      bgGradient: "from-sky-700 via-blue-800 to-indigo-950"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const saved = localStorage.getItem('loan_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);

    // Fetch application status and each required information step.
    Promise.all([
      fetch(`/api/loan?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/notices?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/profile/personal?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/profile/nominee?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/profile/bank?userId=${user.id}`).then(r => r.json())
    ])
      .then(([loanRes, noticesRes, profileRes, nomineeRes, bankRes]) => {
        if (loanRes.success && loanRes.loan) {
          setLoan(loanRes.loan);
          setAmount(loanRes.loan.amount);
          setTenureMonths(loanRes.loan.tenureMonths);
          // If loan exists, keep user in the User Dashboard view!
          setShowApplyForm(false);
        } else {
          // If no loan yet, show the application form so they can apply!
          setShowApplyForm(true);
        }

        if (noticesRes.success) {
          setNotices(noticesRes.notices || []);
        }
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (nomineeRes.success && nomineeRes.data) {
          setNominee(nomineeRes.data);
        }
        if (bankRes.success && bankRes.data) {
          setBank(bankRes.data);
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [router]);

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          purpose,
          amount: Number(amount),
          tenureMonths: Number(tenureMonths)
        })
      });

      const data = await res.json();
      if (data.success) {
        setLoan(data.loan);
        setMessage('ঋণের আবেদন সফলভাবে জমা হয়েছে!');
        // THE INTERFACE TRANSFORMS INTO THE USER DASHBOARD!
        setShowApplyForm(false);
      } else {
        setMessage(data.message || 'আবেদন জমা দিতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setMessage('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = () => {
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
    }, 2500);
  };

  const formatBanglaNumber = (num) => {
    return Number(num).toLocaleString('bn-BD');
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12 font-sans">
      <ClientHeader />

      <main className="max-w-md w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Banner Carousel */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-36 bg-slate-900 transition-all">
          {slides.map((s, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 p-5 flex flex-col justify-end text-white bg-gradient-to-r ${s.bgGradient} transition-opacity duration-700 ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 bg-white/10 px-2 py-0.5 rounded-full w-max mb-1">
                MyBank Services
              </span>
              <h3 className="font-bold text-lg leading-tight drop-shadow-sm">{s.title}</h3>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-1">{s.subtitle}</p>
            </div>
          ))}

          <div className="absolute bottom-2.5 right-4 flex space-x-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? 'w-5 bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: ACTIVE USER DASHBOARD (When Loan Application is Submitted) */}
        {/* ------------------------------------------------------------- */}
        {loan && !showApplyForm && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Top User Greeting & Status Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200 block">আপনার ঋণ একাউন্ট</span>
                <h3 className="text-base font-bold truncate">
                  {currentUser?.fullName || loan.applicantName}
                </h3>
                <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded-full inline-block mt-1">
                  ID: {loan.id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-200 block">আবেদনের তারিখ</span>
                <span className="text-xs font-mono font-semibold">{loan.createdAt?.slice(0, 10)}</span>
              </div>
            </div>

            {/* Top 3 Balance / Stat Cards (Matching Video 1: 0:16 to 0:28) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: Loan Amount */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 text-center flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">মোট ঋণ</span>
                <span className="text-sm sm:text-base font-black text-blue-700 font-mono mt-1">
                  ৳ {formatBanglaNumber(loan.amount)}
                </span>
                <span className="text-[9px] text-slate-400 mt-1">{loan.tenureMonths} মাস মেয়াদি</span>
              </div>

              {/* Card 2: User Balance */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 text-center flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">উত্তোলনযোগ্য</span>
                <span className="text-sm sm:text-base font-black text-emerald-600 font-mono mt-1">
                  ৳ {formatBanglaNumber(loan.userBalance || 0)}
                </span>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">বর্তমান জমা</span>
              </div>

              {/* Card 3: Monthly EMI */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 text-center flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">মাসিক কিস্তি</span>
                <span className="text-sm sm:text-base font-black text-amber-700 font-mono mt-1">
                  ৳ {formatBanglaNumber(loan.monthlyEmi)}
                </span>
                <span className="text-[9px] text-slate-400 mt-1">প্রতি মাসে</span>
              </div>
            </div>

            {/* Prominent Withdrawal Button matching Video 4 (0:11 to 0:13) */}
            <Link
              href="/withdraw"
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-blue-600/30 flex items-center justify-between transition-all border border-blue-400/40 group active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-sm sm:text-base leading-tight">
                    এখনই টাকা উত্তোলন করুন
                  </span>
                  <span className="block text-[11px] text-blue-200 font-medium mt-0.5">
                    আপনার ঋণ অনুমোদিত - তাৎক্ষণিক উত্তোলন করুন
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* In-Mail / Staff Notices (Matches Video 2 & Video 4) */}
            {notices && notices.length > 0 && (
              <div className="space-y-3">
                {notices.map((ntc) => (
                  <div
                    key={ntc.id}
                    className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-xl border border-purple-500/40 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center">
                          <Bell size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-sm text-purple-200 block">
                            জরুরি নোটিশ: {ntc.reason || ntc.title}
                          </span>
                          <span className="text-[10px] text-purple-300">MyBank কর্তৃপক্ষ প্রেরিত বার্তা</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        পরিশোধযোগ্য
                      </span>
                    </div>

                    {(ntc.amountToPay > 0) && (
                      <div className="bg-black/30 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-purple-200 block">নির্ধারিত ফি / সঞ্চয়ের পরিমাণ:</span>
                          <span className="text-xl font-black text-amber-300 font-mono tracking-tight">
                            ৳ {formatBanglaNumber(ntc.amountToPay)}
                          </span>
                        </div>
                        <Link
                          href="/withdraw"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1"
                        >
                          <Wallet size={13} />
                          <span>পরিশোধ ও উত্তোলন</span>
                        </Link>
                      </div>
                    )}

                    {(ntc.description || ntc.message) && (
                      <p className="text-xs text-purple-100 bg-white/5 p-2.5 rounded-lg leading-relaxed border border-white/5">
                        {ntc.description || ntc.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Loan Status & Action Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <FileText size={18} className="text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800">ঋণের বর্তমান অবস্থা</h4>
                </div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    loan.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : loan.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {loan.status === 'approved' ? 'অনুমোদিত (Approved)' : loan.status === 'rejected' ? 'বাতিল' : 'পর্যালোচনায় রয়েছে (Pending)'}
                </span>
              </div>

              {/* Status explanation */}
              {loan.status === 'approved' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>অভিনন্দন! আপনার ঋণ আবেদনটি অনুমোদিত হয়েছে।</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    আপনার সংরক্ষিত ব্যাংক বা মোবাইল ব্যাংকিং একাউন্টে অর্থ উত্তোলনের জন্য প্রস্তুত।
                  </p>
                </div>
              ) : loan.status === 'rejected' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle size={15} className="text-rose-600" />
                    <span>আপনার আবেদনটি এই মুহূর্তে গ্রহণযোগ্য হয়নি।</span>
                  </div>
                  <p className="text-[11px] text-rose-700">বিস্তারিত জানতে মাই ব্যাংক হেল্পলাইনে যোগাযোগ করুন।</p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Clock size={15} className="text-amber-600 animate-spin" />
                    <span>আপনার আবেদনটি ক্রেডিট কমিটি দ্বারা পর্যালোচনা করা হচ্ছে।</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    যাচাইকরণ শেষ হলে স্বয়ংক্রিয়ভাবে আপনার ড্যাশবোর্ডে স্ট্যাটাস আপডেট হবে।
                  </p>
                </div>
              )}

              {/* Withdrawal Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">উত্তোলন মাধ্যম:</span>
                  <span className="font-bold text-blue-700 uppercase">{bank?.method || 'bKash / Nagad'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">একাউন্ট নম্বর:</span>
                  <span className="font-mono font-bold text-slate-800">{bank?.accountNumber || currentUser?.phone}</span>
                </div>

                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={loan.status !== 'approved'}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all mt-2 shadow-sm ${
                    loan.status === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowDownToLine size={15} />
                  <span>
                    {loan.status === 'approved' ? 'টাকা উত্তোলন করুন (Withdraw Funds)' : 'অনুমোদনের পর উত্তোলন সম্ভব হবে'}
                  </span>
                </button>
              </div>

              {/* Details breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">মোট পরিশোধ</span>
                  <span className="font-bold text-slate-800">৳ {formatBanglaNumber(loan.totalRepayment)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">সুদের হার</span>
                  <span className="font-bold text-blue-600">{((loan.interestRate || 0.024) * 100).toFixed(1)}% বাৎসরিক</span>
                </div>
              </div>
            </div>

            {/* Profile Overview (Submitted Application Details) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-700 flex items-center space-x-1.5">
                  <UserCheck size={15} className="text-blue-600" />
                  <span>দাখিলকৃত তথ্যাবলী (Submitted Profile)</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  সংরক্ষিত
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">পিতার নাম:</span>
                  <span className="font-medium text-slate-800">{profile?.fatherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">মাতার নাম:</span>
                  <span className="font-medium text-slate-800">{profile?.motherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">এনআইডি নম্বর:</span>
                  <span className="font-mono font-medium text-slate-800">{profile?.nidNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">রক্তের গ্রুপ:</span>
                  <span className="font-bold text-rose-500">{profile?.bloodGroup || '—'}</span>
                </div>
              </div>
            </div>

            {/* Button to Re-apply or apply for another loan */}
            <div className="text-center pt-2">
              <button
                onClick={() => setShowApplyForm(true)}
                className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold py-2 px-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 transition-all shadow-sm"
              >
                <PlusCircle size={15} />
                <span>নতুন ঋণের আবেদন করুন / পরিবর্তন করুন</span>
              </button>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: LOAN APPLICATION FORM (When applying or requesting loan) */}
        {/* ------------------------------------------------------------- */}
        {(showApplyForm || !loan) && (
          <div className="space-y-4 animate-fade-in">
            {loan && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowApplyForm(false)}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1"
                >
                  <span>← ড্যাশবোর্ডে ফিরে যান</span>
                </button>
              </div>
            )}

            {!applicationReady ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800">আবেদন করার আগে তথ্য পূরণ করুন</h4>
                  <p className="text-xs text-slate-500 mt-1">ঋণের আবেদন জমা দিতে নিচের সব ধাপ সম্পন্ন করতে হবে।</p>
                </div>
                <div className="space-y-2">
                  {requiredInfo.map((section) => (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {section.complete ? (
                        <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                      ) : (
                        <FileText size={20} className="text-blue-600 flex-shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">{section.title}</span>
                        <span className={`block text-xs ${section.complete ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {section.complete ? 'সম্পন্ন' : 'তথ্য পূরণ করুন'}
                        </span>
                      </span>
                      <ChevronRight size={17} className="text-slate-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
            <div className="space-y-4">
            {/* Info Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">১০০% সুরক্ষিত</h4>
                  <p className="text-[11px] text-slate-500">মাই ব্যাংক নিরাপত্তা</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">তাৎক্ষণিক</h4>
                  <p className="text-[11px] text-slate-500">সহজ ঋণ অনুমোদন</p>
                </div>
              </div>
            </div>

            {/* Application Form Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
                <Calculator size={17} className="text-blue-600" />
                <span>ঋণের জন্য আবেদন করুন</span>
              </div>

              {message && (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-700 text-xs font-semibold">
                  {message}
                </div>
              )}

              <form onSubmit={handleApplyLoan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ঋণের উদ্দেশ্য নির্বাচন করুন
                  </label>
                  <div className="relative">
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                    >
                      <option value="Personal Loan (ব্যক্তিগত ঋণ)">Personal Loan (ব্যক্তিগত ঋণ)</option>
                      <option value="Business Loan (ব্যবসা ঋণ)">Business Loan (ব্যবসা ঋণ)</option>
                      <option value="Emergency Loan (জরুরি ঋণ)">Emergency Loan (জরুরি ঋণ)</option>
                      <option value="Home Loan (গৃহ ঋণ)">Home Loan (গৃহ ঋণ)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ঋণের পরিমাণ (টাকায়)
                  </label>
                  <div className="relative">
                    <select
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none font-mono"
                    >
                      {amountOptions.map((amt) => (
                        <option key={amt} value={amt}>
                          ৳ {formatBanglaNumber(amt)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    পরিশোধের মেয়াদ (মাস)
                  </label>
                  <div className="relative">
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                    >
                      {tenureOptions.map((m) => (
                        <option key={m} value={m}>
                          {m} মাস ({m / 12} বছর)
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Golden EMI preview card */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-slate-800 shadow-sm">
                  <div>
                    <span className="text-[11px] text-amber-800 font-semibold block">মাসিক কিস্তির পরিমাণ:</span>
                    <span className="text-xl font-black text-amber-900 font-mono tracking-tight">
                      ৳ {formatBanglaNumber(monthlyEmi)}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      মোট পরিশোধ: ৳ {formatBanglaNumber(totalRepayment)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold text-xs">
                    {tenureMonths}M
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/25 disabled:opacity-70 text-sm"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>আবেদন জমা দিন</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            </div>
            )}
          </div>
        )}

      </main>

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <ArrowDownToLine size={16} className="text-emerald-600" />
                <span>টাকা উত্তোলন প্রক্রিয়া</span>
              </h4>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} />
                </div>
                <h5 className="font-bold text-sm text-emerald-800">উত্তোলন অনুরোধ সফল হয়েছে!</h5>
                <p className="text-xs text-slate-500">
                  আপনার {bank?.method?.toUpperCase() || 'অ্যাকাউন্টে'} অর্থ প্রেরণের প্রক্রিয়া শুরু হয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  আপনার অনুমোদিত ঋণ <strong>৳ {formatBanglaNumber(loan?.amount)}</strong> আপনার নিবন্ধিত একাউন্টে জমা হবে:
                </p>
                <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                  <p><strong>মাধ্যম:</strong> {bank?.method?.toUpperCase() || 'নগদ / বিকাশ'}</p>
                  <p><strong>একাউন্ট নম্বর:</strong> {bank?.accountNumber || currentUser?.phone}</p>
                </div>
                <button
                  onClick={handleWithdraw}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                >
                  কনফার্ম করুন ও টাকা উত্তোলন পাঠান
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
