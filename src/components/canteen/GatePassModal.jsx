import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, Package, Calendar, User, Building2, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GatePassModal({ gatePass, onClose }) {
  const { clearGatePass, currentUser, isSuperAdmin } = useApp();

  if (!gatePass) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCleared = gatePass.gateStatus === 'Cleared at Gate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      
      {/* Modal Container */}
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Action Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Official Factory Gate Pass (Half A4 / A5)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {gatePass.gatePassNo} · Canteen Grocery Clearance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCleared && (
              <button
                type="button"
                onClick={() => clearGatePass(gatePass.gatePassNo, currentUser ? `${currentUser.name} (Security)` : 'Officer R. Mendoza (Main Gate)')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />
                Clear at Gate
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-900" />
              Print / Save as PDF (Half A4)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Half-A4 Gate Pass Document Area */}
        <div className="p-6 bg-slate-100/60 overflow-y-auto max-h-[75vh] flex justify-center print:p-0 print:bg-white print:max-h-none print:overflow-visible">
          
          <div 
            id="nkb-gate-pass-printable"
            className="w-full max-w-[148mm] min-h-[210mm] bg-white border border-slate-300 print:border-none p-6 text-slate-900 shadow-sm print:shadow-none flex flex-col justify-between"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Header */}
            <div className="space-y-3 pb-3 border-b-2 border-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                    NKB Manufacturing Corp.
                  </h1>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Plant Security &amp; Outbound Logistics Division
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    National Highway, Canlubang Industrial Estate, Calamba, Laguna
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-black tracking-wider">
                    HALF A4 · GATE PASS
                  </span>
                  <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                    {gatePass.gatePassNo}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-slate-500 font-bold block text-[9px] uppercase">Purpose / Clearance</span>
                  <span className="font-bold text-slate-800">Canteen Grocery &amp; Household Pantry Clearance</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block text-[9px] uppercase">Exit Validity</span>
                  <span className="font-bold text-slate-800">Date of Issue Only</span>
                </div>
              </div>
            </div>

            {/* Bearer & Transaction Details */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-[10px]">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Bearer / Employee:</span>
                  <span className="font-bold text-slate-900 text-xs">{gatePass.staffName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Employee ID:</span>
                  <span className="font-mono font-bold text-slate-700">{gatePass.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Department:</span>
                  <span className="font-medium text-slate-700">{gatePass.departmentName}</span>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Date &amp; Time Issued:</span>
                  <span className="font-mono text-slate-700">{new Date(gatePass.date).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Receipt Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{gatePass.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[9px] uppercase">Payment Scheme:</span>
                  <span className="font-bold text-slate-800">{gatePass.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Itemized Manifest Table */}
            <div className="flex-1 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                  Authorized Grocery Manifest ({gatePass.items?.length || 0} Items)
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Physical Gate Count</span>
              </div>

              <table className="w-full text-left text-[10px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[9px] font-extrabold uppercase">
                    <th className="p-1.5 w-8 text-center">Chk</th>
                    <th className="p-1.5">Item Description &amp; SKU</th>
                    <th className="p-1.5 text-center w-16">Qty / Unit</th>
                    <th className="p-1.5 text-right w-18">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gatePass.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-200">
                        [ ✓ ]
                      </td>
                      <td className="p-1.5 border-r border-slate-200">
                        <div className="font-bold text-slate-800">{it.name}</div>
                        {it.barcode && (
                          <div className="font-mono text-[8px] text-slate-400">{it.barcode}</div>
                        )}
                      </td>
                      <td className="p-1.5 text-center font-bold text-slate-700 border-r border-slate-200">
                        {it.quantity} {it.unit || 'pcs'}
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-800">
                        ₱{(it.total || it.unitPrice * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <td colSpan="3" className="p-1.5 text-right text-[10px] text-slate-600 uppercase">
                      Total Declared Grocery Value:
                    </td>
                    <td className="p-1.5 text-right font-mono font-black text-slate-900 text-xs">
                      ₱{gatePass.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Security Notice */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[9px] text-slate-600 leading-tight my-2">
              <strong>Notice to Plant Security:</strong> This Gate Pass certifies that the above items were purchased from the NKB Company Canteen and authorized for egress through Factory Perimeter Gates. Any discrepancy in item quantity or packaging must be reported to Canteen Management immediately.
            </div>

            {/* Authorization Sign-off Section */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t-2 border-slate-900 text-[9px] text-center">
              <div>
                <div className="h-8 flex items-end justify-center font-serif text-[10px] italic text-slate-700 border-b border-slate-300 pb-0.5">
                  {gatePass.issuedBy || 'Maria Santos'}
                </div>
                <span className="font-bold text-slate-800 block mt-1 uppercase text-[8px]">
                  Authorized Issuer
                </span>
                <span className="text-slate-400 block text-[8px]">
                  Canteen &amp; Inventory Lead
                </span>
              </div>

              <div>
                <div className="h-8 flex items-end justify-center font-serif text-[10px] italic text-slate-700 border-b border-slate-300 pb-0.5">
                  {gatePass.staffName}
                </div>
                <span className="font-bold text-slate-800 block mt-1 uppercase text-[8px]">
                  Employee / Bearer
                </span>
                <span className="text-slate-400 block text-[8px]">
                  Acknowledge Receipt &amp; Exit
                </span>
              </div>

              <div>
                <div className="h-8 flex items-end justify-center font-mono text-[9px] font-bold text-slate-800 border-b border-slate-300 pb-0.5">
                  {gatePass.securityGuard || (isCleared ? 'Officer Cleared' : '___________________')}
                </div>
                <span className="font-bold text-slate-800 block mt-1 uppercase text-[8px]">
                  Plant Gate Security
                </span>
                <span className="text-slate-400 block text-[8px]">
                  {isCleared ? `Cleared ${gatePass.clearedAt ? new Date(gatePass.clearedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}` : 'Inspection & Time-Out'}
                </span>
              </div>
            </div>

            {/* Bottom Barcode */}
            <div className="mt-3 pt-2 border-t border-slate-200 text-center">
              <div className="inline-block px-4 py-1 bg-white border border-slate-300 rounded font-mono font-bold tracking-widest text-[10px] text-slate-900">
                *{gatePass.gatePassNo}*
              </div>
              <p className="text-[8px] text-slate-400 mt-0.5">
                NKB Standard A5 / Half-A4 Format · Document Control #SEC-GP-2026
              </p>
            </div>

          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span className="text-[11px]">
            Format: Half A4 Paper (A5: 148mm × 210mm). Use Print button to export as PDF.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Embedded Print CSS for exact Half A4 / A5 Page Output */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm;
          }
          body * {
            visibility: hidden !important;
          }
          #nkb-gate-pass-printable,
          #nkb-gate-pass-printable * {
            visibility: visible !important;
          }
          #nkb-gate-pass-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
}
