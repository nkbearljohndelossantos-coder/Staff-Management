import React, { useState, useMemo } from 'react';
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
  Edit3,
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
  Calculator,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Grid,
  FileText
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
import SalesInvoiceModal from './SalesInvoiceModal';
import SalesInvoiceDetailModal from './SalesInvoiceDetailModal';
import BarcodeView from '../common/BarcodeView';
import canteenInventoryData from '../../data/canteenInventory.json';
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

export const POPULAR_SUPPLY_SUGGESTIONS = [
  { name: 'San Miguel Fresh Milk 1L', brand: 'Magnolia Pure Fresh', company: 'San Miguel Dairy Corp', category: 'Beverages & Dairy', size: '1L', unit: 'Bottle', costPrice: 82, sellingPrice: 98, quantity: 45 },
  { name: 'Purefoods Corned Beef 210g', brand: 'Purefoods', company: 'San Miguel Foods Inc', category: 'Canned Goods', size: '210g', unit: 'Can', costPrice: 74, sellingPrice: 92, quantity: 65 },
  { name: 'Nissin Cup Noodles Seafood 60g', brand: 'Nissin', company: 'Monde Nissin Corp', category: 'Instant Meals', size: '60g', unit: 'Cup', costPrice: 28.5, sellingPrice: 38, quantity: 120 },
  { name: 'Gardenia Classic White Bread 600g', brand: 'Gardenia', company: 'Gardenia Bakeries Phils', category: 'Bakery & Bread', size: '600g', unit: 'Loaf', costPrice: 65, sellingPrice: 78, quantity: 24 },
  { name: 'C2 Green Tea Apple 500ml', brand: 'URC C2', company: 'Universal Robina Corp', category: 'Beverages', size: '500ml', unit: 'Bottle', costPrice: 22, sellingPrice: 30, quantity: 80 },
  { name: 'Nature Spring Mineral Water 500ml', brand: 'Nature Spring', company: 'Philippine Spring Water Resources Inc', category: 'Beverages', size: '500ml', unit: 'Bottle', costPrice: 12, sellingPrice: 18, quantity: 150 },
  { name: 'Lucky Me Pancit Canton Kalamansi 80g', brand: 'Lucky Me!', company: 'Monde Nissin Corp', category: 'Instant Meals', size: '80g', unit: 'Pack', costPrice: 15, sellingPrice: 20, quantity: 100 },
  { name: 'Bear Brand Fortified Milk Powder 300g', brand: 'Bear Brand', company: 'Nestlé Philippines', category: 'Beverages & Dairy', size: '300g', unit: 'Pack', costPrice: 95, sellingPrice: 115, quantity: 40 },
  { name: 'Kopiko Blanca Coffee Twin Pack 52g', brand: 'Kopiko', company: 'PT Mayora Indah', category: 'Hot Drinks', size: '52g', unit: 'Sachet', costPrice: 13, sellingPrice: 18, quantity: 120 },
  { name: 'Century Tuna Flakes in Oil 155g', brand: 'Century Tuna', company: 'Century Pacific Food', category: 'Canned Goods', size: '155g', unit: 'Can', costPrice: 38, sellingPrice: 48, quantity: 60 }
];

export const SUGGESTED_COMPANIES = [
  'San Miguel Foods', 'Monde Nissin', 'Universal Robina Corp', 'Nestlé Philippines', 
  'Century Pacific Food', 'Gardenia Bakeries', 'Coca-Cola Beverages PH', 'Peerless Products',
  "JTI Int'l Phils.", 'Optimized Customer Solutions Inc.', 'Rosario Ang', 'Calyan Marketing'
];

export const SUGGESTED_BRANDS = [
  'Magnolia', 'Purefoods', 'Nissin', 'Lucky Me!', 'Gardenia', 'C2', 
  'Nature Spring', 'Bear Brand', 'Kopiko', 'Century Tuna', 'Jack \'n Jill'
];

export const SUGGESTED_SIZES = [
  'Solo', '1L', '500ml', '330ml', '250ml', '210g', '155g', '100g', '80g', '60g', '600g', 'Twin Pack', 'Pack'
];

export const SUGGESTED_UNITS = [
  'Piece', 'Can', 'Bottle', 'Pack', 'Cup', 'Loaf', 'Box', 'Sachet', 'Pouch'
];

