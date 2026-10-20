'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientHeader from '@/components/ClientHeader';
import { Landmark, Bookmark, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck, User } from 'lucide-react';

const BANGLADESH_BANKS = [
  // সরকারি বাণিজ্যিক ও বিশেষায়িত ব্যাংক (State-Owned & Specialized)
  'সোনালী ব্যাংক পিএলসি (Sonali Bank PLC)',
  'জনতা ব্যাংক পিএলসি (Janata Bank PLC)',
  'অগ্রণী ব্যাংক পিএলসি (Agrani Bank PLC)',
  'রূপালী ব্যাংক পিএলসি (Rupali Bank PLC)',
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি (BDBL)',
  'বেসিক ব্যাংক লিমিটেড (BASIC Bank Limited)',
  'বাংলাদেশ কৃষি ব্যাংক (Bangladesh Krishi Bank)',
  'রাজশাহী কৃষি উন্নয়ন ব্যাংক (RAKUB)',
  'প্রবাসী কল্যাণ ব্যাংক (Probashi Kallyan Bank)',
  'কর্মসংস্থান ব্যাংক (Karmasangsthan Bank)',
  'আনসার-ভিডিপি উন্নয়ন ব্যাংক (Ansar-VDP Unnayan Bank)',

  // বেসরকারি বাণিজ্যিক ব্যাংকসমূহ (Private Commercial Banks)
  'ব্র্যাক ব্যাংক পিএলসি (BRAC Bank PLC)',
  'ডাচ-বাংলা ব্যাংক পিএলসি (Dutch-Bangla Bank PLC)',
  'সিটি ব্যাংক পিএলসি (City Bank PLC)',
  'ইস্টার্ন ব্যাংক পিএলসি (Eastern Bank PLC)',
  'ইউনাইটেড কমার্শিয়াল ব্যাংক পিএলসি (UCB)',
  'মিউচুয়াল ট্রাস্ট ব্যাংক পিএলসি (Mutual Trust Bank PLC)',
  'প্রাইম ব্যাংক পিএলসি (Prime Bank PLC)',
  'সাউথইস্ট ব্যাংক পিএলসি (Southeast Bank PLC)',
  'ঢাকা ব্যাংক পিএলসি (Dhaka Bank PLC)',
  'পূবালী ব্যাংক পিএলসি (Pubali Bank PLC)',
  'উত্তরা ব্যাংক পিএলসি (Uttara Bank PLC)',
  'ট্রাস্ট ব্যাংক লিমিটেড (Trust Bank Limited)',
  'যমুনা ব্যাংক পিএলসি (Jamuna Bank PLC)',
  'এনসিসি ব্যাংক পিএলসি (NCC Bank PLC)',
  'ন্যাশনাল ব্যাংক লিমিটেড (National Bank Limited)',
  'এবি ব্যাংক পিএলসি (AB Bank PLC)',
  'ব্যাংক এশিয়া পিএলসি (Bank Asia PLC)',
  'মার্কেন্টাইল ব্যাংক পিএলসি (Mercantile Bank PLC)',
  'ওয়ান ব্যাংক পিএলসি (ONE Bank PLC)',
  'প্রিমিয়ার ব্যাংক পিএলসি (Premier Bank PLC)',
  'আইএফআইসি ব্যাংক পিএলসি (IFIC Bank PLC)',
  'মিডল্যান্ড ব্যাংক লিমিটেড (Midland Bank Limited)',
  'মধুমতি ব্যাংক লিমিটেড (Modhumoti Bank Limited)',
  'এনআরবি ব্যাংক লিমিটেড (NRB Bank Limited)',
  'এনআরবিসি ব্যাংক পিএলসি (NRBC Bank PLC)',
  'মেঘনা ব্যাংক লিমিটেড (Meghna Bank Limited)',
  'সীমান্ত ব্যাংক লিমিটেড (Shimanto Bank Limited)',
  'পদ্মা ব্যাংক লিমিটেড (Padma Bank Limited)',
  'বেঙ্গল কমার্শিয়াল ব্যাংক লিমিটেড (Bengal Commercial Bank)',
  'সিটিজেন্স ব্যাংক পিএলসি (Citizens Bank PLC)',
  'কমিউনিটি ব্যাংক বাংলাদেশ পিএলসি (Community Bank)',
  'বাংলাদেশ কমার্স ব্যাংক লিমিটেড (BCBL)',

  // ইসলামী ব্যাংকসমূহ (Islamic Banks)
  'ইসলামী ব্যাংক বাংলাদেশ পিএলসি (Islami Bank Bangladesh)',
  'আল-আরাফাহ্ ইসলামী ব্যাংক পিএলসি (Al-Arafah Islami Bank)',
  'সোশ্যাল ইসলামী ব্যাংক পিএলসি (Social Islami Bank)',
  'শাহ্জালাল ইসলামী ব্যাংক পিএলসি (Shahjalal Islami Bank)',
  'এক্সিম ব্যাংক পিএলসি (EXIM Bank PLC)',
  'ফার্স্ট সিকিউরিটি ইসলামী ব্যাংক পিএলসি (FSIBL)',
  'গ্লোবাল ইসলামী ব্যাংক পিএলসি (Global Islami Bank)',
  'ইউনিয়ন ব্যাংক পিএলসি (Union Bank PLC)',
  'স্ট্যান্ডার্ড ব্যাংক পিএলসি (Standard Bank PLC)',
  'আইসিবি ইসলামিক ব্যাংক লিমিটেড (ICB Islamic Bank)',

  // অন্যান্য ব্যাংক
  'অন্যান্য ব্যাংক (Other Bank)'
];

