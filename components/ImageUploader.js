'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';

// Client-side image compression to ensure ultra-fast uploads under 300KB
const compressClientImage = (file, maxDim = 1200, quality = 0.82) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export default function ImageUploader({ label, value, onChange, placeholder = "JPG, PNG (ক্লিক করে আপলোড করুন)" }) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const processAndUpload = async (file) => {
    if (!file) return;
    setProcessing(true);
    try {
      const compressedDataUrl = await compressClientImage(file);
      if (compressedDataUrl) {
        onChange(compressedDataUrl);
      }
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUpload(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
      </label>

      {processing ? (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 flex items-center justify-center space-x-2 text-blue-600 text-xs font-medium">
          <Loader2 size={16} className="animate-spin" />
          <span>ছবি সাইজ প্রস্তুত করা হচ্ছে...</span>
        </div>
      ) : value ? (
        <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-14 h-14 rounded-md border border-slate-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
              {/* Preview image */}
              <img src={value} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                <CheckCircle size={12} />
                <span>ফাইল সফলভাবে সংযুক্ত</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all ml-2 flex-shrink-0"
            title="মুছে ফেলুন"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              processAndUpload(file);
            }
          }}
          className={`cursor-pointer border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-all ${
            dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-white'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-2">
            <Upload size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-700 text-center">{label}</p>
          <p className="text-[11px] text-slate-400 text-center mt-0.5">{placeholder}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
