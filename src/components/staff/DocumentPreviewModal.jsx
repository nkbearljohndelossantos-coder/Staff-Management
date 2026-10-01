import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Sparkles, AlertCircle, Eye, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { extractDocument } from '../../utils/documentCompressor';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function DocumentPreviewModal({ doc, onClose }) {
  useEscapeKey('document-preview-modal', ESCAPE_PRIORITY.MODAL, Boolean(doc), onClose);

  const [loading, setLoading] = useState(true);
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let urlToRevoke = null;

    if (!doc) return;

    setLoading(true);
    setError(null);

    extractDocument(doc)
      .then((res) => {
        if (!active) return;
        if (res && res.objectUrl) {
          urlToRevoke = res.objectUrl;
          setExtracted(res);
        } else {
          setError('Could not extract file payload.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to extract document:', err);
        setError('Extraction error: ' + (err.message || 'Corrupt data stream'));
        setLoading(false);
      });

    return () => {
      active = false;
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [doc]);

  if (!doc) return null;

  const isImage = (doc.type && doc.type.startsWith('image/')) || (extracted?.type && extracted.type.startsWith('image/'));
  const isPdf = doc.type === 'application/pdf' || extracted?.type === 'application/pdf' || (doc.name && doc.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                  {doc.name}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {doc.categoryLabel || '201 Requirement'}
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Extracted Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} · Filed by {doc.uploadedBy || 'HR'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compression Statistics Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-slate-400">
            <div>
              <span>Original Size: </span>
              <span className="font-mono font-bold text-slate-200">{doc.originalSize || doc.size || 0} KB</span>
            </div>
            <div>
              <span>Storage Used: </span>
              <span className="font-mono font-bold text-cyan-300">{doc.compressedSize || doc.size || 0} KB</span>
            </div>
            {doc.compressionRatio && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 font-mono">
                {doc.compressionRatio}
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-cyan-400" />
            <span>Encrypted in memory · Decompressed on-demand</span>
          </div>
        </div>

        {/* Main Content Preview Area */}
        <div className="flex-1 min-h-0 bg-slate-950/60 p-4 sm:p-6 overflow-auto flex items-center justify-center relative">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Decompressing and extracting requirement document...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-rose-300">{error}</p>
            </div>
          ) : isImage && extracted?.objectUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={extracted.objectUrl}
                alt={doc.name}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-700/80 bg-slate-900"
              />
            </div>
          ) : isPdf && extracted?.objectUrl ? (
            <iframe
              src={extracted.objectUrl}
              title={doc.name}
              className="w-full h-[65vh] rounded-xl border border-slate-700 bg-white"
            />
          ) : (
            <div className="text-center p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">{doc.name}</p>
              <p className="text-xs text-slate-400 mb-4">
                Extracted binary document ({extracted?.extractedSize || doc.originalSize || 0} KB)
              </p>
              {extracted?.objectUrl && (
                <a
                  href={extracted.objectUrl}
                  download={doc.name}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            {doc.notes ? (
              <span className="italic">Note: {doc.notes}</span>
            ) : (
              <span>Requirement filed in employee 201 records</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {extracted?.objectUrl && (
              <a
                href={extracted.objectUrl}
                download={doc.name}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-slate-950" />
                <span>Save to Computer</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
