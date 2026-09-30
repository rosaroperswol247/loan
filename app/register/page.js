'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Lock, Eye, EyeOff, UserPlus, LogIn, ShieldCheck, Landmark } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !phone || !password) {
      setError('অনুগ্রহ করে সবগুলো ঘর পূরণ করুন');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি মেলেনি');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'নিবন্ধন ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }

      if (data.confirmationRequired) {
        setVerificationRequired(true);
        setLoading(false);
        return;
      }

      // Auto login user
      localStorage.setItem('loan_user', JSON.stringify(data.user));

      // Direct to personal info step
      router.push('/personal-info');
    } catch (err) {
      console.error(err);
      setError('নেটওয়ার্ক সমস্যা, অনুগ্রহ করে আবার চেষ্টা করুন');
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), token: verificationCode.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'যাচাইকরণ ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }

      localStorage.setItem('loan_user', JSON.stringify(data.user));
      router.push('/personal-info');
    } catch (err) {
      console.error(err);
      setError('নেটওয়ার্ক সমস্যা, অনুগ্রহ করে আবার চেষ্টা করুন');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-500/20 flex items-center justify-center p-2 mb-3 shadow-inner text-blue-700">
            <Landmark size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">মাই ব্যাংক (MyBank)</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {verificationRequired ? (
          <form onSubmit={handleVerifyPhone} className="space-y-4">
            <p className="text-sm text-slate-600">{phone} নম্বরে পাঠানো ৬ সংখ্যার কোড দিন।</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="৬ সংখ্যার কোড"
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-lg font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              required
            />
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'ফোন নম্বর যাচাই করুন'}
            </button>
          </form>
        ) : (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              পুরো নাম
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="আপনার পুরো নাম লিখুন"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ফোন নম্বর
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone size={16} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="আপনার ফোন নম্বর লিখুন"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              পাসওয়ার্ড নিশ্চিত করুন
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড আবার লিখুন"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 text-xs mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={16} />
                <span>নিবন্ধন করুন</span>
              </>
            )}
          </button>
        </form>
        )}

        {/* Security badge */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>আপনার তথ্য সুরক্ষিতভাবে প্রক্রিয়াজাত করা হয়</span>
        </div>

        {/* Back to Login link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 mb-2">ইতিমধ্যে একটি অ্যাকাউন্ট আছে?</p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold text-slate-700 bg-slate-50/50 hover:bg-blue-50/50 transition-all"
          >
            <LogIn size={14} />
            <span>সাইন ইন করুন</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
