import React from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Printer, 
  Building2, 
  Calendar, 
  DollarSign, 
  Boxes, 
  CheckCircle2, 
  Barcode, 
  Layers,
  Trash2,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function SalesInvoiceDetailModal({ invoice, onClose }) {
  const { deleteCanteenSalesInvoice, isCanteen, isITAdmin, isSuperAdmin } = useApp();

  useEscapeKey('sales-invoice-detail-modal', ESCAPE_PRIORITY.MODAL, Boolean(invoice), onClose);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    const revert = window.confirm(
      `Do you want to REVERT (deduct) the inbound quantities (${invoice.totalUnits} units) from Canteen Inventory as well?\n\nClick "OK" to revert stock and delete invoice.\nClick "Cancel" to abort.`
    );
    if (revert !== null) {
      deleteCanteenSalesInvoice(invoice.id, true);
      onClose();
    }
  };

  const items = invoice.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Supplier Sales Invoice Voucher
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  {invoice.status || 'POSTED_TO_INVENTORY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {invoice.invoiceNumber} · {invoice.supplier}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isCanteen || isITAdmin || isSuperAdmin) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Delete this invoice and optionally revert inventory stock"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Revert / Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-900" />
              <span>Print Voucher</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document Container */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible print:p-4 text-slate-800">
          
          {/* Official Document Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                NKB General Merchandise &amp; Canteen Services
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-0.5 uppercase">
                Inbound Goods Receiving Voucher
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official Supplier Inbound Delivery Receipt &amp; Inventory Stock Intake
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-200 sm:border-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Sales Invoice Reference
              </span>
              <div className="text-lg font-mono font-black text-indigo-700">
                {invoice.invoiceNumber}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Intake Date: <span className="font-semibold text-slate-800">{invoice.receivedDate || invoice.purchaseDate}</span>
              </span>
            </div>
          </div>

          {/* Supplier & Delivery Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Supplier / Vendor</span>
              <span className="font-black text-slate-900 text-sm">{invoice.supplier}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Terms</span>
              <span className="font-bold text-slate-800">{invoice.paymentMethod || 'Company Fund'}</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {invoice.paymentStatus || 'Paid'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Purchase Date</span>
              <span className="font-semibold text-slate-800">{invoice.purchaseDate}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Intake Encoded By</span>
              <span className="font-semibold text-slate-800">{invoice.encodedBy || 'Glen Nobleza'}</span>
            </div>

            {invoice.notes && (
              <div className="sm:col-span-2 lg:col-span-4 border-t border-slate-200/80 pt-2.5 mt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery Memo / Notes:</span>
                <span className="text-slate-700 font-medium italic">{invoice.notes}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Itemized Inbound Breakdown ({items.length} Line Items)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Flow: Items ➔ Details ➔ Canteen Inventory
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">#</th>
                    <th className="px-4 py-3">Product Name &amp; Barcode</th>
                    <th className="px-3 py-3">Category &amp; Brand</th>
                    <th className="px-3 py-3 text-center">Size &amp; Unit</th>
                    <th className="px-3 py-3 text-center">Qty Received</th>
                    <th className="px-3 py-3 text-right">Cost Price</th>
                    <th className="px-3 py-3 text-right">Selling Price</th>
                    <th className="px-3 py-3 text-right font-black text-slate-900">Subtotal</th>
                    <th className="px-3 py-3 text-center">Expiry (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const lineSubtotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.costPrice) || 0);
                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{it.name}</div>
                          {it.barcode ? (
                            <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Barcode className="h-3 w-3 text-slate-400" />
                              <span>{it.barcode}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              No Barcode Tagged
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800">{it.brand || 'General'}</div>
                          <div className="text-[10px] text-slate-500">{it.category}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-slate-800">
                            {it.size || 'Standard'}
                          </span>
                          <span className="block text-[10px] text-slate-400">({it.unit || 'Piece'})</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-black text-slate-900 bg-indigo-50/30">
                          {it.quantity}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-700">
                          ₱{Number(it.costPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                          ₱{Number(it.sellingPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-black text-slate-900">
                          ₱{lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-600">
                          {it.expirationDate || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right uppercase text-[11px] text-slate-600">
                      Total Invoice Summary:
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-black text-indigo-700 text-sm">
                      {invoice.totalUnits || items.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0)} units
                    </td>
                    <td colSpan="2" className="px-3 py-3 text-right uppercase text-[11px] text-slate-600">
                      Total Invoice Amount:
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-black text-slate-950 text-base">
                      ₱{(invoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Verification & Signature Blocks */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 h-10 flex items-end justify-center font-semibold text-slate-900">
                {invoice.encodedBy || 'Glen Nobleza'}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 mt-1 block">
                Received &amp; Encoded By
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 h-10 flex items-end justify-center font-semibold text-slate-900">
                Nannette MANUEL
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 mt-1 block">
                Canteen Administrator / Manager
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 h-10 flex items-end justify-center font-semibold text-slate-900">
                Audited &amp; Stocked
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 mt-1 block">
                Inventory Custodian Signature
              </span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
            NKB Manufacturing Corp — Staff Management &amp; Canteen Inventory Control System · System Document Generated: {new Date().toLocaleString()}
          </div>

        </div>

      </div>
    </div>
  );
}
