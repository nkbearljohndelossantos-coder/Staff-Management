import React from 'react';
import { X, Printer, ShieldCheck, Store, ScanBarcode } from 'lucide-react';
import BarcodeView from '../common/BarcodeView';

export default function CanteenPassModal({ onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-950 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Official Canteen Barcode Pass
              </h3>
              <p className="text-xs text-slate-500">
                System barcode pass for register operations &amp; authorizations
              </p>
            </div>
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
        <div id="printable-canteen-pass" className="flex flex-col items-center">
          <div className="w-80 bg-white text-slate-900 rounded-2xl shadow-xl border-2 border-slate-900 overflow-hidden relative p-6 flex flex-col items-center">
            
            {/* Top Security Stripe */}
            <div className="w-full bg-slate-950 text-white py-1.5 px-3 rounded-xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/LogoC.png" alt="NKB Logo" className="h-4 w-4 object-contain" />
                <span className="text-[10px] font-black tracking-widest uppercase">NKB MANUFACTURING</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white text-slate-950 font-mono font-black">
                CANTEEN PASS
              </span>
            </div>

            {/* Emblem / Avatar */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 text-white flex items-center justify-center border-4 border-white shadow-lg">
                <Store className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="text-center w-full mb-3">
              <h2 className="text-xl font-black text-slate-950 tracking-tight">CANTEEN</h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Canteen Administrator &amp; Food Services
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                <span>Pass Code:</span>
                <span className="text-slate-950 font-black">NKBCANTEEN</span>
              </div>
            </div>

            {/* High-Resolution Code 128 Barcode */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center">
              <BarcodeView 
                value="NKBCANTEEN" 
                format="CODE128" 
                height={55}
                width={1.9}
                displayValue={true}
              />
              <span className="text-[9px] text-slate-500 font-medium mt-1">
                Scan with handheld scanner gun or terminal
              </span>
            </div>

            {/* Footer Badge Note */}
            <div className="w-full mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span>Authority: NKB Operations</span>
              <span className="font-mono">VALIDATED</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Printer className="h-4 w-4" />
            Print Official Barcode Pass
          </button>
        </div>

      </div>
    </div>
  );
}
