import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, 
  Store, 
  Utensils, 
  ShoppingBag, 
  Banknote, 
  CreditCard, 
  Wallet, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Minus, 
  UserCheck, 
  Maximize2, 
  Tv, 
  X, 
  Search, 
  Receipt, 
  FileText,
  KeyRound,
  ShieldCheck,
  Check,
  Zap,
  Volume2,
  VolumeX,
  Calculator,
  Clock,
  Package,
  Tag,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMultiScreenManager } from '../../utils/useMultiScreenManager';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { 
  playScanBeep, 
  playSuccessChime, 
  playErrorBuzz, 
  playVoidTone,
  isAudioMuted,
  toggleAudioMute
} from '../../utils/audioFeedback';
import { 
  resolveStaffFromScan, 
  cleanScanInput, 
  isStaffBarcodePattern 
} from '../../utils/scanResolver';
import CanteenZReadingModal from './CanteenZReadingModal';
import CanteenItemScanModal from './CanteenItemScanModal';

// Standard fallback catalog for barcode gun recognition
const STANDARD_SUPPLIES_CATALOG = {
  '4800016644012': { name: 'San Miguel Fresh Milk 1L', brand: 'Magnolia Pure Fresh', company: 'San Miguel Dairy Corp', sellingPrice: 98.00, size: '1L', category: 'Beverages & Dairy' },
  '4800016600216': { name: 'Purefoods Corned Beef 210g', brand: 'Purefoods', company: 'San Miguel Foods Inc', sellingPrice: 92.00, size: '210g', category: 'Canned Goods' },
  '4800841200115': { name: 'Nissin Cup Noodles Seafood 60g', brand: 'Nissin', company: 'Monde Nissin Corp', sellingPrice: 38.00, size: '60g', category: 'Instant Meals' },
  '4800047820102': { name: 'Gardenia Classic White Bread 600g', brand: 'Gardenia', company: 'Gardenia Bakeries Phils', sellingPrice: 78.00, size: '600g', category: 'Bakery & Bread' },
  '4807770270014': { name: 'C2 Green Tea Apple 500ml', brand: 'URC C2', company: 'Universal Robina Corp', sellingPrice: 30.00, size: '500ml', category: 'Beverages' },
  '4800552109923': { name: 'Nature Spring Mineral Water 500ml', brand: 'Nature Spring', company: 'Philippine Spring Water Resources Inc', sellingPrice: 18.00, size: '500ml', category: 'Beverages' },
  '4809012340011': { name: 'NKB Arc Welder 200A Consumables', brand: 'NKB Pro', company: 'NKB Manufacturing', sellingPrice: 150.00, size: 'Pack', category: 'General' },
  '4809012340035': { name: 'NKB Precision Shop Gloves', brand: 'NKB Safety', company: 'NKB Manufacturing', sellingPrice: 85.00, size: 'Pair', category: 'Safety' }
};

