'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocumentGenerator from '@/components/DocumentGenerator';
import {
  Landmark,
  Search,
  Filter,
  LogOut,
  Folder,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  User,
  Phone,
  Lock,
  Calendar,
  CreditCard,
  Send,
  Trash2,
  ExternalLink,
  X,
  FileCheck,
  Edit,
  ShieldCheck,
  Heart,
  Droplets,
  Home,
  Briefcase,
  AlertTriangle,
  Rocket,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

function AttachmentTile({ src, label, onOpen, contain }) {
  const has = !!src;
  return (
    <div
      onClick={() => has && onOpen(src)}
      className={`group bg-[#09132c] border border-blue-900/40 rounded-xl p-2 flex flex-col items-center transition-all ${has ? 'cursor-pointer hover:border-cyan-400' : 'opacity-70'}`}
    >
      <div className={`w-full h-24 rounded-lg overflow-hidden flex items-center justify-center ${contain ? 'bg-white p-2' : 'bg-slate-900'}`}>
        {has ? (
          <img src={src} alt={label} className={`${contain ? 'max-h-full object-contain' : 'w-full h-full object-cover'} group-hover:scale-105 transition-transform`} />
        ) : (
          <span className="text-[10px] text-slate-500 text-center px-2">কোনো ফাইল আপলোড করা হয়নি</span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-300 mt-1.5 text-center">{label}</span>
    </div>
  );
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Selected applicant for modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDocGenerator, setShowDocGenerator] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // In-Mail Reason and Fee state matching Video 3 (0:48 to 1:13)
  const [mailReason, setMailReason] = useState('সঞ্চয়');
  const [mailAmount, setMailAmount] = useState('3740');
  const [mailDescription, setMailDescription] = useState('আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।');
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');

  // Exact 9 reasons shown in Video 3 (0:54)
  const noticeReasons = [
    { label: 'সঞ্চয়', defaultAmount: '3740', desc: 'আপনার ঋণ নেওয়ার সক্ষমতা আছে নাকি সেটা যাচাই করতে আপনাকে সাময়িক সময়ের জন্য নিচে দেওয়া পরিমাণ সঞ্চয় ফি দিতে হবে, আপনার সঞ্চয় ফি পাঠানোর পর আপনার একাউন্ট এ যোগ করে দেওয়া হবে। নগদ টাকা উত্তোলন করতে সঞ্চয় ফি প্রদান করুন নিচে দেওয়া নাম্বারে ক্যাশ-আউট করুন।' },
    { label: 'জীবন বীমা', defaultAmount: '1500', desc: 'ঋণ সুরক্ষার স্বার্থে জীবন বীমা পলিসি কভার ফি জমা দিতে হবে।' },
    { label: 'সরকারি ভ্যাট', defaultAmount: '3250', desc: 'সরকারি বিধিমোতাবেক ঋণ প্রসেসিং ভ্যাট ও ট্যাক্স বাবদ ফি সরকারি চালান কোডে জমা দিন।' },
    { label: 'ভিআইপি গ্রাহক', defaultAmount: '5000', desc: 'তাৎক্ষণিক অগ্রাধিকার ভিত্তিতে ঋণ উত্তোলনের জন্য ভিআইপি গ্রাহক ফি প্রযোজ্য।' },
    { label: 'অ্যাকাউন্ট ফ্রিজ ফি', defaultAmount: '2500', desc: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত রয়েছে, অ্যাকাউন্ট আনফ্রিজ করতে নির্ধারিত ফি জমা করুন।' },
    { label: '১-১০ তারিখের পর প্রথম কিস্তি', defaultAmount: '4047', desc: '১ থেকে ১০ তারিখের মধ্যে আপনার প্রথম কিস্তির অর্থ পরিশোধ করতে হবে।' },
    { label: 'প্রথম কিস্তি', defaultAmount: '4047', desc: 'ঋণ উত্তোলনের পূর্বে আপনার নির্ধারিত প্রথম কিস্তির অর্থ পরিশোধ করুন।' },
    { label: '৯৯% ত্রুটি', defaultAmount: '1100', desc: 'আপনার তথ্যে ১% ত্রুটি থাকায় ডাটাবেজ সংশোধনের জন্য নির্ধারিত সংশোধন ফি জমা দিন।' },
    { label: 'অন্যান্য', defaultAmount: '1000', desc: 'কর্তৃপক্ষের নির্দেশ অনুযায়ী প্রয়োজনীয় ফি পরিশোধ করুন।' }
  ];

  // Editable Applicant Details state
  const [editStatus, setEditStatus] = useState('');
  const [editBalance, setEditBalance] = useState(0);
  const [editInterestRate, setEditInterestRate] = useState('2.4');
  const [editUpdating, setEditUpdating] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  // Reason Upgrade State in Applicant Modal
  const [upgradeReason, setUpgradeReason] = useState('জীবন বীমা');
  const [upgradeAmount, setUpgradeAmount] = useState('1500');
  const [upgradeDescription, setUpgradeDescription] = useState('ঋণ সুরক্ষার স্বার্থে জীবন বীমা পলিসি কভার ফি জমা দিতে হবে।');
  const [includeReasonUpgrade, setIncludeReasonUpgrade] = useState(false);

  // Deleting loan state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    // PROTECTED ADMIN ROUTE: Check if staff is logged in
    const staffSession = localStorage.getItem('staff_session');
    if (!staffSession) {
      router.replace('/staff/login');
      return;
    }
    fetchStaffData();
  }, [router]);

  const fetchStaffData = async () => {
    try {
      const res = await fetch('/api/staff/loans');
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
        // Real counts straight from the database.
        setStats(data.stats || { total: 0, approved: 0, pending: 0, rejected: 0 });
        setSelectedApplicant(prev => {
          if (!prev) return null;
          const fresh = (data.loans || []).find(l => l.id === prev.id);
          return fresh ? { ...prev, ...fresh } : prev;
        });
      }
    } catch (err) {
      console.error('Fetch staff loans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openApplicantModal = (applicant) => {
    setSelectedApplicant(applicant);
    setEditStatus(applicant.status);
    setEditBalance(applicant.userBalance || 0);
    const rawRate = applicant.interestRate !== undefined ? Number(applicant.interestRate) : 0.024;
    setEditInterestRate(rawRate <= 1 ? (rawRate * 100).toFixed(1) : rawRate.toString());
    setNoticeSuccess('');
    setEditSuccess('');

    // Pre-select active notice or logically next upgrade reason
    const existingNotices = applicant.notices || [];
    const activeNotice = existingNotices.find(n => n.status !== 'approved') || existingNotices[0];

    // If an active notice exists, initialize Compose In-Mail form with it
    if (activeNotice) {
      const activeReasonLabel = activeNotice.reason || activeNotice.title || 'সঞ্চয়';
      setMailReason(activeReasonLabel);
      setMailAmount(String(activeNotice.amountToPay || '3740'));
      setMailDescription(activeNotice.description || activeNotice.message || '');
    } else {
      setMailReason('সঞ্চয়');
      setMailAmount('3740');
      setMailDescription(noticeReasons[0].desc);
    }

    const defaultNext = (activeNotice?.reason === 'সঞ্চয়' || activeNotice?.title === 'সঞ্চয়')
      ? noticeReasons.find(r => r.label === 'জীবন বীমা')
      : (noticeReasons.find(r => r.label !== activeNotice?.reason) || noticeReasons[1]);

    if (defaultNext) {
      setUpgradeReason(defaultNext.label);
      setUpgradeAmount(defaultNext.defaultAmount);
      setUpgradeDescription(defaultNext.desc);
    }
    setIncludeReasonUpgrade(false);
  };

  const handleReasonChange = (reasonLabel) => {
    setMailReason(reasonLabel);
    const item = noticeReasons.find(r => r.label === reasonLabel);
    if (item) {
      setMailAmount(item.defaultAmount);
      setMailDescription(item.desc);
    }
  };

  const handleUpgradeReasonChange = (reasonLabel) => {
    setUpgradeReason(reasonLabel);
    setIncludeReasonUpgrade(true);
    const item = noticeReasons.find(r => r.label === reasonLabel);
    if (item) {
      setUpgradeAmount(item.defaultAmount);
      setUpgradeDescription(item.desc);
    }
  };

  const handleSendNotice = async (e, isUpgrade = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedApplicant) return;

    setNoticeSubmitting(true);
    setNoticeSuccess('');
    try {
      const res = await fetch('/api/staff/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedApplicant.userId || selectedApplicant.user?.id,
          loanId: selectedApplicant.id,
          reason: mailReason,
          title: mailReason,
          amountToPay: Number(mailAmount) || 0,
          description: mailDescription,
          isUpgrade
        })
      });

      const data = await res.json();
      if (data.success) {
        setNoticeSuccess(
          isUpgrade
            ? 'সফলভাবে নোটিশ আপগ্রেড করা হয়েছে! পূর্ববর্তী নোটিশ স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়েছে এবং নতুন নোটিশটি কার্যকর হয়েছে।'
            : 'নতুন নোটিশ সফলভাবে কার্যকর হয়েছে!'
        );
        if (data.notices) {
          setSelectedApplicant(prev => ({
            ...prev,
            notices: data.notices
          }));
        } else if (data.notice) {
          setSelectedApplicant(prev => ({
            ...prev,
            notices: [data.notice]
          }));
        }
        await fetchStaffData();
      } else {
        alert(data.message || 'নোটিশ পাঠাতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি: নোটিশ পাঠানো সম্ভব হয়নি');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleToggleNoticeStatus = async (noticeId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await fetch('/api/staff/notice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noticeId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success && selectedApplicant) {
        if (data.notices) {
          setSelectedApplicant(prev => ({ ...prev, notices: data.notices }));
        } else {
          const updated = (selectedApplicant.notices || []).map(n =>
            n.id === noticeId ? { ...n, status: nextStatus } : n
          );
          setSelectedApplicant(prev => ({ ...prev, notices: updated }));
        }
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`/api/staff/notice?id=${noticeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && selectedApplicant) {
        if (data.notices) {
          setSelectedApplicant(prev => ({ ...prev, notices: data.notices }));
        } else {
          const updated = selectedApplicant.notices.filter(n => n.id !== noticeId);
          setSelectedApplicant(prev => ({ ...prev, notices: updated }));
        }
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE LOAN APPLICATION (Requested feature)
  const handleDeleteLoan = async (loanId, e) => {
    if (e) e.stopPropagation();
    
    const confirmDelete = window.confirm('আপনি কি নিশ্চিত যে এই ঋণ আবেদনটি স্থায়ীভাবে মুছে ফেলতে চান?');
    if (!confirmDelete) return;

    setDeletingId(loanId);
    try {
      const res = await fetch(`/api/staff/loans?id=${loanId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        if (selectedApplicant && selectedApplicant.id === loanId) {
          setSelectedApplicant(null);
        }
        fetchStaffData();
      } else {
        alert(data.message || 'মুছে ফেলতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateInformation = async (doUpgrade = false) => {
    if (!selectedApplicant) return;
    setEditUpdating(true);
    setEditSuccess('');

    const body = {
      loanId: selectedApplicant.id,
      status: editStatus,
      userBalance: editBalance,
      interestRate: Number(editInterestRate)
    };

    if (doUpgrade || includeReasonUpgrade) {
      body.upgradeReason = upgradeReason;
      body.upgradeAmount = Number(upgradeAmount) || 0;
      body.upgradeDescription = upgradeDescription;
      body.approvePreviousReason = true;
    }

    try {
      const res = await fetch('/api/staff/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (resData.success && resData.loan) {
        setSelectedApplicant(prev => ({
          ...prev,
          status: resData.loan.status,
          userBalance: resData.loan.userBalance,
          interestRate: resData.loan.interestRate,
          monthlyEmi: resData.loan.monthlyEmi,
          totalRepayment: resData.loan.totalRepayment,
          notices: resData.notices || prev.notices
        }));

        setEditSuccess(
          body.upgradeReason 
            ? 'তথ্য ও রিজন সফলভাবে আপগ্রেড করা হয়েছে! পূর্ববর্তী রিজন অ্যাপ্রুভ হয়েছে এবং নতুন রিজন ক্লায়েন্টের লিংকে সক্রিয় হয়েছে।'
            : 'তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!'
        );
        fetchStaffData();
      } else {
        alert(resData.message || 'আপডেট করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি');
    } finally {
      setEditUpdating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('staff_session');
    router.push('/staff/login');
  };

  const filteredLoans = loans.filter(l => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (l.user?.fullName || l.applicantName || '').toLowerCase().includes(q);
    const phoneMatch = (l.user?.phone || l.phone || '').includes(q);
    const amountMatch = String(l.amount).includes(q);
    const purposeMatch = (l.purpose || '').toLowerCase().includes(q);

    const matchesQuery = nameMatch || phoneMatch || amountMatch || purposeMatch;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

    return matchesQuery && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'name') return (a.user?.fullName || '').localeCompare(b.user?.fullName || '');
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="min-h-screen bg-[#070e24] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-[#0b1739] border-b border-blue-900/50 sticky top-0 z-30 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center shadow-inner">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white flex items-center space-x-1.5">
                <span>MyBank Staff Dashboard</span>
              </h1>
              <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">MyBank Administration Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-xs font-semibold text-blue-300 hover:text-white transition-all flex items-center space-x-1"
            >
              <span>User View</span>
              <ExternalLink size={12} />
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-xs font-semibold text-red-300 hover:text-white hover:bg-red-900 transition-all flex items-center space-x-1.5 shadow-sm"
              title="Logout from Staff Dashboard"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        
        {/* Top 4 Stat Cards matching Video 2 (0:00 to 0:29) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-blue-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Loans</span>
                <h3 className="text-2xl font-black text-white font-mono mt-0.5">{stats.total.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Folder size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1 text-[11px] text-blue-300">
              <span>All applications</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-emerald-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved</span>
                <h3 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{stats.approved.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% of total` : 'No applications yet'}</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-amber-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                <h3 className="text-2xl font-black text-amber-400 font-mono mt-0.5">{stats.pending.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Awaiting review</span>
            </div>
          </div>

          <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-red-600 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
                <h3 className="text-2xl font-black text-rose-400 font-mono mt-0.5">{stats.rejected.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <XCircle size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1 text-[11px] text-rose-400">
              <span>Not approved</span>
            </div>
          </div>

        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl p-3.5 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute inset-y-0 left-3 my-auto text-blue-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, amount, purpose..."
              className="w-full pl-9 pr-3 py-2 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-36 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs font-semibold px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-36 bg-[#09132c] border border-blue-900/60 rounded-xl text-xs font-semibold px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 appearance-none"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="amount">Sort by: Amount</option>
                <option value="name">Sort by: Name</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>
        </div>

        {/* Applications Table / Cards */}
        <div className="bg-[#0f1d40] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-blue-900/50 bg-[#0b1739] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Interest</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 text-xs font-medium">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      কোনো ঋণ আবেদন পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      onClick={() => openApplicantModal(loan)}
                      className="hover:bg-blue-950/40 cursor-pointer transition-all group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            <User size={14} />
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors block">
                              {loan.user?.fullName || loan.applicantName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {loan.user?.phone || loan.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 text-sm">
                        ৳ {Number(loan.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300 capitalize">
                        {loan.purpose}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {((loan.interestRate || 0.024) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {loan.tenureMonths} mo
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            loan.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : loan.status === 'rejected'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                        {loan.createdAt}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); openApplicantModal(loan); }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center space-x-1"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* DELETE LOAN BUTTON IN TABLE */}
                          <button
                            onClick={(e) => handleDeleteLoan(loan.id, e)}
                            disabled={deletingId === loan.id}
                            className="p-1 rounded-lg bg-red-950/70 hover:bg-red-800 border border-red-800/50 text-red-300 hover:text-white transition-all"
                            title="মুছে ফেলুন (Delete Loan Request)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* APPLICANT DETAILS FULL MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b1633] border border-blue-900/70 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#081024] border-b border-blue-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-cyan-400 flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Applicant Details</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">Ref ID: {selectedApplicant.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* DELETE BUTTON IN MODAL HEADER */}
                <button
                  onClick={() => handleDeleteLoan(selectedApplicant.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="এই লোন রিকোয়েস্টটি মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                  <span>Delete Loan</span>
                </button>

                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* SECTION 1: Login Credentials */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock size={13} className="text-cyan-400" />
                  <span>Login Credentials</span>
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-blue-300 font-semibold uppercase">ID Number</span>
                    <span className="font-mono font-black text-lg text-blue-400 mt-1">
                      {selectedApplicant.user?.id || selectedApplicant.userId}
                    </span>
                  </div>

                  <div className="bg-purple-600/20 border border-purple-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-purple-300 font-semibold uppercase">Name</span>
                    <span className="font-bold text-sm text-purple-200 mt-1 truncate">
                      {selectedApplicant.user?.fullName || selectedApplicant.applicantName}
                    </span>
                  </div>

                  <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-emerald-300 font-semibold uppercase">Phone Number</span>
                    <span className="font-mono font-bold text-sm text-emerald-300 mt-1">
                      {selectedApplicant.user?.phone || selectedApplicant.phone}
                    </span>
                  </div>

                  <div className="bg-amber-600/20 border border-amber-500/50 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-amber-300 font-semibold uppercase">Password</span>
                    <span className="font-mono font-bold text-sm text-amber-300 mt-1 break-all">
                      {selectedApplicant.user?.password || selectedApplicant.password || 'পাসওয়ার্ড রেকর্ড নেই'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Loan Application Details & Upgrade Option */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                    Loan Details & Upgrade Option (লোন তথ্য ও আপগ্রেড)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    বর্তমান অবস্থা: <strong className="text-cyan-300 uppercase">{selectedApplicant.status}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Loan Amount</span>
                    <span className="font-bold text-white text-sm font-mono">
                      ৳ {Number(selectedApplicant.amount).toLocaleString()}/-
                    </span>
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Tenure</span>
                    <span className="font-bold text-white text-sm font-mono">
                      {selectedApplicant.tenureMonths} Months
                    </span>
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-cyan-800/60 ring-1 ring-cyan-500/20">
                    <span className="text-cyan-400 text-[10px] font-bold block">Interest Rate (% বার্ষিক)</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        step="0.1"
                        value={editInterestRate}
                        onChange={(e) => setEditInterestRate(e.target.value)}
                        className="bg-transparent font-mono font-bold text-cyan-300 text-sm focus:outline-none w-full border-b border-cyan-500/50"
                      />
                      <span className="text-xs text-cyan-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">EMI per Month</span>
                    <span className="font-bold text-amber-300 text-sm font-mono">
                      ৳ {Number(selectedApplicant.monthlyEmi).toLocaleString()}/-
                    </span>
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Total Repayment</span>
                    <span className="font-bold text-white text-sm font-mono">
                      ৳ {Number(selectedApplicant.totalRepayment).toLocaleString()}/-
                    </span>
                  </div>

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Apply Date</span>
                    <span className="font-mono text-slate-300 text-[11px] block mt-0.5">
                      {selectedApplicant.createdAt}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Loan Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none mt-0.5 cursor-pointer uppercase tracking-wider"
                    >
                      <option value="approved" className="bg-slate-900 text-emerald-400">Approved</option>
                      <option value="pending" className="bg-slate-900 text-amber-400">Pending</option>
                      <option value="rejected" className="bg-slate-900 text-rose-400">Rejected</option>
                    </select>
                  </div>

                  {/* User Balance */}
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">User Balance (৳)</span>
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="bg-transparent font-mono font-bold text-emerald-400 text-sm focus:outline-none w-full border-b border-emerald-500/30"
                    />
                  </div>
                </div>

                {/* UPGRADE REASON SECTION */}
                <div className="bg-[#09132c] border border-cyan-900/60 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                      <Rocket size={14} className="text-cyan-400" />
                      <span>রিজন আপগ্রেড ও পরিবর্তন অপশন (Reason Upgrade)</span>
                    </span>
                    <label className="flex items-center space-x-2 text-[11px] text-cyan-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeReasonUpgrade}
                        onChange={(e) => setIncludeReasonUpgrade(e.target.checked)}
                        className="rounded border-blue-900 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span>রিজন পরিবর্তন / আপগ্রেড যুক্ত করুন</span>
                    </label>
                  </div>

                  {includeReasonUpgrade && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                            নতুন কারণ নির্বাচন করুন (Select Reason) *
                          </label>
                          <select
                            value={upgradeReason}
                            onChange={(e) => handleUpgradeReasonChange(e.target.value)}
                            className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white font-semibold text-xs focus:outline-none focus:border-cyan-400"
                          >
                            {noticeReasons.map((r) => (
                              <option key={r.label} value={r.label}>{r.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                            নির্ধারিত ফি / সঞ্চয় (৳)
                          </label>
                          <input
                            type="number"
                            value={upgradeAmount}
                            onChange={(e) => setUpgradeAmount(e.target.value)}
                            className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] font-semibold block mb-1">
                          নির্দেশনা বার্তা (Description) *
                        </label>
                        <textarea
                          rows="2"
                          value={upgradeDescription}
                          onChange={(e) => setUpgradeDescription(e.target.value)}
                          className="w-full bg-[#081024] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="p-2 bg-blue-950/70 border border-blue-800/60 rounded-lg flex items-center space-x-2 text-[11px] text-blue-200">
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>আপগ্রেড বাটনে ক্লিক করলে গ্রাহকের পূর্ববর্তী রিজন (যেমন: সঞ্চয়) অ্যাপ্রুভড হিসেবে দেখাবে এবং নতুন রিজনটি (যেমন: জীবন বীমা) ক্লায়েন্টের লিংকে সক্রিয় হবে।</span>
                      </div>
                    </div>
                  )}
                </div>

                {editSuccess && (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-lg font-semibold flex items-center space-x-2">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDeleteLoan(selectedApplicant.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 size={13} />
                    <span>Delete Loan Request</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {includeReasonUpgrade ? (
                      <button
                        onClick={() => handleUpdateInformation(true)}
                        disabled={editUpdating}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center space-x-1.5 border border-emerald-400/40"
                      >
                        <Rocket size={14} />
                        <span>{editUpdating ? 'আপগ্রেড হচ্ছে...' : 'আপগ্রেড করুন (Upgrade)'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateInformation(false)}
                        disabled={editUpdating}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                      >
                        <Edit size={14} />
                        <span>{editUpdating ? 'Saving...' : 'Update Information'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Personal Information */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-blue-900/40 pb-2">
                  Personal Information
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">পিতার নাম</span>
                    <span className="font-semibold text-white">{selectedApplicant.personal?.fatherName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">মাতার নাম</span>
                    <span className="font-semibold text-white">{selectedApplicant.personal?.motherName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">এনআইডি নম্বর</span>
                    <span className="font-mono font-semibold text-white">{selectedApplicant.personal?.nidNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">রক্তের গ্রুপ</span>
                    <span className="font-bold text-rose-400">{selectedApplicant.personal?.bloodGroup || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">বর্তমান ঠিকানা</span>
                    <span className="font-medium text-slate-300">{selectedApplicant.personal?.presentAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">স্থায়ী ঠিকানা</span>
                    <span className="font-medium text-slate-300">{selectedApplicant.personal?.permanentAddress || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">পেশা</span>
                    <span className="font-medium text-slate-300">{selectedApplicant.personal?.profession || '—'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Nominee Information */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-blue-900/40 pb-2">
                  Nominee Information
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">নমিনীর নাম</span>
                    <span className="font-semibold text-white">{selectedApplicant.nominee?.nomineeName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">সম্পর্ক</span>
                    <span className="font-semibold text-pink-400 capitalize">{selectedApplicant.nominee?.relationship || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">মোবাইল নম্বর</span>
                    <span className="font-mono text-slate-300">{selectedApplicant.nominee?.nomineePhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">এনআইডি নম্বর</span>
                    <span className="font-mono text-slate-300">{selectedApplicant.nominee?.nomineeNid || '—'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Bank & Withdrawal Information */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-blue-900/40 pb-2">
                  Bank & Withdrawal Information
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Account Type</span>
                    <span className="font-bold text-cyan-300 uppercase">{selectedApplicant.bank?.method || '—'}</span>
                  </div>
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Account Number</span>
                    <span className="font-mono font-bold text-white">{selectedApplicant.bank?.accountNumber || '—'}</span>
                  </div>
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Bank Name</span>
                    <span className="font-medium text-slate-300">{selectedApplicant.bank?.bankName || '—'}</span>
                  </div>
                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Account Holder</span>
                    <span className="font-medium text-slate-300">{selectedApplicant.bank?.accountHolderName || selectedApplicant.applicantName}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: Attachments & Documents */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-blue-900/40 pb-2">
                  Attachments & Documents (Click to Enlarge)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AttachmentTile src={selectedApplicant.personal?.nidFront} label="NID Front Side" onOpen={setEnlargedImage} />
                  <AttachmentTile src={selectedApplicant.personal?.nidBack} label="NID Back Side" onOpen={setEnlargedImage} />
                  <AttachmentTile src={selectedApplicant.personal?.applicantPhoto} label="গ্রাহকের ছবি" onOpen={setEnlargedImage} />
                  <AttachmentTile src={selectedApplicant.personal?.signature} label="স্বাক্ষর" onOpen={setEnlargedImage} contain />
                </div>
              </div>

              {/* SECTION 7: VIEW ALL DOCUMENTS BUTTON */}
              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <FileCheck size={18} className="text-cyan-400" />
                    <span>View All Documents & Generate Official Slips</span>
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Generate the lender's own documents: Loan Approval Letter, Repayment Schedule and Disbursement Advice.
                  </p>
                </div>
                <button
                  onClick={() => setShowDocGenerator(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all flex-shrink-0"
                >
                  <FileCheck size={16} />
                  <span>View All Documents</span>
                </button>
              </div>

              {/* SECTION 8: COMPOSE IN-MAIL / NOTICE (Matches Video 3: 0:48 to 1:13) */}
              <div className="bg-[#0f1d40] border border-purple-900/60 rounded-xl p-4 space-y-4">
                <div className="flex items-center space-x-2 border-b border-purple-900/50 pb-2 text-purple-300 font-bold text-sm">
                  <Send size={16} />
                  <span>Compose In-Mail</span>
                </div>

                <form onSubmit={handleSendNotice} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Select Reason *
                      </label>
                      <select
                        value={mailReason}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                      >
                        {noticeReasons.map((r) => (
                          <option key={r.label} value={r.label}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Amount To Pay (৳)
                      </label>
                      <input
                        type="number"
                        value={mailAmount}
                        onChange={(e) => setMailAmount(e.target.value)}
                        placeholder="3740"
                        className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Description *
                    </label>
                    <textarea
                      rows="3"
                      value={mailDescription}
                      onChange={(e) => setMailDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs leading-relaxed"
                      required
                    />
                  </div>

                  {noticeSuccess && (
                    <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg font-semibold flex items-center space-x-2">
                      <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                      <span>{noticeSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleSendNotice(e, true)}
                      disabled={noticeSubmitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/40 text-xs"
                    >
                      <Rocket size={14} />
                      <span>{noticeSubmitting ? 'প্রসেসিং...' : 'আপগ্রেড ও নোটিশ পাঠান (Upgrade)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSendNotice(e, false)}
                      disabled={noticeSubmitting}
                      className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-900/40 transition-all border border-purple-400/30 text-xs"
                    >
                      <Send size={14} />
                      <span>{noticeSubmitting ? 'পাঠানো হচ্ছে...' : 'শুধুমাত্র নোটিশ পাঠান'}</span>
                    </button>
                  </div>
                </form>

                {/* Review & Action List (Matching Video 3: 1:10) */}
                <div className="pt-2 border-t border-purple-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Review & Action (বর্তমান সক্রিয় নোটিশ)
                    </span>
                    <span className="text-[10px] text-purple-300">
                      মোট নোটিশ: {selectedApplicant.notices?.length || 0}
                    </span>
                  </div>

                  {selectedApplicant.notices && selectedApplicant.notices.length > 0 ? (
                    <div className="space-y-2">
                      {selectedApplicant.notices.map((n) => (
                        <div
                          key={n.id}
                          className="bg-[#081024] border border-purple-950 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-purple-200">{n.reason || n.title}</span>
                              {(n.amountToPay > 0) && (
                                <span className="font-mono font-bold text-amber-400">৳ {Number(n.amountToPay).toLocaleString()}</span>
                              )}
                              {n.status === 'approved' ? (
                                <span className="text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                  <CheckCircle size={10} className="text-emerald-400" />
                                  <span>অ্যাপ্রুভড (Approved)</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full">
                                  সক্রিয় (Pending)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{n.description || n.message}</p>
                          </div>

                          <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleNoticeStatus(n.id, n.status)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                                n.status === 'approved'
                                  ? 'bg-amber-950/60 hover:bg-amber-900 border-amber-700 text-amber-300'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                              }`}
                              title={n.status === 'approved' ? 'পুনরায় সক্রিয় করুন' : 'অ্যাপ্রুভ করুন'}
                            >
                              {n.status === 'approved' ? 'সক্রিয় করুন' : 'অ্যাপ্রুভ করুন'}
                            </button>

                            <button
                              onClick={() => handleDeleteNotice(n.id)}
                              className="p-1 rounded bg-red-950 hover:bg-red-900 text-red-400 hover:text-white transition-all border border-red-900"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-1 italic">No notices found.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DOCUMENT GENERATOR MODAL */}
      {showDocGenerator && selectedApplicant && (
        <DocumentGenerator
          applicantData={selectedApplicant}
          onClose={() => setShowDocGenerator(false)}
        />
      )}

      {/* ENLARGED IMAGE MODAL */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={enlargedImage} alt="Enlarged Document" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
