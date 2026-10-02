'use client';

import { useState } from 'react';
import {
  FileCheck,
  Receipt,
  CreditCard,
  FileSignature,
  Shield,
  ArrowRightLeft,
  AlertOctagon,
  Award,
  FileSpreadsheet,
  Printer,
  Sparkles,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

function toWordsBDT(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 50000) return 'Fifty Thousand Taka Only';
  if (n === 1500) return 'One Thousand Five Hundred Taka Only';
  if (n === 3250) return 'Three Thousand Two Hundred Fifty Taka Only';
  if (n === 100000) return 'One Lakh Taka Only';
  if (n === 200000) return 'Two Lakh Taka Only';
  if (n === 500000) return 'Five Lakh Taka Only';
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function inWords(val) {
    if ((val = val.toString()).length > 9) return 'overflow';
    let digits = ('000000000' + val).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!digits) return '';
    let str = '';
    str += (Number(digits[1]) !== 0) ? (a[Number(digits[1])] || b[digits[1][0]] + ' ' + a[digits[1][1]]) + 'Crore ' : '';
    str += (Number(digits[2]) !== 0) ? (a[Number(digits[2])] || b[digits[2][0]] + ' ' + a[digits[2][1]]) + 'Lakh ' : '';
    str += (Number(digits[3]) !== 0) ? (a[Number(digits[3])] || b[digits[3][0]] + ' ' + a[digits[3][1]]) + 'Thousand ' : '';
    str += (Number(digits[4]) !== 0) ? (a[Number(digits[4])] || b[digits[4][0]] + ' ' + a[digits[4][1]]) + 'Hundred ' : '';
    str += (Number(digits[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(digits[5])] || b[digits[5][0]] + ' ' + a[digits[5][1]]) : '';
    return str.trim();
  }
  const result = inWords(n);
  return result ? `${result} Taka Only` : `${n} Taka Only`;
}

function getDateDigits(dateStr) {
  let d = '01', m = '10', y = '2026';
  if (dateStr) {
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parts[0]; m = parts[1].padStart(2, '0'); d = parts[2].padStart(2, '0');
      } else {
        d = parts[0].padStart(2, '0'); m = parts[1].padStart(2, '0'); y = parts[2];
      }
    }
  }
  const full = `${d}${m}${y}`;
  const arr = full.slice(0, 8).split('');
  while (arr.length < 8) arr.push('0');
  return arr;
}

