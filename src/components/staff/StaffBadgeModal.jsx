import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import BarcodeView from '../common/BarcodeView';

export default function StaffBadgeModal({ staff, department, position, onClose }) {
  if (!staff) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Official Staff Badge
            </h3>
            <p className="text-xs text-slate-500">Printable employee identity card with Code 128 barcode</p>
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
          <div className="w-72 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 overflow-hidden relative p-5 flex flex-col items-center">
            
            {/* Badge Top Bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <img src="/LogoC.png" alt="Logo" className="h-4 w-4 object-contain" />
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-800">NKB CORP</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                OFFICIAL BADGE
              </span>
            </div>

            {/* Photo Avatar */}
            <div className="mt-4 relative">
              <img
                src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                alt={staff.firstName}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-300 shadow-md bg-slate-100"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center">
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
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4 flex flex-col items-center shadow-inner">
              <BarcodeView
                value={staff.barcodeValue || staff.employeeId}
                width={1.4}
                height={38}
                displayValue={false}
              />
              <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
                {staff.employeeId}
              </span>
            </div>

            {/* Verification Footer */}
            <div className="mt-3 text-[9px] text-slate-500 flex items-center gap-2">
              <span>● Clock-in Kiosk Compatible</span>
              <span>● Pin: {staff.pin || '12345678'}</span>
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
