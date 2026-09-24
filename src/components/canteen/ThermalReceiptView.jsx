import React, { useState } from 'react';
import { Printer, Download, Copy, Check, X, Smartphone, Store, ShieldCheck } from 'lucide-react';
import BarcodeView from '../common/BarcodeView';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function ThermalReceiptView({ receipt, onClose }) {
  if (!receipt) return null;

  useEscapeKey('canteen-thermal-receipt-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' | '58mm'
  const [copiedEscPos, setCopiedEscPos] = useState(false);

  const effectiveDate = (receipt.isLateEncoded && receipt.claimedDate)
    ? receipt.claimedDate
    : (receipt.date || new Date().toISOString());

  // Generate raw ESC/POS command text for serial/bluetooth POS receipt printers
  const generateEscPosText = () => {
    const divider = '------------------------------------------\n';
    let text = '';
    text += '          NKB MANUFACTURING          \n';
    text += '       PLANT CANTEEN SERVICES        \n';
    text += '        Facility Cafeteria 2         \n';
    text += divider;
    text += `Receipt No: ${receipt.receiptNo}\n`;
    text += `Date: ${new Date(effectiveDate).toLocaleDateString()} ${new Date(receipt.actualEncodedAt || receipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `Customer: ${receipt.customerName || 'Staff Member'}\n`;
    if (receipt.staffId) text += `Staff ID: ${receipt.staffId}\n`;
    text += `Type: ${receipt.orderType || 'Dine In'}\n`;
    text += `Payment: ${receipt.paymentMethod || 'Cash'}\n`;
    if (receipt.gatePassNo) text += `Gate Pass: ${receipt.gatePassNo}\n`;
    text += divider;
    text += 'QTY  DESCRIPTION                 TOTAL   \n';
    text += divider;

    (receipt.items || []).forEach(item => {
      const name = (item.name || 'Item').padEnd(20, ' ').substring(0, 20);
      const qty = String(item.quantity || 1).padEnd(4, ' ');
      const total = `P${Number(item.total || (item.unitPrice * item.quantity)).toFixed(2)}`.padStart(10, ' ');
      text += `${qty}${name}${total}\n`;
    });

    text += divider;
    text += `TOTAL AMOUNT:            P${Number(receipt.total || 0).toFixed(2)}\n`;
    text += divider;
    text += '   Thank you for your hard work!    \n';
    text += '    NKB Manufacturing Staff Care    \n';
    text += '\n\n\n';
    return text;
  };

  const handleCopyEscPos = () => {
    const text = generateEscPosText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEscPos(true);
      setTimeout(() => setCopiedEscPos(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        
        {/* Top Controls Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-cyan-400" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Canteen POS Thermal Receipt</h3>
              <p className="text-[10px] text-slate-400">Direct Thermal Print &amp; ESC/POS Compatible</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 58mm vs 80mm Paper Width Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  paperWidth === '80mm' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  paperWidth === '58mm' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Paper Receipt Simulation View */}
        <div className="p-6 bg-slate-100 overflow-y-auto flex justify-center">
          <div
            id="printable-receipt"
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white border border-slate-300 shadow-md p-5 text-slate-900 font-mono text-xs rounded-xl relative transition-all"
          >
            {/* Top Serrated Edge Mock */}
            <div className="w-full h-1 border-t-2 border-dashed border-slate-300 mb-4" />

            {/* Receipt Header */}
            <div className="text-center space-y-1 mb-3">
              <div className="font-black text-sm tracking-tight text-slate-950">NKB MANUFACTURING</div>
              <div className="text-[10px] font-bold text-slate-600">PLANT CANTEEN SERVICES</div>
              <div className="text-[9px] text-slate-500">Facility Cafeteria 2 · Non-VAT Staff Subsidy</div>
              <div className="text-[10px] font-bold text-slate-700 pt-1">
                RECEIPT #: <span className="text-slate-950">{receipt.receiptNo}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Receipt Metadata */}
            <div className="text-[10px] space-y-0.5 text-slate-600">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-bold text-slate-900">{new Date(effectiveDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-bold text-slate-900">
                  {new Date(receipt.actualEncodedAt || receipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{receipt.customerName || 'Staff'}</span>
              </div>
              {receipt.staffId && (
                <div className="flex justify-between">
                  <span>ID No:</span>
                  <span className="font-bold text-slate-900">{receipt.staffId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Order Nature:</span>
                <span className="font-bold text-slate-900">{receipt.orderType || 'Dine In'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold text-slate-900">{receipt.paymentMethod || 'Cash'}</span>
              </div>
              {receipt.gatePassNo && (
                <div className="flex justify-between text-cyan-800 font-bold">
                  <span>Gate Pass:</span>
                  <span>{receipt.gatePassNo}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Item Table */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {(receipt.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[9px] text-slate-500">
                      {item.quantity} x ₱{Number(item.unitPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-bold font-mono text-slate-900 shrink-0">
                    ₱{Number(item.total || (item.unitPrice * item.quantity)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-400 my-3" />

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL:</span>
                <span className="font-mono">₱{Number(receipt.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>VAT Zero-Rated:</span>
                <span>₱0.00</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Barcode Footer */}
            <div className="flex flex-col items-center justify-center pt-1">
              <BarcodeView value={receipt.receiptNo} width={1.2} height={32} displayValue={false} />
              <span className="text-[9px] font-bold tracking-widest text-slate-600 mt-1">
                {receipt.receiptNo}
              </span>
              <p className="text-[8px] text-center text-slate-400 mt-2">
                Thank you for your dedicated service!<br />
                NKB Manufacturing Staff Wellness
              </p>
            </div>

            {/* Bottom Serrated Edge Mock */}
            <div className="w-full h-1 border-b-2 border-dashed border-slate-300 mt-4" />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleCopyEscPos}
            className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedEscPos ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
            <span>{copiedEscPos ? 'Copied ESC/POS!' : 'Copy ESC/POS Commands'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Print Thermal Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
