import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  Boxes, 
  Barcode, 
  Wand2, 
  Tag, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  DollarSign, 
  Building2, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { playScanBeep } from '../../utils/audioFeedback';
import { 
  isBoxOrPackItem, 
  extractPiecesFromItem, 
  getEffectiveRetailPiecePrice 
} from '../../utils/canteenPricing';

const COMMON_SIZES = [
  'Solo', 'Piece', 'Standard', '500ml', '1L', '330ml', '250ml', '210g', '155g', '100g', '80g', '60g', 'Can', 'Bottle', 'Pack', 'Twin Pack', 'Box', 'Cup'
];

const COMMON_UNITS = [
  'Piece', 'Pack', 'Sachet/Pack', 'Box', 'Twin Pack', 'Bundle', 'Case', 'Can', 'Bottle', 'Cup', 'Loaf', 'Sachet', 'Pouch', 'Serving'
];

const COMMON_BRANDS = [
  'San Miguel', 'Monde Nissin', 'Universal Robina', 'Lucky Me!', 'C2', 'Nestle', 'Purefoods', 'Magnolia', 'Nature Spring', 'Bear Brand', 'Kopiko', 'Century Tuna', 'Jack \'n Jill'
];

const COMMON_SUPPLIERS = [
  'R/L Abad Distribution', 'BGC Beverage Distributors', 'NKB Food Wholesalers', 'Direct Supplier'
];

