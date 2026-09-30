'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Landmark } from 'lucide-react';

export default function ClientHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loan_user');
    }
    router.push('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1 shadow-sm text-blue-700">
            <Landmark size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-tight">MyBank</h1>
            <p className="text-[11px] text-blue-100 font-medium leading-none">Bangladesh • মাই ব্যাংক</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all shadow-sm border border-blue-500/40"
        >
          <span>লগআউট</span>
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}