export default function CanteenHub() {
  const { 
    canteenInventory, 
    canteenCategories,
    addCanteenCategory,
    deleteCanteenCategory,
    addSupplyItem, 
    updateSupplyItem,
    deleteSupplyItem,
    clearAllCanteenInventory,
    canteenSalesInvoices,
    deleteCanteenSalesInvoice,
    personalPurchaseOrders, 
    fulfillPurchaseOrder, 
    canteenReceipts, 
    recordCanteenSale, 
    canteenVoidLogs,
    canteenGatePasses,
    canteenDrawer,
    confirmCanteenSalaryDeduction,
    clearGatePass,
    staffList,
    currentUser,
    isHR,
    isSuperAdmin
  } = useApp();

  const [activeSubtab, setActiveSubtab] = useState('pos'); // 'pos', 'inventory', 'barcodes', 'orders', 'tracking', 'reports'
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

  // Sales Invoice State
  const [showSalesInvoiceModal, setShowSalesInvoiceModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  useEscapeKey('canteen-hub-z-reading-modal', ESCAPE_PRIORITY.MODAL, showZReadingModal, () => setShowZReadingModal(false));

  // Product Name-First Inbound Intake & Autocomplete State
  const [inboundProductNameQuery, setInboundProductNameQuery] = useState('');
  const [showInboundDropdown, setShowInboundDropdown] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [showModalCatalogDropdown, setShowModalCatalogDropdown] = useState(false);

  // Barcode Tagging & Assignment Station State
  const [barcodeViewFilter, setBarcodeViewFilter] = useState('UNASSIGNED'); // 'UNASSIGNED' | 'ALL' | 'INTERNAL'
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [pairingTargetProduct, setPairingTargetProduct] = useState(null);
  const [scannerGunInput, setScannerGunInput] = useState('');
  const [quickBarcodeEdits, setQuickBarcodeEdits] = useState({});

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

  // Edit Supply Item State
  const [editingSupplyItem, setEditingSupplyItem] = useState(null);
  const [showEditInlineAddCategory, setShowEditInlineAddCategory] = useState(false);
  const [editInlineCategoryInput, setEditInlineCategoryInput] = useState('');

  // Search & Filter
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedVoidReceipt, setSelectedVoidReceipt] = useState(null);

  // Progressive Escape dismissal (Priority 40 - MODAL)
  useEscapeKey('canteen-add-supply-modal', ESCAPE_PRIORITY.MODAL, showAddModal, () => setShowAddModal(false));
  useEscapeKey('canteen-edit-supply-modal', ESCAPE_PRIORITY.MODAL, Boolean(editingSupplyItem), () => setEditingSupplyItem(null));
  useEscapeKey('canteen-category-modal', ESCAPE_PRIORITY.MODAL, showCategoryModal, () => setShowCategoryModal(false));
  useEscapeKey('canteen-pass-modal-hub', ESCAPE_PRIORITY.MODAL, showCanteenPassModal, () => setShowCanteenPassModal(false));
  useEscapeKey('canteen-void-receipt-hub', ESCAPE_PRIORITY.MODAL, Boolean(selectedVoidReceipt), () => setSelectedVoidReceipt(null));

  // Unified master catalog list of products for suggestions
  const catalogMasterList = useMemo(() => {
    const map = new Map();
    POPULAR_SUPPLY_SUGGESTIONS.forEach(p => {
      if (p.name) map.set(p.name.toLowerCase().trim(), p);
    });
    if (canteenInventoryData?.products) {
      canteenInventoryData.products.forEach(p => {
        if (p.name && !map.has(p.name.toLowerCase().trim())) {
          map.set(p.name.toLowerCase().trim(), p);
        }
      });
    }
    Object.values(KNOWN_INBOUND_CATALOG).forEach(item => {
      if (item.name && !map.has(item.name.toLowerCase().trim())) {
        map.set(item.name.toLowerCase().trim(), item);
      }
    });
    canteenInventory.forEach(p => {
      if (p.name && !map.has(p.name.toLowerCase().trim())) {
        map.set(p.name.toLowerCase().trim(), p);
      }
    });
    return Array.from(map.values());
  }, [canteenInventory]);

  // Autocomplete matching products for the Inbound search bar
  const inboundMatches = useMemo(() => {
    if (!inboundProductNameQuery || !inboundProductNameQuery.trim()) return [];
    const q = inboundProductNameQuery.toLowerCase().trim();
    return catalogMasterList.filter(item => 
      item.name?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [inboundProductNameQuery, catalogMasterList]);

  // Autocomplete matching products for the inside-modal catalog search
  const modalCatalogMatches = useMemo(() => {
    if (!modalSearchQuery || !modalSearchQuery.trim()) return [];
    const q = modalSearchQuery.toLowerCase().trim();
    return catalogMasterList.filter(item => 
      item.name?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [modalSearchQuery, catalogMasterList]);

  // Helper to detect if a product has no valid barcode assigned
  const isMissingBarcode = (p) => {
    if (!p || !p.barcode) return true;
    const b = String(p.barcode).trim();
    return b === '' || b === 'N/A' || b === 'NONE' || b.startsWith('TEMP-');
  };

  const unassignedProducts = useMemo(() => {
    return canteenInventory.filter(isMissingBarcode);
  }, [canteenInventory]);

  const barcodedProducts = useMemo(() => {
    return canteenInventory.filter(p => !isMissingBarcode(p));
  }, [canteenInventory]);

  const internalSkuProducts = useMemo(() => {
    return canteenInventory.filter(p => p.barcode && String(p.barcode).startsWith('NKB-CAN-'));
  }, [canteenInventory]);

  // Handle selecting a product from suggestions to prefill the intake form
  const handleSelectProduct = (prod) => {
    if (!prod) return;
    playScanBeep();
    setNewItemName(prod.name || '');
    setNewItemCompany(prod.company || prod.supplier || 'Direct Supplier');
    setNewItemBrand(prod.brand || 'General');
    setNewItemCategory(prod.category || canteenCategories?.[0] || 'Beverages & Dairy');
    setNewItemCost(prod.costPrice !== undefined ? String(prod.costPrice) : '0');
    setNewItemPrice(prod.sellingPrice !== undefined ? String(prod.sellingPrice) : '0');
    setNewItemQty(prod.quantity !== undefined && prod.quantity > 0 ? String(prod.quantity) : '50');
    setNewItemSize(prod.size || '');
    setNewItemUnit(prod.unit || 'Piece');
    setNewItemExpiry(prod.expirationDate || '2027-06-30');
    // Barcode is kept if present and not a temp tag, otherwise empty
    setNewItemBarcode(prod.barcode && !prod.barcode.startsWith('TEMP-') ? prod.barcode : '');
    setInboundProductNameQuery('');
    setShowInboundDropdown(false);
    setModalSearchQuery('');
    setShowModalCatalogDropdown(false);
    setShowAddModal(true);
  };

  // Quick markup preset handler: calculates selling price from cost price
  const applyMarkupPercent = (pct) => {
    const cost = parseFloat(newItemCost);
    if (isNaN(cost) || cost <= 0) return;
    const computedPrice = (cost * (1 + pct / 100)).toFixed(2);
    setNewItemPrice(computedPrice);
  };

  // Quick expiry preset handler
  const applyExpiryMonths = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setNewItemExpiry(d.toISOString().slice(0, 10));
  };

  // Internal SKU Generator
  const generateSkuCode = () => {
    return `NKB-CAN-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Fast Scanner Gun Pairing Handler
  const handleScannerGunPair = (e) => {
    e.preventDefault();
    if (!scannerGunInput.trim()) return;
    const scannedCode = scannerGunInput.trim();
    const target = pairingTargetProduct || unassignedProducts[0];
    if (!target) {
      alert('Please select a product from the queue to pair with this barcode.');
      return;
    }
    
    updateSupplyItem(target.id, { barcode: scannedCode });
    playScanBeep();
    setScannerGunInput('');
    
    // Auto-advance to the next unassigned product
    const remaining = unassignedProducts.filter(p => p.id !== target.id);
    if (remaining.length > 0) {
      setPairingTargetProduct(remaining[0]);
    } else {
      setPairingTargetProduct(null);
    }
  };

  // Save inline barcode
  const handleSaveInlineBarcode = (productId, customBarcode) => {
    const code = (customBarcode !== undefined ? customBarcode : quickBarcodeEdits[productId] || '').trim();
    if (!code) {
      alert('Please enter a barcode or click "Generate SKU".');
      return;
    }
    updateSupplyItem(productId, { barcode: code });
    playScanBeep();
    setQuickBarcodeEdits(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  // Bulk Auto-Generate SKUs for All Unassigned Products
  const handleBulkGenerateSKUs = () => {
    if (unassignedProducts.length === 0) return;
    if (!window.confirm(`Generate unique internal scannable SKUs (NKB-CAN-XXXXXX) for all ${unassignedProducts.length} pending products?`)) return;
    
    unassignedProducts.forEach((item, index) => {
      const sku = `NKB-CAN-${Math.floor(100000 + Math.random() * 900000 + index)}`;
      updateSupplyItem(item.id, { barcode: sku });
    });
    playScanBeep();
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

  const handleUpdateSupply = (e) => {
    e.preventDefault();
    if (!editingSupplyItem) return;
    const cleanName = (editingSupplyItem.name || '').trim();
    if (!cleanName) {
      alert('Product name is required.');
      return;
    }
    const cost = parseFloat(editingSupplyItem.costPrice) || 0;
    const price = parseFloat(editingSupplyItem.sellingPrice) || 0;
    const qty = parseInt(editingSupplyItem.quantity) || 0;
    const reorder = parseInt(editingSupplyItem.reorderLevel) || 10;

    updateSupplyItem(editingSupplyItem.id, {
      name: cleanName,
      barcode: (editingSupplyItem.barcode || '').trim(),
      company: (editingSupplyItem.company || '').trim(),
      brand: (editingSupplyItem.brand || '').trim(),
      category: editingSupplyItem.category || canteenCategories?.[0] || 'Beverages & Dairy',
      size: (editingSupplyItem.size || '').trim(),
      costPrice: cost,
      sellingPrice: price,
      quantity: qty,
      unit: editingSupplyItem.unit || 'Piece',
      expirationDate: editingSupplyItem.expirationDate || '',
      reorderLevel: reorder
    });

    setEditingSupplyItem(null);
    setShowEditInlineAddCategory(false);
    setEditInlineCategoryInput('');
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
              onClick={() => setActiveSubtab('invoices')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubtab === 'invoices'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Sales Invoices ({(canteenSalesInvoices || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('barcodes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                activeSubtab === 'barcodes'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Tag className="h-4 w-4 text-amber-400" />
              <span>Barcode Tagging &amp; Workstation</span>
              {unassignedProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {unassignedProducts.length} Pending
                </span>
              )}
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
          
          {/* Inbound Supply Intake by Product Name & Suggestions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Encode Inbound Supply by Product Name
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-amber-300">
                      Catalog Autocomplete &amp; Form Suggestions
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No barcode scanner required at intake! Type product name to auto-fill Supplier, Brand, Category, Size, and Prices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Autocomplete Input */}
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={inboundProductNameQuery}
                    onChange={(e) => {
                      setInboundProductNameQuery(e.target.value);
                      setShowInboundDropdown(true);
                    }}
                    onFocus={() => setShowInboundDropdown(true)}
                    placeholder="Search product name (e.g. San Miguel, Purefoods, C2, Milk)..."
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  {inboundProductNameQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setInboundProductNameQuery('');
                        setShowInboundDropdown(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Autocomplete Dropdown */}
                  {showInboundDropdown && inboundMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-10 z-30 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      <div className="p-2 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        Matching Catalog Products ({inboundMatches.length})
                      </div>
                      {inboundMatches.map((prod, idx) => (
                        <div
                          key={`match-${idx}`}
                          onClick={() => handleSelectProduct(prod)}
                          className="p-2.5 hover:bg-slate-800/90 border-b border-slate-900/50 cursor-pointer transition flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{prod.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-amber-400">{prod.brand || prod.company || 'General'}</span>
                              <span>·</span>
                              <span>{prod.category}</span>
                              {prod.size && <span>· {prod.size}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-emerald-400">₱{Number(prod.sellingPrice || 0).toFixed(2)}</div>
                            <span className="text-[9px] text-slate-500">Auto-fill &amp; Encode</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Open modal for new product
                    setNewItemName(inboundProductNameQuery.trim());
                    setNewItemCompany('');
                    setNewItemBrand('');
                    setNewItemCategory(canteenCategories?.[0] || 'Beverages & Dairy');
                    setNewItemCost('');
                    setNewItemPrice('');
                    setNewItemQty('50');
                    setNewItemSize('');
                    setNewItemUnit('Piece');
                    setNewItemExpiry('');
                    setNewItemBarcode('');
                    setShowAddModal(true);
                  }}
                  className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Encode Product</span>
                </button>
              </div>
            </div>

            {/* Quick Popular Product Suggestion Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 font-medium mr-1 text-[10px] uppercase font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Popular Suggestions:</span>
              </span>
              {POPULAR_SUPPLY_SUGGESTIONS.map((prod, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectProduct(prod)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1"
                  title={`Click to auto-fill ${prod.name}`}
                >
                  <span>{prod.name}</span>
                  <span className="text-[9px] text-amber-400 font-mono">₱{prod.sellingPrice}</span>
                </button>
              ))}
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
                          {(item.sourceInvoiceNo || item.lastInvoiceNo) && (
                            <button
                              type="button"
                              onClick={() => {
                                const inv = (canteenSalesInvoices || []).find(i => i.invoiceNumber === (item.lastInvoiceNo || item.sourceInvoiceNo));
                                if (inv) setSelectedInvoiceDetail(inv);
                              }}
                              className="mt-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-mono font-bold border border-indigo-200 transition inline-flex items-center gap-1"
                              title={`View Sales Invoice ${item.lastInvoiceNo || item.sourceInvoiceNo}`}
                            >
                              <FileText className="h-2.5 w-2.5" />
                              <span>{item.lastInvoiceNo || item.sourceInvoiceNo}</span>
                            </button>
                          )}
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSupplyItem({ ...item })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                              title="Edit supply product details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
                                  deleteSupplyItem(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove supply item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* SUBTAB: SALES INVOICES (Supplier Inbound Receipts) */}
      {activeSubtab === 'invoices' && (() => {
        const invoices = canteenSalesInvoices || [];
        const totalInvoiceValue = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
        const totalInvoiceUnits = invoices.reduce((s, inv) => s + (inv.totalUnits || 0), 0);
        const uniqueSuppliers = [...new Set(invoices.map(inv => inv.supplier))];

        const filteredInvoices = invoices.filter(inv => {
          if (!invoiceSearch) return true;
          const q = invoiceSearch.toLowerCase();
          return (
            (inv.invoiceNumber || '').toLowerCase().includes(q) ||
            (inv.supplier || '').toLowerCase().includes(q) ||
            (inv.notes || '').toLowerCase().includes(q) ||
            (inv.items || []).some(it => (it.name || '').toLowerCase().includes(q))
          );
        });

        return (
          <div className="space-y-5">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoices</span>
                <span className="text-2xl font-mono font-black text-slate-900">{invoices.length}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inbound Value</span>
                <span className="text-2xl font-mono font-black text-indigo-700">₱{totalInvoiceValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Units Received</span>
                <span className="text-2xl font-mono font-black text-emerald-700">{totalInvoiceUnits.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Unique Suppliers</span>
                <span className="text-2xl font-mono font-black text-amber-700">{uniqueSuppliers.length}</span>
              </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Search invoice #, supplier, item name..."
                  className="w-full h-9 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowSalesInvoiceModal(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Encode New Sales Invoice</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Supplier</th>
                      <th className="px-4 py-3.5 text-center">Date &amp; Ref. No.</th>
                      <th className="px-4 py-3.5 text-center">Items</th>
                      <th className="px-4 py-3.5 text-center">Total Units</th>
                      <th className="px-4 py-3.5 text-right">Total Amount</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-3 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-slate-400 text-xs">
                          <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-600 text-sm">
                            {invoiceSearch ? 'No invoices match your search.' : 'No Sales Invoices recorded yet.'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                            Click "Encode New Sales Invoice" to record supplier purchases and automatically add items to Canteen Inventory.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setSelectedInvoiceDetail(inv)}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{inv.supplier}</div>
                            {inv.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">{inv.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="font-semibold text-slate-800">{inv.receivedDate || inv.purchaseDate}</div>
                            <div className="font-mono text-[10px] text-indigo-600 font-bold mt-0.5">{inv.invoiceNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-slate-800">{inv.itemsCount || (inv.items || []).length}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-emerald-700">{inv.totalUnits}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-black text-slate-900">₱{(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              {inv.status === 'POSTED_TO_INVENTORY' ? 'Posted' : (inv.status || 'Active')}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedInvoiceDetail(inv); }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                                title="View invoice details & print voucher"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete Sales Invoice ${inv.invoiceNumber} and revert ${inv.totalUnits} inbound units from inventory?`)) {
                                    deleteCanteenSalesInvoice(inv.id, true);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete invoice & revert stock"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

      {/* SUBTAB: BARCODE TAGGING & ASSIGNMENT WORKSTATION */}
      {activeSubtab === 'barcodes' && (
        <div className="space-y-5">
          
          {/* Workstation Header & KPI Metrics */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      Barcode Tagging &amp; Inventory SKU Station
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                      {unassignedProducts.length} Awaiting Barcode
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage items encoded without physical barcodes. Pair manufacturer barcodes using your scanner gun or generate internal NKB SKUs for adhesive sticker printing.
                  </p>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkGenerateSKUs}
                  disabled={unassignedProducts.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Automatically generate NKB-CAN-XXXXXX SKUs for all pending items"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Auto-Generate SKUs for All ({unassignedProducts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBarcodeSheet(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Print A4 Barcode Sticker Sheet (24-Up)"
                >
                  <Printer className="h-4 w-4 text-cyan-400" />
                  <span>Print Sticker Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewItemName('');
                    setNewItemBarcode('');
                    setNewItemCost('');
                    setNewItemPrice('');
                    setNewItemQty('50');
                    setShowAddModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Encode New Supply</span>
                </button>
              </div>
            </div>

            {/* 4 Stat KPI Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Catalog Items</span>
                <div className="text-xl font-black text-white font-mono">{canteenInventory.length}</div>
                <span className="text-[10px] text-slate-500">Master product database</span>
              </div>

              <div className="bg-amber-950/30 border border-amber-900/40 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400">Awaiting Barcodes</span>
                <div className="text-xl font-black text-amber-300 font-mono">{unassignedProducts.length}</div>
                <span className="text-[10px] text-amber-400/80 font-medium">Pending scanner/SKU pairing</span>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Barcodes Verified</span>
                <div className="text-xl font-black text-emerald-300 font-mono">{barcodedProducts.length}</div>
                <span className="text-[10px] text-emerald-400/80 font-medium">Ready for POS counter scan</span>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-900/40 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Internal NKB SKUs</span>
                <div className="text-xl font-black text-cyan-300 font-mono">{internalSkuProducts.length}</div>
                <span className="text-[10px] text-cyan-400/80 font-medium">Cooked/Local canteen goods</span>
              </div>
            </div>
          </div>

          {/* Rapid Scanner Gun Pairing Station */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Rapid Barcode Scanner Gun Pairing Workstation
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Auto-Advances to Next Item on Scan
              </span>
            </div>

            {/* Currently targeted item banner */}
            {(() => {
              const target = pairingTargetProduct || unassignedProducts[0];
              if (!target) {
                return (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-200">
                      All products currently have assigned barcodes!
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select any product in the directory table below to update or re-tag its barcode.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                            Active Gun Pairing Target
                          </span>
                          <span className="text-xs font-bold text-white">{target.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>Category: <strong className="text-slate-200">{target.category}</strong></span>
                          <span>·</span>
                          <span>Size: <strong className="text-slate-200">{target.size || 'Standard'}</strong></span>
                          <span>·</span>
                          <span>Stock: <strong className="text-slate-200">{target.quantity} {target.unit || 'pcs'}</strong></span>
                          <span>·</span>
                          <span>Price: <strong className="text-emerald-400 font-mono">₱{Number(target.sellingPrice).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sku = generateSkuCode();
                          handleSaveInlineBarcode(target.id, sku);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Generate internal SKU for this item"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Generate SKU</span>
                      </button>
                    </div>
                  </div>

                  {/* Scanner Gun Input Form */}
                  <form onSubmit={handleScannerGunPair} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <ScanBarcode className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={scannerGunInput}
                        onChange={(e) => setScannerGunInput(e.target.value)}
                        placeholder="Aim scanner gun here & pull trigger (or type barcode & press Enter)..."
                        className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!scannerGunInput.trim()}
                      className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition cursor-pointer shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Pair Barcode &amp; Next</span>
                    </button>
                  </form>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>💡 <strong>Scanner Gun Workflow:</strong> Plug in your USB scanner gun, scan the physical barcode on the packaging. The system will immediately bind the barcode to <strong>"{target.name}"</strong>, emit a beep, and auto-load the next unassigned product!</span>
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Subtab View Filters & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setBarcodeViewFilter('UNASSIGNED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    barcodeViewFilter === 'UNASSIGNED'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                  <span>Awaiting Barcode ({unassignedProducts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBarcodeViewFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    barcodeViewFilter === 'ALL'
                      ? 'bg-slate-950 text-white shadow-sm font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>All Catalog Products ({canteenInventory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBarcodeViewFilter('INTERNAL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    barcodeViewFilter === 'INTERNAL'
                      ? 'bg-cyan-700 text-white shadow-sm font-black'
                      : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
                  }`}
                >
                  <Wand2 className="h-3.5 w-3.5 text-cyan-600" />
                  <span>Internal NKB SKUs ({internalSkuProducts.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={barcodeTableSearch}
                  onChange={(e) => setBarcodeTableSearch(e.target.value)}
                  placeholder="Search name, category, or barcode..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                {barcodeTableSearch && (
                  <button
                    type="button"
                    onClick={() => setBarcodeTableSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Products Workstation Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-slate-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {barcodeViewFilter === 'UNASSIGNED' ? 'Products Awaiting Barcode Tagging' : barcodeViewFilter === 'INTERNAL' ? 'Internal NKB Canteen SKUs' : 'All Catalog Barcode Directory'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Real-Time POS Inventory Sync
              </span>
            </div>

            {(() => {
              let list = canteenInventory;
              if (barcodeViewFilter === 'UNASSIGNED') {
                list = unassignedProducts;
              } else if (barcodeViewFilter === 'INTERNAL') {
                list = internalSkuProducts;
              }

              if (barcodeTableSearch.trim()) {
                const q = barcodeTableSearch.toLowerCase().trim();
                list = list.filter(item => 
                  item.name?.toLowerCase().includes(q) ||
                  item.barcode?.toLowerCase().includes(q) ||
                  item.category?.toLowerCase().includes(q) ||
                  item.brand?.toLowerCase().includes(q) ||
                  item.company?.toLowerCase().includes(q)
                );
              }

              if (list.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">
                      {barcodeViewFilter === 'UNASSIGNED' 
                        ? 'Zero pending products! All items have verified barcodes.'
                        : 'No products match your search filter.'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {barcodeViewFilter === 'UNASSIGNED' 
                        ? 'When you encode new supply without a barcode, it will appear here in the tagging queue automatically.'
                        : 'Try searching with a different keyword or resetting your filter.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3.5">Product Name &amp; Details</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5 text-right">Selling Price</th>
                        <th className="px-4 py-3.5 text-center">In-Stock Qty</th>
                        <th className="px-4 py-3.5">Current Barcode / Scannable SKU</th>
                        <th className="px-4 py-3.5">Assign Physical Barcode</th>
                        <th className="px-4 py-3.5 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((item) => {
                        const hasBarcode = !isMissingBarcode(item);
                        const isInternal = item.barcode && String(item.barcode).startsWith('NKB-CAN-');
                        const isTargeted = pairingTargetProduct?.id === item.id;
                        const editVal = quickBarcodeEdits[item.id] !== undefined ? quickBarcodeEdits[item.id] : (item.barcode || '');

                        return (
                          <tr 
                            key={item.id} 
                            className={`transition ${isTargeted ? 'bg-amber-50/60 ring-1 ring-amber-300' : hasBarcode ? 'hover:bg-slate-50/80' : 'bg-amber-50/20 hover:bg-amber-50/40'}`}
                          >
                            {/* Product Name & Details */}
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {isTargeted && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                                    Active Target
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                {item.brand && <span>{item.brand}</span>}
                                {item.company && <span>· {item.company}</span>}
                                {item.size && <span>· {item.size}</span>}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {item.category || 'General Supplies'}
                              </span>
                            </td>

                            {/* Selling Price */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              ₱{Number(item.sellingPrice || 0).toFixed(2)}
                            </td>

                            {/* In-Stock Qty */}
                            <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-medium">
                              <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                                item.quantity <= 5 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {item.quantity} {item.unit || 'pcs'}
                              </span>
                            </td>

                            {/* Current Barcode / Preview */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {hasBarcode ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      {item.barcode}
                                    </span>
                                    {isInternal ? (
                                      <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold">
                                        Internal SKU
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                                        GTIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-28 py-0.5">
                                    <BarcodeView value={item.barcode} height={20} width={1} displayValue={false} />
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  <AlertCircle className="h-3 w-3 text-amber-600" />
                                  No Barcode Assigned
                                </span>
                              )}
                            </td>

                            {/* Assign Physical Barcode Input */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuickBarcodeEdits(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                  placeholder="Type or scan..."
                                  className="w-36 h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveInlineBarcode(item.id, editVal);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineBarcode(item.id, editVal)}
                                  className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer"
                                  title="Save this barcode to the product"
                                >
                                  Save
                                </button>
                              </div>
                            </td>

                            {/* Quick Actions */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                {!hasBarcode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const sku = generateSkuCode();
                                      handleSaveInlineBarcode(item.id, sku);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                    title="Generate Internal Scannable SKU"
                                  >
                                    <Wand2 className="h-3 w-3" />
                                    <span>Gen SKU</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPairingTargetProduct(item);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                    isTargeted
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                  title="Set this product as the target for scanner gun pairing"
                                >
                                  <ScanBarcode className="h-3 w-3" />
                                  <span>{isTargeted ? 'Targeted' : 'Gun Target'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingSupplyItem(item)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title="Edit full product attributes"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

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
                      const isCleared = Boolean(
                        gp.gateStatus?.toLowerCase().includes('cleared') ||
                        gp.status?.toLowerCase().includes('cleared') ||
                        gp.clearedAt
                      );
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
                              isCleared ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isCleared ? 'Cleared at Gate' : (gp.gateStatus || 'Issued')}
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
              
              {/* Quick Catalog / Product Name Auto-Fill Bar Inside Modal */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Search Catalog to Auto-Fill All Form Fields</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    350+ Item Master Database
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => {
                      setModalSearchQuery(e.target.value);
                      setShowModalCatalogDropdown(true);
                    }}
                    onFocus={() => setShowModalCatalogDropdown(true)}
                    placeholder="Search product (e.g. San Miguel, Purefoods, C2, Milk, Lucky Me)..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalSearchQuery('');
                        setShowModalCatalogDropdown(false);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Autocomplete Dropdown Inside Modal */}
                  {showModalCatalogDropdown && modalCatalogMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-9 z-30 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                      {modalCatalogMatches.map((m, idx) => (
                        <div
                          key={`modal-match-${idx}`}
                          onClick={() => {
                            handleSelectProduct(m);
                            setShowModalCatalogDropdown(false);
                            setModalSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-800 cursor-pointer border-b border-slate-900 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{m.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({m.category} · {m.brand || 'General'})</span>
                          </div>
                          <span className="font-mono text-emerald-400 text-xs font-bold">₱{Number(m.sellingPrice || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Product Name */}
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 font-bold text-slate-900"
                  />
                </div>

                {/* Barcode (Explicitly Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Barcode (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewItemBarcode(generateSkuCode())}
                      className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition cursor-pointer"
                      title="Generate an internal NKB-CAN-XXXXXX SKU"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Generate SKU</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newItemBarcode}
                    onChange={(e) => setNewItemBarcode(e.target.value)}
                    placeholder="Leave blank if no barcode yet..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Can be assigned later in the <strong>Barcode Tagging Station</strong>.
                  </p>
                </div>

                {/* Size / Packaging with Suggestions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Size / Packaging (e.g. 1L, 210g, Solo)
                  </label>
                  <input
                    type="text"
                    value={newItemSize}
                    onChange={(e) => setNewItemSize(e.target.value)}
                    placeholder="e.g., 1L, 210g, 60g, 500ml"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {SUGGESTED_SIZES.slice(0, 7).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setNewItemSize(sz)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                          newItemSize === sz
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category with Suggestions */}
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

                  {/* Quick Category Suggestion Pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Beverages & Dairy', 'Canned Goods', 'Instant Meals', 'Bakery & Bread', 'Snacks', 'Hot Drinks', 'General Supplies'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewItemCategory(cat)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                          newItemCategory === cat
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company (Supplier) with Suggestions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company (Supplier)
                  </label>
                  <input
                    type="text"
                    value={newItemCompany}
                    onChange={(e) => setNewItemCompany(e.target.value)}
                    placeholder="e.g., San Miguel Foods"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {SUGGESTED_COMPANIES.slice(0, 4).map(comp => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setNewItemCompany(comp)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                          newItemCompany === comp
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand with Suggestions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="e.g., Magnolia Pure Fresh"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {SUGGESTED_BRANDS.slice(0, 6).map(br => (
                      <button
                        key={br}
                        type="button"
                        onClick={() => setNewItemBrand(br)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                          newItemBrand === br
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {br}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit of Measurement with Suggestions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Piece, Can, Bottle, Pack..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {SUGGESTED_UNITS.map(un => (
                      <button
                        key={un}
                        type="button"
                        onClick={() => setNewItemUnit(un)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                          newItemUnit === un
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {un}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing & Markup Presets Box */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Pricing &amp; Automatic Markup Presets (% on Cost):
                    </span>
                    {parseFloat(newItemCost) > 0 && parseFloat(newItemPrice) > 0 && (
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        Margin: {(((parseFloat(newItemPrice) - parseFloat(newItemCost)) / parseFloat(newItemCost)) * 100).toFixed(1)}% (+₱{(parseFloat(newItemPrice) - parseFloat(newItemCost)).toFixed(2)}/unit)
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cost Price (₱) <span className="text-slate-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newItemCost}
                        onChange={(e) => setNewItemCost(e.target.value)}
                        placeholder="82.00"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Selling Price (₱) <span className="text-slate-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="98.00"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* Markup calculation quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Markup Presets:</span>
                    {[15, 20, 25, 30].map(pct => {
                      const cost = parseFloat(newItemCost);
                      const targetPrice = !isNaN(cost) && cost > 0 ? (cost * (1 + pct / 100)).toFixed(2) : null;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyMarkupPercent(pct)}
                          disabled={!targetPrice}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 text-slate-700 hover:text-emerald-800 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                        >
                          +{pct}% {targetPrice ? `(₱${targetPrice})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inbound Quantity */}
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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[12, 24, 48, 50, 100].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setNewItemQty(String(q))}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer"
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiration Date with Presets */}
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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { label: '+1M', months: 1 },
                      { label: '+3M', months: 3 },
                      { label: '+6M', months: 6 },
                      { label: '+1Y', months: 12 }
                    ].map(exp => (
                      <button
                        key={exp.label}
                        type="button"
                        onClick={() => applyExpiryMonths(exp.months)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>
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

      {/* Edit Supply Item Modal */}
      {editingSupplyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-slate-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Supply Product Details
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ID: {editingSupplyItem.id} {editingSupplyItem.barcode ? `· SKU: ${editingSupplyItem.barcode}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSupplyItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSupply} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSupplyItem.name || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., San Miguel Fresh Milk 1L"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Barcode (SKU / GTIN)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingSupplyItem(prev => ({ ...prev, barcode: generateSkuCode() }))}
                      className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition cursor-pointer"
                      title="Generate an internal NKB-CAN-XXXXXX SKU"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Generate SKU</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingSupplyItem.barcode || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Leave blank or enter barcode..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Size / Packaging (e.g., 210g, 1L, 60g, 500ml)
                  </label>
                  <input
                    type="text"
                    value={editingSupplyItem.size || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, size: e.target.value }))}
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
                    {showEditInlineAddCategory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditInlineAddCategory(false);
                          setEditInlineCategoryInput('');
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        Choose Existing
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowEditInlineAddCategory(true)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
                        title="Add a new custom supply category"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Category</span>
                      </button>
                    )}
                  </div>

                  {showEditInlineAddCategory ? (
                    <div>
                      <div className="relative flex items-center w-full">
                        <input
                          type="text"
                          value={editInlineCategoryInput}
                          onChange={(e) => setEditInlineCategoryInput(e.target.value)}
                          placeholder="Type new category..."
                          className="w-full h-10 pl-3 pr-20 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium transition"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const clean = editInlineCategoryInput.trim();
                              if (clean) {
                                addCanteenCategory(clean);
                                setEditingSupplyItem(prev => ({ ...prev, category: clean }));
                              }
                              setShowEditInlineAddCategory(false);
                              setEditInlineCategoryInput('');
                            } else if (e.key === 'Escape') {
                              setShowEditInlineAddCategory(false);
                              setEditInlineCategoryInput('');
                            }
                          }}
                        />
                        <div className="absolute right-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const clean = editInlineCategoryInput.trim();
                              if (clean) {
                                addCanteenCategory(clean);
                                setEditingSupplyItem(prev => ({ ...prev, category: clean }));
                              }
                              setShowEditInlineAddCategory(false);
                              setEditInlineCategoryInput('');
                            }}
                            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditInlineAddCategory(false);
                              setEditInlineCategoryInput('');
                            }}
                            className="h-7 w-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={editingSupplyItem.category || canteenCategories?.[0] || 'Beverages & Dairy'}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowEditInlineAddCategory(true);
                        } else {
                          setEditingSupplyItem(prev => ({ ...prev, category: e.target.value }));
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
                    value={editingSupplyItem.company || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, company: e.target.value }))}
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
                    value={editingSupplyItem.brand || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, brand: e.target.value }))}
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
                    value={editingSupplyItem.costPrice ?? ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, costPrice: e.target.value }))}
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
                    value={editingSupplyItem.sellingPrice ?? ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    placeholder="98.00"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity <span className="text-slate-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editingSupplyItem.quantity ?? ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="50"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={editingSupplyItem.unit || 'Piece'}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                  >
                    <option value="Piece">Piece / pc</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Can">Can</option>
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiration Date / Best Before Date
                  </label>
                  <input
                    type="date"
                    value={editingSupplyItem.expirationDate || ''}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={editingSupplyItem.reorderLevel ?? 10}
                    onChange={(e) => setEditingSupplyItem(prev => ({ ...prev, reorderLevel: e.target.value }))}
                    placeholder="10"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplyItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Update Supply Product</span>
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

      {/* Sales Invoice Encoding Modal */}
      {showSalesInvoiceModal && (
        <SalesInvoiceModal
          isOpen={showSalesInvoiceModal}
          onClose={() => setShowSalesInvoiceModal(false)}
        />
      )}

      {/* Sales Invoice Detail / Voucher Modal */}
      {selectedInvoiceDetail && (
        <SalesInvoiceDetailModal
          invoice={selectedInvoiceDetail}
          onClose={() => setSelectedInvoiceDetail(null)}
        />
      )}

    </div>
  );
}
