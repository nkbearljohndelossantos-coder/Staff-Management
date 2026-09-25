import React, { useState } from 'react';
import { 
  ScanBarcode, 
  Boxes, 
  Receipt, 
  Compass, 
  Plus, 
  Search, 
  ShoppingCart, 
  ShieldAlert, 
  ShieldCheck,
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Store, 
  Building2, 
  Tag, 
  DollarSign, 
  Package, 
  User, 
  Lock,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Filter,
  X,
  BarChart3,
  Calculator
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CardVoidModal from './CardVoidModal';
import ProductTrackingMap from './ProductTrackingMap';
import GatePassModal from './GatePassModal';
import CanteenScannerTerminal from './CanteenScannerTerminal';
import CanteenReportsSection from './CanteenReportsSection';
import CanteenPassModal from './CanteenPassModal';
import ThermalReceiptView from './ThermalReceiptView';
import BarcodeLabelSheet from './BarcodeLabelSheet';
import CanteenZReadingModal from './CanteenZReadingModal';
import { playScanBeep, playErrorBuzz } from '../../utils/audioFeedback';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

// Known Catalog for Automatic Inbound Scan Pre-filling
export const KNOWN_INBOUND_CATALOG = {
  '4800016644012': {
    name: 'San Miguel Fresh Milk 1L',
    company: 'San Miguel Dairy Corp',
    brand: 'Magnolia Pure Fresh',
    category: 'Beverages & Dairy',
    costPrice: 82.00,
    sellingPrice: 98.00,
    quantity: 45,
    size: '1L',
    unit: 'Bottle',
    expirationDate: '2026-08-15'
  },
  '4800016600216': {
    name: 'Purefoods Corned Beef 210g',
    company: 'San Miguel Foods Inc',
    brand: 'Purefoods',
    category: 'Canned Goods',
    costPrice: 74.00,
    sellingPrice: 92.00,
    quantity: 65,
    size: '210g',
    unit: 'Can',
    expirationDate: '2027-03-30'
  },
  '4800841200115': {
    name: 'Nissin Cup Noodles Seafood 60g',
    company: 'Monde Nissin Corp',
    brand: 'Nissin',
    category: 'Instant Meals',
    costPrice: 28.50,
    sellingPrice: 38.00,
    quantity: 120,
    size: '60g',
    unit: 'Cup',
    expirationDate: '2026-11-20'
  },
  '4800047820102': {
    name: 'Gardenia Classic White Bread 600g',
    company: 'Gardenia Bakeries Phils',
    brand: 'Gardenia',
    category: 'Bakery & Bread',
    costPrice: 65.00,
    sellingPrice: 78.00,
    quantity: 24,
    size: '600g',
    unit: 'Loaf',
    expirationDate: '2026-05-25'
  },
  '4807770270014': {
    name: 'C2 Green Tea Apple 500ml',
    company: 'Universal Robina Corp',
    brand: 'URC C2',
    category: 'Beverages',
    costPrice: 22.00,
    sellingPrice: 30.00,
    quantity: 80,
    size: '500ml',
    unit: 'Bottle',
    expirationDate: '2026-12-10'
  },
  '4800552109923': {
    name: 'Nature Spring Mineral Water 500ml',
    company: 'Philippine Spring Water Resources Inc',
    brand: 'Nature Spring',
    category: 'Beverages',
    costPrice: 12.00,
    sellingPrice: 18.00,
    quantity: 150,
    size: '500ml',
    unit: 'Bottle',
    expirationDate: '2027-05-01'
  }
};

export default function CanteenHub() {
  const { 
    canteenInventory, 
    canteenCategories,
    addCanteenCategory,
    deleteCanteenCategory,
    addSupplyItem, 
    deleteSupplyItem,
    clearAllCanteenInventory,
    personalPurchaseOrders, 
    fulfillPurchaseOrder, 
    canteenReceipts, 
    recordCanteenSale, 
    canteenVoidLogs,
    canteenGatePasses,
    confirmCanteenSalaryDeduction,
    clearGatePass,
    staffList,
    currentUser,
    isHR,
    isSuperAdmin
  } = useApp();

  const [activeSubtab, setActiveSubtab] = useState('pos'); // 'pos', 'inventory', 'orders', 'tracking', 'reports'
  const [showCanteenPassModal, setShowCanteenPassModal] = useState(false);
  
  // POS Register State
  const [posBarcodeQuery, setPosBarcodeQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [customerType, setCustomerType] = useState('Staff Member');
  const [orderType, setOrderType] = useState('Dine In'); // 'Dine In' | 'Grocery'
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'Salary Deduction'
  const [lastReceipt, setLastReceipt] = useState(null);
  const [lastGatePass, setLastGatePass] = useState(null);
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [selectedThermalReceipt, setSelectedThermalReceipt] = useState(null);
  const [showBarcodeSheet, setShowBarcodeSheet] = useState(false);
  const [showZReadingModal, setShowZReadingModal] = useState(false);

  useEscapeKey('canteen-hub-z-reading-modal', ESCAPE_PRIORITY.MODAL, showZReadingModal, () => setShowZReadingModal(false));

  // Inbound Inventory Scanner State
  const [inboundScanQuery, setInboundScanQuery] = useState('');

  // Category management & filtering state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalInput, setCategoryModalInput] = useState('');
  const [showInlineAddCategory, setShowInlineAddCategory] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');

  const handleSaveInlineCategory = () => {
    const clean = inlineCategoryInput.trim();
    if (!clean) return;
    const res = addCanteenCategory(clean);
    if (res && res.category) {
      setNewItemCategory(res.category);
    }
    setInlineCategoryInput('');
    setShowInlineAddCategory(false);
  };

  const handleSaveModalCategory = (e) => {
    e.preventDefault();
    const clean = categoryModalInput.trim();
    if (!clean) return;
    addCanteenCategory(clean);
    setCategoryModalInput('');
  };

  // New Supply Item State (with Size, Company, Brand, Expiry, Prices, and Late Encoding)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBarcode, setNewItemBarcode] = useState('');
  const [newItemCompany, setNewItemCompany] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(canteenCategories?.[0] || 'Beverages & Dairy');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Piece');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  // Late Encoding option
  const [isLateEncoded, setIsLateEncoded] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [lateCustomDate, setLateCustomDate] = useState('');

  // Search & Filter
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedVoidReceipt, setSelectedVoidReceipt] = useState(null);

  // Progressive Escape dismissal (Priority 40 - MODAL)
  useEscapeKey('canteen-add-supply-modal', ESCAPE_PRIORITY.MODAL, showAddModal, () => setShowAddModal(false));
  useEscapeKey('canteen-category-modal', ESCAPE_PRIORITY.MODAL, showCategoryModal, () => setShowCategoryModal(false));
  useEscapeKey('canteen-pass-modal-hub', ESCAPE_PRIORITY.MODAL, showCanteenPassModal, () => setShowCanteenPassModal(false));
  useEscapeKey('canteen-void-receipt-hub', ESCAPE_PRIORITY.MODAL, Boolean(selectedVoidReceipt), () => setSelectedVoidReceipt(null));

  // Scan & Auto-Fill Inbound Stock Handler
  const handleScanInboundInventory = (code) => {
    if (!code || !code.trim()) return;
    const clean = code.trim();
    const catalogMatch = KNOWN_INBOUND_CATALOG[clean];
    const inventoryMatch = canteenInventory.find(i => i.barcode === clean || i.id === clean);
    const item = catalogMatch || inventoryMatch;

    if (item) {
      playScanBeep();
      setNewItemBarcode(item.barcode || clean);
      setNewItemName(item.name || '');
      setNewItemCompany(item.company || '');
      setNewItemBrand(item.brand || '');
      setNewItemCategory(item.category || 'General Supplies');
      setNewItemCost(item.costPrice !== undefined ? String(item.costPrice) : '0');
      setNewItemPrice(item.sellingPrice !== undefined ? String(item.sellingPrice) : '0');
      setNewItemQty(item.quantity !== undefined ? String(item.quantity) : '50');
      setNewItemSize(item.size || '');
      setNewItemUnit(item.unit || 'Piece');
      setNewItemExpiry(item.expirationDate || '2026-12-31');
    } else {
      playScanBeep();
      setNewItemBarcode(clean);
      setNewItemName(`Inbound Supply Item #${clean.slice(-4)}`);
      setNewItemCompany('Direct Supplier Corp');
      setNewItemBrand('Standard Brand');
      setNewItemCategory('General Supplies');
      setNewItemCost('50.00');
      setNewItemPrice('65.00');
      setNewItemQty('50');
      setNewItemSize('Unit');
      setNewItemUnit('Piece');
      setNewItemExpiry('2027-06-30');
    }

    setInboundScanQuery('');
    setShowAddModal(true);
  };

  const handleInboundScanSubmit = (e) => {
    e.preventDefault();
    if (inboundScanQuery.trim()) {
      handleScanInboundInventory(inboundScanQuery.trim());
    }
  };

  // POS Cart Methods
  const handleAddToCart = (item) => {
    if (item.quantity <= 0) {
      playErrorBuzz();
      return;
    }
    playScanBeep();
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) return prev; // Limit to in-stock
        return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, {
        id: item.id,
        barcode: item.barcode,
        name: item.name,
        unitPrice: item.sellingPrice,
        quantity: 1,
        maxStock: item.quantity
      }];
    });
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!posBarcodeQuery.trim()) return;
    const clean = posBarcodeQuery.trim();
    const item = canteenInventory.find(i => i.barcode === clean || i.id === clean || i.name.toLowerCase().includes(clean.toLowerCase()));
    if (item) {
      handleAddToCart(item);
      setPosBarcodeQuery('');
    }
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        if (nextQty > item.maxStock) return item;
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);

  const handlePOSCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'Salary Deduction' && !selectedStaffId) {
      alert('Please select an employee member for Salary Deduction.');
      return;
    }

    let custName = 'Walk-in Guest';
    if (customerType === 'Staff Member' && selectedStaffId) {
      const st = staffList.find(s => s.id === selectedStaffId);
      if (st) custName = `${st.firstName} ${st.lastName}`;
    }

    const res = recordCanteenSale({
      customerName: custName,
      customerType,
      staffId: selectedStaffId || null,
      items: cart,
      orderType,
      paymentMethod
    });

    if (res.success) {
      setLastReceipt(res.receipt);
      if (res.gatePass) {
        setLastGatePass(res.gatePass);
        setSelectedGatePass(res.gatePass);
      } else {
        setLastGatePass(null);
      }
      setCart([]);
      setSelectedStaffId('');
    }
  };

  // Add Supply Form Submit
  const handleSaveSupply = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCost || !newItemPrice || !newItemQty) return;

    addSupplyItem({
      name: newItemName.trim(),
      barcode: newItemBarcode.trim(),
      company: newItemCompany.trim(),
      brand: newItemBrand.trim(),
      category: newItemCategory,
      costPrice: Number(newItemCost),
      sellingPrice: Number(newItemPrice),
      quantity: Number(newItemQty),
      size: newItemSize.trim(),
      unit: newItemUnit,
      expirationDate: newItemExpiry,
      isLateEncoded,
      lateReason: isLateEncoded ? lateReason.trim() : null,
      customDate: isLateEncoded && lateCustomDate ? lateCustomDate : null
    });

    setShowAddModal(false);
    // Reset
    setNewItemName('');
    setNewItemBarcode('');
    setNewItemCompany('');
    setNewItemBrand('');
    setNewItemCategory(canteenCategories?.[0] || 'Beverages & Dairy');
    setNewItemCost('');
    setNewItemPrice('');
    setNewItemQty('');
    setNewItemSize('');
    setNewItemUnit('Piece');
    setNewItemExpiry('');
    setIsLateEncoded(false);
    setLateReason('');
    setLateCustomDate('');
    setShowInlineAddCategory(false);
    setInlineCategoryInput('');
  };

  const filteredInventory = canteenInventory.filter(item => {
    const q = inventorySearch.toLowerCase();
    const matchesSearch = (
      item.name.toLowerCase().includes(q) ||
      item.barcode.includes(q) ||
      (item.company && item.company.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
    const matchesCategory = selectedCategoryFilter === 'ALL' || 
      (item.category && item.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Subtab Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-sm text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubtab('pos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'pos'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ScanBarcode className="h-4 w-4" />
              <span>Barcode POS Register</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'inventory'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Boxes className="h-4 w-4" />
              <span>Supply Inventory ({canteenInventory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'orders'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Personal POs (Mfg Goods) &amp; Receipts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('tracking')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'tracking'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Live Product Tracking Agent</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('reports')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'reports'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Transaction Reports &amp; Records</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowZReadingModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
              title="Daily POS Shift Closeout &amp; Cashier Z-Reading Report"
            >
              <Calculator className="h-3.5 w-3.5 text-cyan-400" />
              <span>📊 Shift Z-Reading</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBarcodeSheet(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
              title="Generate & Print A4 Barcode Sticker Sheet (24-Up)"
            >
              <Tag className="h-3.5 w-3.5 text-cyan-400" />
              <span>🏷️ Barcode Stickers</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCanteenPassModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
              title="Print & View Official Canteen Barcode Pass (NKBCANTEEN)"
            >
              <Store className="h-3.5 w-3.5 text-amber-400" />
              <span>🪪 Canteen Barcode Pass</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Immutable Records Enforced</span>
            </div>
          </div>

        </div>
      </div>

      {/* SUBTAB 1: BARCODE POS REGISTER & DUAL-MONITOR SCANNER */}
      {activeSubtab === 'pos' && (
        <CanteenScannerTerminal 
          onShowReceipt={(r) => { 
            setLastReceipt(r); 
            setSelectedThermalReceipt(r);
          }}
          onShowGatePass={(gp) => { setLastGatePass(gp); setSelectedGatePass(gp); }}
        />
      )}

      {/* SUBTAB 2: SUPPLY INVENTORY WITH INBOUND SCANNING & LATE ENCODING */}
      {activeSubtab === 'inventory' && (
        <div className="space-y-4">
          
          {/* Inbound Inventory Barcode Quick-Scanner Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white">
                  <ScanBarcode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Inbound Inventory Barcode Scanner
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-300">
                      Auto-Fills 6 Required Attributes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scanning fills: <strong>Company Name</strong>, <strong>Brand</strong>, <strong>Expiration / Best Before Date</strong>, <strong>Quantity</strong>, <strong>Prices (Cost &amp; Selling)</strong>, and <strong>Size</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInboundScanSubmit} className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <ScanBarcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={inboundScanQuery}
                    onChange={(e) => setInboundScanQuery(e.target.value)}
                    placeholder="Scan barcode for inventory..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <ScanBarcode className="h-3.5 w-3.5 text-slate-950" />
                  Scan &amp; Fill
                </button>
              </form>
            </div>

            {/* Quick Test Barcode Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 font-medium mr-1 text-[10px] uppercase font-bold">Quick Inbound Scan Test:</span>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4800016644012')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                Milk (1L) · San Miguel
              </button>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4800016600216')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                Corned Beef (210g) · Purefoods
              </button>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4800841200115')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                Cup Noodles (60g) · Nissin
              </button>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4800047820102')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                White Bread (600g) · Gardenia
              </button>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4807770270014')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                C2 Tea (500ml) · URC
              </button>
              <button
                type="button"
                onClick={() => handleScanInboundInventory('4800552109923')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                Water (500ml) · Nature Spring
              </button>
            </div>
          </div>

          {/* Inventory Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search company, brand, barcode, SKU, size..."
                  className="w-full h-9 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                />
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                  title="Filter inventory by supply category"
                >
                  <option value="ALL">All Categories ({canteenInventory.length})</option>
                  {(canteenCategories || []).map(cat => {
                    const count = canteenInventory.filter(it => (it.category || '').toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {/* Manage / Add Categories Button */}
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Add or manage supply categories"
              >
                <Tag className="h-3.5 w-3.5 text-slate-600" />
                <span>Categories ({(canteenCategories || []).length})</span>
              </button>

              {canteenInventory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove ALL supplies from Canteen Inventory?')) {
                      clearAllCanteenInventory();
                    }
                  }}
                  className="h-9 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Supplies
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-9 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4 text-white" />
                Encode Supply Item (Manual / Inbound)
              </button>
            </div>

          </div>

          {/* Inventory Supplies Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Product &amp; Barcode</th>
                    <th className="px-4 py-3.5">Company (Supplier)</th>
                    <th className="px-4 py-3.5">Brand &amp; Category</th>
                    <th className="px-4 py-3.5 text-center">Size</th>
                    <th className="px-4 py-3.5 text-right">Cost Price</th>
                    <th className="px-4 py-3.5 text-right">Selling Price</th>
                    <th className="px-4 py-3.5 text-center">Stock Qty</th>
                    <th className="px-4 py-3.5">Expiration / Best Before</th>
                    <th className="px-4 py-3.5">Encoding Status</th>
                    <th className="px-3 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-12 text-center text-slate-400 text-xs">
                        <Boxes className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-sm">
                          {inventorySearch ? 'No supply items match your search filter.' : 'No supply items found in inventory.'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          Canteen inventory is completely clean. Use the "Encode Supply Item" button above to intake and record new supplies.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">{item.barcode}</div>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-700">
                          {item.company || 'Direct Vendor'}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.brand || 'N/A'}</div>
                          <div className="text-[10px] text-slate-500">{item.category}</div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-slate-800 font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {item.size || 'N/A'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          ₱{item.costPrice?.toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₱{item.sellingPrice?.toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            item.quantity <= (item.reorderLevel || 10)
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.quantity} {item.unit || 'pcs'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{item.expirationDate || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {item.isLateEncoded ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-extrabold uppercase tracking-wide">
                                [Late Encoded]
                              </span>
                              {item.lateReason && (
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={item.lateReason}>
                                  {item.lateReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Regular Entry
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteSupplyItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove supply item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 3: PERSONAL PURCHASE ORDERS & IMMUTABLE RECEIPTS */}
      {activeSubtab === 'orders' && (
        <div className="space-y-6">
          
          {/* Section A: Personal Purchase Orders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-600" />
                  Personal Purchase Orders (NKB Manufactured Products)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employee purchase orders for NKB factory manufactured products (inverters, electric motors, steel workbenches, generators, power tools) with Cash (Accounting Receivable) or COOP Share Capital deduction.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {personalPurchaseOrders.length} Registered POs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Manufactured Products</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Payment Scheme</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalPurchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {po.staffName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {po.items?.map((it, idx) => (
                            <div key={idx}>
                              <span className="text-slate-800 font-bold">{it.quantity}x {it.name}</span>
                              {it.sku && <span className="block font-mono text-[10px] text-slate-400">{it.sku}</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₱{po.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {po.paymentMethod === 'cash' ? (
                          <div>
                            <span className="font-bold text-slate-900 block">Cash</span>
                            <span className="text-[10px] text-slate-500">Receivable by Accounting</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 block">COOP Share</span>
                            <span className="text-[10px] text-slate-500">Debited from Share Capital</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'Fulfilled'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {po.status !== 'Fulfilled' ? (
                          <button
                            type="button"
                            onClick={() => fulfillPurchaseOrder(po.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Fulfill &amp; Handover
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Fulfilled ({po.fulfilledBy || 'Canteen'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Immutable POS Sales Receipts & Card-Based Voids */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-600" />
                  Immutable Sales Receipts &amp; Supervisor Voids
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receipts cannot be directly edited. Corrections require RFID/QR/Barcode supervisor authorization, returning stock to inventory.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                <span>Card-Based Void Security Enforced</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Receipt Number</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items Summary</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Correction / Void</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canteenReceipts.map(rec => {
                    const isVoided = rec.status === 'VOIDED';
                    return (
                      <tr key={rec.receiptNo} className={`transition ${isVoided ? 'bg-slate-50/60 opacity-70' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {rec.receiptNo}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(rec.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {rec.cashierName}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {rec.customerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {rec.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ₱{rec.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVoided ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isVoided ? (
                            <span className="text-[10px] font-bold text-slate-500">
                              Voided &amp; Restocked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedVoidReceipt(rec)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <ShieldAlert className="h-3 w-3 text-slate-600" />
                              Card Void
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Supervisor Void Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-400" />
                  Supervisor Card Void Audit Log ({canteenVoidLogs.length} Records)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immutable forensic audit trail of all card-authorized void events and inventory stock returns.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {canteenVoidLogs.map(v => (
                <div key={v.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-white">
                      Receipt #{v.receiptNo}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(v.voidedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-400 text-[11px] pt-1">
                    <div>
                      Authorized Supervisor: <strong className="text-slate-200">{v.voidedBy}</strong>
                    </div>
                    <div>
                      Card Credential: <strong className="text-slate-200 font-mono">{v.cardBadgeId}</strong> ({v.authMethod})
                    </div>
                    <div className="text-slate-300">
                      Restored Items: {v.returnedItems?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                    Audit Reason: <span className="italic text-slate-300">"{v.reason}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Canteen Grocery Gate Passes (Half-A4 Plant Security Manifests) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                  Canteen Grocery Gate Passes ({canteenGatePasses.length} Security Clearances)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Half-A4 (A5) security manifests required for personal groceries leaving factory perimeter gates.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                Standard Half-A4 (148mm × 210mm) Printable
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Gate Pass No</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Bearer / Staff</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Manifest Summary</th>
                    <th className="px-4 py-3 text-right">Total Value</th>
                    <th className="px-4 py-3 text-center">Gate Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canteenGatePasses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400 text-xs">
                        No gate passes issued yet. Checkout any Grocery order to generate one.
                      </td>
                    </tr>
                  ) : (
                    canteenGatePasses.map(gp => {
                      const isCleared = gp.gateStatus === 'Cleared at Gate';
                      return (
                        <tr key={gp.id || gp.gatePassNo} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {gp.gatePassNo}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(gp.date).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{gp.staffName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{gp.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {gp.departmentName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs">
                            {gp.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₱{gp.totalAmount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCleared ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {gp.gateStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedGatePass(gp)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3 text-white" />
                                Print Half A4
                              </button>
                              {!isCleared && (
                                <button
                                  type="button"
                                  onClick={() => clearGatePass(gp.gatePassNo, currentUser ? `${currentUser.name} (Security)` : 'Officer R. Mendoza (Main Gate)')}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section E: Canteen Salary Deductions & COOP Budget Reconciliation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-600" />
                  Canteen Salary Deductions &amp; COOP Budget Reconciliation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transactions charged to Salary Deduction. Deducted to the employee's COOP budget once confirmed by HR that payroll was deducted to the bank.
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                HR Bank Payroll Verification
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Order Nature</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">COOP Reconciliation Status</th>
                    <th className="px-4 py-3 text-center">HR Confirmation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canteenReceipts.filter(r => r.paymentMethod === 'Salary Deduction').length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400 text-xs">
                        No transactions on Salary Deduction.
                      </td>
                    </tr>
                  ) : (
                    canteenReceipts
                      .filter(r => r.paymentMethod === 'Salary Deduction')
                      .map(r => {
                        const isConfirmed = r.salaryDeductionStatus === 'Confirmed by HR - Deducted to Bank & COOP';
                        return (
                          <tr key={r.receiptNo} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                              {r.receiptNo}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(r.date).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {r.customerName}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {r.orderType || 'Dine In'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                              ₱{r.total?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isConfirmed ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'
                              }`}>
                                {r.salaryDeductionStatus || 'Pending HR Bank Confirmation'}
                              </span>
                              {isConfirmed && r.hrConfirmedAt && (
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                  Confirmed: {new Date(r.hrConfirmedAt).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {!isConfirmed ? (
                                isHR || isSuperAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => confirmCanteenSalaryDeduction(r.receiptNo)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-bold transition cursor-pointer shadow-sm"
                                  >
                                    Confirm Bank Deduction &amp; Deduct to COOP
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Requires HR Verification
                                  </span>
                                )
                              ) : (
                                <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
                                  Deducted to COOP Budget
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 4: LIVE PRODUCT TRACKING MAP AGENT */}
      {activeSubtab === 'tracking' && (
        <ProductTrackingMap />
      )}

      {/* SUBTAB 5: COMPREHENSIVE TRANSACTION REPORTS & AUDIT RECORDS */}
      {activeSubtab === 'reports' && (
        <CanteenReportsSection 
          onShowReceipt={(r) => { setLastReceipt(r); }}
          onShowGatePass={(gp) => { setLastGatePass(gp); setSelectedGatePass(gp); }}
          onShowCanteenPass={() => setShowCanteenPassModal(true)}
        />
      )}

      {/* Card Void Modal Popup */}
      {selectedVoidReceipt && (
        <CardVoidModal
          receipt={selectedVoidReceipt}
          onClose={() => setSelectedVoidReceipt(null)}
        />
      )}

      {/* Add Supply Item Modal (with Late Encoding option) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Encode Inbound Supply Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupply} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Quick Barcode Scanner Auto-Fill Bar Inside Modal */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ScanBarcode className="h-4 w-4 text-white" />
                    Scan Barcode to Auto-Fill Inbound Fields
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Auto-fills: Company, Brand, Expiry, Qty, Prices, Size
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Scan or enter barcode (e.g. 4800016644012)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanInboundInventory(e.target.value);
                      }
                    }}
                    className="flex-1 h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">Press Enter to Auto-Fill</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., San Miguel Fresh Milk 1L"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (SKU / GTIN)
                  </label>
                  <input
                    type="text"
                    value={newItemBarcode}
                    onChange={(e) => setNewItemBarcode(e.target.value)}
                    placeholder="Auto-generated if blank..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Size / Packaging (e.g., 210g, 1L, 60g, 500ml)
                  </label>
                  <input
                    type="text"
                    value={newItemSize}
                    onChange={(e) => setNewItemSize(e.target.value)}
                    placeholder="e.g., 1L, 210g, 60g, 600g, 500ml"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <span>Category</span>
                      <span className="text-slate-400">*</span>
                    </label>
                    {showInlineAddCategory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineAddCategory(false);
                          setInlineCategoryInput('');
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        Choose Existing
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowInlineAddCategory(true)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
                        title="Add a new custom supply category"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Category</span>
                      </button>
                    )}
                  </div>

                  {showInlineAddCategory ? (
                    <div>
                      <div className="relative flex items-center w-full">
                        <input
                          type="text"
                          value={inlineCategoryInput}
                          onChange={(e) => setInlineCategoryInput(e.target.value)}
                          placeholder="Type new category..."
                          className="w-full h-10 pl-3 pr-20 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium transition"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveInlineCategory();
                            } else if (e.key === 'Escape') {
                              setShowInlineAddCategory(false);
                              setInlineCategoryInput('');
                            }
                          }}
                        />
                        <div className="absolute right-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveInlineCategory}
                            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
                            title="Add and select category"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineAddCategory(false);
                              setInlineCategoryInput('');
                            }}
                            className="h-7 w-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                        Press Enter or click Add to save &amp; select.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={newItemCategory}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowInlineAddCategory(true);
                        } else {
                          setNewItemCategory(e.target.value);
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer bg-white"
                    >
                      {(canteenCategories || []).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__ADD_NEW__" className="font-bold text-emerald-600">
                        + Add New Category...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company (Supplier)
                  </label>
                  <input
                    type="text"
                    value={newItemCompany}
                    onChange={(e) => setNewItemCompany(e.target.value)}
                    placeholder="e.g., San Miguel Dairy Corp"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="e.g., Magnolia Pure Fresh"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (₱) <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    placeholder="82.00"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₱) <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="98.00"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inbound Quantity <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="50"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiration Date / Best Before Date
                  </label>
                  <input
                    type="date"
                    value={newItemExpiry}
                    onChange={(e) => setNewItemExpiry(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* LATE ENCODING OPTION */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lateEncodingToggle"
                    checked={isLateEncoded}
                    onChange={(e) => setIsLateEncoded(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-400 cursor-pointer"
                  />
                  <label htmlFor="lateEncodingToggle" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Late Inbound Stock Entry (Delayed Encoding)
                  </label>
                </div>

                {isLateEncoded && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Actual Inbound Physical Delivery Date:
                      </label>
                      <input
                        type="date"
                        value={lateCustomDate}
                        onChange={(e) => setLateCustomDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Reason for Late Encoding Memo:
                      </label>
                      <input
                        type="text"
                        value={lateReason}
                        onChange={(e) => setLateReason(e.target.value)}
                        placeholder="e.g., Delivery receipt invoice delayed from logistics carrier..."
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <span className="inline-block text-[10px] text-slate-500 font-medium">
                      Item will be marked with a permanent [Late Encoded] audit label.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white transition cursor-pointer shadow-sm"
                >
                  Save Stock Item
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Manage Supply Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Canteen Supply Categories
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add new categories and organize inventory classification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryModalInput('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Add New Category Form */}
              <form onSubmit={handleSaveModalCategory} className="flex gap-2">
                <input
                  type="text"
                  value={categoryModalInput}
                  onChange={(e) => setCategoryModalInput(e.target.value)}
                  placeholder="Enter new category name (e.g. Health & Wellness)..."
                  className="flex-1 h-10 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white transition"
                  autoFocus
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Active Categories ({(canteenCategories || []).length})
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {(canteenCategories || []).map(cat => {
                    const itemCount = canteenInventory.filter(it => (it.category || '').toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <div key={cat} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition">
                        <div className="flex items-center gap-2.5">
                          <Tag className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-800">{cat}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-medium text-slate-500">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {itemCount === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete category "${cat}"?`)) {
                                deleteCanteenCategory(cat);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Remove "${cat}"`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryModalInput('');
                }}
                className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Half-A4 Gate Pass Modal */}
      {selectedGatePass && (
        <GatePassModal
          gatePass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

      {/* Official Canteen Barcode Pass Modal */}
      {showCanteenPassModal && (
        <CanteenPassModal
          onClose={() => setShowCanteenPassModal(false)}
        />
      )}

      {/* 58mm / 80mm ESC/POS Thermal Receipt Modal */}
      {selectedThermalReceipt && (
        <ThermalReceiptView
          receipt={selectedThermalReceipt}
          onClose={() => setSelectedThermalReceipt(null)}
        />
      )}

      {/* A4 24-Up Barcode Sticker Label Sheet Modal */}
      {showBarcodeSheet && (
        <BarcodeLabelSheet
          inventory={canteenInventory}
          onClose={() => setShowBarcodeSheet(false)}
        />
      )}

      {/* Daily Shift Closeout & Cashier Z-Reading Modal */}
      {showZReadingModal && (
        <CanteenZReadingModal
          onClose={() => setShowZReadingModal(false)}
        />
      )}

    </div>
  );
}
