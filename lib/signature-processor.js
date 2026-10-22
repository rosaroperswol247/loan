/**
 * Smart Signature Processing & Background Removal
 * 
 * Takes an image of a physical signature (photo, scan, screenshot)
 * and extracts clean transparent ink strokes, removing paper background,
 * grain, shadows, and off-white tints.
 */

export async function processSignatureImage(fileOrDataUrl, options = {}) {
  if (!fileOrDataUrl) return null;

  // 1. Convert File or Blob to Data URL if needed
  let dataUrl;
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  if (!dataUrl) return null;

  // 2. Load into offscreen Image
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = dataUrl;
  });

  const naturalWidth = img.naturalWidth || img.width || 600;
  const naturalHeight = img.naturalHeight || img.height || 250;

  // Resize to standard working resolution (max 1400px) for speed & high DPI
  const maxDim = 1400;
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;
  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const len = data.length;

  // Step 1: Histogram analysis to find the paper background brightness
  // Paper in photos occupies 65-95% of all pixels and is the brightest cluster
  const histogram = new Array(256).fill(0);
  let validPixelCount = 0;

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a < 30) continue; // Skip existing transparent pixels
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[lum]++;
    validPixelCount++;
  }

  // Find 85th percentile of brightness (represents the paper background level)
  let cumulative = 0;
  let paperLum = 225; // Default fallback
  const targetCumulative = Math.floor(validPixelCount * 0.85);

  for (let l = 0; l < 256; l++) {
    cumulative += histogram[l];
    if (cumulative >= targetCumulative) {
      paperLum = Math.max(160, l);
      break;
    }
  }

  // Define dynamic thresholds based on detected paper luminance
  // Anything near paperLum is background paper.
  // Ink is distinctly darker than the paper.
  const highThreshold = Math.max(165, Math.min(245, paperLum - 12));
  const lowThreshold = Math.max(50, highThreshold - 75);

  let minX = targetWidth;
  let minY = targetHeight;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Preserve existing transparency
    if (a < 25) {
      data[i + 3] = 0;
      continue;
    }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Detect if the pixel is blue pen ink (ballpoint blue has high blue compared to red/green)
    const isBlueInk = (b > r + 18 && b > g + 8) || (b > 110 && b > r * 1.25);

    if (isBlueInk) {
      // Blue ink stroke detected! Keep rich navy/royal blue ink
      const inkLumRatio = Math.max(0, Math.min(1, (highThreshold - lum) / (highThreshold - lowThreshold)));
      const alpha = Math.max(180, Math.round(180 + inkLumRatio * 75));
      data[i] = Math.max(10, Math.min(40, Math.round(r * 0.5)));       // Dark Navy Red
      data[i + 1] = Math.max(25, Math.min(75, Math.round(g * 0.6)));   // Dark Navy Green
      data[i + 2] = Math.max(130, Math.min(210, b));                   // Crisp Pen Blue
      data[i + 3] = alpha;

      const pIdx = i / 4;
      const px = pIdx % targetWidth;
      const py = Math.floor(pIdx / targetWidth);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      hasInk = true;
    } else if (lum >= highThreshold) {
      // Paper background & surrounding shadows -> convert to pure 100% transparent
      data[i + 3] = 0;
    } else if (lum <= lowThreshold) {
      // Solid dark ink stroke -> 100% opaque crisp dark ink
      data[i] = 15;
      data[i + 1] = 23;
      data[i + 2] = 42; // Deep Slate-900 `#0f172a`
      data[i + 3] = 255;

      const pIdx = i / 4;
      const px = pIdx % targetWidth;
      const py = Math.floor(pIdx / targetWidth);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      hasInk = true;
    } else {
      // Anti-aliased transition between ink and background
      const ratio = (highThreshold - lum) / (highThreshold - lowThreshold);
      const alpha = Math.round(Math.pow(ratio, 1.1) * 255);
      data[i] = 15;
      data[i + 1] = 23;
      data[i + 2] = 42;
      data[i + 3] = alpha;

      if (alpha > 35) {
        const pIdx = i / 4;
        const px = pIdx % targetWidth;
        const py = Math.floor(pIdx / targetWidth);
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        hasInk = true;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Auto-crop to exact signature bounds with padding if ink was found
  if (hasInk && maxX > minX && maxY > minY) {
    const pad = 14;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(targetWidth - cropX, (maxX - minX) + pad * 2);
    const cropH = Math.min(targetHeight - cropY, (maxY - minY) + pad * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cropCtx = croppedCanvas.getContext('2d');
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return croppedCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}