export default function BankInfoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [method, setMethod] = useState('bank');
  const [bankName, setBankName] = useState('সোনালী ব্যাংক পিএলসি (Sonali Bank PLC)');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [savedData, setSavedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('loan_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);
    setAccountHolderName(user.fullName || '');

    fetch(`/api/profile/bank?userId=${user.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setSavedData(res.data);
          setMethod(res.data.method || 'bank');
          setAccountNumber(res.data.accountNumber || '');
          if (res.data.bankName) setBankName(res.data.bankName);
          if (res.data.accountHolderName) setAccountHolderName(res.data.accountHolderName);
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (method === 'bank' && !bankName) {
      setError('অনুগ্রহ করে ব্যাংকের নাম নির্বাচন করুন');
      return;
    }

    if (!accountHolderName.trim()) {
      setError('অনুগ্রহ করে একাউন্ট হোল্ডারের নাম লিখুন');
      return;
    }

    if (!accountNumber.trim()) {
      setError('অনুগ্রহ করে একাউন্ট নম্বর লিখুন');
      return;
    }

    const userId = currentUser?.id || (() => {
      try {
        return JSON.parse(localStorage.getItem('loan_user') || '{}')?.id;
      } catch {
        return null;
      }
    })();

    if (!userId) {
      setError('আপনার লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          userId: userId,
          method,
          accountNumber: accountNumber.trim(),
          bankName: method === 'bank' ? bankName : getMethodName(method),
          accountHolderName: accountHolderName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }

      setSavedData(data.data);
      setSuccess('ব্যাংক একাউন্ট তথ্য সফলভাবে সংরক্ষণ করা হয়েছে');
      setLoading(false);

      // Auto redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('সার্ভার সংযোগ ত্রুটি');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getMethodName = (m) => {
    switch (m) {
      case 'bkash': return 'বিকাশ (bKash)';
      case 'nagad': return 'নগদ (Nagad)';
      case 'bank': return 'ব্যাংক (Bank)';
      case 'rocket': return 'রকেট (Rocket)';
      default: return m;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12">
      <ClientHeader />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex-1">
        {/* Step Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-800 leading-tight">ব্যাংক একাউন্ট তথ্য</h2>
            <p className="text-xs text-slate-500">আপনার ঋণ পরিশোধ ও প্রাপ্তির জন্য একাউন্ট বিবরণী</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-700 text-xs font-medium flex items-center space-x-1.5">
            <CheckCircle size={15} />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1: Bank Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <Bookmark size={16} className="text-blue-600" />
              <span>আপনার ব্যাংক তথ্য</span>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Landmark size={15} />
                  </span>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                  >
                    <option value="bank">ব্যাংক</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ</option>
                    <option value="rocket">রকেট</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Bank Name Selector - All Government & Private Banks */}
              {method === 'bank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ব্যাংক নির্বাচন করুন *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Landmark size={15} />
                    </span>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                      required
                    >
                      {BANGLADESH_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
              )}

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  একাউন্ট হোল্ডারের নাম *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="হিসাবধারীর পূর্ণ নাম লিখুন"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {method === 'bank' ? 'ব্যাংক একাউন্ট নম্বর লিখুন *' : 'মোবাইল ব্যাংকিং নম্বর লিখুন *'}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={method === 'bank' ? 'ব্যাংক হিসাব নম্বর লিখুন' : '০১XXXXXXXXX'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm shadow-cyan-600/20 text-xs disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 2: Saved Bank Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <Bookmark size={16} className="text-blue-600" />
              <span>সংরক্ষিত একাউন্ট তথ্য</span>
            </div>

            {savedData ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">মাধ্যম:</span>
                  <span className="font-bold text-blue-700 capitalize">{getMethodName(savedData.method)}</span>
                </div>
                {savedData.method === 'bank' && savedData.bankName && (
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-500 font-medium">ব্যাংক:</span>
                    <span className="font-bold text-slate-800 text-right max-w-[200px]">{savedData.bankName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">হোল্ডার নেম:</span>
                  <span className="font-semibold text-slate-800">{savedData.accountHolderName || currentUser?.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">একাউন্ট নম্বর:</span>
                  <span className="font-mono font-bold text-slate-900">{savedData.accountNumber}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                আপনার কোনো সংরক্ষিত ব্যাংক তথ্য নেই।
              </p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <button
              type="button"
              onClick={() => router.push('/nominee-info')}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>নমিনী তথ্য (Back)</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-500/20 text-xs"
            >
              <span>ঋণ ড্যাশবোর্ড</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
