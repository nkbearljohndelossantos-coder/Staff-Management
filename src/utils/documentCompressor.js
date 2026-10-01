/**
 * documentCompressor.js
 * High-performance client-side document compressor and extractor for HR requirements.
 * 
 * Compresses uploads using native CompressionStream('gzip') and Canvas image downscaling.
 * Allows storing dozens of 201 requirement documents without exceeding browser storage limits.
 * Live extracts documents via DecompressionStream('gzip') when opened or downloaded.
 */

export const REQUIREMENT_CATEGORIES = [
  { id: 'sss', label: 'SSS (E-1 / UMID / Static Record)', color: 'blue' },
  { id: 'philhealth', label: 'PhilHealth (MDR / Member Record)', color: 'emerald' },
  { id: 'hdmf', label: 'Pag-IBIG / HDMF (MID / Member Form)', color: 'amber' },
  { id: 'tin', label: 'BIR TIN (Form 1902 / 2316 / Verified)', color: 'purple' },
  { id: 'nbi', label: 'NBI / Police Clearance', color: 'rose' },
  { id: 'medical', label: 'Medical Exam / Fit to Work / Drug Test', color: 'teal' },
  { id: 'contract', label: 'Signed Employment Contract & Job Offer', color: 'indigo' },
  { id: 'resume', label: 'Resume / Curriculum Vitae / Biodata', color: 'cyan' },
  { id: 'diploma', label: 'Diploma / Transcript of Records (TOR)', color: 'orange' },
  { id: 'valid_id', label: 'Government Valid ID (Passport / License / PRC)', color: 'violet' },
  { id: 'birth_cert', label: 'PSA Birth / Marriage Certificate', color: 'pink' },
  { id: 'company_policy', label: 'Code of Conduct & NDA Acknowledgment', color: 'sky' },
  { id: 'other', label: 'Other 201 Requirement Document', color: 'slate' }
];

export async function compressImage(file, maxDimension = 1600, quality = 0.76) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return resolve(null);
    }
    if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(null);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function gzipBuffer(buffer) {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([buffer]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      return await compressedBlob.arrayBuffer();
    } catch (e) {
      console.warn('Gzip stream fallback:', e);
    }
  }
  return buffer;
}

export async function gunzipBuffer(buffer) {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new Blob([buffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      return await decompressedBlob.arrayBuffer();
    } catch (e) {
      console.warn('Gunzip stream fallback:', e);
    }
  }
  return buffer;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function compressDocument(file, metadata = {}) {
  const originalSize = file.size;
  let workBlob = file;
  let finalType = file.type || 'application/octet-stream';

  if (file.type && file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    const optimized = await compressImage(file);
    if (optimized && optimized.size < file.size) {
      workBlob = optimized;
      finalType = 'image/jpeg';
    }
  }

  const buffer = await workBlob.arrayBuffer();
  const compressedBuffer = await gzipBuffer(buffer);
  const compressedBase64 = arrayBufferToBase64(compressedBuffer);
  const compressedBytes = compressedBuffer.byteLength;
  const savedBytes = Math.max(0, originalSize - compressedBytes);
  const ratio = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  const categoryObj = REQUIREMENT_CATEGORIES.find(c => c.id === metadata.category) || {
    id: metadata.category || 'other',
    label: metadata.categoryLabel || 'Requirement Document'
  };

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    category: categoryObj.id,
    categoryLabel: categoryObj.label,
    notes: metadata.notes || '',
    type: finalType,
    originalType: file.type,
    originalSize: Math.round(originalSize / 1024),
    compressedSize: Math.max(1, Math.round(compressedBytes / 1024)),
    compressionRatio: `${ratio}% saved`,
    compressed: true,
    compressedData: compressedBase64,
    uploadedAt: new Date().toISOString(),
    uploadedBy: metadata.uploadedBy || 'HR Management',
    status: 'Filed'
  };
}

export async function extractDocument(doc) {
  if (!doc) return null;
  if (!doc.compressed || !doc.compressedData) {
    return {
      objectUrl: doc.dataUrl || '',
      blob: null,
      type: doc.type || 'application/pdf',
      name: doc.name || 'Document',
      extractedSize: doc.size || 0
    };
  }

  const compressedBuffer = base64ToArrayBuffer(doc.compressedData);
  const extractedBuffer = await gunzipBuffer(compressedBuffer);
  const blob = new Blob([extractedBuffer], { type: doc.type || 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);

  return {
    objectUrl,
    blob,
    type: doc.type,
    name: doc.name,
    extractedSize: Math.round(blob.size / 1024)
  };
}
