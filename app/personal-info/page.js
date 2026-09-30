'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientHeader from '@/components/ClientHeader';
import SignaturePad from '@/components/SignaturePad';
import ImageUploader from '@/components/ImageUploader';
import { FileText, User, CreditCard, Droplet, Home, MapPin, Briefcase, Send, PenTool } from 'lucide-react';

export default function PersonalInfoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    applicantName: '',
    fatherName: '',
    motherName: '',
    nidNumber: '',
    bloodGroup: '',
    presentAddress: '',
    permanentAddress: '',
    profession: '',
    nidFront: '',
    nidBack: '',
    applicantPhoto: '',
    signature: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('loan_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);

    // Fetch existing info if any
    fetch(`/api/profile/personal?userId=${user.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFormData(res.data);
        } else {
          setFormData(prev => ({ ...prev, applicantName: user.fullName || '' }));
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

    if (!formData.applicantName || !formData.fatherName || !formData.motherName || !formData.nidNumber) {
      setError('অনুগ্রহ করে সবগুলো প্রয়োজনীয় ঘর পূরণ করুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/personal', {
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

      // Next step -> Nominee Info
      router.push('/nominee-info');
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
            <FileText size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-800 leading-tight">ঋণ আবেদন ফর্ম</h2>
            <p className="text-xs text-slate-500">আপনার প্রয়োজনীয় তথ্যের জন্য আবেদন করুন</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <User size={16} className="text-blue-600" />
              <span>ব্যক্তিগত তথ্য</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                আপনার নাম *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                পিতার নাম *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="পিতার নাম লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                মাতার নাম *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="মাতার নাম লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                এনআইডি নম্বর *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <CreditCard size={15} />
                </span>
                <input
                  type="text"
                  name="nidNumber"
                  value={formData.nidNumber}
                  onChange={handleChange}
                  placeholder="১০ অথবা ১৭ ডিজিটের এনআইডি"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                রক্তের গ্রুপ *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Droplet size={15} className="text-red-500" />
                </span>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="জানা নেই">জানা নেই</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                বর্তমান ঠিকানা *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Home size={15} />
                </span>
                <input
                  type="text"
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleChange}
                  placeholder="বর্তমান ঠিকানা লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                স্থায়ী ঠিকানা *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin size={15} />
                </span>
                <input
                  type="text"
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  placeholder="স্থায়ী ঠিকানা লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                আপনার পেশা *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Briefcase size={15} />
                </span>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder="আপনার পেশা লিখুন"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <FileText size={16} className="text-blue-600" />
              <span>অ্যাটাচমেন্ট বা কাগজপত্রসমূহ</span>
            </div>

            <ImageUploader
              label="এনআইডি কার্ডের সামনের দিক"
              value={formData.nidFront}
              onChange={(val) => setFormData(prev => ({ ...prev, nidFront: val }))}
            />

            <ImageUploader
              label="এনআইডি কার্ডের পিছনের দিক"
              value={formData.nidBack}
              onChange={(val) => setFormData(prev => ({ ...prev, nidBack: val }))}
            />

            <ImageUploader
              label="আপনার ছবি দিন"
              value={formData.applicantPhoto}
              onChange={(val) => setFormData(prev => ({ ...prev, applicantPhoto: val }))}
            />
          </div>

          {/* Section 3: Signature */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-sm">
              <PenTool size={16} className="text-blue-600" />
              <span>স্বাক্ষর</span>
            </div>

            <p className="text-xs text-slate-600 font-semibold">নিচের বক্সে স্বাক্ষর দিন *</p>
            <SignaturePad
              initialSignature={formData.signature}
              onSave={(dataUrl) => setFormData(prev => ({ ...prev, signature: dataUrl }))}
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
                <span>আবেদন জমা দিন</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
