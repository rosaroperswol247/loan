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
  AlertTriangle
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

  // Compose message state (informational messages to the applicant only)
  const [mailTitle, setMailTitle] = useState('আবেদন হালনাগাদ');
  const [mailDescription, setMailDescription] = useState('আপনার ঋণ আবেদনটি পর্যালোচনাধীন রয়েছে। যাচাই সম্পন্ন হলে স্ট্যাটাস আপডেট করা হবে।');
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');

  // Ready-made message templates (status / document / reminder — never fees)
  const messageTemplates = [
    { title: 'আবেদন হালনাগাদ', body: 'আপনার ঋণ আবেদনটি পর্যালোচনাধীন রয়েছে। যাচাই সম্পন্ন হলে স্ট্যাটাস আপডেট করা হবে।' },
    { title: 'আবেদন অনুমোদিত', body: 'অভিনন্দন! আপনার ঋণ আবেদনটি অনুমোদিত হয়েছে। নির্ধারিত একাউন্টে অর্থ ছাড়ের প্রক্রিয়া চলছে।' },
    { title: 'কাগজপত্র প্রয়োজন', body: 'অনুগ্রহ করে আপনার এনআইডি ও ছবি পরিষ্কারভাবে পুনরায় আপলোড করুন।' },
    { title: 'কিস্তি অনুস্মারক', body: 'আপনার পরবর্তী মাসিক কিস্তির নির্ধারিত তারিখ নিকটবর্তী। সময়মতো পরিশোধের জন্য অনুরোধ করা হলো।' }
  ];

  // Editable Applicant Details state
  const [editStatus, setEditStatus] = useState('');
  const [editBalance, setEditBalance] = useState(0);
  const [editUpdating, setEditUpdating] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

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
    setNoticeSuccess('');
    setEditSuccess('');
  };

  const applyTemplate = (title) => {
    const tpl = messageTemplates.find(t => t.title === title);
    setMailTitle(title);
    if (tpl) setMailDescription(tpl.body);
  };

    const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setNoticeSubmitting(true);
    try {
      const res = await fetch('/api/staff/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedApplicant.userId,
          loanId: selectedApplicant.id,
          title: mailTitle,
          message: mailDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        setNoticeSuccess('বার্তা সফলভাবে পাঠানো হয়েছে!');
        const updatedNotices = [data.notice, ...(selectedApplicant.notices || [])];
        const updatedApp = { ...selectedApplicant, notices: updatedNotices };
        setSelectedApplicant(updatedApp);
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`/api/staff/notice?id=${noticeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && selectedApplicant) {
        const updated = selectedApplicant.notices.filter(n => n.id !== noticeId);
        setSelectedApplicant({ ...selectedApplicant, notices: updated });
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

  const handleUpdateInformation = async () => {
    if (!selectedApplicant) return;
    setEditUpdating(true);
    setEditSuccess('');

    try {
      await fetch('/api/staff/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedApplicant.id,
          status: editStatus,
          userBalance: editBalance
        })
      });

      setEditSuccess('তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
      fetchStaffData();
    } catch (err) {
      console.error(err);
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

                </div>
              </div>

              {/* SECTION 2: Loan Application Details */}
              <div className="bg-[#0f1d40] border border-blue-900/60 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-blue-900/40 pb-2">
                  Loan Application Details
                </span>

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

                  <div className="bg-[#09132c] p-2.5 rounded-lg border border-blue-900/40">
                    <span className="text-slate-400 text-[10px] block">Interest Rate</span>
                    <span className="font-bold text-cyan-400 text-sm font-mono">
                      {((selectedApplicant.interestRate || 0.024) * 100).toFixed(1)}%
                    </span>
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

                {editSuccess && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg">
                    {editSuccess}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => handleDeleteLoan(selectedApplicant.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 size={13} />
                    <span>Delete Loan Request</span>
                  </button>

                  <button
                    onClick={handleUpdateInformation}
                    disabled={editUpdating}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Edit size={14} />
                    <span>{editUpdating ? 'Saving...' : 'Update Information'}</span>
                  </button>
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

              {/* SECTION 8: COMPOSE IN-MAIL / NOTICE */}
              <div className="bg-[#0f1d40] border border-purple-900/60 rounded-xl p-4 space-y-4">
                <div className="flex items-center space-x-2 border-b border-purple-900/50 pb-2 text-purple-300 font-bold text-sm">
                  <Send size={16} />
                  <span>Send Message to Applicant (Status / Document Request)</span>
                </div>

                <form onSubmit={handleSendNotice} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Quick Template
                    </label>
                    <select
                      onChange={(e) => applyTemplate(e.target.value)}
                      className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                    >
                      {messageTemplates.map((t) => (
                        <option key={t.title} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={mailTitle}
                      onChange={(e) => setMailTitle(e.target.value)}
                      placeholder="Message title"
                      className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Message *
                    </label>
                    <textarea
                      rows="3"
                      value={mailDescription}
                      onChange={(e) => setMailDescription(e.target.value)}
                      placeholder="Write the message to the applicant..."
                      className="w-full bg-[#081024] border border-purple-900/60 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs leading-relaxed"
                      required
                    />
                  </div>

                  {noticeSuccess && (
                    <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg">
                      {noticeSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={noticeSubmitting}
                    className="w-full bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-900/40 transition-all border border-purple-400/30"
                  >
                    <Send size={15} />
                    <span>{noticeSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>

                {/* Review & Action List */}
                <div className="pt-2 border-t border-purple-900/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Previously Sent Messages
                  </span>

                  {selectedApplicant.notices && selectedApplicant.notices.length > 0 ? (
                    <div className="space-y-2">
                      {selectedApplicant.notices.map((n) => (
                        <div
                          key={n.id}
                          className="bg-[#081024] border border-purple-950 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-purple-300">{n.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{n.message}</p>
                          </div>

                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="p-1.5 rounded-md bg-red-950 hover:bg-red-900 text-red-400 hover:text-white transition-all ml-2"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-1 italic">No messages sent yet.</p>
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
