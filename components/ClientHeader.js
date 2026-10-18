'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Landmark, ArrowLeft, Home, User, Users, CreditCard } from 'lucide-react';

export default function ClientHeader({ showBack = true, backHref, title }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loan_user');
      localStorage.removeItem('staff_session');
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-md mx-auto px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isDashboard && showBack && (
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all mr-1 shadow-sm"
                title="আগের পেজে যান (Back)"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm text-blue-700 group-hover:scale-105 transition-transform">
                <Landmark size={18} />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight leading-tight flex items-center space-x-1">
                  <span>MyBank</span>
                  {title && <span className="font-normal text-xs text-blue-200">| {title}</span>}
                </h1>
                <p className="text-[10px] text-blue-100 font-medium leading-none">মাই ব্যাংক পোর্টাল</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-1.5">
            {!isDashboard && (
              <Link
                href="/dashboard"
                className="bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-all"
                title="ড্যাশবোর্ডে যান"
              >
                <Home size={13} />
                <span className="hidden sm:inline">হোম</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-all shadow-sm border border-red-400/30"
              title="লগআউট করুন"
            >
              <span>লগআউট</span>
              <LogOut size={12} />
            </button>
          </div>
        </div>

        {/* Quick Nav Bar for easy switching between application steps */}
        <nav className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/15 text-[11px] font-semibold">
          <Link
            href="/dashboard"
            className={`flex items-center space-x-1 py-1 px-2 rounded-md transition-colors ${
              pathname === '/dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Home size={12} />
            <span>হোম</span>
          </Link>

          <Link
            href="/personal-info"
            className={`flex items-center space-x-1 py-1 px-2 rounded-md transition-colors ${
              pathname === '/personal-info' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <User size={12} />
            <span>ব্যক্তিগত</span>
          </Link>

          <Link
            href="/nominee-info"
            className={`flex items-center space-x-1 py-1 px-2 rounded-md transition-colors ${
              pathname === '/nominee-info' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Users size={12} />
            <span>নমিনী</span>
          </Link>

          <Link
            href="/bank"
            className={`flex items-center space-x-1 py-1 px-2 rounded-md transition-colors ${
              pathname === '/bank' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <CreditCard size={12} />
            <span>ব্যাংক</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
