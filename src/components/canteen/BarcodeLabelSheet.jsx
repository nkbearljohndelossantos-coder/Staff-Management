import React, { useState } from 'react';
import { Printer, Tag, X, Check, Copy, Grid } from 'lucide-react';
import BarcodeView from '../common/BarcodeView';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function BarcodeLabelSheet({ inventory = [], onClose }) {
  useEscapeKey('canteen-barcode-label-sheet', ESCAPE_PRIORITY.MODAL, true, onClose);

  const [selectedItems, setSelectedItems] = useState(() => {
    // Default select first 12 items or all if fewer
    return inventory.slice(0, 12).map(i => i.id);
  });
  const [copiesPerItem, setCopiesPerItem] = useState(2);

  const toggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(inventory.map(i => i.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  // Compile list of labels to print
  const labelsToPrint = [];
  inventory.forEach(item => {
    if (selectedItems.includes(item.id)) {
      for (let i = 0; i < copiesPerItem; i++) {
        labelsToPrint.push(item);
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[95vh] my-auto">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Canteen Barcode Sticker Sheet</h3>
              <p className="text-[10px] text-slate-400">Standard A4 24-Up Adhesive Label Paper Layout</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-[11px] font-bold">Copies each:</span>
              <select
                value={copiesPerItem}
                onChange={(e) => setCopiesPerItem(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold"
              >
                <option value={1}>1 copy</option>
                <option value={2}>2 copies</option>
                <option value={4}>4 copies</option>
                <option value={6}>6 copies</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sticker Sheet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Item Selection Toolbar (Hidden on Print) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-bold text-slate-700 hover:text-slate-950 underline cursor-pointer"
            >
              Select All ({inventory.length})
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Deselect All
            </button>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Total stickers to print: <strong>{labelsToPrint.length}</strong>
          </span>
        </div>

        {/* Printable Label Grid */}
        <div className="p-6 bg-slate-100 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            {labelsToPrint.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-between text-center min-h-[120px] print:border-slate-300 print:break-inside-avoid"
              >
                <div className="w-full">
                  <div className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 truncate">
                    NKB CANTEEN
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate mt-0.5" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.brand || item.category || 'Supplies'}
                  </div>
                </div>

                <div className="my-1.5 flex flex-col items-center">
                  <BarcodeView
                    value={item.barcode || item.id}
                    width={1.2}
                    height={28}
                    displayValue={false}
                  />
                  <span className="font-mono text-[9px] font-bold text-slate-800 tracking-wider">
                    {item.barcode || item.id}
                  </span>
                </div>

                <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[9px] text-slate-400 uppercase font-sans">Price</span>
                  <span className="font-black text-slate-900">₱{Number(item.sellingPrice || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