export default function DocumentGenerator({ applicantData, onClose }) {
  const [selectedDoc, setSelectedDoc] = useState('approval');

  const todayStr = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  const amount = Number(applicantData?.amount || 50000);
  const tenure = Number(applicantData?.tenureMonths || 12);
  const rawRate = applicantData?.interestRate !== undefined ? Number(applicantData.interestRate) : 0.024;
  const initialRatePercent = rawRate <= 1 ? (rawRate * 100).toFixed(1) : rawRate.toString();
  const interestRate = Number(initialRatePercent) / 100;
  const computedTotal = applicantData?.totalRepayment
    ? Number(applicantData.totalRepayment)
    : Math.round(amount + amount * (tenure / 12) * interestRate);
  const computedEmi = applicantData?.monthlyEmi
    ? Number(applicantData.monthlyEmi)
    : Number((computedTotal / tenure).toFixed(2));

  const userPhoto = applicantData?.personal?.applicantPhoto || applicantData?.applicantPhoto || '';
  const userSignature = applicantData?.personal?.signature || applicantData?.signature || applicantData?.user?.signature || '';

  // Dynamic document fields initialized with applicant data
  const [docFields, setDocFields] = useState({
    name: applicantData?.user?.fullName || applicantData?.applicantName || 'Abdur Rahman',
    fatherName: applicantData?.personal?.fatherName || 'Moly',
    motherName: applicantData?.personal?.motherName || 'Begum',
    nid: applicantData?.personal?.nidNumber || '1962377626',
    address: applicantData?.personal?.presentAddress || 'Kishorganj, Dhaka',
    loanAmount: amount,
    tenureMonths: tenure,
    interestRate: initialRatePercent, // Changable interest rate (%)
    monthlyEmi: computedEmi,
    totalRepayment: computedTotal,
    processingFees: 1500, // Processing Fee specifically requested in Video 3!
    photoUrl: userPhoto,
    signatureUrl: userSignature,
    officerName: 'Md Hannan Mia',
    date: todayStr,
    receiptNumber: 'AFB-0058',
    paymentMethod: applicantData?.bank?.method || 'bKash',
    accountNumber: applicantData?.bank?.accountNumber || '01927440422',
    fineAmount: 110,
    policeStation: 'DMP Police Station',
    challanNumber: 'গ-২১৪৫৬৯',
    branch: 'সেগুনবাগিচা, ঢাকা ১০০০'
  });

  const [generated, setGenerated] = useState(true);

  const handleInterestRateChange = (newRate) => {
    const rateNum = parseFloat(newRate);
    const loan = Number(docFields.loanAmount) || 0;
    const tenureMonths = Number(docFields.tenureMonths) || 12;
    if (!isNaN(rateNum) && loan > 0 && tenureMonths > 0) {
      const annualDecimal = rateNum / 100;
      const total = Math.round(loan + loan * (tenureMonths / 12) * annualDecimal);
      const emi = Number((total / tenureMonths).toFixed(2));
      setDocFields(prev => ({
        ...prev,
        interestRate: newRate,
        totalRepayment: total,
        monthlyEmi: emi
      }));
    } else {
      setDocFields(prev => ({ ...prev, interestRate: newRate }));
    }
  };

  const handleLoanOrTenureChange = (field, val) => {
    const loan = Number(field === 'loanAmount' ? val : docFields.loanAmount) || 0;
    const tenureMonths = Number(field === 'tenureMonths' ? val : docFields.tenureMonths) || 12;
    const rateNum = parseFloat(docFields.interestRate) || 2.4;
    const annualDecimal = rateNum / 100;
    const total = Math.round(loan + loan * (tenureMonths / 12) * annualDecimal);
    const emi = tenureMonths > 0 ? Number((total / tenureMonths).toFixed(2)) : 0;
    setDocFields(prev => ({
      ...prev,
      [field]: val,
      totalRepayment: total,
      monthlyEmi: emi
    }));
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocFields(prev => ({ ...prev, signatureUrl: event.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocFields(prev => ({ ...prev, photoUrl: event.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Exact 9 documents from Video 3 & document_img reference folder
  const docTypes = [
    { id: 'approval', name: 'Approval Letter', icon: FileCheck, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
    { id: 'receipt', name: 'Money Receipt', icon: Receipt, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20' },
    { id: 'check', name: 'Bank Check', icon: CreditCard, color: 'text-purple-400 border-purple-500/40 bg-purple-950/20' },
    { id: 'agreement', name: 'Agreement', icon: FileSignature, color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' },
    { id: 'insurance', name: 'Insurance', icon: Shield, color: 'text-rose-400 border-rose-500/40 bg-rose-950/20' },
    { id: 'transaction', name: 'Transaction', icon: ArrowRightLeft, color: 'text-blue-400 border-blue-500/40 bg-blue-950/20' },
    { id: 'correction', name: 'Correction fine', icon: AlertOctagon, color: 'text-teal-400 border-teal-500/40 bg-teal-950/20' },
    { id: 'police', name: 'Police Clearance', icon: Award, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20' },
    { id: 'challan', name: 'Challan Form', icon: FileSpreadsheet, color: 'text-green-400 border-green-500/40 bg-green-950/20' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleFieldChange = (field, value) => {
    setDocFields(prev => ({ ...prev, [field]: value }));
  };

  const dateDigits = getDateDigits(docFields.date);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b142b] border border-blue-900/60 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-[#081024] border-b border-blue-900/50 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide">Document Generator</h2>
              <p className="text-xs text-blue-300">MyBank Loan Official Documents — Exact Government & Banking Templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Doc Type Selector Grid (9 Documents) */}
          <div className="no-print">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Document Type
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {docTypes.map((dt) => {
                const Icon = dt.icon;
                const active = selectedDoc === dt.id;
                return (
                  <button
                    key={dt.id}
                    onClick={() => { setSelectedDoc(dt.id); setGenerated(true); }}
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

          {/* Form and Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: Input Editor */}
            <div className="lg:col-span-5 bg-[#0f1d3e]/60 border border-blue-900/40 rounded-xl p-4 space-y-3.5 no-print max-h-[75vh] overflow-y-auto">
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
                  <input
                    type="text"
                    value={docFields.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={docFields.fatherName}
                      onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={docFields.motherName}
                      onChange={(e) => handleFieldChange('motherName', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">NID Number</label>
                    <input
                      type="text"
                      value={docFields.nid}
                      onChange={(e) => handleFieldChange('nid', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Address</label>
                    <input
                      type="text"
                      value={docFields.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Loan Amount (৳)</label>
                    <input
                      type="number"
                      value={docFields.loanAmount}
                      onChange={(e) => handleLoanOrTenureChange('loanAmount', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Tenure (months)</label>
                    <input
                      type="number"
                      value={docFields.tenureMonths}
                      onChange={(e) => handleLoanOrTenureChange('tenureMonths', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* Interest Rate & Processing Fee */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-cyan-400 font-bold block mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={docFields.interestRate}
                      onChange={(e) => handleInterestRateChange(e.target.value)}
                      placeholder="2.4"
                      className="w-full bg-[#081024] border border-cyan-500/60 rounded-lg px-3 py-2 text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-amber-400 font-bold block mb-1">Processing Fees (৳) *</label>
                    <input
                      type="number"
                      value={docFields.processingFees}
                      onChange={(e) => handleFieldChange('processingFees', e.target.value)}
                      className="w-full bg-[#081024] border border-amber-500/60 rounded-lg px-3 py-2 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Monthly EMI (৳)</label>
                    <input
                      type="number"
                      value={docFields.monthlyEmi}
                      onChange={(e) => handleFieldChange('monthlyEmi', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Total Repayment (৳)</label>
                    <input
                      type="number"
                      value={docFields.totalRepayment}
                      onChange={(e) => handleFieldChange('totalRepayment', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Sanctioning Officer</label>
                    <input
                      type="text"
                      value={docFields.officerName}
                      onChange={(e) => handleFieldChange('officerName', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Date</label>
                    <input
                      type="text"
                      value={docFields.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Photo & Signature Upload Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Photo */}
                  <div className="bg-[#081024] border border-blue-900/60 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300 font-bold">Applicant Photo</span>
                      {docFields.photoUrl ? (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">✓ Loaded</span>
                      ) : (
                        <span className="text-[9px] text-slate-500">None</span>
                      )}
                    </div>
                    {docFields.photoUrl && (
                      <div className="h-14 bg-slate-900 rounded flex items-center justify-center overflow-hidden border border-slate-700">
                        <img src={docFields.photoUrl} alt="Photo" className="h-full object-cover" />
                      </div>
                    )}
                    <label className="cursor-pointer block text-center py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 rounded text-blue-200 text-[10px] font-semibold">
                      <span>Change Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Signature */}
                  <div className="bg-[#081024] border border-blue-900/60 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300 font-bold">Signature</span>
                      {docFields.signatureUrl ? (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">✓ Loaded</span>
                      ) : (
                        <span className="text-[9px] text-slate-500">None</span>
                      )}
                    </div>
                    {docFields.signatureUrl && (
                      <div className="h-14 bg-white rounded flex items-center justify-center p-1 border border-slate-300">
                        <img src={docFields.signatureUrl} alt="Sig" className="max-h-12 max-w-full object-contain" />
                      </div>
                    )}
                    <label className="cursor-pointer block text-center py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 rounded text-blue-200 text-[10px] font-semibold">
                      <span>Change Signature</span>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Account No.</label>
                    <input
                      type="text"
                      value={docFields.accountNumber}
                      onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Branch</label>
                    <input
                      type="text"
                      value={docFields.branch}
                      onChange={(e) => handleFieldChange('branch', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGenerated(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all mt-2"
                >
                  <Sparkles size={15} />
                  <span>Update Live Preview</span>
                </button>
              </div>
            </div>

            {/* Right: Document Live Preview */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Preview ({docTypes.find(d => d.id === selectedDoc)?.name})
                </span>
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Printer size={14} />
                  <span>Print / Download PDF</span>
                </button>
              </div>

              {/* Printable Document Container */}
              <div id="printable-doc" className="bg-white text-slate-900 rounded-xl p-4 sm:p-6 shadow-2xl border border-slate-200 min-h-[500px] text-xs leading-relaxed font-sans relative overflow-hidden doc-container">
                
                {/* 1. APPROVAL LETTER (Exact match to 2.jpeg) */}
                {selectedDoc === 'approval' && (
                  <div className="space-y-3 relative font-sans text-slate-900">
                    {/* Background faint globe watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
                      <div className="w-80 h-80 rounded-full border-[18px] border-blue-800 flex items-center justify-center">
                        <div className="w-56 h-56 rounded-full border-[12px] border-blue-800" />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      {/* Top Header */}
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Blue globe logo */}
                          <div className="w-8 h-8 rounded-full border-2 border-blue-700 text-blue-700 flex items-center justify-center font-bold text-xs">
                            🌐
                          </div>
                          <div className="text-left">
                            <h2 className="font-extrabold text-sm uppercase tracking-wider text-blue-900 leading-tight">
                              MYBANK BANGLADESH
                            </h2>
                            <p className="text-[9px] text-slate-500 font-semibold tracking-wider">
                              CREDIT DIVISION • MYBANK GROUP
                            </p>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-600 font-medium">
                          E-32, Agargaon, Sher-e-Bangla Nagar, Dhaka-1207
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Head Quarters: Motijheel C/A, Dhaka-1000, Bangladesh
                        </p>
                      </div>

                      {/* Black Full Width Bar */}
                      <div className="w-full h-0.5 bg-black my-1" />

                      {/* Title */}
                      <div className="text-center py-1">
                        <h3 className="font-black text-sm uppercase tracking-widest text-black">
                          APPROVAL LETTER
                        </h3>
                      </div>

                      {/* Applicant Meta Information */}
                      <div className="space-y-0.5 text-[11px] leading-relaxed">
                        <p><strong>Name:</strong> {docFields.name}</p>
                        <p><strong>KYC Verification:</strong> MB/BD/FL/{docFields.date}</p>
                        <p><strong>Subject:</strong> Approval For MyBank personal-loan</p>
                        <p><strong>Loan Amount:</strong> BDT. {Number(docFields.loanAmount).toLocaleString()}/-</p>
                        <p><strong>Date:</strong> {docFields.date}</p>
                      </div>

                      {/* Salutation */}
                      <p className="text-[11px] pt-1">
                        <strong>Dear {docFields.name},</strong>
                      </p>
                      <p className="text-[11px] text-justify text-slate-800 leading-normal">
                        This letter is to inform you that your loan application for BDT.{Number(docFields.loanAmount).toLocaleString()} with <strong>"MyBank Flexible Loan"</strong> has been approved, subject to the terms and conditions outlined below and in the attached loan agreement.
                      </p>

                      {/* Loan Details & Green Approved Stamp Side-by-Side (Matches 2.jpeg) */}
                      <div className="flex items-center justify-between py-1">
                        <div className="space-y-1 text-[11px]">
                          <p className="font-bold underline text-slate-900">Loan details:</p>
                          <ul className="space-y-0.5 text-slate-800 pl-2">
                            <li>• Loan Amount: BDT. {Number(docFields.loanAmount).toLocaleString()}/-</li>
                            <li>• Loan Purpose: personal-loan</li>
                            <li>• Interest Rate: {docFields.interestRate}% per annum</li>
                            <li>• Loan Tenure: {docFields.tenureMonths} Month</li>
                            <li>• Repayment Schedule: BDT. {Number(docFields.monthlyEmi).toLocaleString()}/- per month</li>
                            <li>• Processing Fees: BDT.{Number(docFields.processingFees).toLocaleString()}/-</li>
                          </ul>
                        </div>

                        {/* Approved Green Circle Badge */}
                        <div className="pr-4 flex-shrink-0">
                          <div className="w-24 h-24 rounded-full border-4 border-emerald-600 flex flex-col items-center justify-center p-1 text-emerald-600 select-none shadow-sm bg-white">
                            <span className="text-[7px] font-black tracking-widest uppercase">★ APPROVED ★</span>
                            <div className="text-2xl font-black leading-none my-0.5 text-emerald-600">✓</div>
                            <span className="text-[8px] font-black uppercase tracking-wider">APPROVED</span>
                          </div>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-1 text-[10px] text-slate-800">
                        <p className="font-bold underline">Conditions of approval:</p>
                        <p className="pl-2">
                          • This approval is contingent upon your acceptance of the terms and conditions outlined in the attached loan agreement. You are required to sign and return the loan agreement within 7 days of receiving this letter.
                        </p>
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-800">
                        <p className="font-bold">Please contact our service portal at your earliest convenience to:</p>
                        <ul className="pl-3 space-y-0.5">
                          <li>• Collect and sign the loan agreement.</li>
                          <li>• Complete any remaining formalities.</li>
                          <li>• Discuss the disbursement schedule.</li>
                        </ul>
                      </div>

                      <p className="text-[10px] text-slate-700 text-justify">
                        We are pleased to approve your loan and look forward to assisting you with your financial needs. Please do not hesitate to contact us if you have any questions or require further clarification.
                      </p>

                      {/* Bottom Officer Sign-Off & Official Seals (Matches 2.jpeg) */}
                      <div className="pt-2 flex items-end justify-between">
                        <div className="space-y-0.5 text-[10px]">
                          {/* Signature line */}
                          <div className="w-28 border-b border-slate-700 mb-1 font-serif italic text-base text-blue-900 font-bold h-7 flex items-center">
                            Hannan Mia
                          </div>
                          <p className="font-medium text-slate-600">Sincerely,</p>
                          <p className="font-bold text-slate-900">{docFields.officerName}</p>
                          <p className="text-slate-600">Principle Officer</p>
                          <p className="text-slate-500 font-medium">MyBank Bangladesh Group</p>
                        </div>

                        {/* Bottom Right Authorization Seals */}
                        <div className="flex items-center space-x-2">
                          <div className="text-center border border-blue-300 rounded p-1 bg-blue-50/60 text-[8px] font-bold text-blue-900">
                            <span>MYBANK</span><br/>
                            <span className="text-[6px] text-slate-500">CREDIT DESK</span>
                          </div>
                          <div className="w-10 h-10 rounded-full border border-red-500 text-red-600 flex flex-col items-center justify-center p-0.5 text-[6px] font-bold text-center">
                            <span>BANGLADESH</span>
                            <span>GOVT</span>
                          </div>
                          <div className="w-10 h-10 rounded-full border border-emerald-600 text-emerald-700 flex flex-col items-center justify-center p-0.5 text-[6px] font-bold text-center">
                            <span>CENTRAL</span>
                            <span>BANK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MONEY RECEIPT (Exact match to 3.jpeg) */}
                {selectedDoc === 'receipt' && (
                  <div className="relative bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm p-4 sm:p-6 text-slate-900 font-sans">
                    {/* Top Decorative Angled Corner Polygons matching 3.jpeg */}
                    <div className="absolute top-0 left-0 w-36 h-10 bg-[#0d2847] clip-path-top-left" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)' }} />
                    <div className="absolute top-0 right-0 left-32 h-6 bg-[#f59e0b]" style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 0 100%)' }} />

                    {/* Bottom Decorative Angled Corner Polygons */}
                    <div className="absolute bottom-0 right-0 w-44 h-8 bg-[#f59e0b]" style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0 100%)' }} />
                    <div className="absolute bottom-0 left-0 right-40 h-2 bg-[#0d2847]" />

                    <div className="relative z-10 pt-4 space-y-4">
                      {/* Top Row: Logo, Title, Branch & Date */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full border border-blue-600 text-blue-700 flex items-center justify-center font-bold text-xs">
                              🌐
                            </div>
                            <span className="font-extrabold text-xs uppercase text-[#0d2847] tracking-wider">
                              MYBANK GROUP
                            </span>
                          </div>
                          <p className="font-mono font-bold text-xs text-slate-800">
                            NO. {docFields.receiptNumber}
                          </p>
                        </div>

                        <div className="text-center">
                          <h2 className="font-black text-xl sm:text-2xl text-[#0d2847] tracking-wide uppercase">
                            MONEY RECEIPT
                          </h2>
                        </div>

                        <div className="text-right space-y-1 text-[10px]">
                          <p className="font-extrabold text-[#0d2847] text-[11px] uppercase">MYBANK BANGLADESH</p>
                          <p className="text-slate-500">Plot E 32, Sher-e-Bangla Nagar,</p>
                          <p className="text-slate-500">Agargaon, Dhaka 1207, Bangladesh</p>
                          <div className="pt-1 flex items-center justify-end space-x-1">
                            <span className="font-bold text-xs text-slate-800">Date</span>
                            <span className="font-mono text-xs text-slate-900 border-b border-dotted border-slate-700 px-3">
                              {docFields.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Orange Dividing Line */}
                      <div className="w-full h-1 bg-[#f59e0b] my-2" />

                      {/* Receipt Dotted Lines matching 3.jpeg */}
                      <div className="space-y-2.5 text-xs text-slate-800 font-medium">
                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-slate-900 flex-shrink-0">Received with thanks from</span>
                          <span className="font-bold text-sm text-slate-900 font-serif border-b border-dotted border-slate-500 flex-1 px-2">
                            {docFields.name}
                          </span>
                        </div>

                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-slate-900 flex-shrink-0">Amount</span>
                          <span className="font-bold font-mono text-slate-900 border-b border-dotted border-slate-500 flex-1 px-2">
                            {Number(docFields.processingFees).toLocaleString()}/-
                          </span>
                        </div>

                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-slate-900 flex-shrink-0">In word</span>
                          <span className="font-serif italic text-slate-800 border-b border-dotted border-slate-500 flex-1 px-2">
                            {toWordsBDT(docFields.processingFees)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-baseline space-x-2">
                            <span className="font-bold text-slate-900 flex-shrink-0">For</span>
                            <span className="font-semibold text-slate-800 border-b border-dotted border-slate-500 flex-1 px-2">
                              MyBank Loan Verification & Processing
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className="font-bold text-slate-900 flex-shrink-0">Branch</span>
                            <span className="font-semibold text-slate-800 border-b border-dotted border-slate-500 flex-1 px-2">
                              {docFields.branch}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-baseline space-x-2">
                            <span className="font-bold text-slate-900 flex-shrink-0">ACCT.</span>
                            <span className="font-bold text-blue-700 capitalize border-b border-dotted border-slate-500 flex-1 px-2">
                              {docFields.paymentMethod} ({docFields.accountNumber})
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className="font-bold text-slate-900 flex-shrink-0">PAID</span>
                            <span className="font-bold text-emerald-700 border-b border-dotted border-slate-500 flex-1 px-2">
                              Yes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row matching 3.jpeg */}
                      <div className="pt-6 pb-4 flex items-end justify-between">
                        {/* Amount Box */}
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-slate-900">Amount=</span>
                          <div className="border-2 border-slate-400 bg-white px-3 py-1 font-mono font-black text-sm text-slate-900 shadow-inner">
                            {Number(docFields.processingFees).toLocaleString()}/-
                          </div>
                        </div>

                        {/* Received by */}
                        <div className="text-center">
                          <p className="font-serif italic font-bold text-xs text-blue-900 border-b border-dotted border-slate-600 px-4 mb-0.5">
                            {docFields.officerName}
                          </p>
                          <span className="text-[10px] font-bold text-slate-600">Received by</span>
                        </div>

                        {/* Authorized Signature with signature */}
                        <div className="text-center">
                          <div className="border-b border-dotted border-slate-600 px-4 mb-0.5">
                            <span className="font-serif italic text-base text-blue-950 font-black">
                              Hannan Mia
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">Authorized Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BANK CHECK (Exact match to 6.jpeg) */}
                {selectedDoc === 'check' && (
                  <div className="relative bg-[#ebf3fa] border-2 border-slate-300 rounded-lg overflow-hidden shadow-md p-5 text-slate-900 font-sans">
                    {/* Faint World Map Watermark in background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] z-0">
                      <div className="w-[85%] h-44 rounded-full border-[10px] border-blue-600 flex items-center justify-center">
                        <div className="w-[60%] h-28 border-[6px] border-blue-500 rounded-full" />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3.5">
                      {/* Top Row: Bank Logo & Date Boxes matching 6.jpeg */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-full border-2 border-blue-800 text-blue-800 flex items-center justify-center font-bold text-sm">
                            🌐
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-blue-950 tracking-wider">
                              MYBANK BANGLADESH
                            </h3>
                            <p className="text-[9px] text-slate-600 font-medium tracking-wide">
                              HEAD OFFICE • MOTIJHEEL, DHAKA
                            </p>
                          </div>
                        </div>

                        {/* Date Grid matching 6.jpeg */}
                        <div>
                          <div className="flex border border-slate-700 bg-white">
                            {dateDigits.map((digit, idx) => (
                              <div
                                key={idx}
                                className={`w-5 h-6 border-r border-slate-700 last:border-r-0 flex items-center justify-center font-mono font-bold text-xs ${
                                  idx === 1 || idx === 3 ? 'mr-1 border-r border-slate-700' : ''
                                }`}
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[7px] text-slate-600 font-bold px-1 mt-0.5 tracking-widest font-mono">
                            <span>D D</span>
                            <span>M M</span>
                            <span>Y Y Y Y</span>
                          </div>
                        </div>
                      </div>

                      {/* Pay Line with OR BEARER */}
                      <div className="pt-2 flex items-baseline space-x-2 text-xs">
                        <span className="font-extrabold text-blue-950 tracking-wider">PAY</span>
                        <span className="font-serif font-black text-sm text-slate-900 border-b border-blue-950 flex-1 px-3">
                          {docFields.name}
                        </span>
                        <span className="font-bold text-[10px] text-blue-950 uppercase tracking-wider">OR BEARER</span>
                      </div>

                      {/* SUM OF Line with Amount Box matching 6.jpeg */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="font-extrabold text-blue-950 tracking-wider">SUM OF</span>
                            <span className="font-serif italic font-bold text-slate-900 border-b border-blue-950 flex-1 px-2">
                              {toWordsBDT(docFields.loanAmount)}
                            </span>
                          </div>
                          {/* Second guideline */}
                          <div className="w-full border-b border-blue-950/60 h-2" />
                        </div>

                        {/* Amount in Figures Box [ ৳ | 50000 ] */}
                        <div className="flex border-2 border-blue-950 bg-white h-9 shadow-sm">
                          <div className="w-8 bg-blue-50 border-r-2 border-blue-950 flex items-center justify-center font-black text-base text-blue-950">
                            ৳
                          </div>
                          <div className="px-4 flex items-center justify-center font-mono font-black text-sm text-slate-900">
                            {Number(docFields.loanAmount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Account No. & Signature Line matching 6.jpeg */}
                      <div className="pt-4 flex items-end justify-between">
                        {/* Account Box */}
                        <div className="flex border border-slate-700 bg-white">
                          <div className="px-2 py-1 bg-slate-100 border-r border-slate-700 font-bold text-[10px] text-slate-700">
                            Acc. No.
                          </div>
                          <div className="px-3 py-1 font-mono font-bold text-xs text-slate-900">
                            {docFields.accountNumber}
                          </div>
                        </div>

                        {/* Sign Line */}
                        <div className="text-center">
                          <div className="w-36 border-b border-slate-800 mb-1 font-serif italic text-blue-950 font-bold text-sm h-6 flex items-center justify-center">
                            Hannan Mia
                          </div>
                          <span className="text-[9px] text-slate-600 font-medium">Please Sign Above</span>
                        </div>
                      </div>

                      {/* Bottom White MICR Strip matching 6.jpeg */}
                      <div className="bg-white border-t border-slate-300 -mx-5 -mb-5 px-6 py-2 flex items-center justify-center font-mono text-[11px] font-bold text-slate-800 tracking-widest select-none">
                        00 2154 &nbsp;&nbsp; 54 &nbsp;&nbsp; 8045 &nbsp;&nbsp; 0014458651256 &nbsp;&nbsp; 88
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AGREEMENT STAMP (Exact match to 1.jpeg) */}
                {selectedDoc === 'agreement' && (
                  <div className="space-y-4 font-serif text-slate-900 bg-[#fdfdfb] p-3 sm:p-5 border border-slate-300 rounded-lg">
                    {/* The Authentic Green Bangladesh Judicial Stamp Header (Matches 1.jpeg) */}
                    <div className="border-[3px] border-emerald-900 rounded-lg p-2.5 bg-[#eaf5ec] text-center space-y-1 shadow-sm">
                      {/* Top Cartouche Banner */}
                      <div className="flex justify-between items-center px-4">
                        {/* Left ৳ ১০০ */}
                        <div className="text-center font-serif">
                          <span className="text-2xl font-black text-emerald-950">৳ ১০০</span>
                        </div>

                        {/* Center Emblem & Title */}
                        <div className="flex flex-col items-center space-y-1">
                          <div className="px-6 py-0.5 rounded-full border border-emerald-800 bg-[#d4ebd7] text-emerald-950 font-black text-xs uppercase tracking-wider">
                            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                          </div>
                          {/* Circular Bangladesh National Emblem Seal */}
                          <div className="w-14 h-14 rounded-full border-2 border-emerald-800 bg-white flex flex-col items-center justify-center text-emerald-900 text-center p-0.5 shadow-sm">
                            <span className="text-xs">🌾</span>
                            <span className="text-[9px] font-black leading-none">বাংলাদেশ</span>
                            <span className="text-[7px]">★★★★</span>
                          </div>
                        </div>

                        {/* Right ৳ ১০০ */}
                        <div className="text-center font-serif">
                          <span className="text-2xl font-black text-emerald-950">৳ ১০০</span>
                        </div>
                      </div>

                      {/* Bottom Ribbon Frame */}
                      <div className="pt-0.5">
                        <span className="inline-block border border-emerald-800 bg-[#d4ebd7] text-emerald-950 font-bold text-xs px-8 py-0.5 rounded">
                          একশত টাকা
                        </span>
                      </div>
                    </div>

                    {/* Serial Number & Centered Title matching 1.jpeg */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        খয &nbsp; ৪০১৭৪৭২
                      </span>
                      <h3 className="font-black text-base text-slate-950 underline underline-offset-4 tracking-wide -ml-16">
                        ঋণের চুক্তিপত্র
                      </h3>
                      <div />
                    </div>

                    {/* Applicant 6-Item Data & Photo with Red Stamp side-by-side matching 1.jpeg */}
                    <div className="flex items-start justify-between gap-4 py-1 text-xs">
                      {/* Left Data List */}
                      <div className="space-y-1 text-slate-900 font-sans">
                        <p><strong>ঋণ গ্রহীতার নাম:</strong> {docFields.name}</p>
                        <p><strong>এনআইডি নম্বর:</strong> {docFields.nid}</p>
                        <p><strong>আবেদনের তারিখ:</strong> {docFields.date}</p>
                        <p><strong>ঋণের পরিমাণ:</strong> {Number(docFields.loanAmount).toLocaleString()}</p>
                        <p><strong>ঋণের মেয়াদ:</strong> {docFields.tenureMonths}</p>
                        <p><strong>মাসিক কিস্তি:</strong> {Number(docFields.monthlyEmi).toLocaleString()}</p>
                      </div>

                      {/* Right Applicant Photo with LOAN APPROVED Stamp */}
                      <div className="relative flex-shrink-0 pr-2">
                        <div className="w-24 h-28 border border-slate-400 bg-slate-100 rounded overflow-hidden shadow">
                          {docFields.photoUrl ? (
                            <img src={docFields.photoUrl} alt="Applicant" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                              <ImageIcon size={20} />
                              <span>ছবি</span>
                            </div>
                          )}
                        </div>

                        {/* Red Circular Stamp placed on corner matching 1.jpeg */}
                        <div className="absolute -bottom-2 -left-3 w-16 h-16 rounded-full border-2 border-red-600 bg-red-600/10 text-red-600 flex flex-col items-center justify-center text-center p-0.5 transform -rotate-12 select-none shadow">
                          <span className="text-[5px] font-black">★ LOAN APPROVED ★</span>
                          <span className="text-[7px] font-black uppercase tracking-tighter">LOAN APPROVED</span>
                          <span className="text-[5px] font-black">★ 2026 ★</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Terms matching 1.jpeg */}
                    <div className="text-[11px] leading-relaxed text-slate-800 space-y-2 text-justify font-sans">
                      <p className="font-bold underline text-slate-900">শর্তাবলী:</p>
                      <p>
                        এই চুক্তি {docFields.date} তারিখে, সিনিয়র ঋণ কর্মকর্তা (মাই ব্যাংক ঋণ বাংলাদেশ এর পক্ষে) প্রথম পক্ষ এবং জনাব {docFields.name}, পিতাঃ {docFields.fatherName}, {docFields.address} দ্বিতীয় পক্ষ - এই দুই পক্ষের মধ্যে স্বাক্ষরিত হলো। যেহেতু দ্বিতীয় পক্ষের আবেদনের ভিত্তিতে প্রথম পক্ষ মাই ব্যাংক ঋণ বাংলাদেশ হতে তাকে ঋণের জন্য নির্বাচিত করেছে, সেহেতু দ্বিতীয় পক্ষ গ্রহণকৃত ঋণের সুদেআসলে অর্থ যথাসময়ে পরিশোধে বাধ্য থাকবেন। মেয়াদ শেষে উভয় পক্ষ কর্তৃক একটি চুক্তিপত্র স্বাক্ষরিত হয়েছে।
                      </p>

                      <ol className="list-decimal pl-4 space-y-1">
                        <li>দ্বিতীয় পক্ষ প্রতিমাসের ০১ তারিখ থেকে ১০ তারিখের মধ্যে অনলাইনের মাধ্যমে কিস্তি প্রদান করতে হবে। কিস্তি প্রদানে কোনো সমস্যা হলে অবশ্যই পূর্বেই জানাতে হবে।</li>
                        <li>ব্যাংক কর্তৃপক্ষ যেসব নির্দেশনার কথা বলেছেন তা অবশ্যই সম্পূর্ণ করতে হবে।</li>
                        <li>দ্বিতীয় পক্ষ যদি কোনো মাসে কিস্তি দিতে অসমর্থ হন তবে ২ মাসের কিস্তি একসাথে দিতে পারবেন। যদি ২ মাসের বেশি হয়, তাহলে দ্বিতীয় পক্ষকে ব্যাংক কর্তৃক নির্ধারিত পরিমাণ জরিমানা দিতে হবে।</li>
                        <li>দ্বিতীয় পক্ষ কোনো কারণে মেয়াদোত্তীর্ণ খেলাপি হলে বা এই চুক্তিনামার কোনো শর্ত লঙ্ঘন করলে, তার বিরুদ্ধে প্রথম পক্ষ কর্তৃক সামাজিক ও আইনানুগ সকল ধরনের ব্যবস্থা গ্রহণ করা যাবে।</li>
                      </ol>

                      <p>
                        অতঃপর এই চুক্তিপত্র সম্পর্কে কোনো বিভ্রান্তি অথবা ভুল বোঝাবুঝি থাকলে তা প্রথম পক্ষের গচ্ছিত নথিতে যুক্ত করা হবে এবং প্রথম পক্ষের সিদ্ধান্তই চূড়ান্ত বলে বিবেচিত হবে।
                      </p>
                    </div>

                    {/* Signatures Row matching 1.jpeg */}
                    <div className="pt-4 space-y-2 font-sans">
                      <p className="text-center font-bold text-xs text-slate-800">
                        চুক্তিকারীগণ ও সাক্ষীগণ স্বাক্ষর করিলেন:
                      </p>

                      <div className="pt-4 flex justify-between items-end">
                        {/* Left Bank Authority Signature */}
                        <div className="text-center space-y-1">
                          <div className="w-28 border-b border-slate-700 pb-0.5 font-serif italic text-blue-900 font-bold text-sm h-7 flex items-center justify-center">
                            Hannan Mia
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">ব্যাংক কর্তৃপক্ষের স্বাক্ষর</span>
                        </div>

                        {/* Right Applicant Signature with Real Signature */}
                        <div className="text-center space-y-1">
                          <div className="w-28 border-b border-slate-700 pb-0.5 flex items-center justify-center h-8">
                            {docFields.signatureUrl ? (
                              <img src={docFields.signatureUrl} alt="Signature" className="max-h-7 max-w-[100px] object-contain" />
                            ) : (
                              <span className="font-serif italic text-blue-900 font-bold text-xs">{docFields.name}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">ঋণ গ্রহীতার স্বাক্ষর</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Slogan matching 1.jpeg */}
                    <div className="text-center pt-3 border-t border-slate-200">
                      <p className="font-bold text-xs text-emerald-800">
                        “দেশপ্রেমের শপথ নিন, দুর্নীতিকে বিদায় দিন”
                      </p>
                    </div>
                  </div>
                )}

                {/* 5. INSURANCE (Exact match to 4.jpeg) */}
                {selectedDoc === 'insurance' && (
                  <div className="space-y-3 font-sans text-slate-900 bg-white p-3 sm:p-5 border border-slate-300 rounded-lg relative">
                    {/* Background Bangladesh Emblem Watermark matching 4.jpeg */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
                      <div className="w-72 h-72 rounded-full border-[12px] border-cyan-800 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full border-[8px] border-cyan-800" />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      {/* Top Header matching 4.jpeg */}
                      <div className="text-center space-y-0.5">
                        <div className="w-8 h-8 rounded-full border border-red-500 bg-red-50 mx-auto flex items-center justify-center text-xs">
                          🔴
                        </div>
                        <p className="font-bold text-[10px] text-slate-800">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                        <p className="text-[9px] text-slate-600">আর্থিক প্রতিষ্ঠান বিভাগ, অর্থ মন্ত্রণালয়</p>
                        <h2 className="font-black text-base text-blue-950 uppercase tracking-wide">
                          জীবন বীমা কর্পোরেশন
                        </h2>
                        <p className="text-[9px] font-bold text-blue-800">(একমাত্র রাষ্ট্রীয় জীবন বীমা প্রতিষ্ঠান)</p>
                        <h3 className="font-black text-xs uppercase underline pt-1 text-slate-900">
                          বীমা পলিসি বিবরণী
                        </h3>
                      </div>

                      {/* Content with Photo on Top Right matching 4.jpeg */}
                      <div className="flex items-start justify-between gap-4 py-1 text-xs">
                        <div className="space-y-1 text-slate-900 flex-1">
                          <p><strong>পলিসি নম্বর:</strong> 2565-2255-1329658</p>
                          <p><strong>প্রার্থীর নাম:</strong> {docFields.name}</p>
                          <p><strong>এনআইডি নম্বর:</strong> {docFields.nid}</p>
                          <p><strong>পিতার নাম:</strong> {docFields.fatherName}</p>
                          <p><strong>মাতার নাম:</strong> {docFields.motherName}</p>
                          <p><strong>ঠিকানা:</strong> {docFields.address}</p>
                          <p><strong>বীমা অংক:</strong> {Number(docFields.processingFees).toLocaleString()}</p>
                          <p><strong>বীমা প্রিমিয়াম:</strong> ২০ টাকা</p>
                          <p><strong>প্রিমিয়াম প্রদানের পদ্ধতি:</strong> এককালীন</p>
                          <p><strong>তারিখ:</strong> {docFields.date}</p>
                        </div>

                        {/* Top Right Applicant Photo with Blue Stamp */}
                        <div className="relative flex-shrink-0 pr-2">
                          <div className="w-24 h-28 border border-slate-300 rounded overflow-hidden shadow-sm bg-slate-100">
                            {docFields.photoUrl ? (
                              <img src={docFields.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                                <ImageIcon size={20} />
                                <span>ছবি</span>
                              </div>
                            )}
                          </div>
                          {/* Circular Blue Rubber Stamp */}
                          <div className="absolute -bottom-2 -left-3 w-16 h-16 rounded-full border-2 border-blue-800 bg-blue-800/10 text-blue-900 flex flex-col items-center justify-center text-center p-0.5 transform -rotate-12 select-none shadow">
                            <span className="text-[5px] font-black">★ জীবন বীমা ★</span>
                            <span className="text-[6px] font-black leading-tight">কর্পোরেশন</span>
                            <span className="text-[5px]">একমাত্র রাষ্ট্রীয়</span>
                          </div>
                        </div>
                      </div>

                      {/* Policy Text matching 4.jpeg */}
                      <div className="text-[11px] leading-relaxed text-slate-800 space-y-1.5 text-justify">
                        <p>
                          জনাব {docFields.name}, এনআইডি: {docFields.nid} জীবন বীমা কর্পোরেশনে একটি সাধারণ বীমা পলিসি গ্রহণ করেছেন। এই পলিসির মেয়াদ 10 বছর পর্যন্ত।
                        </p>
                        <p>
                          মেয়াদ শেষে তিনি বীমা অংকের অনুপাতে সকল লাভসহ অন্যান্য সুবিধাদি পেতে পারবেন। এছাড়াও, এই পলিসিটি দুর্ঘটনা এবং মৃত্যু বীমার ক্ষেত্রেও প্রযোজ্য থাকবে।
                        </p>
                      </div>

                      {/* Signatures matching 4.jpeg */}
                      <div className="pt-4 flex justify-between items-end">
                        <div className="text-left space-y-0.5">
                          <div className="w-28 border-b border-slate-600 pb-0.5 h-7 flex items-center">
                            {docFields.signatureUrl ? (
                              <img src={docFields.signatureUrl} alt="Signature" className="max-h-6 max-w-[100px] object-contain" />
                            ) : (
                              <span className="font-serif italic text-xs text-blue-900 font-bold">{docFields.name}</span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-800">স্বাক্ষরিত</p>
                          <p className="text-[9px] text-slate-600">উপপরিচালক (সাধারণ বীমা)</p>
                          <p className="text-[9px] text-slate-500">জীবন বীমা কর্পোরেশন, ঢাকা</p>
                        </div>
                        <div />
                      </div>

                      {/* Footer matching 4.jpeg */}
                      <div className="pt-4 border-t border-slate-200 text-center space-y-0.5 text-[8px] text-slate-600">
                        <div className="w-5 h-5 rounded-full border border-red-500 mx-auto flex items-center justify-center text-[8px]">
                          🔴
                        </div>
                        <p className="font-bold">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                        <p>আর্থিক প্রতিষ্ঠান বিভাগ, অর্থ মন্ত্রণালয়</p>
                        <p className="font-extrabold text-[9px] text-blue-900">জীবন বীমা কর্পোরেশন</p>
                        <p>(একমাত্র রাষ্ট্রীয় জীবন বীমা প্রতিষ্ঠান)</p>
                        <p>প্রধান কার্যালয়: ২৪ মতিঝিল বা/এ, ঢাকা-১০০০।</p>
                        <p>ফোন: ০২২২৩৩৮৫৭২০ &nbsp;|&nbsp; ই-মেইল: tad@jbc.gov.bd &nbsp;|&nbsp; Web: jbc.gov.bd</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CHALLAN FORM (Exact match to 5.jpeg) */}
                {selectedDoc === 'challan' && (
                  <div className="space-y-3 font-sans text-slate-900 bg-white p-3 sm:p-5 border border-slate-400 rounded-lg text-[10px]">
                    {/* Title */}
                    <div className="text-center space-y-0.5">
                      <h2 className="font-black text-base text-black">চালান ফরম</h2>
                      <p className="font-bold text-xs text-slate-800">টি, আর ফরম নং ৬ (এস, আর ৩৭ দ্রষ্টব্য)</p>
                    </div>

                    {/* Meta & 3-Copy Box matching 5.jpeg */}
                    <div className="flex items-start justify-between pt-1">
                      <div className="space-y-1">
                        <p><strong>চালান নং :</strong> &nbsp; {docFields.challanNumber}</p>
                        <p><strong>তারিখ :</strong> &nbsp;&nbsp;&nbsp;&nbsp; {docFields.date}</p>
                      </div>

                      {/* 3 Copy Boxes */}
                      <div className="flex border border-black font-bold text-[9px]">
                        <span className="px-2 py-0.5 border-r border-black bg-slate-100">১ম (মূল) কপি</span>
                        <span className="px-2 py-0.5 border-r border-black">২য় কপি</span>
                        <span className="px-2 py-0.5">৩য় কপি</span>
                      </div>
                    </div>

                    {/* Bank & Branch Line */}
                    <div className="pt-1">
                      <p className="text-[10px]">
                        বাংলাদেশ ব্যাংক/সোনালী ব্যাংক লিঃ &nbsp;&nbsp; জেলার &nbsp;<u>{docFields.branch}</u>&nbsp; শাখায় টাকা জমা দেওয়ার চালান
                      </p>
                    </div>

                    {/* Code Number Boxes matching 5.jpeg */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      <span className="font-bold">কোড নং:</span>
                      <div className="flex border border-black font-mono font-bold text-xs">
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">১</span>
                      </div>
                      <div className="flex border border-black font-mono font-bold text-xs">
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">১</span>
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">১</span>
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">৩</span>
                        <span className="w-4 h-5 flex items-center justify-center">০</span>
                      </div>
                      <div className="flex border border-black font-mono font-bold text-xs">
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">০</span>
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">০</span>
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">১</span>
                        <span className="w-4 h-5 flex items-center justify-center">০</span>
                      </div>
                      <div className="flex border border-black font-mono font-bold text-xs">
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">০</span>
                        <span className="w-4 h-5 border-r border-black flex items-center justify-center">৩</span>
                        <span className="w-4 h-5 flex items-center justify-center">১</span>
                      </div>
                    </div>

                    {/* The Comprehensive Government Challan Table matching 5.jpeg */}
                    <table className="w-full border-collapse border border-black text-[9px] text-center my-2">
                      <thead>
                        <tr>
                          <th colSpan="4" className="border border-black p-1 font-bold">
                            জমা প্রদানকারী কর্তৃক পূরণ করিতে হইবে
                          </th>
                          <th colSpan="2" className="border border-black p-1 font-bold">
                            টাকার অংক
                          </th>
                          <th rowSpan="2" className="border border-black p-1 font-bold w-40 text-justify align-top leading-tight">
                            বিভাগের নাম এবং চালানের পৃষ্ঠাংকনকারী কর্মকর্তার নাম, পদবী ও দপ্তর।
                          </th>
                        </tr>
                        <tr>
                          <th className="border border-black p-1 font-bold w-20">
                            যাহার মারফত প্রদত্ত হইল তাহার নাম ও ঠিকানা।
                          </th>
                          <th className="border border-black p-1 font-bold w-24">
                            যে ব্যক্তির/প্রতিষ্ঠানের পক্ষ হইতে টাকা প্রদত্ত হইল তাহার নাম, পদবী ও ঠিকানা।
                          </th>
                          <th className="border border-black p-1 font-bold w-20">
                            কি বাবদ জমা দেওয়া হইল তাহার বিবরণ।
                          </th>
                          <th className="border border-black p-1 font-bold w-20">
                            মুদ্রা ও নোটের বিবরণ/ ড্রাফট, পে-অর্ডার ও চেকের বিবরণ।
                          </th>
                          <th className="border border-black p-1 font-bold w-12">টাকা</th>
                          <th className="border border-black p-1 font-bold w-8">পয়সা</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="h-44 align-top">
                          <td className="border border-black p-1.5 pt-6 font-semibold">
                            সরকারী ভ্যাট/ট্যাক্স
                          </td>
                          <td className="border border-black p-1.5 pt-6 font-bold">
                            {docFields.name}
                          </td>
                          <td className="border border-black p-1.5 pt-6 font-semibold">
                            সরকারী ভ্যাট/ট্যাক্স
                          </td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5 pt-6 font-mono font-bold">
                            ৩২৫০/-
                          </td>
                          <td className="border border-black p-1.5"></td>
                          {/* Official Pink Seal Column matching 5.jpeg */}
                          <td className="border border-black p-2 align-bottom">
                            <div className="border border-pink-500 rounded p-1 bg-pink-50/50 text-pink-900 text-[8px] space-y-0.5 leading-tight">
                              <div className="w-8 h-8 rounded-full border border-pink-600 mx-auto flex items-center justify-center text-[7px] text-pink-700">
                                🔴
                              </div>
                              <p className="font-black text-[9px]">মোঃ আব্দুর রহমান খান</p>
                              <p className="font-bold">এফসিএমএ</p>
                              <p>সচিব, অভ্যন্তরীণ সম্পদ বিভাগ</p>
                              <p>অর্থ মন্ত্রণালয়, চেয়ারম্যান</p>
                              <p className="font-bold">জাতীয় রাজস্ব বোর্ড, বাংলাদেশ</p>
                            </div>
                          </td>
                        </tr>
                        {/* Summary Total Row */}
                        <tr className="font-bold">
                          <td colSpan="4" className="border border-black p-1 text-right">
                            মোট টাকা
                          </td>
                          <td className="border border-black p-1 font-mono font-black">
                            ৩২৫০/-
                          </td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bottom Info matching 5.jpeg */}
                    <div className="space-y-1 pt-1 text-[10px]">
                      <p><strong>টাকা (কথায়) :</strong> &nbsp; তিন হাজার দুইশত পঞ্চাশ টাকা মাত্র</p>
                      <p><strong>টাকা পাওয়া গেল :</strong> &nbsp; __________________________________________________</p>
                      <p><strong>তারিখ :</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {docFields.date}</p>
                    </div>

                    <div className="pt-2 space-y-0.5 text-[8px] text-slate-700">
                      <p>নোট : ১। সংশ্লিষ্ট দপ্তরের সহিত যোগাযোগ করিয়া সঠিক কোড নম্বর জানিয়া লইবেন।</p>
                      <p>২। যে সকল ক্ষেত্রে কর্মকর্তা কর্তৃক পৃষ্ঠাংকন প্রয়োজন, সে সকল ক্ষেত্রে প্রযোজ্য হইবে।</p>
                    </div>

                    <div className="pt-3 border-t border-slate-300 text-center text-[8px] text-slate-500 space-y-0.5">
                      <p>বাংলাদেশ সরকারের ই-সিটিজেন সার্ভিস অ্যাপ্লিকেশন থেকে মুদ্রিত</p>
                      <p>Download Site: https://forms.portal.gov.bd</p>
                    </div>
                  </div>
                )}

                {/* 7. TRANSACTION (Electronic Funds Transfer Advice) */}
                {selectedDoc === 'transaction' && (
                  <div className="space-y-4 font-sans text-slate-900 bg-white p-4 sm:p-6 border border-slate-300 rounded-lg">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="font-black text-sm text-blue-900 uppercase">
                          ELECTRONIC FUNDS TRANSFER ADVICE
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">MyBank Core Banking Inter-Bank Clearing Voucher</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded">
                        TRX ID: TX-80419265
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Sender / Issuer:</span>
                        <span className="font-bold text-slate-800">MyBank Credit Desk</span>
                        <span className="text-slate-500 text-[10px] block mt-2">Disbursement Method:</span>
                        <span className="font-bold text-blue-700 capitalize">{docFields.paymentMethod} Transfer</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Beneficiary:</span>
                        <span className="font-bold text-slate-800">{docFields.name}</span>
                        <span className="text-slate-500 text-[10px] block mt-2">Beneficiary Account:</span>
                        <span className="font-mono font-bold text-slate-800">{docFields.accountNumber}</span>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <span className="text-slate-500 text-[10px] block">Transfer Amount:</span>
                      <span className="font-black text-2xl text-emerald-600 font-mono">
                        ৳ {Number(docFields.loanAmount).toLocaleString()} BDT
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block mt-1 font-bold border border-emerald-300">
                        STATUS: READY FOR DISBURSEMENT (সুদের হার: {docFields.interestRate}% বাৎসরিক)
                      </span>
                    </div>

                    <div className="pt-4 flex justify-between items-end border-t border-slate-200 mt-2">
                      <div className="text-center">
                        <div className="w-28 h-10 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img src={docFields.signatureUrl} alt="Receiver Signature" className="max-h-8 max-w-[95px] object-contain" />
                          ) : (
                            <span className="font-serif italic text-xs text-slate-800">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">Receiver Signature</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">Dispatched by MyBank Core System</span>
                    </div>
                  </div>
                )}

                {/* 8. CORRECTION FINE (Correction Order) */}
                {selectedDoc === 'correction' && (
                  <div className="space-y-4 font-sans text-slate-900 bg-white p-4 sm:p-6 border border-amber-300 rounded-lg">
                    <div className="flex items-center justify-between border-b-2 border-amber-500 pb-2">
                      <div>
                        <h3 className="font-black text-sm text-amber-900 uppercase">MYBANK BANGLADESH</h3>
                        <p className="text-[10px] text-slate-600 font-medium">Information Correction & Verification Order</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 font-mono font-bold text-xs px-2.5 py-1 rounded border border-amber-300">
                        FINE SLIP
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 py-2">
                      <p><strong>Applicant Name:</strong> {docFields.name}</p>
                      <p><strong>NID Number:</strong> {docFields.nid}</p>
                      <p><strong>Registered Address:</strong> {docFields.address}</p>
                      <p className="text-justify text-slate-700 pt-1">
                        Notice is hereby given that upon digital database validation, slight discrepancies were observed during financial verification. Under section 14-B of Financial Protocols, a corrective processing fee has been designated for profile re-alignment.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-amber-800 font-semibold block">Required Correction Fine:</span>
                        <span className="text-lg font-black text-amber-900 font-mono">${docFields.fineAmount} USD (Refundable)</span>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-1 rounded">
                        Action Required
                      </span>
                    </div>

                    <div className="pt-6 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-24 h-10 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img src={docFields.signatureUrl} alt="Applicant Signature" className="max-h-8 max-w-[95px] object-contain" />
                          ) : (
                            <span className="font-serif italic text-xs text-slate-800">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">Applicant Signature</span>
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-b border-slate-400 mb-1 font-serif italic text-xs">{docFields.officerName}</div>
                        <span className="text-[9px] text-slate-600 font-bold">Verifying Officer</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. POLICE CLEARANCE CERTIFICATE */}
                {selectedDoc === 'police' && (
                  <div className="space-y-4 font-sans text-slate-900 bg-white p-4 sm:p-6 border border-indigo-300 rounded-lg">
                    <div className="flex items-center justify-between border-b-2 border-indigo-900 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-950 text-white flex items-center justify-center font-bold text-xs">
                          POLICE
                        </div>
                        <div>
                          <h3 className="font-black text-xs uppercase text-indigo-950">GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH</h3>
                          <p className="text-[9px] text-slate-600">Dhaka Metropolitan Police • Special Verification Branch</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">Report No: 32018</span>
                    </div>

                    <div className="text-center py-1">
                      <h4 className="font-black text-sm uppercase underline text-slate-900">
                        POLICE CLEARANCE CERTIFICATE
                      </h4>
                    </div>

                    <div className="text-xs text-justify space-y-2 text-slate-800">
                      <p>
                        This is to certify that <strong>{docFields.name}</strong>, Son/Daughter of: <strong>{docFields.fatherName}</strong> and <strong>{docFields.motherName}</strong>, holding NID: <strong>{docFields.nid}</strong>, resident of: {docFields.address}, has no adverse criminal records or unlawful activities reported at {docFields.policeStation}.
                      </p>
                      <p>
                        As per our official verification database, the individual bears acceptable conduct and is cleared for availing micro-credit loan privileges from MyBank Bangladesh Mission.
                      </p>
                    </div>

                    <div className="pt-8 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-20 h-10 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img src={docFields.signatureUrl} alt="Applicant Signature" className="max-h-8 max-w-[85px] object-contain" />
                          ) : (
                            <span className="font-serif italic text-xs text-slate-800">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">Subject Signature</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border border-indigo-700 text-indigo-800 flex items-center justify-center text-[8px] font-bold text-center">
                        DMP SEAL
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-b border-slate-400 mb-1 font-serif italic text-xs">Superintendent</div>
                        <span className="text-[9px] text-slate-600 font-bold">Special Branch</span>
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
