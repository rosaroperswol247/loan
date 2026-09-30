'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientHeader from '@/components/ClientHeader';
import ImageUploader from '@/components/ImageUploader';
import { Users, User, Heart, Phone, CreditCard, FileText, Send } from 'lucide-react';

export default function NomineeInfoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nomineeName: '',
    relationship: '',
    nomineePhone: '',
    nomineeNid: '',
    nomineePhoto: '',
    nomineeNidFront: '',
    nomineeNidBack: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('loan_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);

    fetch(`/api/profile/nominee?userId=${user.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFormData(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nomineeName || !formData.relationship || !formData.nomineePhone) {
      setError('অনুগ্রহ করে সবগুলো প্রয়োজনীয় ঘর পূরণ করুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/nominee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }

      // Next step -> Bank Info
      router.push('/bank');
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12">
      <ClientHeader />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex-1">
        {/* Step Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-800 leading-tight">নমিনীর তথ্য</h2>
            <p className="text-xs text-slate-500">আপনার মনোনীত ব্যক্তির তথ্য দিন</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Nominee Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <User size={16} className="text-blue-600" />
              <span>ব্যক্তিগত তথ্য</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                নমিনীর নাম *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="nomineeName"
                  value={formData.nomineeName}
                  onChange={handleChange}
                  placeholder="নমিনীর পূর্ণ নাম"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সম্পর্ক *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Heart size={15} className="text-pink-500" />
                </span>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                  required
                >
                  <option value="">সম্পর্ক নির্বাচন করুন</option>
                  <option value="spouse">স্ত্রী / স্বামী</option>
                  <option value="father">পিতা</option>
                  <option value="mother">মাতা</option>
                  <option value="brother">ভাই</option>
                  <option value="sister">বোন</option>
                  <option value="child">সন্তান</option>
                  <option value="other">অন্যান্য</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                নমিনীর মোবাইল নম্বর *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  name="nomineePhone"
                  value={formData.nomineePhone}
                  onChange={handleChange}
                  placeholder="০১XXXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                নমিনীর এনআইডি নম্বর
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <CreditCard size={15} />
                </span>
                <input
                  type="text"
                  name="nomineeNid"
                  value={formData.nomineeNid}
                  onChange={handleChange}
                  placeholder="১০ বা ১৭ ডিজিট"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nominee Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <FileText size={16} className="text-blue-600" />
              <span>অ্যাটাচমেন্ট বা কাগজপত্রসমূহ</span>
            </div>

            <ImageUploader
              label="নমিনীর ছবি"
              value={formData.nomineePhoto}
              onChange={(val) => setFormData(prev => ({ ...prev, nomineePhoto: val }))}
            />

            <ImageUploader
              label="নমিনীর এনআইডি কার্ডের সামনের দিক"
              value={formData.nomineeNidFront}
              onChange={(val) => setFormData(prev => ({ ...prev, nomineeNidFront: val }))}
            />

            <ImageUploader
              label="নমিনীর এনআইডি কার্ডের পিছনের দিক"
              value={formData.nomineeNidBack}
              onChange={(val) => setFormData(prev => ({ ...prev, nomineeNidBack: val }))}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={16} />
                <span>তথ্য জমা দিন</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
