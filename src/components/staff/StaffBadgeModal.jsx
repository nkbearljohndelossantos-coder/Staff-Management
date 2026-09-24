import React, { useState } from 'react';
import { X, Printer, ShieldCheck, QrCode, Copy, Check, ScanLine } from 'lucide-react';
import BarcodeView from '../common/BarcodeView';
import QRCodeView from '../common/QRCodeView';

export default function StaffBadgeModal({ staff, department, position, onClose }) {
  if (!staff) return null;

  const [copiedType, setCopiedType] = useState(null);

  const employeeId = staff.employeeId || staff.id;
  const barcodeValue = staff.barcodeValue || employeeId;
  const qrPayload = `NKB-STAFF:${employeeId}:${staff.firstName}_${staff.lastName}:AUTH-2026`;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              Official Staff Digital ID Badge
            </h3>
            <p className="text-[11px] text-slate-500">Employee identity card with Code 128 barcode &amp; 2D QR pass</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Printable Badge Card */}
        <div id="printable-content" className="flex flex-col items-center">
          <div className="w-full max-w-xs bg-white text-slate-900 rounded-3xl shadow-xl border border-slate-300 overflow-hidden relative p-5 flex flex-col items-center">
            
            {/* Badge Top Bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <img src="/LogoC.png" alt="Logo" className="h-5 w-5 object-contain" />
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-800">NKB CORP</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                VERIFIED ID
              </span>
            </div>

            {/* Photo Avatar */}
            <div className="mt-4 relative">
              <img
                src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                alt={staff.firstName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-md bg-slate-100"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Staff Info */}
            <div className="text-center mt-3">
              <h4 className="font-extrabold text-base tracking-tight text-slate-900">
                {staff.firstName} {staff.lastName}
              </h4>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                {position?.title || 'Team Member'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {department?.name || 'Department'}
              </p>
            </div>

            {/* Rendered Barcode */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 mt-4 flex flex-col items-center shadow-inner">
              <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Code 128 Barcode</span>
                <button
                  type="button"
                  onClick={() => handleCopy(barcodeValue, 'barcode')}
                  className="text-cyan-700 hover:text-cyan-900 flex items-center gap-0.5 font-bold cursor-pointer"
                >
                  {copiedType === 'barcode' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedType === 'barcode' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <BarcodeView
                value={barcodeValue}
                width={1.5}
                height={40}
                displayValue={false}
              />
              <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
                {barcodeValue}
              </span>
            </div>

            {/* 2D QR Code */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 mt-3 flex flex-col items-center shadow-inner">
              <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>2D Turnstile QR Pass</span>
                <button
                  type="button"
                  onClick={() => handleCopy(qrPayload, 'qr')}
                  className="text-cyan-700 hover:text-cyan-900 flex items-center gap-0.5 font-bold cursor-pointer"
                >
                  {copiedType === 'qr' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedType === 'qr' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <QRCodeView
                value={qrPayload}
                size={110}
              />
            </div>

            {/* Verification Footer */}
            <div className="mt-3 text-[9px] text-slate-500 flex items-center justify-between w-full px-1">
              <span>● Kiosk Compatible</span>
              <span>PIN: {staff.pin || '12345678'}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition"
          >
            <Printer className="h-4 w-4 text-white" />
            Print Badge
          </button>
        </div>

      </div>
    </div>
  );
}
