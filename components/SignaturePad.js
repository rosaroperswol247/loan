'use client';

import { useRef, useState, useEffect } from 'react';
import { Trash2, Upload, Loader2, Sparkles } from 'lucide-react';
import { processSignatureImage } from '@/lib/signature-processor';

export default function SignaturePad({ onSave, initialSignature }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [processingUpload, setProcessingUpload] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High resolution canvas
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth || 350;
    const height = canvas.offsetHeight || 140;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, width, height);
          setHasSignature(true);
        } catch {}
      };
      img.onerror = () => {};
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (onSave && canvas) {
      try {
        onSave(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas export failed:', err);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSave) {
      onSave('');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingUpload(true);
    try {
      const processedPng = await processSignatureImage(file);
      if (!processedPng) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          const width = canvas.offsetWidth || 350;
          const height = canvas.offsetHeight || 140;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Calculate aspect-fit dimensions inside canvas
          let drawW = width;
          let drawH = height;
          if (img.width && img.height) {
            const aspect = img.width / img.height;
            if (aspect > width / height) {
              drawW = width * 0.85;
              drawH = drawW / aspect;
            } else {
              drawH = height * 0.85;
              drawW = drawH * aspect;
            }
          }
          const posX = (width - drawW) / 2;
          const posY = (height - drawH) / 2;

          ctx.drawImage(img, posX, posY, drawW, drawH);
          setHasSignature(true);
          if (onSave) onSave(processedPng);
        };
        img.src = processedPng;
      }
    } catch (err) {
      console.warn('Failed to process uploaded signature:', err);
    } finally {
      setProcessingUpload(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair touch-none"
        />
        {!hasSignature && !processingUpload && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs space-y-1">
            <span>এখানে হাত দিয়ে ডিজিটাল স্বাক্ষর দিন</span>
            <span className="text-[10px] text-slate-400">অথবা নিচে &ldquo;স্বাক্ষরের ছবি দিন&rdquo; বাটনে ক্লিক করে কাগজের ছবি আপলোড করুন</span>
          </div>
        )}
        {processingUpload && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center space-x-2 text-xs font-semibold text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            <span>স্বাক্ষরের ব্যাকগ্রাউন্ড রিমুভ হচ্ছে...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all shadow-sm active:scale-95">
            {processingUpload ? (
              <Loader2 size={13} className="animate-spin text-blue-600" />
            ) : (
              <Upload size={13} />
            )}
            <span>স্বাক্ষরের ছবি দিন (Auto BG Remove)</span>
            <input
              type="file"
              accept="image/*"
              disabled={processingUpload}
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 active:scale-95 text-red-700 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all shadow-sm"
        >
          <Trash2 size={13} />
          <span>স্বাক্ষর মুছুন</span>
        </button>
      </div>
    </div>
  );
}