export default function CanteenScannerTerminal({ onShowReceipt, onShowGatePass }) {
  const { 
    staffList, 
    canteenInventory, 
    recordCanteenSale, 
    verifySupervisorBarcode,
    voidActiveCartItemWithBarcode,
    voidActiveCartWithBarcode,
    broadcastPOSDisplayState,
    currentUser
  } = useApp();

  const {
    isMultiScreen,
    screenCount,
    secondaryScreen,
    isAutoLaunchEnabled,
    toggleAutoLaunch,
    isWindowOpen,
    openCustomerDisplay,
    closeCustomerDisplay,
    hdmiStatusText,
    autoLaunchBlocked,
    dismissBlockedPrompt,
    lastEventMsg
  } = useMultiScreenManager();

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine In'); // 'Dine In' | 'Grocery'
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'Salary Deduction' (Auto-Settled via Coop)
  
  // Scanned item feedback banner
  const [lastScanned, setLastScanned] = useState(null);
  
  // Customer selection modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Late Encoding option (Claimed on earlier date)
  const [isLateEncoded, setIsLateEncoded] = useState(false);
  const [claimedDate, setClaimedDate] = useState('');
  const [lateReason, setLateReason] = useState('');
  
  // Void authorization modal
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [targetVoidItem, setTargetVoidItem] = useState(null); // null means full cart void
  const [supervisorBarcode, setSupervisorBarcode] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [voidReason, setVoidReason] = useState('Cashier error / Order modification');
  const [voidError, setVoidError] = useState('');

  // Audio Feedback & Z-Reading Closeout Modal
  const [soundMuted, setSoundMuted] = useState(() => isAudioMuted());
  const [showZReadingModal, setShowZReadingModal] = useState(false);

  // Real-time scan feedback banner for cashier
  const [scanStatusNotice, setScanStatusNotice] = useState(null);

  // Auto-dismiss scan notice after 6s
  useEffect(() => {
    if (!scanStatusNotice) return;
    const timer = setTimeout(() => setScanStatusNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [scanStatusNotice]);

  const barcodeInputRef = useRef(null);
  const supervisorInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const suggestionsBoxRef = useRef(null);

  // Product suggestions & autocomplete states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Canteen Item Scan & Details Pop-up Modal State
  const [showItemScanModal, setShowItemScanModal] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState(null);

  // Global F2 shortcut to open Canteen Item Scan Pop-up
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setEditingCartItem(null);
        setShowItemScanModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Progressive Escape dismissal:
  // 0. Item Scan Modal (Priority 40)
  useEscapeKey('canteen-item-scan-modal', ESCAPE_PRIORITY.MODAL, showItemScanModal, () => {
    setShowItemScanModal(false);
    setEditingCartItem(null);
  });
  // 1. Suggestions: Dismiss product suggestions dropdown or clear customer search (Priority 80)
  useEscapeKey('canteen-product-suggestions', ESCAPE_PRIORITY.SUGGESTION, showSuggestions, () => setShowSuggestions(false));
  useEscapeKey('canteen-customer-search-query', ESCAPE_PRIORITY.SUGGESTION, showCustomerModal && Boolean(customerSearchQuery), () => setCustomerSearchQuery(''));
  // 2. Modals: Close customer modal, void modal, or z-reading modal (Priority 40)
  useEscapeKey('canteen-customer-modal', ESCAPE_PRIORITY.MODAL, showCustomerModal, () => setShowCustomerModal(false));
  useEscapeKey('canteen-void-modal', ESCAPE_PRIORITY.MODAL, showVoidModal, () => setShowVoidModal(false));
  useEscapeKey('canteen-z-reading-modal', ESCAPE_PRIORITY.MODAL, showZReadingModal, () => setShowZReadingModal(false));
  // 3. Docked mini-tabs / floating panels: Dismiss lastScanned item banner or notice (Priority 10)
  useEscapeKey('canteen-scanned-banner', ESCAPE_PRIORITY.DOCKED_TAB, Boolean(lastScanned), () => setLastScanned(null));
  useEscapeKey('canteen-status-notice', ESCAPE_PRIORITY.DOCKED_TAB, Boolean(scanStatusNotice), () => setScanStatusNotice(null));

  // Dismiss suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target) && !barcodeInputRef.current?.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus barcode input on mount and after actions
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [showCustomerModal, showVoidModal, showZReadingModal]);

  // Audio Feedback Synthesizer using Web Audio API
  const playBeep = (type = 'success') => {
    if (type === 'success' || type === 'scan') {
      playScanBeep();
    } else if (type === 'checkout') {
      playSuccessChime();
    } else if (type === 'void') {
      playVoidTone();
    } else if (type === 'error') {
      playErrorBuzz();
    } else {
      playScanBeep();
    }
  };

  // Broadcast current register state to 2nd monitor whenever cart, orderType, payment, or customer changes
  useEffect(() => {
    const total = cart.reduce((acc, it) => acc + (it.unitPrice * (it.quantity || 1)), 0);
    const customerPayload = selectedStaff ? {
      ...selectedStaff,
      name: selectedStaff.name || `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''}`.trim() || selectedStaff.rawName || 'Employee'
    } : null;

    broadcastPOSDisplayState({
      cart,
      lastScannedItem: lastScanned,
      orderType,
      paymentMethod,
      customer: customerPayload,
      grandTotal: total,
      status: cart.length > 0 ? 'SCANNING' : 'IDLE'
    });
  }, [cart, orderType, paymentMethod, selectedStaff, lastScanned]);

  // Launch / Focus Customer Display on Second Monitor
  const handleOpenSecondMonitor = () => {
    openCustomerDisplay();
  };

  // Resolves staff from barcode gun, digital ID QR, name, or employee ID
  const resolveStaff = (inputStr) => {
    return resolveStaffFromScan(staffList, inputStr);
  };

  // Live product suggestions based on barcode, product name, brand, or category
  const productSuggestions = React.useMemo(() => {
    const q = (barcodeQuery || '').trim().toLowerCase();
    if (!q) return [];

    const cleanQ = cleanScanInput(q).toLowerCase();
    const cleanAlnum = q.replace(/[^a-z0-9]/g, '');
    const inventoryList = Array.isArray(canteenInventory) ? canteenInventory : [];

    const matches = inventoryList.filter(item => {
      const bCode = (item.barcode || '').toLowerCase();
      const bAlnum = bCode.replace(/[^a-z0-9]/g, '');
      const name = (item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const id = (item.id || '').toLowerCase();

      return (
        bCode.includes(cleanQ) ||
        (cleanAlnum.length >= 3 && bAlnum.includes(cleanAlnum)) ||
        name.includes(q) ||
        brand.includes(q) ||
        cat.includes(q) ||
        id.includes(q)
      );
    });

    // Also search STANDARD_SUPPLIES_CATALOG
    Object.entries(STANDARD_SUPPLIES_CATALOG).forEach(([code, std]) => {
      if (matches.length >= 12) return;
      const bCode = code.toLowerCase();
      const name = std.name.toLowerCase();
      const brand = (std.brand || '').toLowerCase();
      const cat = (std.category || '').toLowerCase();

      if (
        (bCode.includes(cleanQ) || name.includes(q) || brand.includes(q) || cat.includes(q)) &&
        !matches.some(m => m.barcode === code)
      ) {
        matches.push({
          id: `prod-${code}`,
          barcode: code,
          name: std.name,
          brand: std.brand,
          company: std.company,
          sellingPrice: std.sellingPrice,
          size: std.size,
          category: std.category,
          quantity: 50,
          stockStatus: 'In Stock'
        });
      }
    });

    // Rank: exact barcode > barcode starts with > name starts with > contains
    return matches.sort((a, b) => {
      const aBar = (a.barcode || '').toLowerCase();
      const bBar = (b.barcode || '').toLowerCase();
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();

      if (aBar === cleanQ) return -1;
      if (bBar === cleanQ) return 1;
      if (aBar.startsWith(cleanQ) && !bBar.startsWith(cleanQ)) return -1;
      if (!aBar.startsWith(cleanQ) && bBar.startsWith(cleanQ)) return 1;
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (!aName.startsWith(q) && bName.startsWith(q)) return 1;
      return 0;
    }).slice(0, 8);
  }, [barcodeQuery, canteenInventory]);

  // Top quick suggestions for fast checkout identification
  const popularQuickPicks = React.useMemo(() => {
    if (!Array.isArray(canteenInventory) || canteenInventory.length === 0) {
      return Object.entries(STANDARD_SUPPLIES_CATALOG).slice(0, 6).map(([code, item]) => ({
        id: `prod-${code}`,
        barcode: code,
        name: item.name,
        sellingPrice: item.sellingPrice,
        brand: item.brand,
        category: item.category
      }));
    }
    const staples = ['water', 'coffee', 'bread', 'noodles', 'snack', 'biscuit'];
    const candidates = canteenInventory.filter(item => {
      const n = (item.name || '').toLowerCase();
      return staples.some(s => n.includes(s));
    });
    return (candidates.length >= 6 ? candidates : canteenInventory).slice(0, 6);
  }, [canteenInventory]);

  // Centralized helper to add product to cart with audio & display feedback
  const addItemToCart = (item) => {
    if (!item) return;
    playBeep('success');
    const unitPrice = Number(item.sellingPrice || item.unitPrice || 0);

    setLastScanned({
      name: item.name,
      brand: item.brand || 'NKB',
      barcode: item.barcode,
      unitPrice: unitPrice,
      size: item.size || item.unit || 'Unit'
    });

    setCart(prev => {
      const idx = prev.findIndex(p => (item.barcode && p.barcode === item.barcode) || p.id === item.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 1) + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          id: item.id || `item-${Date.now()}`,
          barcode: item.barcode || '',
          name: item.name,
          brand: item.brand || 'NKB',
          size: item.size || item.unit || '',
          unitPrice: unitPrice,
          quantity: 1
        }
      ];
    });

    setScanStatusNotice({
      type: 'staff',
      message: `Added: ${item.name} · ₱${unitPrice.toFixed(2)}`,
      timestamp: Date.now()
    });

    setBarcodeQuery('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    barcodeInputRef.current?.focus();
  };

  // Handler for confirmed item from CanteenItemScanModal
  const handleConfirmItemFromModal = (itemData) => {
    if (!itemData) return;
    playBeep('success');
    const unitPrice = Number(itemData.unitPrice || 0);

    setLastScanned({
      name: itemData.name,
      brand: itemData.brand || 'NKB',
      barcode: itemData.barcode,
      unitPrice: unitPrice,
      size: itemData.size || 'Unit'
    });

    setCart(prev => {
      // If editing existing item by id
      const editIdx = prev.findIndex(p => p.id === itemData.id);
      if (editIdx !== -1) {
        const copy = [...prev];
        copy[editIdx] = {
          ...copy[editIdx],
          ...itemData
        };
        return copy;
      }

      // Check if existing product by barcode (non-custom, without special notes/discounts)
      if (itemData.barcode && !itemData.isCustom) {
        const existingIdx = prev.findIndex(p => p.barcode === itemData.barcode && !p.notes && !p.discountPercent);
        if (existingIdx !== -1 && !itemData.notes && !itemData.discountPercent) {
          const copy = [...prev];
          copy[existingIdx] = {
            ...copy[existingIdx],
            quantity: (copy[existingIdx].quantity || 1) + (itemData.quantity || 1)
          };
          return copy;
        }
      }

      return [
        ...prev,
        {
          id: itemData.id || `item-${Date.now()}`,
          barcode: itemData.barcode || '',
          name: itemData.name,
          brand: itemData.brand || 'NKB',
          size: itemData.size || '',
          unitPrice: unitPrice,
          originalPrice: itemData.originalPrice || unitPrice,
          discountPercent: itemData.discountPercent || 0,
          quantity: itemData.quantity || 1,
          orderType: itemData.orderType || orderType,
          category: itemData.category || '',
          notes: itemData.notes || '',
          isCustom: Boolean(itemData.isCustom)
        }
      ];
    });

    setScanStatusNotice({
      type: 'staff',
      message: `${editingCartItem ? 'Updated' : 'Recorded'}: ${itemData.quantity}x ${itemData.name} · ₱${(unitPrice * itemData.quantity).toFixed(2)}`,
      timestamp: Date.now()
    });

    setEditingCartItem(null);
  };

  // Keyboard navigation for product suggestions dropdown
  const handleKeyDown = (e) => {
    if (!showSuggestions || productSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < productSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : productSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && productSuggestions[highlightedIndex]) {
        e.preventDefault();
        addItemToCart(productSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle Barcode Scan
  const handleBarcodeSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // If an item is highlighted via keyboard in suggestions, select it
    if (highlightedIndex >= 0 && productSuggestions[highlightedIndex]) {
      addItemToCart(productSuggestions[highlightedIndex]);
      return;
    }

    const clean = cleanScanInput(barcodeQuery);
    if (!clean) return;

    // 1. Check if user scanned an employee badge (supports Name, ID, QR code, Code 128, etc.)
    const foundStaff = resolveStaff(clean);
    if (foundStaff) {
      setSelectedStaff(foundStaff);
      playBeep('success');
      setBarcodeQuery('');
      setShowSuggestions(false);
      setScanStatusNotice({
        type: 'staff',
        message: `Customer Identified: ${foundStaff.firstName} ${foundStaff.lastName} (${foundStaff.employeeId}) · Unlimited Pass Verified`,
        timestamp: Date.now()
      });
      return;
    }

    // 2. Guard: If barcode matches employee badge patterns but wasn't found in masterlist, DO NOT add to cart!
    if (isStaffBarcodePattern(clean)) {
      playBeep('error');
      setScanStatusNotice({
        type: 'error',
        message: `Employee ID / Badge "${clean}" was not recognized in the Employee Masterlist.`,
        timestamp: Date.now()
      });
      alert(`Employee Badge or ID "${clean}" was not recognized in the Employee Masterlist.\n\nPlease verify the employee ID card or select staff manually.`);
      setBarcodeQuery('');
      setShowSuggestions(false);
      barcodeInputRef.current?.focus();
      return;
    }

    // 3. Check in canteenInventory
    let matchedItem = canteenInventory.find(i => 
      (i.barcode && cleanScanInput(i.barcode).toUpperCase() === clean.toUpperCase()) || 
      (i.id && i.id.toUpperCase() === clean.toUpperCase()) || 
      (i.name && i.name.toLowerCase().includes(clean.toLowerCase()))
    );

    // 4. Fallback to standard supply catalog
    if (!matchedItem && STANDARD_SUPPLIES_CATALOG[clean]) {
      const std = STANDARD_SUPPLIES_CATALOG[clean];
      matchedItem = {
        id: `prod-${clean}`,
        barcode: clean,
        name: std.name,
        brand: std.brand,
        company: std.company,
        sellingPrice: std.sellingPrice,
        size: std.size,
        category: std.category
      };
    }

    // 5. If item not found in inventory or catalog:
    if (!matchedItem) {
      // If user typed search terms and there are suggestions, pick the top suggestion
      if (productSuggestions.length > 0) {
        addItemToCart(productSuggestions[0]);
        return;
      }

      playBeep('error');
      setScanStatusNotice({
        type: 'error',
        message: `Unrecognized Barcode "${clean}". Item not found in Canteen Inventory or Catalog.`,
        timestamp: Date.now()
      });
      alert(`Barcode "${clean}" was not found in Canteen Inventory or Catalog.\n\nPlease register this product in Canteen Inventory before scanning.`);
      setBarcodeQuery('');
      setShowSuggestions(false);
      barcodeInputRef.current?.focus();
      return;
    }

    addItemToCart(matchedItem);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const next = (item.quantity || 1) + delta;
        if (next <= 0) return null;
        return { ...item, quantity: next };
      }
      return item;
    }).filter(Boolean));
  };

  // Open Void Modal
  const initiateVoidItem = (item) => {
    setTargetVoidItem(item);
    setSupervisorBarcode('');
    setSupervisorPin('');
    setVoidReason('Order change / item removed');
    setVoidError('');
    setShowVoidModal(true);
    setTimeout(() => supervisorInputRef.current?.focus(), 150);
  };

  const initiateVoidCart = () => {
    if (cart.length === 0) return;
    setTargetVoidItem(null);
    setSupervisorBarcode('');
    setSupervisorPin('');
    setVoidReason('Order cancelled by customer');
    setVoidError('');
    setShowVoidModal(true);
    setTimeout(() => supervisorInputRef.current?.focus(), 150);
  };

  // Confirm Void with Supervisor Barcode
  const handleConfirmVoid = (e) => {
    e.preventDefault();
    setVoidError('');

    if (targetVoidItem) {
      // Void single line item
      const res = voidActiveCartItemWithBarcode({
        item: targetVoidItem,
        supervisorBarcode,
        pin: supervisorPin,
        reason: voidReason
      });

      if (res.success) {
        playBeep('void');
        setCart(prev => prev.filter(it => it.id !== targetVoidItem.id));
        broadcastPOSDisplayState({
          voidNotice: {
            message: `Voided 1x ${targetVoidItem.name}`,
            supervisorName: res.supervisor?.supervisorName || 'Supervisor'
          }
        });
        setTimeout(() => {
          broadcastPOSDisplayState({ voidNotice: null });
        }, 4000);
        setShowVoidModal(false);
      } else {
        playBeep('error');
        setVoidError(res.message || 'Authorization failed.');
      }
    } else {
      // Void entire transaction
      const res = voidActiveCartWithBarcode({
        items: cart,
        supervisorBarcode,
        pin: supervisorPin,
        reason: voidReason
      });

      if (res.success) {
        playBeep('void');
        setCart([]);
        setLastScanned(null);
        setSelectedStaff(null);
        broadcastPOSDisplayState({
          cart: [],
          lastScannedItem: null,
          grandTotal: 0,
          customer: null,
          status: 'VOIDED',
          voidNotice: {
            message: `Entire transaction voided (${cart.length} items)`,
            supervisorName: res.supervisor?.supervisorName || 'Supervisor'
          }
        });
        setTimeout(() => {
          broadcastPOSDisplayState({ voidNotice: null, status: 'IDLE' });
        }, 4000);
        setShowVoidModal(false);
      } else {
        playBeep('error');
        setVoidError(res.message || 'Authorization failed.');
      }
    }
  };

  // Checkout & Customer ID Badge Modal
  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setShowCustomerModal(true);
    setTimeout(() => customerInputRef.current?.focus(), 150);
  };

  const handleCustomerScanSubmit = (e) => {
    e.preventDefault();
    const clean = cleanScanInput(customerSearchQuery);
    if (!clean) return;

    const found = resolveStaff(clean);

    if (found) {
      setSelectedStaff(found);
      setCustomerSearchQuery('');
      playBeep('success');
      setScanStatusNotice({
        type: 'staff',
        message: `Customer Verified: ${found.firstName} ${found.lastName} (${found.employeeId})`,
        timestamp: Date.now()
      });
      setShowCustomerModal(false);
    } else {
      playBeep('error');
      alert(`Employee ID, Name, or Barcode "${clean}" not recognized in Masterlist.`);
    }
  };

  // Complete Order
  const handleFinalizeCheckout = () => {
    if (cart.length === 0) return;

    if (!selectedStaff) {
      alert('Scanning employee ID badge or entering employee code is required to complete transaction.');
      return;
    }

    const res = recordCanteenSale({
      customerName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
      customerType: 'Staff Member',
      staffId: selectedStaff.id,
      items: cart,
      orderType,
      paymentMethod,
      isLateEncoded,
      claimedDate: isLateEncoded ? claimedDate : null,
      lateReason: isLateEncoded ? lateReason : null
    });

    if (res.success) {
      playBeep('checkout');
      broadcastPOSDisplayState({
        cart: [],
        lastScannedItem: null,
        grandTotal: 0,
        customer: selectedStaff ? {
          ...selectedStaff,
          name: selectedStaff.name || `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''}`.trim() || selectedStaff.rawName || 'Employee'
        } : null,
        status: 'COMPLETED',
        completedReceipt: res.receipt
      });

      // Clear register
      setCart([]);
      setLastScanned(null);
      setSelectedStaff(null);
      setIsLateEncoded(false);
      setClaimedDate('');
      setLateReason('');
      setShowCustomerModal(false);

      if (onShowReceipt) onShowReceipt(res.receipt);
      if (res.gatePass && onShowGatePass) onShowGatePass(res.gatePass);

      setTimeout(() => {
        broadcastPOSDisplayState({ completedReceipt: null, status: 'IDLE' });
      }, 5000);
    }
  };

  const grandTotal = cart.reduce((acc, it) => acc + (it.unitPrice * (it.quantity || 1)), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Second Monitor Action Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-white">
            <ScanBarcode className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Canteen POS Scanner Terminal
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-300">
                Continuous Barcode Intake
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Canteen Administrator: <strong>Nannette MANUEL</strong> ({currentUser?.role === 'canteen' ? 'Active' : 'Admin Mode'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* HDMI Multi-Screen Status Badge */}
          <div 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono transition ${
              isMultiScreen 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title={isMultiScreen ? "External display detected via HDMI / Multi-Screen" : "Plug in an HDMI cable to connect external monitor"}
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isMultiScreen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-semibold">{hdmiStatusText}</span>
          </div>

          {/* Auto-Launch on HDMI Connect Toggle */}
          <button
            type="button"
            onClick={() => toggleAutoLaunch()}
            className={`h-11 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none ${
              isAutoLaunchEnabled
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Automatically opens Customer Display on second monitor whenever HDMI is connected"
          >
            <Zap className={`h-4 w-4 shrink-0 ${isAutoLaunchEnabled ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Auto-Launch on HDMI:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-black ${
              isAutoLaunchEnabled ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
            }`}>
              {isAutoLaunchEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Audio Feedback Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = toggleAudioMute();
              setSoundMuted(nextMuted);
            }}
            className={`h-11 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none ${
              !soundMuted 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/30' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundMuted ? "Audio feedback is muted. Click to enable sound." : "Audio feedback enabled. Click to mute."}
          >
            {!soundMuted ? (
              <>
                <Volume2 className="h-4 w-4 text-cyan-400" />
                <span className="hidden sm:inline">Audio:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-400 text-slate-950 font-black">ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Audio:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 font-bold">MUTED</span>
              </>
            )}
          </button>

          {/* Canteen Item Scanner & Detail Entry Pop-up Launch Button (F2) */}
          <button
            type="button"
            onClick={() => {
              setEditingCartItem(null);
              setShowItemScanModal(true);
            }}
            className="h-11 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md select-none"
            title="Open Canteen Items Scanner & Detail Pop-up Screen (F2)"
          >
            <ScanBarcode className="h-4 w-4 text-cyan-200" />
            <span className="hidden sm:inline">Items Pop-up</span>
            <kbd className="px-1.5 py-0.5 rounded bg-cyan-800 text-cyan-200 font-mono text-[10px]">F2</kbd>
          </button>

          {/* Shift Closeout / Z-Reading Modal Launch Button */}
          <button
            type="button"
            onClick={() => setShowZReadingModal(true)}
            className="h-11 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm select-none"
            title="Daily POS Shift Closeout &amp; Cashier Z-Reading"
          >
            <Calculator className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Shift Closeout /</span>
            <span>Z-Reading</span>
          </button>

          {/* Open / Focus 2nd Monitor Display Button */}
          <button
            type="button"
            onClick={handleOpenSecondMonitor}
            className={`flex-1 md:flex-initial h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md select-none ${
              isWindowOpen
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold ring-2 ring-emerald-400/30'
                : 'bg-white hover:bg-slate-100 text-slate-950'
            }`}
            title={isWindowOpen ? "Customer display is open. Click to bring to front / focus." : "Open customer display on second monitor"}
          >
            <Tv className="h-4 w-4 shrink-0" />
            <span>{isWindowOpen ? '2nd Monitor Active (Focus)' : 'Open 2nd Monitor Display'}</span>
          </button>
        </div>
      </div>

      {/* Pop-up Blocked Recovery Banner */}
      {autoLaunchBlocked && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/25 text-amber-300 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                HDMI Monitor Detected · Browser Pop-up Prompt
              </h4>
              <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium">
                The browser paused the automatic pop-up window. Click <strong>Launch Customer Display</strong> below to project to the 2nd monitor and allow permanent auto-placement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenSecondMonitor}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              Launch Customer Display Now
            </button>
            <button
              type="button"
              onClick={dismissBlockedPrompt}
              className="p-2 rounded-xl hover:bg-amber-500/20 text-amber-300 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connection Event Banner */}
      {lastEventMsg && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-mono text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {lastEventMsg}
          </span>
          <span className="text-[10px] text-slate-400">HDMI Multi-Screen Auto-Sync</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Barcode Scanner Input, Item Banner, Fast Pick Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Active Barcode Scanner Input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            {scanStatusNotice && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in zoom-in-95 duration-200 ${
                scanStatusNotice.type === 'staff' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {scanStatusNotice.type === 'staff' ? (
                    <div className="p-1 rounded-lg bg-emerald-600 text-white shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  )}
                  <span className="truncate">{scanStatusNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanStatusNotice(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ScanBarcode className="h-4 w-4 text-slate-900" />
                Scan Item Barcode (Physical Barcode Gun or Manual Code)
              </label>

              <div className="flex items-center gap-2">
                {/* Launch Item Scanner Pop-up Screen Button (F2) */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCartItem(null);
                    setShowItemScanModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Open screen-fitted items lookup & details pop-up (F2)"
                >
                  <Package className="h-3.5 w-3.5 text-cyan-600" />
                  <span>Items Pop-up</span>
                  <kbd className="px-1.5 py-0.2 rounded bg-cyan-200/80 text-cyan-950 font-mono text-[9px]">F2</kbd>
                </button>

                {/* Exact or single product identified live pill */}
                {productSuggestions.length === 1 && barcodeQuery.trim().length >= 2 ? (
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Identified: {productSuggestions[0].name.slice(0, 22)}... (₱{Number(productSuggestions[0].sellingPrice).toFixed(2)})
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Press ENTER to record</span>
                )}
              </div>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeQuery}
                    onChange={(e) => {
                      setBarcodeQuery(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                      if (barcodeQuery.trim()) setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or type name (e.g. 4800016644012, Colgate, Bread, Coffee)..."
                    className="w-full h-11 pl-11 pr-8 rounded-xl border-2 border-slate-200 focus:border-slate-900 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner bg-slate-50 focus:bg-white"
                  />
                  {barcodeQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setBarcodeQuery('');
                        setShowSuggestions(false);
                        setHighlightedIndex(-1);
                        barcodeInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-3 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 sm:px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4 text-white" />
                  Record Item
                </button>
              </div>

              {/* Suggestions Popover Dropdown */}
              {showSuggestions && productSuggestions.length > 0 && (
                <div 
                  ref={suggestionsBoxRef}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3.5 py-2 bg-slate-900 text-white flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-cyan-400" />
                      Product Suggestions ({productSuggestions.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Use ↑↓ to navigate · ENTER or click to select
                    </span>
                  </div>

                  {productSuggestions.map((item, idx) => (
                    <div
                      key={item.id || item.barcode}
                      onClick={() => addItemToCart(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                        highlightedIndex === idx ? 'bg-cyan-50/90 border-l-4 border-l-cyan-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {item.name}
                          </span>
                          {item.brand && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold shrink-0">
                              {item.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            <ScanBarcode className="h-3 w-3 text-slate-500" />
                            {item.barcode}
                          </span>
                          {item.category && <span>· {item.category}</span>}
                          {item.quantity !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.quantity > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : item.quantity > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.quantity > 10 ? `${item.quantity} in stock` : item.quantity > 0 ? `Low: ${item.quantity}` : 'Out of stock'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-slate-950">
                            ₱{Number(item.sellingPrice || 0).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase font-semibold">
                            {item.size || item.unit || 'Unit'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItemToCart(item);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Identification Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Quick Suggestions:
              </span>
              {popularQuickPicks.map(item => (
                <button
                  key={item.id || item.barcode}
                  type="button"
                  onClick={() => addItemToCart(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition cursor-pointer border border-slate-200/80 flex items-center gap-1.5 shadow-2xs"
                  title={`Barcode: ${item.barcode} · ₱${Number(item.sellingPrice).toFixed(2)}`}
                >
                  <span className="font-semibold">{item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}</span>
                  <span className="font-mono font-bold text-slate-900 text-[10px]">₱{Number(item.sellingPrice).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Scanned Item Highlight Card */}
          {lastScanned && (
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-slate-950 font-black">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Just Scanned &amp; Recorded
                  </div>
                  <h3 className="text-base font-black text-white">{lastScanned.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">{lastScanned.brand}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">{lastScanned.barcode}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Unit Price</div>
                <div className="text-2xl font-black text-white font-mono">
                  ₱{lastScanned.unitPrice.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Order Nature & Payment Method Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Order Nature Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-slate-900" />
                  1. Order Nature
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {orderType === 'Grocery' ? 'Generates Exit Gate Pass' : 'Dine-In Pantry Meal'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('Dine In')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                    orderType === 'Dine In'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Utensils className="h-4 w-4" />
                  <span>Dine In (Cafeteria Meal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('Grocery')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                    orderType === 'Grocery'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Grocery / Takeout (Exit Gate Pass)</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-slate-900" />
                  2. Payment Method
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Select tender</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                    paymentMethod === 'Cash'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Cash Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Salary Deduction')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer text-xs font-bold ${
                    paymentMethod === 'Salary Deduction'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Salary Deduction</span>
                  </div>
                  <span className={`text-[10px] font-normal ${paymentMethod === 'Salary Deduction' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Auto-Paid via Coop
                  </span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Register Basket, Totals, Customer Identifier & Supervisor Void (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Active Cart & Void Action Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Cart Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-slate-900" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Register Basket ({cart.reduce((a, b) => a + (b.quantity || 1), 0)} items)
                </h3>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={initiateVoidCart}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Supervisor barcode required to void entire cart"
                >
                  <ShieldAlert className="h-3 w-3" />
                  Void Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-3 max-h-[340px] overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <ScanBarcode className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-500">Cart is empty</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Scan items using a USB barcode scanner or search inventory.
                  </p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition group">
                    <div 
                      onClick={() => {
                        setEditingCartItem(item);
                        setShowItemScanModal(true);
                      }}
                      className="min-w-0 flex-1 cursor-pointer"
                      title="Click to edit item quantity, unit price, discount, or notes [F2]"
                    >
                      <div className="font-bold text-xs text-slate-900 truncate hover:text-cyan-700 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.discountPercent > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            -{item.discountPercent}%
                          </span>
                        )}
                        {item.isCustom && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{item.brand}</span>
                        {item.size && <span>· {item.size}</span>}
                        <span className="font-mono text-slate-400">₱{item.unitPrice.toFixed(2)}</span>
                        {item.notes && <span className="italic text-slate-600 bg-slate-100 px-1 rounded truncate max-w-[150px]">"{item.notes}"</span>}
                      </div>
                    </div>

                    {/* Quantity Modifier */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                      ₱{(item.unitPrice * (item.quantity || 1)).toFixed(2)}
                    </div>

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCartItem(item);
                        setShowItemScanModal(true);
                      }}
                      title="Edit item details, price, discount, or notes"
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition cursor-pointer shrink-0"
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </button>

                    {/* Void Item Button (Requires Supervisor Barcode) */}
                    <button
                      type="button"
                      onClick={() => initiateVoidItem(item)}
                      title="Supervisor barcode authorization required to void item"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal & Checkout Action Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal ({cart.reduce((a, b) => a + (b.quantity || 1), 0)} items):</span>
                <span className="font-mono font-bold text-slate-900">₱{grandTotal.toFixed(2)}</span>
              </div>

              {/* Selected Customer Card Preview */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="h-4 w-4 text-slate-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Customer ID Badge</span>
                      {selectedStaff && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          ♾️ Unlimited Uses
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName} (${selectedStaff.employeeId})` : 'Not Scanned Yet'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null);
                        setScanStatusNotice({
                          type: 'staff',
                          message: 'Customer unlinked from current transaction.',
                          timestamp: Date.now()
                        });
                      }}
                      title="Clear Selected Customer"
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    {selectedStaff ? 'Change ID' : 'Scan ID'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-black uppercase text-slate-800">Total Tender Due</span>
                <span className="text-2xl font-black font-mono text-slate-950">₱{grandTotal.toFixed(2)}</span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={initiateCheckout}
                className={`w-full h-12 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  cart.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Finish &amp; Complete Checkout
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: SCAN CUSTOMER EMPLOYEE ID BADGE */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Scan Customer Employee ID</h3>
                  <p className="text-[11px] text-slate-400">Code 128 Barcode Badge Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Barcode input for Customer Employee Badge */}
              <form onSubmit={handleCustomerScanSubmit} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Scan Customer Employee Badge or Type Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                    <input
                      ref={customerInputRef}
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="e.g. NKB052026-0001 or scan badge..."
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </form>

              {/* Verified Staff Card */}
              {selectedStaff ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStaff.avatar}
                      alt={selectedStaff.firstName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                    />
                    <div>
                      <div className="font-black text-sm text-slate-900">
                        {selectedStaff.firstName} {selectedStaff.lastName}
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-600">
                        {selectedStaff.employeeId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedStaff.departmentName}
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                        ♾️ Unlimited Daily Scan Pass Active
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Please scan the customer's employee badge or type their ID above.</span>
                </div>
              )}

              {/* Late Encoding Checkbox & Customer Claimed Date */}
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLateEncoded}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsLateEncoded(checked);
                      if (checked && !claimedDate) {
                        setClaimedDate(new Date().toISOString().slice(0, 10));
                      }
                    }}
                    className="rounded text-amber-700 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      Late Encoded Transaction
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Customer claimed the goods on an earlier date / previous shift
                    </span>
                  </div>
                </label>

                {isLateEncoded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-amber-200/70 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-900 mb-1">
                        Date Claimed by Customer *
                      </label>
                      <input
                        type="date"
                        required={isLateEncoded}
                        value={claimedDate}
                        onChange={(e) => setClaimedDate(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-amber-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-900 mb-1">
                        Reason for Delayed Encoding
                      </label>
                      <input
                        type="text"
                        value={lateReason}
                        onChange={(e) => setLateReason(e.target.value)}
                        placeholder="e.g. Offline claim, register downtime"
                        className="w-full h-8 px-2.5 rounded-lg border border-amber-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedStaff}
                  onClick={handleFinalizeCheckout}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    selectedStaff
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm &amp; Complete Checkout
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: SUPERVISOR BARCODE VOID CONFIRMATION */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Supervisor Void Authorization</h3>
                  <p className="text-[11px] text-slate-400">Scan Canteen Admin or IT Admin Barcode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              
              {/* Target Void Summary */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Void Target:</div>
                <div className="font-bold text-white text-sm">
                  {targetVoidItem ? `1x ${targetVoidItem.name} (₱${targetVoidItem.unitPrice.toFixed(2)})` : `Entire Cart (${cart.length} items · ₱${grandTotal.toFixed(2)})`}
                </div>
              </div>

              {voidError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{voidError}</span>
                </div>
              )}

              {/* Supervisor Barcode Scan Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ScanBarcode className="h-4 w-4 text-white" />
                  Scan Canteen Admin or Admin Barcode
                </label>
                <input
                  ref={supervisorInputRef}
                  type="text"
                  required
                  value={supervisorBarcode}
                  onChange={(e) => setSupervisorBarcode(e.target.value)}
                  placeholder="Scan NKB052026-0024 or NKB092026-0048..."
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Quick Barcode Scan Presets for Testing */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Quick Supervisor Scan:</span>
                <button
                  type="button"
                  onClick={() => setSupervisorBarcode('NKB052026-0024')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                >
                  Nannette MANUEL (Canteen Admin)
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorBarcode('NKB092026-0048')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                >
                  Carl Laurence PATAGNAN (IT Admin)
                </button>
              </div>

              {/* Supervisor PIN Fallback */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  Or Supervisor Security PIN
                </label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Enter 8-digit PIN (default 12345678)"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Reason for Void (Audit Record)
                </label>
                <input
                  type="text"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Order cancelled, customer item change"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Authorize &amp; Void
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Cashier End-of-Day Shift Closeout Z-Reading Modal */}
      {showZReadingModal && (
        <CanteenZReadingModal onClose={() => setShowZReadingModal(false)} />
      )}

      {/* Canteen Item Scanner & Detail Entry Pop-up Modal (F2) */}
      <CanteenItemScanModal
        isOpen={showItemScanModal}
        onClose={() => {
          setShowItemScanModal(false);
          setEditingCartItem(null);
          barcodeInputRef.current?.focus();
        }}
        canteenInventory={canteenInventory}
        onConfirmItem={handleConfirmItemFromModal}
        initialItem={editingCartItem}
        defaultOrderType={orderType}
      />

    </div>
  );
}
