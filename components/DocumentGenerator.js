'use client';

import { useState } from 'react';
import {
  FileCheck,
  CalendarClock,
  Banknote,
  Download,
  Printer,
  Sparkles,
  X
} from 'lucide-react';

/**
 * Document Generator
 * ------------------
 * Produces ONLY the lender's own documents, on MyBank branding:
 *   1. Loan Approval (Sanction) Letter
 *   2. Repayment (EMI) Schedule
 *   3. Disbursement Advice
 *
 * It never generates documents that belong to any other authority
 * (police, courts, tax offices, other banks or insurers).
 */
export default function DocumentGenerator({ applicantData, onClose }) {
  const [selectedDoc, setSelectedDoc] = useState('approval');

  const todayStr = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  const amount = Number(applicantData?.amount || 0);
  const tenure = Number(applicantData?.tenureMonths || 12);
  const interestRate = Number(applicantData?.interestRate || 0.024);
  const computedTotal = applicantData?.totalRepayment
    ? Number(applicantData.totalRepayment)
    : Math.round(amount + amount * (tenure / 12) * interestRate);
  const computedEmi = applicantData?.monthlyEmi
    ? Number(applicantData.monthlyEmi)
    : Number((computedTotal / tenure).toFixed(2));

  const [docFields, setDocFields] = useState({
    name: applicantData?.user?.fullName || applicantData?.applicantName || '',
    fatherName: applicantData?.personal?.fatherName || '',
    motherName: applicantData?.personal?.motherName || '',
    nid: applicantData?.personal?.nidNumber || '',
    address: applicantData?.personal?.presentAddress || '',
    loanAmount: amount,
    tenureMonths: tenure,
    monthlyEmi: computedEmi,
    totalRepayment: computedTotal,
    accountNumber: applicantData?.bank?.accountNumber || '',
    accountMethod: applicantData?.bank?.method || '',
    officerName: '',
    referenceNo: applicantData?.id || '',
    date: todayStr,
    startDate: todayStr
  });

  const docTypes = [
    { id: 'approval', name: 'Approval Letter', icon: FileCheck, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
    { id: 'schedule', name: 'Repayment Schedule', icon: CalendarClock, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20' },
    { id: 'disbursement', name: 'Disbursement Advice', icon: Banknote, color: 'text-blue-400 border-blue-500/40 bg-blue-950/20' },
  ];

  const handlePrint = () => window.print();

  const handleFieldChange = (field, value) => {
    setDocFields(prev => ({ ...prev, [field]: value }));
  };

  const money = (n) => `৳ ${Number(n || 0).toLocaleString('en-US')}`;

  // Build the month-by-month repayment schedule.
  const buildSchedule = () => {
    const rows = [];
    const n = Math.max(1, Number(docFields.tenureMonths) || 1);
    const emi = Number(docFields.monthlyEmi) || 0;
    const total = Number(docFields.totalRepayment) || emi * n;

    let base = new Date();
    const parts = String(docFields.startDate).split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      if (d && m && y) base = new Date(y, m - 1, d);
    }

    let remaining = total;
    for (let i = 1; i <= n; i++) {
      const due = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      const pay = i === n ? Number(remaining.toFixed(2)) : emi;
      remaining = Number((remaining - pay).toFixed(2));
      rows.push({
        no: i,
        due: due.toLocaleDateString('en-GB'),
        pay,
        balance: remaining < 0 ? 0 : remaining
      });
    }
    return rows;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b142b] border border-blue-900/60 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">

        {/* Header */}
        <div className="p-4 bg-[#081024] border-b border-blue-900/50 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide">Document Generator</h2>
              <p className="text-xs text-blue-300">MyBank loan documents — approval, schedule & disbursement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Doc Type Selector */}
          <div className="no-print">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Document Type
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {docTypes.map((dt) => {
                const Icon = dt.icon;
                const active = selectedDoc === dt.id;
                return (
                  <button
                    key={dt.id}
                    onClick={() => setSelectedDoc(dt.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      active
                        ? `${dt.color} shadow-lg ring-2 ring-blue-500 scale-[1.02]`
                        : 'bg-[#0f1d3e]/70 border-blue-950 hover:border-blue-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="mb-1.5" />
                    <span className="text-[11px] font-semibold leading-tight">{dt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Editor */}
            <div className="lg:col-span-5 bg-[#0f1d3e]/60 border border-blue-900/40 rounded-xl p-4 space-y-3.5 no-print">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Document Details ({docTypes.find(d => d.id === selectedDoc)?.name})
                </span>
                <span className="text-[11px] bg-blue-600/30 text-blue-300 font-semibold px-2 py-0.5 rounded">
                  Edit Fields
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Applicant Name</label>
                  <input type="text" value={docFields.name} onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Loan Amount (৳)</label>
                    <input type="number" value={docFields.loanAmount} onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Tenure (months)</label>
                    <input type="number" value={docFields.tenureMonths} onChange={(e) => handleFieldChange('tenureMonths', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Monthly EMI (৳)</label>
                    <input type="number" value={docFields.monthlyEmi} onChange={(e) => handleFieldChange('monthlyEmi', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Total Repayment (৳)</label>
                    <input type="number" value={docFields.totalRepayment} onChange={(e) => handleFieldChange('totalRepayment', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Sanctioning Officer</label>
                  <input type="text" value={docFields.officerName} onChange={(e) => handleFieldChange('officerName', e.target.value)}
                    placeholder="Officer name"
                    className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Date</label>
                    <input type="text" value={docFields.date} onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">NID Number</label>
                    <input type="text" value={docFields.nid} onChange={(e) => handleFieldChange('nid', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono" />
                  </div>
                </div>

                {selectedDoc === 'schedule' && (
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">First Installment Date (dd/mm/yyyy)</label>
                    <input type="text" value={docFields.startDate} onChange={(e) => handleFieldChange('startDate', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>
                )}

                {selectedDoc === 'disbursement' && (
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Disbursement Account</label>
                    <input type="text" value={docFields.accountNumber} onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>
                )}

                <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 mt-2 opacity-90">
                  <Sparkles size={16} />
                  <span>Live preview updates automatically</span>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                <button onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all">
                  <Printer size={14} />
                  <span>Print / Download</span>
                </button>
              </div>

              <div id="printable-doc" className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl border border-slate-200 min-h-[480px] text-xs leading-relaxed font-sans relative overflow-hidden doc-container">

                {/* Shared MyBank letterhead */}
                <div className="flex items-center justify-between border-b-2 border-blue-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-xl">MB</div>
                    <div>
                      <h2 className="font-extrabold text-sm uppercase tracking-wide text-blue-900">MyBank Bangladesh</h2>
                      <p className="text-[10px] text-slate-600 font-medium">Credit Division • Head Office, Dhaka</p>
                      <p className="text-[9px] text-slate-500">Motijheel Commercial Area, Dhaka-1000, Bangladesh</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-mono">Date: {docFields.date}</p>
                    {docFields.referenceNo && (
                      <p className="text-[10px] text-slate-500 font-mono">Ref: {docFields.referenceNo}</p>
                    )}
                  </div>
                </div>

                {/* 1. APPROVAL LETTER */}
                {selectedDoc === 'approval' && (
                  <div className="space-y-4 pt-4">
                    <div className="text-center py-1">
                      <h3 className="font-black text-sm uppercase underline tracking-wider text-slate-800">
                        Loan Approval Letter
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <p><strong>To:</strong> {docFields.name || '—'}</p>
                      <p><strong>Father:</strong> {docFields.fatherName || '—'} &nbsp; | &nbsp; <strong>Mother:</strong> {docFields.motherName || '—'}</p>
                      <p><strong>NID No:</strong> {docFields.nid || '—'} &nbsp; | &nbsp; <strong>Address:</strong> {docFields.address || '—'}</p>
                    </div>

                    <p className="text-[11px] text-justify text-slate-700">
                      We are pleased to inform you that your application for a personal credit loan from MyBank Bangladesh
                      has been reviewed and <strong>approved</strong> by the Credit Committee on the terms below.
                    </p>

                    <table className="w-full border-collapse border border-slate-300 text-[10px] my-2">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-1.5 font-bold">Approved Loan Amount</td>
                          <td className="border border-slate-300 p-1.5 font-bold font-mono text-blue-700">{money(docFields.loanAmount)}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Repayment Tenure</td>
                          <td className="border border-slate-300 p-1.5 font-mono">{docFields.tenureMonths} Months</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold">Monthly Installment (EMI)</td>
                          <td className="border border-slate-300 p-1.5 font-mono">{money(docFields.monthlyEmi)}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Total Repayable</td>
                          <td className="border border-slate-300 p-1.5 font-mono">{money(docFields.totalRepayment)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-[10px] text-slate-600">
                      The approved amount will be disbursed to your registered disbursement account. No advance payment
                      of any kind is required to release this loan; all applicable charges are included in the EMI shown above.
                    </p>

                    <div className="pt-8 flex items-end justify-between">
                      <div className="text-center">
                        <div className="w-28 h-8 border-b border-slate-400 mb-1"></div>
                        <p className="text-[9px] text-slate-500 font-medium">Applicant Signature</p>
                      </div>
                      <div className="text-center">
                        <div className="w-28 h-8 border-b border-slate-400 mb-1"></div>
                        <p className="text-[9px] text-slate-600 font-bold">{docFields.officerName || 'Sanctioning Officer'}</p>
                        <p className="text-[8px] text-slate-400">MyBank Credit Division</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. REPAYMENT SCHEDULE */}
                {selectedDoc === 'schedule' && (
                  <div className="space-y-3 pt-4">
                    <div className="text-center py-1">
                      <h3 className="font-black text-sm uppercase underline tracking-wider text-slate-800">
                        Repayment Schedule
                      </h3>
                      <p className="text-[10px] text-slate-500">{docFields.name || '—'} &nbsp;•&nbsp; {money(docFields.loanAmount)} &nbsp;•&nbsp; {docFields.tenureMonths} months</p>
                    </div>

                    <table className="w-full border-collapse border border-slate-300 text-[10px] text-center">
                      <thead className="bg-slate-100 font-bold">
                        <tr>
                          <th className="border border-slate-300 p-1.5">#</th>
                          <th className="border border-slate-300 p-1.5">Due Date</th>
                          <th className="border border-slate-300 p-1.5">Installment</th>
                          <th className="border border-slate-300 p-1.5">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildSchedule().map((r) => (
                          <tr key={r.no}>
                            <td className="border border-slate-300 p-1 font-mono">{r.no}</td>
                            <td className="border border-slate-300 p-1 font-mono">{r.due}</td>
                            <td className="border border-slate-300 p-1 font-mono">{money(r.pay)}</td>
                            <td className="border border-slate-300 p-1 font-mono">{money(r.balance)}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-slate-50">
                          <td colSpan="2" className="border border-slate-300 p-1 text-right">Total Repayable</td>
                          <td colSpan="2" className="border border-slate-300 p-1 font-mono">{money(docFields.totalRepayment)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-[9px] text-slate-500">
                      Installments are due monthly from the first installment date. Figures are indicative and governed by the signed loan agreement.
                    </p>
                  </div>
                )}

                {/* 3. DISBURSEMENT ADVICE */}
                {selectedDoc === 'disbursement' && (
                  <div className="space-y-4 pt-4">
                    <div className="text-center py-1">
                      <h3 className="font-black text-sm uppercase underline tracking-wider text-slate-800">
                        Loan Disbursement Advice
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Issued By</span>
                        <span className="font-bold text-slate-800">MyBank Bangladesh — Credit Division</span>
                        <span className="text-slate-500 text-[10px] block mt-2">Disbursement Method</span>
                        <span className="font-bold text-blue-700 capitalize">{docFields.accountMethod || 'Registered account'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Beneficiary</span>
                        <span className="font-bold text-slate-800">{docFields.name || '—'}</span>
                        <span className="text-slate-500 text-[10px] block mt-2">Beneficiary Account</span>
                        <span className="font-mono font-bold text-slate-800">{docFields.accountNumber || '—'}</span>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <span className="text-slate-500 text-[10px] block">Disbursed Amount</span>
                      <span className="font-black text-xl text-emerald-600 font-mono">{money(docFields.loanAmount)}</span>
                    </div>

                    <p className="text-[10px] text-slate-600 text-justify">
                      This advice confirms that the approved loan amount shown above has been scheduled for disbursement
                      to the beneficiary's registered account. No fee or advance payment is required from the beneficiary
                      to receive these funds.
                    </p>

                    <div className="pt-8 flex items-end justify-end">
                      <div className="text-center">
                        <div className="w-28 h-8 border-b border-slate-400 mb-1"></div>
                        <p className="text-[9px] text-slate-600 font-bold">{docFields.officerName || 'Authorized Officer'}</p>
                        <p className="text-[8px] text-slate-400">MyBank Credit Division</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
