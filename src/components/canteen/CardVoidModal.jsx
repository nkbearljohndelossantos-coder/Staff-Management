import React, { useState } from 'react';
import { X, ShieldAlert, ScanBarcode, QrCode, Radio, CheckCircle, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CardVoidModal({ receipt, onClose }) {
  const { voidTransactionWithCard, currentUser } = useApp();
  const [authMethod, setAuthMethod] = useState('rfid'); // 'rfid', 'barcode', 'qr'
  const [cardBadgeId, setCardBadgeId] = useState('');
  const [reason, setReason] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!receipt) return null;

  const handleSimulateScan = (badgeId, method) => {
    setAuthMethod(method);
    setCardBadgeId(badgeId);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardBadgeId.trim()) {
      setErrorMsg('Please scan, tap, or enter a supervisor authorization card badge.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('A detailed reason for the void is mandatory for compliance.');
      return;
    }

    setIsAuthorizing(true);
    setErrorMsg('');

    setTimeout(() => {
      const methodLabel = 
        authMethod === 'rfid' ? 'RFID Badge Tap' :
        authMethod === 'qr' ? 'QR Code Scan' : 'Barcode Scan';

      const result = voidTransactionWithCard({
        receiptNo: receipt.receiptNo,
        cardId: cardBadgeId.trim(),
        authMethod: methodLabel,
        supervisorName: currentUser?.name || 'Authorized Supervisor',
        reason: reason.trim()
      });

      setIsAuthorizing(false);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.message || 'Void authorization failed.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <ShieldAlert className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Supervisor Card-Based Void Authorization
              </h3>
              <p className="text-[11px] text-slate-400">
                Receipt #{receipt.receiptNo} · Immutable Record Audit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Target Receipt Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Receipt Target:</span>
              <span className="font-mono font-bold text-white">{receipt.receiptNo}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Customer:</span>
              <span className="font-medium text-slate-300">{receipt.customerName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Charged:</span>
              <span className="font-bold text-white">₱{receipt.total?.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3 text-slate-400" />
                Items to Automatically Return to Stock ({receipt.items?.length || 0}):
              </div>
              <ul className="space-y-1 text-xs text-slate-300 pl-2">
                {receipt.items?.map((it, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-mono text-slate-400">+ {it.quantity} back to stock</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Authentication Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Card Verification Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAuthMethod('rfid')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  authMethod === 'rfid'
                    ? 'bg-white text-slate-950 border-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Radio className={`h-4 w-4 ${authMethod === 'rfid' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>RFID Badge</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('barcode')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  authMethod === 'barcode'
                    ? 'bg-white text-slate-950 border-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <ScanBarcode className={`h-4 w-4 ${authMethod === 'barcode' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>Barcode Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('qr')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  authMethod === 'qr'
                    ? 'bg-white text-slate-950 border-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <QrCode className={`h-4 w-4 ${authMethod === 'qr' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>QR Badge</span>
              </button>
            </div>
          </div>

          {/* Quick-Tap Simulation Cards */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Simulate Card Tap / Scan (Supervisor Badges)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateScan('RFID-CANT-8890', 'rfid')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition cursor-pointer"
              >
                <span className="font-bold text-white block">Maria Santos (Lead)</span>
                <span className="text-[9px] text-slate-400 font-mono">RFID-CANT-8890</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan('BARCODE-CEO-0001', 'barcode')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition cursor-pointer"
              >
                <span className="font-bold text-white block">Executive Super Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">BARCODE-CEO-0001</span>
              </button>
            </div>
          </div>

          {/* Card Identifier Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {authMethod === 'rfid' ? 'Scanned RFID Card Serial / UID' :
               authMethod === 'qr' ? 'Scanned QR Authorization Payload' : 'Scanned Barcode String'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={cardBadgeId}
                onChange={(e) => setCardBadgeId(e.target.value)}
                placeholder="Tap card on reader or click badge above..."
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
              />
              {cardBadgeId && (
                <CheckCircle className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>

          {/* Reason for Void */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason for Void <span className="text-slate-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Accidental duplicate scan, customer requested refund before leaving register..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
            />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing}
              className="px-5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isAuthorizing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Verifying Card &amp; Restoring Stock...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-950" />
                  Authorize Void &amp; Return Items
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
