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
  Download,
  Printer,
  Sparkles,
  X
} from 'lucide-react';

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
    signatureUrl: userSignature, // Real applicant signature
    officerName: 'Md Hannan Mia',
    date: todayStr,
    receiptNumber: 'AFB-0058',
    paymentMethod: applicantData?.bank?.method || 'bKash',
    accountNumber: applicantData?.bank?.accountNumber || '01927440422',
    fineAmount: 110,
    policeStation: 'DMP Police Station',
    challanNumber: 'গ-১২৩৬০৬',
    branch: 'সেগুনবাগিচা, ঢাকা ১০০০'
  });

  const [generated, setGenerated] = useState(true);

  const handleInterestRateChange = (newRate) => {
    const rateNum = parseFloat(newRate);
    const loan = Number(docFields.loanAmount) || 0;
    const tenure = Number(docFields.tenureMonths) || 12;
    if (!isNaN(rateNum) && loan > 0 && tenure > 0) {
      const annualDecimal = rateNum / 100;
      const total = Math.round(loan + loan * (tenure / 12) * annualDecimal);
      const emi = Number((total / tenure).toFixed(2));
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
    const tenure = Number(field === 'tenureMonths' ? val : docFields.tenureMonths) || 12;
    const rateNum = parseFloat(docFields.interestRate) || 2.4;
    const annualDecimal = rateNum / 100;
    const total = Math.round(loan + loan * (tenure / 12) * annualDecimal);
    const emi = tenure > 0 ? Number((total / tenure).toFixed(2)) : 0;
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

  // Exact 9 documents from Video 3 (0:25 to 0:47)
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
              <p className="text-xs text-blue-300">MyBank Loan Documents — approval, schedule & verification slips</p>
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
          {/* Doc Type Selector Grid (9 Documents from Video 3) */}
          <div className="no-print">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Editor */}
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
                  <input
                    type="text"
                    value={docFields.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
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

                {/* User Signature Card & Uploader in Editor */}
                <div className="bg-[#081024] border border-blue-900/60 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold text-[11px] block">
                      Applicant Signature (গ্রাহকের স্বাক্ষর)
                    </label>
                    {docFields.signatureUrl ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded font-semibold">
                        ✓ Signature Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded">
                        Defaulting to Name
                      </span>
                    )}
                  </div>

                  {docFields.signatureUrl && (
                    <div className="bg-white rounded-md p-1.5 flex items-center justify-center border border-slate-300 h-12">
                      <img
                        src={docFields.signatureUrl}
                        alt="Applicant Signature Preview"
                        className="max-h-10 max-w-full object-contain"
                      />
                    </div>
                  )}

                  <label className="cursor-pointer block text-center py-1.5 px-3 bg-blue-950 hover:bg-blue-900 border border-blue-700/60 rounded-lg text-blue-200 text-[11px] font-semibold transition-all">
                    <span>{docFields.signatureUrl ? 'Change / Upload Signature' : 'Upload Signature'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Sanctioning Officer Name</label>
                  <input
                    type="text"
                    value={docFields.officerName}
                    onChange={(e) => handleFieldChange('officerName', e.target.value)}
                    className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Date</label>
                    <input
                      type="text"
                      value={docFields.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">NID Number</label>
                    <input
                      type="text"
                      value={docFields.nid}
                      onChange={(e) => handleFieldChange('nid', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-semibold font-mono"
                    />
                  </div>
                </div>

                {selectedDoc === 'receipt' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Receipt Number</label>
                      <input
                        type="text"
                        value={docFields.receiptNumber}
                        onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
                        className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Payment Method</label>
                      <input
                        type="text"
                        value={docFields.paymentMethod}
                        onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                        className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                )}

                {selectedDoc === 'correction' && (
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Fine Amount ($)</label>
                    <input
                      type="number"
                      value={docFields.fineAmount}
                      onChange={(e) => handleFieldChange('fineAmount', e.target.value)}
                      className="w-full bg-[#081024] border border-blue-900/50 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                )}

                {selectedDoc === 'challan' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Challan No</label>
                      <input
                        type="text"
                        value={docFields.challanNumber}
                        onChange={(e) => handleFieldChange('challanNumber', e.target.value)}
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
                )}

                <button
                  type="button"
                  onClick={() => setGenerated(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all mt-4"
                >
                  <Sparkles size={16} />
                  <span>Generate Document</span>
                </button>
              </div>
            </div>

            {/* Right: Document Live Preview */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Preview
                </span>
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Printer size={14} />
                  <span>Print / Download</span>
                </button>
              </div>

              {/* Document Printable View */}
              <div id="printable-doc" className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl border border-slate-200 min-h-[480px] text-xs leading-relaxed font-sans relative overflow-hidden doc-container">
                
                {/* 1. APPROVAL LETTER (Matches Video 3 0:13) */}
                {selectedDoc === 'approval' && (
                  <div className="space-y-4">
                    {/* Letterhead */}
                    <div className="flex items-center justify-between border-b-2 border-blue-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center p-1.5 font-black text-xl">
                          MB
                        </div>
                        <div>
                          <h2 className="font-extrabold text-sm uppercase tracking-wide text-blue-900">MYBANK BANGLADESH</h2>
                          <p className="text-[10px] text-slate-600 font-medium">CREDIT DIVISION • HEAD OFFICE, DHAKA</p>
                          <p className="text-[9px] text-slate-500">Motijheel Commercial Area, Dhaka-1000, Bangladesh</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 uppercase">
                          APPROVED
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">Date: {docFields.date}</p>
                      </div>
                    </div>

                    <div className="text-center py-1">
                      <h3 className="font-black text-sm uppercase underline tracking-wider text-slate-800">
                        LOAN APPROVAL LETTER
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">Reference No: MB-BD/2026/LN-{docFields.loanAmount}</p>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <p><strong>To:</strong> {docFields.name}</p>
                      <p><strong>Father:</strong> {docFields.fatherName} | <strong>Mother:</strong> {docFields.motherName}</p>
                      <p><strong>NID No:</strong> {docFields.nid} | <strong>Address:</strong> {docFields.address}</p>
                    </div>

                    <p className="text-[11px] text-justify text-slate-700">
                      We are pleased to inform you that your application for a personal development credit loan from MyBank Bangladesh Financial Initiative has been officially reviewed and <strong>APPROVED</strong> by the Credit Sanctioning Committee.
                    </p>

                    {/* Breakdown Table with Processing Fee and Interest Rate */}
                    <table className="w-full border-collapse border border-slate-300 text-[10px] my-2">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-1.5 font-bold">Approved Loan Amount:</td>
                          <td className="border border-slate-300 p-1.5 font-bold font-mono text-blue-700">৳ {Number(docFields.loanAmount).toLocaleString()} BDT</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Repayment Tenure:</td>
                          <td className="border border-slate-300 p-1.5 font-mono">{docFields.tenureMonths} Months</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold">Monthly Installment (EMI):</td>
                          <td className="border border-slate-300 p-1.5 font-mono">৳ {Number(docFields.monthlyEmi).toLocaleString()} BDT</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-amber-900 bg-amber-50">Processing Fee:</td>
                          <td className="border border-slate-300 p-1.5 font-bold font-mono text-amber-900 bg-amber-50">৳ {Number(docFields.processingFees).toLocaleString()} BDT</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-1.5 font-bold">Total Repayment:</td>
                          <td className="border border-slate-300 p-1.5 font-mono">৳ {Number(docFields.totalRepayment).toLocaleString()} BDT</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-blue-900">Interest Rate:</td>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-700">{docFields.interestRate}% (Annual)</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-[10px] text-slate-600">
                      The sanctioned funds will be disbursed to your registered disbursement account upon verification of primary processing fee formalities as per Article 12 of Bangladesh Financial Regulations.
                    </p>

                    {/* Signatures and Stamp */}
                    <div className="pt-6 flex items-end justify-between">
                      <div className="text-center">
                        <div className="w-28 h-12 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="Applicant Signature"
                              className="max-h-11 max-w-[110px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-blue-900 font-bold text-sm">{docFields.name}</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium">Applicant Signature</p>
                      </div>

                      {/* Official Stamp */}
                      <div className="w-20 h-20 rounded-full border-2 border-emerald-600 text-emerald-700 flex flex-col items-center justify-center text-center p-1 transform -rotate-12 select-none">
                        <span className="text-[8px] font-black uppercase">MYBANK</span>
                        <span className="text-[7px] font-bold">DHAKA BD</span>
                        <span className="text-[9px] font-black uppercase">VERIFIED</span>
                        <span className="text-[6px]">2026</span>
                      </div>

                      <div className="text-center">
                        <div className="w-28 h-10 border-b border-slate-400 mb-1 flex items-center justify-center font-serif italic text-blue-900 font-bold text-sm">
                          {docFields.officerName}
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold">{docFields.officerName}</p>
                        <p className="text-[8px] text-slate-400">Chief Sanctioning Officer</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MONEY RECEIPT */}
                {selectedDoc === 'receipt' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2">
                      <div>
                        <h2 className="font-black text-base text-blue-800 uppercase">MONEY RECEIPT</h2>
                        <p className="text-[10px] text-slate-500 font-medium">MyBank Customer Cash & Settlement Voucher</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800">NO: {docFields.receiptNumber}</span>
                        <p className="text-[10px] text-slate-500 font-mono">Date: {docFields.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Received with thanks from:</span>
                        <span className="font-bold text-sm text-slate-900">{docFields.name}</span>
                        <span className="block text-[10px] text-slate-500 mt-1">NID: {docFields.nid}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Amount Received:</span>
                        <span className="font-black text-lg text-blue-700 font-mono">৳ {Number(docFields.processingFees).toLocaleString()} BDT</span>
                        <span className="block text-[10px] text-slate-600 capitalize">Payment Method: {docFields.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-[11px]">
                      <p><strong>Account Number:</strong> {docFields.accountNumber}</p>
                      <p><strong>Purpose of Deposit:</strong> Verification / Processing / Insurance Guarantee Deposit</p>
                      <p><strong>Amount in Words:</strong> One Thousand Five Hundred Taka Only</p>
                    </div>

                    <div className="pt-10 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-28 h-12 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="Depositor Signature"
                              className="max-h-11 max-w-[110px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-blue-900 font-bold text-xs">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">Depositor Signature</span>
                      </div>
                      <div className="text-center">
                        <div className="w-28 border-b border-slate-400 mb-1 font-serif italic text-blue-900">{docFields.officerName}</div>
                        <span className="text-[10px] text-slate-600 font-bold">Authorized Cashier</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BANK CHECK */}
                {selectedDoc === 'check' && (
                  <div className="border-4 border-blue-900/40 rounded-xl p-4 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                          MB
                        </div>
                        <div>
                          <h4 className="font-extrabold text-blue-900 text-xs">MYBANK BANGLADESH LIMITED</h4>
                          <p className="text-[9px] text-slate-500">Payable at all branches across Bangladesh</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500">Date:</span>
                        <span className="font-mono font-bold text-xs ml-1 border-b border-slate-400 px-2">{docFields.date}</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-700">PAY TO:</span>
                        <span className="font-bold text-sm text-slate-900 border-b border-slate-400 flex-1 px-2 font-serif">
                          {docFields.name}
                        </span>
                        <span className="font-bold text-xs text-slate-700">OR BEARER</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-700">THE SUM OF:</span>
                        <span className="text-xs text-slate-800 border-b border-slate-400 flex-1 px-2 font-serif italic">
                          Fifty Thousand Taka Only
                        </span>
                        <div className="border-2 border-slate-800 px-3 py-1 font-mono font-black text-sm bg-white">
                          ৳ {Number(docFields.loanAmount).toLocaleString()} /-
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-600">
                        <span>A/C NO:</span>
                        <span className="font-mono font-bold">{docFields.accountNumber}</span>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-24 h-10 border-b border-slate-400 mb-0.5 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="Payee Signature"
                              className="max-h-9 max-w-[95px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-[11px] text-slate-800 font-bold">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[8px] font-bold text-slate-500">Payee / Bearer Signature</span>
                      </div>

                      <div className="font-mono text-slate-400 text-[10px] tracking-widest hidden sm:block">
                        ||| 001 045 0001235 ||| 2026 |||
                      </div>

                      <div className="text-center">
                        <div className="w-28 border-b-2 border-slate-700 mb-1 font-serif italic font-bold text-blue-900 text-sm">
                          {docFields.officerName}
                        </div>
                        <span className="text-[9px] font-bold text-slate-600">Authorized Signature</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AGREEMENT (৩০০ টাকার স্ট্যাম্প) */}
                {selectedDoc === 'agreement' && (
                  <div className="space-y-4">
                    {/* Non-judicial Stamp Header */}
                    <div className="border-4 border-emerald-800 p-2 bg-emerald-50/40 text-center rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-emerald-900 font-black text-xs px-2">
                        <span>৳ ৩০০</span>
                        <span className="uppercase text-sm tracking-wider">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
                        <span>৳ ৩০০</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-800">নন-জুডিশিয়াল স্ট্যাম্প (NON-JUDICIAL STAMP)</p>
                    </div>

                    <div className="text-center py-1">
                      <h3 className="font-black text-sm uppercase underline text-slate-900">
                        ঋণ চুক্তিপত্র ও অঙ্গীকারনামা
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">Agreement No: AG-MB-2026/089</p>
                    </div>

                    <div className="text-[10px] leading-relaxed text-slate-700 space-y-2 text-justify">
                      <p>
                        ১ম পক্ষ: <strong>MyBank Credit Mission</strong>, ঢাকা, বাংলাদেশ (ঋণ প্রদানকারী সংস্থা)।<br/>
                        ২য় পক্ষ: <strong>{docFields.name}</strong>, পিতা: {docFields.fatherName}, মাতা: {docFields.motherName}, এনআইডি: {docFields.nid}, ঠিকানা: {docFields.address} (ঋণ গ্রহীতা)।
                      </p>
                      <p>
                        উভয় পক্ষ সুস্থ মস্তিষ্কে স্বেচ্ছায় ও সজ্ঞানে এই মর্মে চুক্তিবদ্ধ হইতেছেন যে, ১ম পক্ষ ২য় পক্ষকে <strong>৳ {Number(docFields.loanAmount).toLocaleString()}</strong> টাকা ঋণ বার্ষিক <strong>{docFields.interestRate}%</strong> সুদের হারে প্রদান করিতে সম্মত হইয়াছেন এবং ২য় পক্ষ প্রতি মাসে নির্ধারিত <strong>৳ {Number(docFields.monthlyEmi).toLocaleString()}</strong> টাকা হারে আগামী {docFields.tenureMonths} মাসের মধ্যে সম্পূর্ণ অর্থ (মোট ৳ {Number(docFields.totalRepayment).toLocaleString()}) পরিশোধ করিতে বাধ্য থাকিবেন।
                      </p>
                    </div>

                    <div className="pt-8 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-28 h-12 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="২য় পক্ষ (ঋণ গ্রহীতা) স্বাক্ষর"
                              className="max-h-11 max-w-[110px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-xs text-blue-900 font-bold">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-600">২য় পক্ষ (ঋণ গ্রহীতা)</span>
                      </div>
                      <div className="text-center">
                        <div className="w-28 border-b border-slate-400 mb-1 font-serif italic text-xs text-blue-900 font-bold">
                          {docFields.officerName}
                        </div>
                        <span className="text-[9px] font-bold text-slate-600">১ম পক্ষ (কর্তৃপক্ষ)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. INSURANCE */}
                {selectedDoc === 'insurance' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-rose-600 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg">
                          JBK
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-rose-900 uppercase">জীবন বীমা কর্পোরেশন</h3>
                          <p className="text-[9px] text-slate-500">Jiban Bima Corporation - Micro Credit Life Protection</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500">Certificate No: JBK-77821</span>
                        <p className="text-[9px] text-slate-400 font-mono">Date: {docFields.date}</p>
                      </div>
                    </div>

                    <div className="text-center py-1">
                      <h4 className="font-bold text-xs uppercase underline text-slate-800">
                        বীমা পলিসি কভার নোট (INSURANCE COVER NOTE)
                      </h4>
                    </div>

                    <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 text-[11px] space-y-1">
                      <p><strong>পলিসি হোল্ডারের নাম:</strong> {docFields.name}</p>
                      <p><strong>পিতা/মাতা:</strong> {docFields.fatherName} / {docFields.motherName}</p>
                      <p><strong>এনআইডি:</strong> {docFields.nid}</p>
                      <p><strong>বীমার মোট পরিমাণ:</strong> ৳ {Number(docFields.loanAmount).toLocaleString()} BDT (বার্ষিক সুদের হার: {docFields.interestRate}%)</p>
                      <p><strong>মাসিক প্রিমিয়াম:</strong> ৳ ১৫০/- (লোনের সাথে অন্তর্ভুক্ত)</p>
                    </div>

                    <div className="pt-8 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-28 h-12 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="গ্রাহকের স্বাক্ষর"
                              className="max-h-11 max-w-[110px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-xs text-blue-900 font-bold">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">গ্রাহকের স্বাক্ষর</span>
                      </div>
                      <div className="text-center">
                        <div className="w-28 border-b border-slate-400 mb-1 font-serif italic text-xs text-rose-900 font-bold">
                          Insurance Officer
                        </div>
                        <span className="text-[9px] text-slate-600 font-bold">অনুমোদিত স্বাক্ষরকারী</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. TRANSACTION */}
                {selectedDoc === 'transaction' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-black text-sm text-blue-900 uppercase">ELECTRONIC FUNDS TRANSFER ADVICE</h3>
                      <span className="text-[10px] font-mono text-slate-500">TRX ID: TX-{Math.floor(10000000 + Math.random()*90000000)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-[11px]">
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
                      <span className="font-black text-xl text-emerald-600 font-mono">৳ {Number(docFields.loanAmount).toLocaleString()} BDT</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                        STATUS: READY FOR DISBURSEMENT (সুদের হার: {docFields.interestRate}% বাৎসরিক)
                      </span>
                    </div>

                    <div className="pt-4 flex justify-between items-end border-t border-slate-200 mt-2">
                      <div className="text-center">
                        <div className="w-24 h-10 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img src={docFields.signatureUrl} alt="Receiver Signature" className="max-h-9 max-w-[95px] object-contain" />
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

                {/* 7. CORRECTION FINE */}
                {selectedDoc === 'correction' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-amber-500 pb-2">
                      <div>
                        <h3 className="font-black text-sm text-amber-900 uppercase">MYBANK BANGLADESH</h3>
                        <p className="text-[10px] text-slate-600 font-medium">Information Correction & Verification Order</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 font-mono font-bold text-xs px-2 py-1 rounded">
                        FINE SLIP
                      </span>
                    </div>

                    <div className="text-[11px] space-y-2 py-2">
                      <p><strong>Applicant Name:</strong> {docFields.name}</p>
                      <p><strong>NID Number:</strong> {docFields.nid}</p>
                      <p><strong>Registered Address:</strong> {docFields.address}</p>
                      <p className="text-justify text-slate-700">
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
                            <img src={docFields.signatureUrl} alt="Applicant Signature" className="max-h-9 max-w-[95px] object-contain" />
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

                {/* 8. POLICE CLEARANCE CERTIFICATE */}
                {selectedDoc === 'police' && (
                  <div className="space-y-4">
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

                    <div className="text-[10px] text-justify space-y-2 text-slate-800">
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
                            <img src={docFields.signatureUrl} alt="Applicant Signature" className="max-h-9 max-w-[85px] object-contain" />
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

                {/* 9. CHALLAN FORM (চালান ফরম) */}
                {selectedDoc === 'challan' && (
                  <div className="space-y-3">
                    <div className="text-center border-b pb-2 space-y-0.5">
                      <h3 className="font-black text-sm text-slate-900">চালান ফরম (টি. আর. ফরম নং ৪১)</h3>
                      <p className="text-[10px] text-slate-600">বাংলাদেশ ব্যাংক / সোনালী ব্যাংক লিমিটেড এ জমাদানের চালান</p>
                      <p className="text-[9px] text-slate-500 font-mono">চালান নম্বর: {docFields.challanNumber} | তারিখ: {docFields.date}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                      <p><strong>জমা প্রদানকারীর নাম:</strong> {docFields.name}</p>
                      <p><strong>ঠিকানা ও শাখা:</strong> {docFields.branch}</p>
                    </div>

                    <table className="w-full border-collapse border border-slate-400 text-[9px] text-center my-2">
                      <thead className="bg-slate-100 font-bold">
                        <tr>
                          <th className="border border-slate-400 p-1">কিসের বাবদ</th>
                          <th className="border border-slate-400 p-1">সরকারি খাতের কোড</th>
                          <th className="border border-slate-400 p-1">পরিমাণ (টাকা)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-400 p-1.5 text-left">সরকারি ভ্যাট ও রাজস্ব ট্যাক্স (MyBank Loan VAT)</td>
                          <td className="border border-slate-400 p-1.5 font-mono">১-১১৪১-০০০০-০১১১</td>
                          <td className="border border-slate-400 p-1.5 font-bold font-mono">৳ ৩,২৫০/-</td>
                        </tr>
                        <tr className="font-bold bg-slate-50">
                          <td colSpan="2" className="border border-slate-400 p-1 text-right">মোট টাকা:</td>
                          <td className="border border-slate-400 p-1 font-mono">৳ ৩,২৫০/-</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="pt-6 flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-28 h-12 border-b border-slate-400 mb-1 flex items-center justify-center">
                          {docFields.signatureUrl ? (
                            <img
                              src={docFields.signatureUrl}
                              alt="টাকা জমা প্রদানকারী স্বাক্ষর"
                              className="max-h-11 max-w-[110px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-xs text-slate-800">{docFields.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">টাকা জমা প্রদানকারী</span>
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-b border-slate-400 mb-1 font-serif italic text-xs">ম্যানেজার</div>
                        <span className="text-[9px] font-bold text-slate-700"> শাখা ব্যবস্থাপক</span>
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
