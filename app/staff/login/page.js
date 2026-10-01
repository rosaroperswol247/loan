'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, User, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে!');
        setLoading(false);
        return;
      }

      if (!['staff', 'admin'].includes(data.user.role)) {
        setError('অননুমোদিত প্রবেশ! এটি শুধুমাত্র ব্যাংক স্টাফদের জন্য সংরক্ষিত।');
        setLoading(false);
        return;
      }

      // Save staff session
      localStorage.setItem('staff_session', JSON.stringify({
        id: data.user.id,
        name: data.user.fullName,
        role: 'staff',
        loggedInAt: new Date().toISOString()
      }));

      router.push('/staff');
    } catch (err) {
      console.error(err);
      setError('সার্ভার ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060c1d] flex flex-col justify-center items-center px-4 py-8 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-[#0b1633] rounded-2xl shadow-2xl border border-blue-900/60 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center p-3 mb-3 shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            MyBank Staff Portal
          </h1>
          <p className="text-xs text-cyan-400 font-semibold mt-1 uppercase tracking-wider">
            Restricted Admin & Staff Login
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <Lock size={14} className="text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleStaffLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Staff Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="email"
                placeholder="Enter staff email"
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 bg-[#070e22] border border-blue-900/60 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                className="w-full pl-9 pr-10 py-2.5 bg-[#070e22] border border-blue-900/60 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 text-xs mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={15} />
                <span>Login to Staff Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Client Site */}
        <div className="mt-6 pt-4 border-t border-blue-900/50 text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-cyan-300 font-semibold transition-all"
          >
            <ArrowLeft size={14} />
            <span>Go to Customer Portal (গ্রাহক সাইট)</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