export default function NewSupplyItemModal({ isOpen, onClose }) {
  const { 
    canteenCategories = [], 
    addCanteenCategory, 
    addSupplyItem 
  } = useApp();

  // Escape to close
  useEscapeKey('new-supply-item-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  // Form State
  // PRIORITIZED FIELDS
  const [name, setName] = useState('');
  const [size, setSize] = useState('Piece');
  const [quantity, setQuantity] = useState(0);

  // OPTIONAL FIELDS
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [hasRetailPiece, setHasRetailPiece] = useState(false);
  const [piecesPerPack, setPiecesPerPack] = useState('');
  const [retailPiecePrice, setRetailPiecePrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [company, setCompany] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [reorderLevel, setReorderLevel] = useState(10);
  const [expirationDate, setExpirationDate] = useState('');
  
  // UI Helpers
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [keepOpenAfterSave, setKeepOpenAfterSave] = useState(false);
  const [showInlineAddCategory, setShowInlineAddCategory] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const nameInputRef = useRef(null);

  // Auto-focus on modal open & reset
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSize('Piece');
      setQuantity(0);
      setBarcode('');
      setCostPrice('');
      setSellingPrice('');
      setHasRetailPiece(false);
      setPiecesPerPack('');
      setRetailPiecePrice('');
      setCategory(canteenCategories?.[0] || 'General Supplies');
      setBrand('');
      setCompany('R/L Abad Distribution');
      setUnit('Piece');
      setReorderLevel(10);
      setExpirationDate('');
      setErrorMessage('');
      setShowInlineAddCategory(false);
      setInlineCategoryInput('');
      
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, canteenCategories]);

  // Auto-activate retail piece option if name, size or unit indicates Box, Pack, Twin, etc.
  useEffect(() => {
    if (isBoxOrPackItem({ name, size, unit })) {
      setHasRetailPiece(true);
      setShowOptionalDetails(true);
      const estPieces = extractPiecesFromItem({ name, size, unit });
      if (estPieces > 1 && !piecesPerPack) {
        setPiecesPerPack(String(estPieces));
      }
    }
  }, [name, size, unit]);

  if (!isOpen) return null;

  // Generate internal SKU
  const handleGenerateSku = () => {
    const sku = `NKB-CAN-${Math.floor(100000 + Math.random() * 900000)}`;
    setBarcode(sku);
  };

  // Add inline new category
  const handleSaveInlineCategory = () => {
    const clean = inlineCategoryInput.trim();
    if (!clean) return;
    const res = addCanteenCategory(clean);
    if (res && res.category) {
      setCategory(res.category);
    }
    setInlineCategoryInput('');
    setShowInlineAddCategory(false);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Product Name is required.');
      nameInputRef.current?.focus();
      return;
    }

    const cleanSize = size.trim() || 'Piece';
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const finalBarcode = barcode.trim() || `NKB-CAN-${Math.floor(100000 + Math.random() * 900000)}`;

    const res = addSupplyItem({
      name: cleanName,
      size: cleanSize,
      quantity: qty,
      barcode: finalBarcode,
      costPrice: cost,
      sellingPrice: price,
      hasRetailPiece: Boolean(hasRetailPiece || (Number(retailPiecePrice) > 0)),
      retailPiecePrice: parseFloat(retailPiecePrice) || 0,
      piecesPerPack: parseInt(piecesPerPack, 10) || 0,
      category: category || canteenCategories?.[0] || 'General Supplies',
      brand: brand.trim() || 'General',
      company: company.trim() || 'Direct Supplier',
      unit: unit || 'Piece',
      reorderLevel: parseInt(reorderLevel, 10) || 10,
      expirationDate: expirationDate || ''
    });

    if (res?.success) {
      playScanBeep();
      if (keepOpenAfterSave) {
        // Reset prioritized fields for next item
        setName('');
        setSize('Piece');
        setQuantity(0);
        setBarcode('');
        setCostPrice('');
        setSellingPrice('');
        setHasRetailPiece(false);
        setPiecesPerPack('');
        setRetailPiecePrice('');
        setExpirationDate('');
        setErrorMessage('');
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      } else {
        onClose();
      }
    } else {
      setErrorMessage(res?.message || 'Failed to add supply product.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Add New Supply Item
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold">
                  Shortcut: Alt+N
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Quickly add canteen supply item with prioritized fields (Name, Size, Qty).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* PRIORITIZED PRIMARY FIELDS CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50 border-2 border-emerald-500/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Prioritized Required Information
              </span>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Primary Fields
              </span>
            </div>

            {/* 1. PRODUCT NAME */}
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                1. Product Name <span className="text-emerald-600">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kopiko Blanca 30g, Lucky Me Pancit Canton, C2 Apple 500ml..."
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-emerald-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-900 placeholder-slate-400 transition"
              />
            </div>

            {/* 2. SIZE / PACKAGING */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900">
                  2. Size / Packaging <span className="text-emerald-600">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Current: <strong className="text-slate-800 font-bold">{size || 'None'}</strong>
                </span>
              </div>
              <input
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., Piece, 500ml, 1L, 210g, Solo, Pack..."
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 transition"
              />

              {/* Quick Select Size Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-slate-500 py-0.5">Quick picks:</span>
                {COMMON_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      size.toLowerCase() === s.toLowerCase()
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. INITIAL STOCK QUANTITY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900">
                  3. Initial Stock Quantity <span className="text-emerald-600">*</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {quantity === 0 ? (
                    <span className="text-rose-600 font-bold">Out of Stock (0)</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">{quantity} {unit || 'pcs'}</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(0, parseInt(prev, 10) - 1))}
                  className="h-10 w-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-base flex items-center justify-center transition cursor-pointer"
                  title="Decrease Quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-emerald-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-center text-sm font-black font-mono text-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(0, parseInt(prev, 10) + 1))}
                  className="h-10 w-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-base flex items-center justify-center transition cursor-pointer"
                  title="Increase Quantity"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Quantity Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-slate-500 py-0.5">Presets:</span>
                {[0, 10, 25, 50, 100].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      quantity === qty
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {qty === 0 ? '0 (Out of stock)' : `${qty}`}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* OPTIONAL DETAILS TOGGLE / ACCORDION */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(prev => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">
                  Optional Details (Barcode / SKU, Pricing, Category, Supplier, Expiry)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <span>{showOptionalDetails ? 'Hide' : 'Show'}</span>
                {showOptionalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {showOptionalDetails && (
              <div className="p-4 border-t border-slate-200 space-y-4 bg-white animate-in slide-in-from-top-1 duration-150">
                
                {/* Barcode & SKU Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-slate-500" />
                      <span>Barcode (SKU / GTIN)</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition cursor-pointer"
                      title="Auto-generate internal NKB-CAN-XXXXXX SKU"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Generate SKU</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Leave blank for auto-generated internal barcode..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    If left empty, a unique scannable <span className="font-mono text-slate-600">NKB-CAN-XXXXXX</span> code will be created automatically.
                  </p>
                </div>

                {/* Selling & Cost Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selling Price (PHP) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cost Price (PHP) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Box & Pack Breakdown & Retail Piece Price Option */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasRetailPiece}
                        onChange={(e) => setHasRetailPiece(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Boxes className="h-4 w-4 text-amber-600" />
                        <span>Box / Pack: Set Retail Price per Piece</span>
                      </span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 text-[10px] font-bold">
                      Wholesale vs Retail
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Set a separate retail price for individual pieces when sold separately from the box/pack. <strong>The retail price per piece will be more expensive than the wholesale price per piece</strong>.
                  </p>

                  {hasRetailPiece && (
                    <div className="space-y-3 pt-2 border-t border-amber-200/60 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Pieces per Box/Pack */}
                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            Pieces per Box / Pack
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={piecesPerPack}
                            onChange={(e) => setPiecesPerPack(e.target.value)}
                            placeholder="e.g., 10, 24, 50 pcs"
                            className="w-full h-10 px-3 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          {piecesPerPack > 0 && Number(sellingPrice) > 0 && (
                            <p className="text-[10px] text-amber-800 font-mono mt-1">
                              Wholesale equivalent: <strong>₱{(Number(sellingPrice) / Number(piecesPerPack)).toFixed(2)}</strong> / piece
                            </p>
                          )}
                        </div>

                        {/* Retail Price per Piece */}
                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            Retail Price per Piece (₱)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-600">₱</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={retailPiecePrice}
                              onChange={(e) => setRetailPiecePrice(e.target.value)}
                              placeholder="e.g., 12.00"
                              className="w-full h-10 pl-7 pr-3 rounded-xl border border-amber-400 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Markup Suggestions */}
                      {piecesPerPack > 0 && Number(sellingPrice) > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-800">Suggested Retail Markups:</span>
                          {[15, 20, 25, 30].map(pct => {
                            const base = Number(sellingPrice) / Number(piecesPerPack);
                            const sug = Math.ceil(base * (1 + pct / 100));
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setRetailPiecePrice(sug.toFixed(2))}
                                className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-mono text-[10px] font-bold transition cursor-pointer"
                              >
                                +{pct}% (₱{sug.toFixed(2)})
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Validation badge */}
                      {Number(retailPiecePrice) > 0 && piecesPerPack > 0 && Number(sellingPrice) > 0 && (
                        <div>
                          {Number(retailPiecePrice) > (Number(sellingPrice) / Number(piecesPerPack)) ? (
                            <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Retail price (₱{Number(retailPiecePrice).toFixed(2)}/pc) is {Math.round(((Number(retailPiecePrice) - (Number(sellingPrice) / Number(piecesPerPack))) / (Number(sellingPrice) / Number(piecesPerPack))) * 100)}% more expensive than wholesale rate (₱{(Number(sellingPrice) / Number(piecesPerPack)).toFixed(2)}/pc).
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-800 text-[11px] font-bold bg-rose-100/80 px-2.5 py-1.5 rounded-lg border border-rose-300">
                              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span>
                                Note: Retail price (₱{Number(retailPiecePrice).toFixed(2)}/pc) is not higher than wholesale rate (₱{(Number(sellingPrice) / Number(piecesPerPack)).toFixed(2)}/pc). Single pieces should be more expensive.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Category <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineAddCategory(prev => !prev)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>New Category</span>
                      </button>
                    </div>

                    {showInlineAddCategory ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          value={inlineCategoryInput}
                          onChange={(e) => setInlineCategoryInput(e.target.value)}
                          placeholder="Category name..."
                          className="flex-1 h-9 px-2.5 rounded-lg border border-indigo-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleSaveInlineCategory}
                          className="h-9 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInlineAddCategory(false)}
                          className="h-9 px-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                      >
                        <option value="">Select Category...</option>
                        {(canteenCategories || []).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Measure <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                    >
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Brand & Supplier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Brand <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      list="brand-suggestions"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g., Nestle, URC, Lucky Me..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <datalist id="brand-suggestions">
                      {COMMON_BRANDS.map(b => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Supplier / Company <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      list="supplier-suggestions"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g., R/L Abad Distribution..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <datalist id="supplier-suggestions">
                      {COMMON_SUPPLIERS.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Reorder Level & Expiration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Low Stock Alert Level <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                      placeholder="10"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expiration Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

        </form>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={keepOpenAfterSave}
              onChange={(e) => setKeepOpenAfterSave(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
            />
            <span>Keep form open to add another item</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel (Esc)
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-600/30"
            >
              <Check className="h-4 w-4" />
              <span>Add to Inventory (Enter)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
