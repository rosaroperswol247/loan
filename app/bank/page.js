'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientHeader from '@/components/ClientHeader';
import { Landmark, Bookmark, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';

export default function BankInfoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [method, setMethod] = useState('bkash');
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

    fetch(`/api/profile/bank?userId=${user.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setSavedData(res.data);
          setMethod(res.data.method || 'bkash');
          setAccountNumber(res.data.accountNumber || '');
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!accountNumber) {
      setError('অনুগ্রহ করে একাউন্ট নম্বর লিখুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          method,
          accountNumber: accountNumber.trim(),
          bankName: method === 'bank' ? 'ব্যাংক একাউন্ট' : method.toUpperCase(),
          accountHolderName: currentUser.fullName
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
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ</option>
                    <option value="bank">ব্যাংক</option>
                    <option value="rocket">রকেট</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  আপনার একাউন্ট নম্বর লিখুন *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="০১XXXXXXXXX বা ব্যাংক একাউন্ট নম্বর"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">মাধ্যম:</span>
                  <span className="font-bold text-blue-700 capitalize">{getMethodName(savedData.method)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">একাউন্ট নম্বর:</span>
                  <span className="font-mono font-bold text-slate-800">{savedData.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">হোল্ডার নেম:</span>
                  <span className="font-semibold text-slate-700">{savedData.accountHolderName || currentUser?.fullName}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                আপনার কোনো সংরক্ষিত ব্যাংক তথ্য নেই।
              </p>
            )}
          </div>

          {/* Action button to proceed directly to dashboard */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20 text-sm mt-3"
          >
            <span>ঋণ ড্যাশবোর্ডে যান</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
