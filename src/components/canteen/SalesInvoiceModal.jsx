import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Plus, 
  Trash2, 
  Search, 
  Building2, 
  Calendar, 
  DollarSign, 
  Tag, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Barcode,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { SUGGESTED_COMPANIES, SUGGESTED_BRANDS, SUGGESTED_SIZES, SUGGESTED_UNITS } from './CanteenHub';

export default function SalesInvoiceModal({ isOpen, onClose }) {
  const { 
    canteenInventory = [], 
    canteenCategories = [], 
    recordCanteenSalesInvoice,
    currentUser
  } = useApp();

  useEscapeKey('sales-invoice-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  // Generate default Invoice Number
  const defaultInvoiceNumber = useMemo(() => {
    const yr = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SI-${yr}-${rand}`;
  }, [isOpen]);

  // Invoice Header Fields
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Company Fund');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');

  // Line Items State: multi-item support
  const createBlankItem = () => ({
    tempId: `line-${Date.now()}-${Math.random()}`,
    name: '',
    category: canteenCategories?.[0] || 'Beverages & Dairy',
    brand: '',
    company: '',
    size: 'Standard',
    unit: 'Piece',
    quantity: '50',
    costPrice: '',
    sellingPrice: '',
    expirationDate: '',
    barcode: '',
    searchQuery: '',
    showDropdown: false
  });

  const [items, setItems] = useState([createBlankItem()]);
  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState(null);

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      setInvoiceNumber(`SI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setSupplier('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Company Fund');
      setPaymentStatus('Paid');
      setNotes('');
      setItems([createBlankItem()]);
      setActiveItemSearchIdx(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Catalog item lookup for autocomplete
  const handleItemSearchChange = (index, query) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        name: query,
        searchQuery: query,
        showDropdown: true
      };
      return next;
    });
    setActiveItemSearchIdx(index);
  };

  const handleSelectItemFromCatalog = (index, catItem) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        name: catItem.name || '',
        category: catItem.category || canteenCategories?.[0] || 'General',
        brand: catItem.brand || '',
        company: catItem.company || catItem.supplier || supplier || '',
        size: catItem.size || 'Standard',
        unit: catItem.unit || 'Piece',
        costPrice: catItem.costPrice ? String(catItem.costPrice) : '',
        sellingPrice: catItem.sellingPrice ? String(catItem.sellingPrice) : '',
        expirationDate: catItem.expirationDate || '',
        barcode: catItem.barcode || '',
        searchQuery: catItem.name,
        showDropdown: false
      };
      return next;
    });

    // If invoice supplier is still empty, auto-fill it from item company/supplier
    if (!supplier && (catItem.supplier || catItem.company)) {
      setSupplier(catItem.supplier || catItem.company);
    }

    setActiveItemSearchIdx(null);
  };

  const handleItemFieldChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const handleAddLineItem = () => {
    const newItem = createBlankItem();
    // Default company from invoice supplier if available
    if (supplier) newItem.company = supplier;
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveLineItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Preset Markup calculator (+15%, +20%, +25%, +30%)
  const applyMarkup = (index, percent) => {
    const cost = parseFloat(items[index].costPrice) || 0;
    if (cost > 0) {
      const calculatedPrice = (cost * (1 + percent / 100)).toFixed(2);
      handleItemFieldChange(index, 'sellingPrice', calculatedPrice);
    }
  };

  // Grand Totals Calculation
  const totalInvoiceAmount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.costPrice) || 0;
    return sum + (qty * cost);
  }, 0);

  const totalInboundUnits = items.reduce((sum, item) => {
    return sum + (parseInt(item.quantity, 10) || 0);
  }, 0);

  // Form submission: Post to Inventory
  const handlePostInvoice = (e) => {
    e.preventDefault();

    // Validation
    const cleanSupplier = supplier.trim();
    if (!cleanSupplier) {
      alert('Please enter or select a Supplier Name for this Sales Invoice.');
      return;
    }

    if (!invoiceNumber.trim()) {
      alert('Please enter a Sales Invoice Number.');
      return;
    }

    // Validate items
    const invalidItem = items.find(it => !it.name.trim() || !(parseFloat(it.quantity) > 0));
    if (invalidItem) {
      alert('Each item in the invoice must have a Product Name and an Inbound Quantity greater than 0.');
      return;
    }

    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      supplier: cleanSupplier,
      purchaseDate,
      receivedDate,
      paymentMethod,
      paymentStatus,
      notes: notes.trim(),
      encodedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Glen Nobleza (Canteen Staff)',
      items: items.map(it => ({
        name: it.name.trim(),
        category: it.category || 'General',
        brand: it.brand.trim(),
        company: it.company.trim() || cleanSupplier,
        size: it.size.trim() || 'Standard',
        unit: it.unit || 'Piece',
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
        costPrice: Math.max(0, parseFloat(it.costPrice) || 0),
        sellingPrice: Math.max(0, parseFloat(it.sellingPrice) || 0),
        expirationDate: it.expirationDate,
        barcode: it.barcode.trim()
      }))
    };

    const res = recordCanteenSalesInvoice(payload);
    if (res && res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-white uppercase">
                  Encode Supplier Sales Invoice
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Inbound Intake
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5 font-medium">
                <span>Sales Invoice</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span>Items</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span>Item Details</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="text-emerald-400 font-bold">Canteen Inventory</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePostInvoice} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[78vh]">
          
          {/* SECTION 1: SALES INVOICE HEADER DETAILS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Step 1: Supplier &amp; Invoice Header
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Official Purchase Receipt / Manifest
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Sales Invoice # <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. SI-2026-8812"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber(`SI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-300 transition"
                    title="Generate new SI number"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Supplier / Vendor Name */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Supplier / Vendor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. San Miguel Dairy Corp, Universal Robina Corp, Monde Nissin..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />

                {/* Common Vendor Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Quick Select:</span>
                  {SUGGESTED_COMPANIES.slice(0, 6).map((comp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSupplier(comp)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition border ${
                        supplier === comp 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Purchase Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>Purchase Date</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Delivery / Intake Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Boxes className="h-3 w-3 text-slate-400" />
                  <span>Delivery / Received Date</span>
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Payment Method / Terms */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-slate-400" />
                  <span>Payment Terms</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Company Fund">Company Fund</option>
                  <option value="Petty Cash">Petty Cash</option>
                  <option value="Cash">Cash</option>
                  <option value="On Account (30 Days)">On Account (30 Days)</option>
                  <option value="Check Voucher">Check Voucher</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Paid">Paid / Settled</option>
                  <option value="Pending">Pending / Due</option>
                </select>
              </div>
            </div>

            {/* Receipt Notes / DR # */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Receipt Memo / Delivery Receipt # (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Delivery Receipt #DR-90214, Truck #Plate 402, Received in good condition"
                className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>


          {/* SECTION 2: ITEMS -> DETAILS OF ITEM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Step 2: Items &amp; Item Details ({items.length} {items.length === 1 ? 'Product' : 'Products'})
                </h4>
              </div>

              <button
                type="button"
                onClick={handleAddLineItem}
                className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Line Item</span>
              </button>
            </div>

            {/* Item Line Cards */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const qtyNum = parseFloat(item.quantity) || 0;
                const costNum = parseFloat(item.costPrice) || 0;
                const sellNum = parseFloat(item.sellingPrice) || 0;
                const lineTotal = qtyNum * costNum;
                const marginPerUnit = sellNum - costNum;
                const marginPercent = costNum > 0 ? ((marginPerUnit / costNum) * 100).toFixed(1) : '0';

                // Real-time catalog filtering for this specific row
                const catalogMatches = item.searchQuery && item.searchQuery.trim().length >= 2
                  ? canteenInventory.filter(p => 
                      p.name?.toLowerCase().includes(item.searchQuery.toLowerCase()) ||
                      p.brand?.toLowerCase().includes(item.searchQuery.toLowerCase()) ||
                      p.barcode?.includes(item.searchQuery)
                    ).slice(0, 6)
                  : [];

                return (
                  <div 
                    key={item.tempId} 
                    className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-sm transition space-y-4 relative"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                          {index + 1}
                        </span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Line Item #{index + 1}
                        </span>
                        {item.name && (
                          <span className="text-xs font-bold text-indigo-700 truncate max-w-xs">
                            — {item.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Line Subtotal</span>
                          <span className="text-sm font-mono font-black text-slate-900">
                            ₱{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove this line item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Name Autocomplete Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6 relative">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                          Product Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleItemSearchChange(index, e.target.value)}
                            onFocus={() => {
                              handleItemFieldChange(index, 'showDropdown', true);
                              setActiveItemSearchIdx(index);
                            }}
                            placeholder="Type to search official 355+ catalog or enter new product..."
                            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Dropdown Suggestions */}
                        {item.showDropdown && activeItemSearchIdx === index && catalogMatches.length > 0 && (
                          <div className="absolute left-0 right-0 top-16 z-30 bg-slate-950 text-white border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                            <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Catalog Suggestions (Auto-fill details)
                            </div>
                            {catalogMatches.map((catItem, cIdx) => (
                              <div
                                key={cIdx}
                                onClick={() => handleSelectItemFromCatalog(index, catItem)}
                                className="p-2.5 hover:bg-slate-800 border-b border-slate-900/60 cursor-pointer transition flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{catItem.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="text-amber-400">{catItem.brand || catItem.company || 'Direct'}</span>
                                    <span>·</span>
                                    <span>{catItem.category}</span>
                                    {catItem.size && <span>· {catItem.size}</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-mono font-bold text-emerald-400">₱{Number(catItem.sellingPrice || 0).toFixed(2)}</div>
                                  <span className="text-[9px] text-indigo-300">Click to fill</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Category Selection */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemFieldChange(index, 'category', e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          {(canteenCategories || []).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Brand */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={item.brand}
                          onChange={(e) => handleItemFieldChange(index, 'brand', e.target.value)}
                          placeholder="e.g. Magnolia, Purefoods, C2"
                          className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Packaging Details: Size, Unit, Inbound Quantity */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {/* Packaging Size */}
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Size / Variant
                        </label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemFieldChange(index, 'size', e.target.value)}
                          placeholder="e.g. 1L, 500ml, 60g, Standard"
                          className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Unit of Measure
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          {SUGGESTED_UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Inbound Quantity */}
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Inbound Qty <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-indigo-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        />
                      </div>
                    </div>

                    {/* Financials & Expiry: Cost Price, Selling Price, Expiry, Barcode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      
                      {/* Cost Price */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Cost Price (₱) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={item.costPrice}
                            onChange={(e) => handleItemFieldChange(index, 'costPrice', e.target.value)}
                            placeholder="0.00"
                            className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-300 font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Selling Price & Markup Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Selling Price (₱)
                          </label>
                          <span className="text-[9px] font-mono text-emerald-600 font-bold">
                            {costNum > 0 && sellNum >= costNum ? `+${marginPercent}%` : ''}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.sellingPrice}
                            onChange={(e) => handleItemFieldChange(index, 'sellingPrice', e.target.value)}
                            placeholder="0.00"
                            className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-300 font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Preset Margin Helpers */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[8px] uppercase font-bold text-slate-400">Markup:</span>
                          {[15, 20, 25, 30].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => applyMarkup(index, pct)}
                              className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-[9px] font-bold transition"
                              title={`Set +${pct}% margin over cost`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expiration Date */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 text-slate-400" />
                          <span>Expiration Date</span>
                        </label>
                        <input
                          type="date"
                          value={item.expirationDate}
                          onChange={(e) => handleItemFieldChange(index, 'expirationDate', e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Barcode (Optional) */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                          <Barcode className="h-3 w-3 text-slate-400" />
                          <span>Barcode (Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={item.barcode}
                          onChange={(e) => handleItemFieldChange(index, 'barcode', e.target.value)}
                          placeholder="Scan / Type or leave blank"
                          className="w-full h-8 px-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: INVENTORY DESTINATION SUMMARY */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 text-emerald-400 border border-white/10">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Step 3: Post &amp; Store Directly to Canteen Inventory
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Submitting will automatically increment stock for existing products or create new catalog records with full traceability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-slate-950/60 px-5 py-3 rounded-xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Items</span>
                <span className="text-base font-mono font-black text-white">{items.length}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inbound Units</span>
                <span className="text-base font-mono font-black text-emerald-400">{totalInboundUnits}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoice Cost</span>
                <span className="text-lg font-mono font-black text-amber-400">
                  ₱{totalInvoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAddLineItem}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Item to Invoice</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Post &amp; Store in Canteen Inventory</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
