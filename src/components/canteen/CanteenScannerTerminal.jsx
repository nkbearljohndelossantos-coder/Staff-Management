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
  Sparkles,
  Boxes
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
import { 
  isBoxOrPackItem, 
  extractPiecesFromItem, 
  getEffectiveRetailPiecePrice, 
  getEffectiveWholesalePrice,
  hasMultiBuyPromo,
  calculateMultiBuySubtotal
} from '../../utils/canteenPricing';

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

  // Fast Checkout Keyboard Wizard State
  // null | 'ORDER_NATURE' | 'PAYMENT_METHOD' | 'CONFIRM'
  const [checkoutWizardStep, setCheckoutWizardStep] = useState(null);
  const [lastScannedItemId, setLastScannedItemId] = useState(null);

  // Active Inline Keyboard Shortcut Step for Order Nature & Payment Method
  // null | 'ORDER_NATURE' | 'PAYMENT_METHOD' | 'CONFIRM'
  const [activeShortcutStep, setActiveShortcutStep] = useState(null);
  const pendingShortcutTimerRef = useRef(null);

  // Reset active shortcut step if cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      setActiveShortcutStep(null);
    }
  }, [cart.length]);

  // Global F2 (Items Pop-up) & F9 (Fast Checkout) Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setEditingCartItem(null);
        setShowItemScanModal(prev => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          if (selectedStaff) {
            setCheckoutWizardStep(prev => prev ? null : 'ORDER_NATURE');
          } else {
            initiateCheckout();
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, selectedStaff]);

  // Progressive Escape dismissal:
  // 0. Fast Checkout Wizard (Priority 50)
  useEscapeKey('canteen-checkout-wizard', ESCAPE_PRIORITY.MODAL, Boolean(checkoutWizardStep), () => {
    setCheckoutWizardStep(null);
    barcodeInputRef.current?.focus();
  });
  // 0a. Active Inline Shortcut Step (Priority 45)
  useEscapeKey('canteen-active-shortcut', ESCAPE_PRIORITY.MODAL - 5, Boolean(activeShortcutStep), () => {
    setActiveShortcutStep(null);
    barcodeInputRef.current?.focus();
  });
  // 0b. Item Scan Modal (Priority 40)
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
    const total = cart.reduce((acc, it) => {
      const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
      return acc + breakdown.subtotal;
    }, 0);
    const totalSavings = cart.reduce((acc, it) => {
      const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
      return acc + breakdown.savings;
    }, 0);
    const customerPayload = selectedStaff ? {
      ...selectedStaff,
      name: selectedStaff.name || `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''}`.trim() || selectedStaff.rawName || 'Employee'
    } : null;

    broadcastPOSDisplayState({
      cart: cart.map(it => {
        const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
        return {
          ...it,
          subtotal: breakdown.subtotal,
          promoSavings: breakdown.savings,
          isPromoApplied: breakdown.isPromoApplied,
          promoDescription: breakdown.promoDescription
        };
      }),
      lastScannedItem: lastScanned,
      orderType,
      paymentMethod,
      customer: customerPayload,
      grandTotal: total,
      totalSavings,
      status: cart.length > 0 ? 'SCANNING' : 'IDLE'
    });
  }, [cart, orderType, paymentMethod, selectedStaff, lastScanned]);

  // Launch / Focus Customer Display on Second Monitor
  const handleOpenSecondMonitor = () => {
    openCustomerDisplay();
    try {
      const bc = new BroadcastChannel('nkb_canteen_pos_channel');
      bc.postMessage({ type: 'REQUEST_FULLSCREEN' });
      setTimeout(() => bc.close(), 100);
    } catch {
      // BroadcastChannel unsupported
    }
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
      const pieceCode = (item.pieceBarcode || '').toLowerCase();
      const pieceAlnum = pieceCode.replace(/[^a-z0-9]/g, '');
      const name = (item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const id = (item.id || '').toLowerCase();

      return (
        bCode.includes(cleanQ) ||
        (pieceCode && pieceCode.includes(cleanQ)) ||
        (cleanAlnum.length >= 3 && (bAlnum.includes(cleanAlnum) || pieceAlnum.includes(cleanAlnum))) ||
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
  const addItemToCart = (item, tier = 'wholesale', addQty = 1) => {
    if (!item) return;
    playBeep('success');

    const isBoxOrPack = isBoxOrPackItem(item);
    const baseSellingPrice = getEffectiveWholesalePrice(item);
    const effectiveRetailPiecePrice = getEffectiveRetailPiecePrice(item);
    const piecesCount = item.piecesPerPack || extractPiecesFromItem(item);

    const isRetail = tier === 'retail_piece' && isBoxOrPack;
    const finalUnitPrice = isRetail ? effectiveRetailPiecePrice : baseSellingPrice;
    const cleanRawName = item.rawName || item.name.replace(' (Piece)', '');
    const finalName = isRetail ? `${cleanRawName} (Piece)` : cleanRawName;
    const finalSize = isRetail ? 'Piece' : (item.size || item.unit || 'Unit');
    const initialQty = Math.max(1, parseInt(addQty, 10) || 1);

    const hasPromo = Boolean(item.hasMultiBuy || (Number(item.multiBuyQty) > 1 && Number(item.multiBuyPrice) > 0));
    const mQty = parseInt(item.multiBuyQty, 10) || 0;
    const mPrice = parseFloat(item.multiBuyPrice) || 0;

    setLastScanned({
      id: item.id,
      name: finalName,
      rawName: cleanRawName,
      brand: item.brand || 'NKB',
      barcode: item.barcode,
      pieceBarcode: item.pieceBarcode || '',
      unitPrice: finalUnitPrice,
      wholesalePrice: baseSellingPrice,
      retailPiecePrice: effectiveRetailPiecePrice,
      hasMultiBuy: hasPromo,
      multiBuyQty: mQty,
      multiBuyPrice: mPrice,
      isBoxOrPack: isBoxOrPack,
      isRetailPiece: isRetail,
      piecesPerPack: piecesCount,
      unit: item.unit || 'Pack',
      size: finalSize,
      quantity: initialQty
    });

    setCart(prev => {
      const idx = prev.findIndex(p => 
        ((item.barcode && p.barcode === item.barcode) || (item.pieceBarcode && p.pieceBarcode === item.pieceBarcode) || p.id === item.id || p.rawId === item.id) &&
        Boolean(p.isRetailPiece) === Boolean(isRetail)
      );

      if (idx !== -1) {
        const copy = [...prev];
        const nextQty = (copy[idx].quantity || 1) + initialQty;
        copy[idx] = { 
          ...copy[idx], 
          quantity: nextQty,
          hasMultiBuy: hasPromo,
          multiBuyQty: mQty,
          multiBuyPrice: mPrice
        };
        setLastScannedItemId(copy[idx].id);
        setLastScanned(prevLs => prevLs ? { ...prevLs, quantity: nextQty } : null);
        return copy;
      }

      const newId = `${item.id || 'item'}-${isRetail ? 'piece' : 'pack'}-${Date.now()}`;
      setLastScannedItemId(newId);
      return [
        ...prev,
        {
          id: newId,
          rawId: item.id,
          barcode: item.barcode || '',
          pieceBarcode: item.pieceBarcode || '',
          name: finalName,
          rawName: cleanRawName,
          brand: item.brand || 'NKB',
          size: finalSize,
          unitPrice: finalUnitPrice,
          wholesalePrice: baseSellingPrice,
          retailPiecePrice: effectiveRetailPiecePrice,
          hasMultiBuy: hasPromo,
          multiBuyQty: mQty,
          multiBuyPrice: mPrice,
          isBoxOrPack: isBoxOrPack,
          isRetailPiece: isRetail,
          piecesPerPack: piecesCount,
          unit: item.unit || 'Pack',
          quantity: initialQty
        }
      ];
    });

    const breakdown = calculateMultiBuySubtotal({
      ...item,
      unitPrice: finalUnitPrice,
      retailPiecePrice: effectiveRetailPiecePrice,
      hasMultiBuy: hasPromo,
      multiBuyQty: mQty,
      multiBuyPrice: mPrice
    }, initialQty, isRetail);

    setScanStatusNotice({
      type: 'staff',
      message: breakdown.savings > 0 
        ? `Added: ${initialQty}x ${finalName} · ₱${breakdown.subtotal.toFixed(2)} (✨ Promo applied: saved ₱${breakdown.savings.toFixed(2)})`
        : `Added: ${initialQty > 1 ? `${initialQty}x ` : ''}${finalName} [${isRetail ? 'Retail Piece' : 'Wholesale'}] · ₱${breakdown.subtotal.toFixed(2)}`,
      timestamp: Date.now()
    });

    setBarcodeQuery('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setActiveShortcutStep('ORDER_NATURE');
    barcodeInputRef.current?.focus();
  };

  // Toggle cart item between wholesale box/pack and retail piece
  const handleToggleCartItemTier = (targetId) => {
    setCart(prev => prev.map(it => {
      if (it.id !== targetId) return it;
      const willBeRetail = !it.isRetailPiece;
      const baseWholesale = getEffectiveWholesalePrice(it);
      const piecePrice = getEffectiveRetailPiecePrice(it);
      const newPrice = willBeRetail ? piecePrice : baseWholesale;
      const baseName = it.rawName || it.name.replace(' (Piece)', '');
      const newName = willBeRetail ? `${baseName} (Piece)` : baseName;
      const newSize = willBeRetail ? 'Piece' : (it.unit || 'Pack');

      playBeep('scan');
      setScanStatusNotice({
        type: 'staff',
        message: `Switched: ${newName} to ${willBeRetail ? 'Retail Piece' : 'Wholesale'} (₱${newPrice.toFixed(2)})`,
        timestamp: Date.now()
      });

      return {
        ...it,
        isRetailPiece: willBeRetail,
        retailPiecePrice: piecePrice,
        wholesalePrice: baseWholesale,
        name: newName,
        size: newSize,
        unitPrice: newPrice
      };
    }));

    // Keep lastScanned synced if it's the same item
    setLastScanned(prev => {
      if (!prev || (prev.id !== targetId && lastScannedItemId !== targetId)) return prev;
      const willBeRetail = !prev.isRetailPiece;
      const baseWholesale = getEffectiveWholesalePrice(prev);
      const piecePrice = getEffectiveRetailPiecePrice(prev);
      const newPrice = willBeRetail ? piecePrice : baseWholesale;
      const baseName = prev.rawName || prev.name.replace(' (Piece)', '');
      return {
        ...prev,
        isRetailPiece: willBeRetail,
        retailPiecePrice: piecePrice,
        wholesalePrice: baseWholesale,
        name: willBeRetail ? `${baseName} (Piece)` : baseName,
        size: willBeRetail ? 'Piece' : (prev.unit || 'Pack'),
        unitPrice: newPrice
      };
    });
  };

  // Set last scanned item tier
  const handleSetLastScannedTier = (tier) => {
    if (!lastScanned) return;
    const targetId = lastScannedItemId;
    const willBeRetail = tier === 'retail_piece';
    const baseWholesale = getEffectiveWholesalePrice(lastScanned);
    const piecePrice = getEffectiveRetailPiecePrice(lastScanned);
    const newPrice = willBeRetail ? piecePrice : baseWholesale;
    const baseName = lastScanned.rawName || lastScanned.name.replace(' (Piece)', '');
    const newName = willBeRetail ? `${baseName} (Piece)` : baseName;
    const newSize = willBeRetail ? 'Piece' : (lastScanned.unit || 'Pack');

    setCart(prev => prev.map(it => {
      if (it.id !== targetId && it.barcode !== lastScanned.barcode) return it;
      return {
        ...it,
        isRetailPiece: willBeRetail,
        retailPiecePrice: piecePrice,
        wholesalePrice: baseWholesale,
        name: newName,
        size: newSize,
        unitPrice: newPrice
      };
    }));

    setLastScanned(prev => prev ? {
      ...prev,
      isRetailPiece: willBeRetail,
      retailPiecePrice: piecePrice,
      wholesalePrice: baseWholesale,
      name: newName,
      unitPrice: newPrice,
      size: newSize
    } : null);

    playBeep('scan');
    setScanStatusNotice({
      type: 'staff',
      message: `Updated: ${newName} [${willBeRetail ? 'Retail Piece' : 'Wholesale'}] · ₱${newPrice.toFixed(2)}`,
      timestamp: Date.now()
    });
  };

  // Set quantity for the most recently scanned item (or specific item id)
  const setRecentItemQuantity = (newQty, targetId = null) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return false;

    let updatedName = '';
    let updatedPrice = 0;

    setCart(prev => {
      if (prev.length === 0) return prev;
      const targetIdx = targetId 
        ? prev.findIndex(p => p.id === targetId)
        : (lastScannedItemId ? prev.findIndex(p => p.id === lastScannedItemId) : prev.length - 1);
      
      const effectiveIdx = targetIdx !== -1 ? targetIdx : prev.length - 1;
      const copy = [...prev];
      const targetItem = copy[effectiveIdx];
      updatedName = targetItem.name;
      updatedPrice = targetItem.unitPrice;

      copy[effectiveIdx] = {
        ...targetItem,
        quantity: qty
      };
      setLastScannedItemId(targetItem.id);
      return copy;
    });

    playBeep('success');
    setLastScanned(prev => prev ? { ...prev, quantity: qty } : null);
    setScanStatusNotice({
      type: 'staff',
      message: `Set Quantity: ${qty}x ${updatedName || 'Item'} (₱${((updatedPrice || 0) * qty).toFixed(2)})`,
      timestamp: Date.now()
    });
    setBarcodeQuery('');
    setShowSuggestions(false);
    setActiveShortcutStep('ORDER_NATURE');
    barcodeInputRef.current?.focus();
    return true;
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
      size: itemData.size || 'Unit',
      quantity: itemData.quantity || 1
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
        setLastScannedItemId(copy[editIdx].id);
        return copy;
      }

      // Check if existing product by barcode (non-custom, without special notes/discounts)
      if (itemData.barcode && !itemData.isCustom) {
        const existingIdx = prev.findIndex(p => p.barcode === itemData.barcode && !p.notes && !p.discountPercent);
        if (existingIdx !== -1 && !itemData.notes && !itemData.discountPercent) {
          const copy = [...prev];
          const newQ = (copy[existingIdx].quantity || 1) + (itemData.quantity || 1);
          copy[existingIdx] = {
            ...copy[existingIdx],
            quantity: newQ
          };
          setLastScannedItemId(copy[existingIdx].id);
          return copy;
        }
      }

      const newId = itemData.id || `item-${Date.now()}`;
      setLastScannedItemId(newId);
      return [
        ...prev,
        {
          id: newId,
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
    setActiveShortcutStep('ORDER_NATURE');
    barcodeInputRef.current?.focus();
  };

  // Centralized keyboard shortcut processor for zero-mouse cashier flow:
  // Step 1: ORDER NATURE (Left/1 = Dine In, Right/2 = Gate Pass)
  // Step 2: PAYMENT METHOD (Left/1 = Salary Deduction, Right/2 = Cash)
  // Step 3: CONFIRM (Enter = finalize transaction)
  const processShortcutKey = (key, e = null) => {
    if (cart.length === 0) return false;
    if (e && (e.ctrlKey || e.altKey || e.metaKey)) return false;

    if (key === 'Escape') {
      if (e) e.preventDefault();
      setActiveShortcutStep(null);
      barcodeInputRef.current?.focus();
      return true;
    }

    // STEP 1: ORDER NATURE
    if (activeShortcutStep === 'ORDER_NATURE') {
      if (key === 'ArrowLeft' || key === '1') {
        if (e) e.preventDefault();
        setOrderType('Dine In');
        playBeep('scan');
        setActiveShortcutStep('PAYMENT_METHOD');
        setScanStatusNotice({
          type: 'staff',
          message: 'Order Nature: Dine In (Cafeteria) · Step 2: Choose Payment [1/Left] Salary Deduction or [2/Right] Cash',
          timestamp: Date.now()
        });
        return true;
      } else if (key === 'ArrowRight' || key === '2') {
        if (e) e.preventDefault();
        setOrderType('Grocery');
        playBeep('scan');
        setActiveShortcutStep('PAYMENT_METHOD');
        setScanStatusNotice({
          type: 'staff',
          message: 'Order Nature: Gate Pass (Grocery) · Step 2: Choose Payment [1/Left] Salary Deduction or [2/Right] Cash',
          timestamp: Date.now()
        });
        return true;
      } else if (key === 'Enter') {
        if (e) e.preventDefault();
        playBeep('scan');
        setActiveShortcutStep('PAYMENT_METHOD');
        return true;
      }
    } 
    // STEP 2: PAYMENT METHOD
    else if (activeShortcutStep === 'PAYMENT_METHOD') {
      if (key === 'ArrowLeft' || key === '1') {
        if (e) e.preventDefault();
        setPaymentMethod('Salary Deduction');
        playBeep('scan');
        setActiveShortcutStep('CONFIRM');
        setScanStatusNotice({
          type: 'staff',
          message: 'Payment: Salary Deduction · Step 3: Press [ENTER] to Complete Order',
          timestamp: Date.now()
        });
        return true;
      } else if (key === 'ArrowRight' || key === '2') {
        if (e) e.preventDefault();
        setPaymentMethod('Cash');
        playBeep('scan');
        setActiveShortcutStep('CONFIRM');
        setScanStatusNotice({
          type: 'staff',
          message: 'Payment: Cash Payment · Step 3: Press [ENTER] to Complete Order',
          timestamp: Date.now()
        });
        return true;
      } else if (key === 'ArrowUp' || key === 'Backspace') {
        if (e) e.preventDefault();
        setActiveShortcutStep('ORDER_NATURE');
        return true;
      } else if (key === 'Enter') {
        if (e) e.preventDefault();
        playBeep('scan');
        setActiveShortcutStep('CONFIRM');
        return true;
      }
    } 
    // STEP 3: CONFIRM
    else if (activeShortcutStep === 'CONFIRM') {
      if (key === 'Enter') {
        if (e) e.preventDefault();
        setActiveShortcutStep(null);
        handleFinalizeCheckout();
        return true;
      } else if (key === 'ArrowUp' || key === 'Backspace' || key === 'ArrowLeft') {
        if (e) e.preventDefault();
        setActiveShortcutStep('PAYMENT_METHOD');
        return true;
      }
    }
    // QUICK SHORTCUT: If cart has items and arrow keys pressed
    else if (cart.length > 0) {
      if (key === 'ArrowLeft') {
        if (e) e.preventDefault();
        setOrderType('Dine In');
        playBeep('scan');
        setActiveShortcutStep('PAYMENT_METHOD');
        return true;
      } else if (key === 'ArrowRight') {
        if (e) e.preventDefault();
        setOrderType('Grocery');
        playBeep('scan');
        setActiveShortcutStep('PAYMENT_METHOD');
        return true;
      }
    }

    return false;
  };

  // Keyboard navigation for product suggestions dropdown & keyboard quick shortcuts
  const handleKeyDown = (e) => {
    // Clear pending shortcut debounce timer on any key press
    if (pendingShortcutTimerRef.current) {
      clearTimeout(pendingShortcutTimerRef.current);
      pendingShortcutTimerRef.current = null;
    }

    // 1. Suggestions dropdown navigation
    if (showSuggestions && productSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < productSuggestions.length - 1 ? prev + 1 : 0));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : productSuggestions.length - 1));
        return;
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && productSuggestions[highlightedIndex]) {
          e.preventDefault();
          addItemToCart(productSuggestions[highlightedIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // 2. Physical keypad '+' or '-' when barcode input is empty: increments/decrements last scanned item
    if (!barcodeQuery && cart.length > 0) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
        handleUpdateQuantity(targetId, 1);
        playBeep('scan');
        setActiveShortcutStep('ORDER_NATURE');
        return;
      } else if (e.key === '-') {
        e.preventDefault();
        const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
        handleUpdateQuantity(targetId, -1);
        playBeep('scan');
        setActiveShortcutStep('ORDER_NATURE');
        return;
      }
    }

    // 3. Arrow keys, Backspace, or Escape when barcode input is empty
    if (!barcodeQuery && cart.length > 0) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Backspace', 'Escape'].includes(e.key)) {
        if (processShortcutKey(e.key, e)) return;
      }

      // 4. Numeric shortcut keys '1' and '2' when activeShortcutStep is active
      if (activeShortcutStep && (e.key === '1' || e.key === '2')) {
        e.preventDefault();
        const pressedKey = e.key;
        // 45ms guard: if a barcode scanner is rapidly streaming characters starting with 1 or 2,
        // the next character arrives < 40ms, cancelling this timer and letting the barcode stream through.
        pendingShortcutTimerRef.current = setTimeout(() => {
          processShortcutKey(pressedKey);
          pendingShortcutTimerRef.current = null;
        }, 45);
        return;
      }
    }

    // 5. Fast Checkout Trigger: If barcode input is empty and cashier presses Enter
    if (!barcodeQuery && e.key === 'Enter') {
      if (cart.length > 0) {
        e.preventDefault();
        if (activeShortcutStep) {
          processShortcutKey('Enter', e);
        } else {
          setActiveShortcutStep('ORDER_NATURE');
        }
        return;
      }
    }
  };

  // Handle Barcode Scan & Quick Quantity Command
  const handleBarcodeSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // If an item is highlighted via keyboard in suggestions, select it
    if (highlightedIndex >= 0 && productSuggestions[highlightedIndex]) {
      addItemToCart(productSuggestions[highlightedIndex]);
      return;
    }

    const raw = (barcodeQuery || '').trim();
    const clean = cleanScanInput(raw);
    if (!clean) {
      // Empty Enter: Advance inline shortcut or trigger checkout
      if (cart.length > 0) {
        if (activeShortcutStep) {
          processShortcutKey('Enter');
        } else {
          setActiveShortcutStep('ORDER_NATURE');
        }
      }
      return;
    }

    // 0. CHECK IF INPUT IS A QUANTITY OVERWRITE COMMAND FOR THE RECENTLY SCANNED ITEM:
    // Matches formats: "2", "3", "15", "*3", "3*", "x4", "4x", "@5"
    // (Only applies if cart is not empty and input is short numbers 1-99 or has multiplier syntax)
    const isPureShortDigits = /^\d{1,2}$/.test(clean); // e.g. "2", "3", "12"
    const hasMultiplierSyntax = /^[*x@]\s*\d{1,3}$/i.test(raw) || /^\d{1,3}\s*[*x]$/i.test(raw);

    if (cart.length > 0 && (isPureShortDigits || hasMultiplierSyntax)) {
      const match = raw.match(/\d{1,3}/);
      if (match) {
        const parsedQty = parseInt(match[0], 10);
        if (parsedQty > 0) {
          setRecentItemQuantity(parsedQty);
          return;
        }
      }
    }

    // 1. Check if user scanned an employee badge (supports Name, ID, QR code, Code 128, etc.)
    const foundStaff = resolveStaff(clean);
    if (foundStaff) {
      setSelectedStaff(foundStaff);
      playBeep('success');
      setBarcodeQuery('');
      setShowSuggestions(false);

      // If cart already has items, immediately engage Fast Checkout Wizard!
      if (cart.length > 0) {
        setActiveShortcutStep('ORDER_NATURE');
        setScanStatusNotice({
          type: 'staff',
          message: `Customer Verified: ${foundStaff.firstName} ${foundStaff.lastName}. Use ← Left (Dine In) or → Right (Gate Pass)`,
          timestamp: Date.now()
        });
      } else {
        setScanStatusNotice({
          type: 'staff',
          message: `Customer Identified: ${foundStaff.firstName} ${foundStaff.lastName} (${foundStaff.employeeId}) · Ready for Items Scan`,
          timestamp: Date.now()
        });
      }
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

    // 3. Dual-Barcode Resolver:
    // First, check if scanned barcode directly matches an INNER PIECE BARCODE
    const matchedPieceItem = canteenInventory.find(i => 
      i.pieceBarcode && cleanScanInput(i.pieceBarcode).toUpperCase() === clean.toUpperCase()
    );

    if (matchedPieceItem) {
      // Direct hit on inner piece barcode -> Automatically ring up as Single Retail Piece!
      addItemToCart(matchedPieceItem, 'retail_piece');
      setScanStatusNotice({
        type: 'staff',
        message: `Recognized Inner Piece Barcode [${clean}] · Added: ${matchedPieceItem.name} as Single Retail Piece`,
        timestamp: Date.now()
      });
      return;
    }

    // Next, check by outer pack barcode, product ID, or product name
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
    setActiveShortcutStep('ORDER_NATURE');
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
      setShowCustomerModal(false);

      if (cart.length > 0) {
        setActiveShortcutStep('ORDER_NATURE');
        setScanStatusNotice({
          type: 'staff',
          message: `Customer Verified: ${found.firstName} ${found.lastName}. Use ← Left (Dine In) or → Right (Gate Pass)`,
          timestamp: Date.now()
        });
      } else {
        setScanStatusNotice({
          type: 'staff',
          message: `Customer Verified: ${found.firstName} ${found.lastName} (${found.employeeId})`,
          timestamp: Date.now()
        });
      }
    } else {
      playBeep('error');
      alert(`Employee ID, Name, or Barcode "${clean}" not recognized in Masterlist.`);
    }
  };

  // Global Keyboard Navigation for Fast Checkout Wizard
  useEffect(() => {
    if (!checkoutWizardStep) return;

    const handleWizardKeyDown = (e) => {
      // Allow browser shortcuts (like F11)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (checkoutWizardStep === 'ORDER_NATURE') {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          e.preventDefault();
          setOrderType('Dine In');
          playBeep('scan');
          setCheckoutWizardStep('PAYMENT_METHOD');
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          e.preventDefault();
          setOrderType('Grocery');
          playBeep('scan');
          setCheckoutWizardStep('PAYMENT_METHOD');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          playBeep('scan');
          setCheckoutWizardStep('PAYMENT_METHOD');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setCheckoutWizardStep(null);
          barcodeInputRef.current?.focus();
        }
      } else if (checkoutWizardStep === 'PAYMENT_METHOD') {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          e.preventDefault();
          setPaymentMethod('Salary Deduction');
          playBeep('scan');
          setCheckoutWizardStep('CONFIRM');
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          e.preventDefault();
          setPaymentMethod('Cash');
          playBeep('scan');
          setCheckoutWizardStep('CONFIRM');
        } else if (e.key === 'ArrowUp' || e.key === 'Backspace') {
          e.preventDefault();
          setCheckoutWizardStep('ORDER_NATURE');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          playBeep('scan');
          setCheckoutWizardStep('CONFIRM');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setCheckoutWizardStep(null);
          barcodeInputRef.current?.focus();
        }
      } else if (checkoutWizardStep === 'CONFIRM') {
        if (e.key === 'Enter') {
          e.preventDefault();
          setCheckoutWizardStep(null);
          handleFinalizeCheckout();
        } else if (e.key === 'ArrowUp' || e.key === 'Backspace' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setCheckoutWizardStep('PAYMENT_METHOD');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setCheckoutWizardStep(null);
          barcodeInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleWizardKeyDown);
    return () => window.removeEventListener('keydown', handleWizardKeyDown);
  }, [checkoutWizardStep, orderType, paymentMethod, cart, selectedStaff]);

  // Global Keyboard Navigation for Active Inline Shortcuts (when focus is outside barcode input)
  useEffect(() => {
    if (!activeShortcutStep || checkoutWizardStep) return;

    const handleGlobalWindowKeyDown = (e) => {
      // Don't intercept if an overlay modal is open
      if (showCustomerModal || showVoidModal || showZReadingModal || showItemScanModal) return;

      // If active element is a different text input or textarea, let it handle typing
      if (e.target && e.target !== barcodeInputRef.current && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Backspace', 'Escape'].includes(e.key)) {
        processShortcutKey(e.key, e);
      } else if ((e.key === '1' || e.key === '2') && e.target !== barcodeInputRef.current) {
        processShortcutKey(e.key, e);
      } else if (e.key === 'Enter' && e.target !== barcodeInputRef.current) {
        processShortcutKey('Enter', e);
      }
    };

    window.addEventListener('keydown', handleGlobalWindowKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalWindowKeyDown);
  }, [activeShortcutStep, checkoutWizardStep, showCustomerModal, showVoidModal, showZReadingModal, showItemScanModal, processShortcutKey]);

  // Complete Order
  function handleFinalizeCheckout() {
    if (cart.length === 0) return;

    if (!selectedStaff) {
      setScanStatusNotice({
        type: 'error',
        message: 'Scanning employee ID badge or entering employee code is required to complete transaction.',
        timestamp: Date.now()
      });
      alert('Scanning employee ID badge or entering employee code is required to complete transaction.\n\nPlease scan employee ID or select customer from masterlist.');
      setShowCustomerModal(true);
      return;
    }

    const enrichedCart = cart.map(it => {
      const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
      return {
        ...it,
        subtotal: breakdown.subtotal,
        promoSavings: breakdown.savings,
        isPromoApplied: breakdown.isPromoApplied,
        promoDescription: breakdown.promoDescription
      };
    });

    const res = recordCanteenSale({
      customerName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
      customerType: 'Staff Member',
      staffId: selectedStaff.id,
      items: enrichedCart,
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
        totalSavings: 0,
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
      setCheckoutWizardStep(null);
      setActiveShortcutStep(null);

      if (onShowReceipt) onShowReceipt(res.receipt);
      if (res.gatePass && onShowGatePass) onShowGatePass(res.gatePass);

      setTimeout(() => {
        broadcastPOSDisplayState({ completedReceipt: null, status: 'IDLE' });
      }, 5000);
    }
  }

  const grandTotal = cart.reduce((acc, it) => {
    const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
    return acc + breakdown.subtotal;
  }, 0);
  const totalCartSavings = cart.reduce((acc, it) => {
    const breakdown = calculateMultiBuySubtotal(it, it.quantity, it.isRetailPiece);
    return acc + breakdown.savings;
  }, 0);

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
            className="h-11 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md select-none"
            title="Browse Products & Select Wholesale (Box/Pack) or Retail (Piece) Pricing (F2)"
          >
            <Boxes className="h-4 w-4 text-slate-950" />
            <span className="hidden sm:inline">Wholesale &amp; Retail Items</span>
            <span className="sm:hidden">Wholesale/Retail</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono text-[10px]">F2</kbd>
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
                {/* Launch Item Scanner Pop-up Screen Button (F2) with Box & Pack Tag */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCartItem(null);
                    setShowItemScanModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Open Box / Pack wholesale vs retail switcher & item lookup (F2)"
                >
                  <Boxes className="h-4 w-4 text-amber-600" />
                  <span>📦 Box / Pack Retail Switcher</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 font-mono text-[9px] font-black">F2</kbd>
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
                    placeholder="Scan outer pack or inner piece barcode (e.g. 4800016644012, Colgate, Nescafe)..."
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
                          {item.barcode && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              <ScanBarcode className="h-3 w-3 text-slate-500" />
                              {item.pieceBarcode ? `Pack: ${item.barcode}` : item.barcode}
                            </span>
                          )}
                          {item.pieceBarcode && (
                            <span className="flex items-center gap-1 font-mono text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Single piece barcode">
                              <ScanBarcode className="h-3 w-3 text-amber-600" />
                              Piece: {item.pieceBarcode}
                            </span>
                          )}
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

                      {isBoxOrPackItem(item) ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-black font-mono text-slate-900">
                              ₱{getEffectiveWholesalePrice(item).toFixed(2)}
                              <span className="text-[9px] text-slate-400 font-normal ml-0.5">/{item.unit || 'pack'}</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-amber-700">
                              ₱{getEffectiveRetailPiecePrice(item).toFixed(2)}/pc
                            </div>
                            {hasMultiBuyPromo(item) && (
                              <div className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                ✨ {item.multiBuyQty} for ₱{Number(item.multiBuyPrice).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItemToCart(item, 'wholesale');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title={`Add wholesale ${item.unit || 'pack'}`}
                            >
                              <Boxes className="h-3 w-3 text-cyan-400" />
                              <span>+{item.unit || 'Pack'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItemToCart(item, 'retail_piece');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Add single piece at retail price"
                            >
                              <Tag className="h-3 w-3" />
                              <span>+Piece (Retail)</span>
                            </button>
                            {hasMultiBuyPromo(item) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItemToCart(item, 'retail_piece', item.multiBuyQty);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition cursor-pointer"
                                title={`Add promo bundle (${item.multiBuyQty} pcs for ₱${Number(item.multiBuyPrice).toFixed(2)})`}
                              >
                                <Sparkles className="h-3 w-3 text-emerald-200" />
                                <span>+{item.multiBuyQty} Promo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-black font-mono text-slate-950">
                              ₱{Number(item.sellingPrice || 0).toFixed(2)}
                            </div>
                            <div className="text-[9px] text-slate-400 uppercase font-semibold">
                              {item.size || item.unit || 'Unit'}
                            </div>
                            {hasMultiBuyPromo(item) && (
                              <div className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                ✨ {item.multiBuyQty} for ₱{Number(item.multiBuyPrice).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
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
                            {hasMultiBuyPromo(item) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItemToCart(item, 'wholesale', item.multiBuyQty);
                                }}
                                className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title={`Add promo bundle (${item.multiBuyQty} pcs for ₱${Number(item.multiBuyPrice).toFixed(2)})`}
                              >
                                <Sparkles className="h-3 w-3 text-emerald-200" />
                                <span>+{item.multiBuyQty} Promo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
              {popularQuickPicks.map(item => {
                const isBoxPack = item.unit === 'Box' || item.unit === 'Pack' || (item.size || '').toLowerCase().includes('pack') || (item.size || '').toLowerCase().includes('box');
                return (
                  <button
                    key={item.id || item.barcode}
                    type="button"
                    onClick={() => addItemToCart(item)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition cursor-pointer border border-slate-200/80 flex items-center gap-1.5 shadow-2xs"
                    title={`Barcode: ${item.barcode} · ₱${Number(item.sellingPrice).toFixed(2)}`}
                  >
                    <span className="font-semibold">{item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name}</span>
                    <span className="font-mono font-bold text-slate-900 text-[10px]">₱{Number(item.sellingPrice).toFixed(2)}</span>
                    {isBoxPack && (
                      <span className="px-1 py-0.2 rounded bg-amber-200 text-amber-900 text-[8px] font-bold">
                        {item.unit || 'Pack'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recently Scanned Item Highlight Card with Quick-Quantity Bar */}
          {lastScanned && (
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white shadow-lg space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
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

              {/* Accessible Quick-Quantity Bar */}
              <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Quantity:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono font-bold text-xs">
                    {cart.find(c => c.id === lastScannedItemId || c.barcode === lastScanned.barcode)?.quantity || lastScanned.quantity || 1}x
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">(type number or + / -)</span>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRecentItemQuantity(n)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        (cart.find(c => c.id === lastScannedItemId || c.barcode === lastScanned.barcode)?.quantity || 1) === n
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={`Set quantity to ${n}x`}
                    >
                      {n}x
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
                      if (targetId) handleUpdateQuantity(targetId, 1);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold"
                    title="Increment quantity (+)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
                      if (targetId) handleUpdateQuantity(targetId, -1);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold"
                    title="Decrement quantity (-)"
                  >
                    -
                  </button>
                </div>
              </div>

              {/* Box & Pack Pricing Option on Just Scanned Card */}
              {isBoxOrPackItem(lastScanned) && (
                <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Box / Pack Option:
                      </span>
                    </div>
                    {lastScanned.piecesPerPack > 1 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({lastScanned.piecesPerPack} pcs · ₱{(getEffectiveWholesalePrice(lastScanned) / lastScanned.piecesPerPack).toFixed(2)}/pc wholesale)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetLastScannedTier('wholesale')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        !lastScanned.isRetailPiece
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Boxes className="h-3.5 w-3.5" />
                      <span>Wholesale ({lastScanned.unit || 'Pack'}): ₱{getEffectiveWholesalePrice(lastScanned).toFixed(2)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetLastScannedTier('retail_piece')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        lastScanned.isRetailPiece
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>Retail (Piece): ₱{getEffectiveRetailPiecePrice(lastScanned).toFixed(2)}</span>
                    </button>

                    {hasMultiBuyPromo(lastScanned) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!lastScanned.isRetailPiece) {
                            handleSetLastScannedTier('retail_piece');
                          }
                          const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
                          if (targetId) {
                            setRecentItemQuantity(lastScanned.multiBuyQty || 3, targetId);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          lastScanned.isRetailPiece && (lastScanned.quantity || 1) >= (lastScanned.multiBuyQty || 3)
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow font-black'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                        }`}
                        title={`Apply Multi-Buy Promo (${lastScanned.multiBuyQty} pcs for ₱${Number(lastScanned.multiBuyPrice).toFixed(2)})`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Promo ({lastScanned.multiBuyQty} pcs): ₱{Number(lastScanned.multiBuyPrice).toFixed(2)}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Buy Option for non-box single items on Just Scanned Card */}
              {!isBoxOrPackItem(lastScanned) && hasMultiBuyPromo(lastScanned) && (
                <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Multi-Buy Promo Available:</span>
                    <span className="text-emerald-200 font-mono">
                      {lastScanned.multiBuyQty} for ₱{Number(lastScanned.multiBuyPrice).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = lastScannedItemId || cart[cart.length - 1]?.id;
                      if (targetId) {
                        setRecentItemQuantity(lastScanned.multiBuyQty || 3, targetId);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      (lastScanned.quantity || 1) >= (lastScanned.multiBuyQty || 3)
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow font-black'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Set to {lastScanned.multiBuyQty} pcs (₱{Number(lastScanned.multiBuyPrice).toFixed(2)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Order Nature & Payment Method Selector */}
          <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-200 ${
            activeShortcutStep ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-slate-200'
          }`}>
            
            {/* Order Nature Selector */}
            <div className={`transition-all duration-200 rounded-xl p-2.5 -m-2.5 ${
              activeShortcutStep === 'ORDER_NATURE' 
                ? 'bg-blue-50/70 border border-blue-300 ring-2 ring-blue-400/20 shadow-xs' 
                : 'border border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-slate-900" />
                  <span>1. Order Nature</span>
                  {activeShortcutStep === 'ORDER_NATURE' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                      <Zap className="h-2.5 w-2.5" /> SHORTCUT ACTIVE
                    </span>
                  )}
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {orderType === 'Grocery' ? 'Generates Exit Gate Pass' : 'Dine-In Pantry Meal'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Dine In');
                    playBeep('scan');
                    setActiveShortcutStep('PAYMENT_METHOD');
                  }}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                    orderType === 'Dine In'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } ${activeShortcutStep === 'ORDER_NATURE' ? 'ring-2 ring-blue-400/40 hover:border-blue-500' : ''}`}
                >
                  <Utensils className="h-4 w-4" />
                  <span>Dine In (Cafeteria)</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition ${
                    orderType === 'Dine In' 
                      ? 'bg-blue-600 text-white ring-1 ring-blue-300' 
                      : activeShortcutStep === 'ORDER_NATURE'
                        ? 'bg-blue-600 text-white animate-pulse shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    ← Left / 1
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Grocery');
                    playBeep('scan');
                    setActiveShortcutStep('PAYMENT_METHOD');
                  }}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                    orderType === 'Grocery'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } ${activeShortcutStep === 'ORDER_NATURE' ? 'ring-2 ring-blue-400/40 hover:border-blue-500' : ''}`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Gate Pass</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition ${
                    orderType === 'Grocery' 
                      ? 'bg-blue-600 text-white ring-1 ring-blue-300' 
                      : activeShortcutStep === 'ORDER_NATURE'
                        ? 'bg-blue-600 text-white animate-pulse shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    Right → / 2
                  </span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className={`transition-all duration-200 rounded-xl p-2.5 -m-2.5 ${
              activeShortcutStep === 'PAYMENT_METHOD' 
                ? 'bg-blue-50/70 border border-blue-300 ring-2 ring-blue-400/20 shadow-xs' 
                : 'border border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-slate-900" />
                  <span>2. Payment Method</span>
                  {activeShortcutStep === 'PAYMENT_METHOD' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                      <Zap className="h-2.5 w-2.5" /> SHORTCUT ACTIVE
                    </span>
                  )}
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Select tender</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Salary Deduction');
                    playBeep('scan');
                    setActiveShortcutStep('CONFIRM');
                  }}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer text-xs font-bold ${
                    paymentMethod === 'Salary Deduction'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } ${activeShortcutStep === 'PAYMENT_METHOD' ? 'ring-2 ring-blue-400/40 hover:border-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    <span>Salary Deduction</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition ${
                      paymentMethod === 'Salary Deduction' 
                        ? 'bg-blue-600 text-white ring-1 ring-blue-300' 
                        : activeShortcutStep === 'PAYMENT_METHOD'
                          ? 'bg-blue-600 text-white animate-pulse shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      ← Left / 1
                    </span>
                  </div>
                  <span className={`text-[10px] font-normal ${paymentMethod === 'Salary Deduction' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Auto-Paid via Coop
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Cash');
                    playBeep('scan');
                    setActiveShortcutStep('CONFIRM');
                  }}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer text-xs font-bold ${
                    paymentMethod === 'Cash'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } ${activeShortcutStep === 'PAYMENT_METHOD' ? 'ring-2 ring-blue-400/40 hover:border-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-4 w-4" />
                    <span>Cash Payment</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition ${
                      paymentMethod === 'Cash' 
                        ? 'bg-blue-600 text-white ring-1 ring-blue-300' 
                        : activeShortcutStep === 'PAYMENT_METHOD'
                          ? 'bg-blue-600 text-white animate-pulse shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      Right → / 2
                    </span>
                  </div>
                  <span className={`text-[10px] font-normal ${paymentMethod === 'Cash' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Cash at Register
                  </span>
                </button>
              </div>
            </div>

            {/* Step 3 Confirmation / Enter Finalize Action */}
            {activeShortcutStep === 'CONFIRM' && (
              <div className="pt-2 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[11px] font-black border border-emerald-400/40">
                      ENTER ↵
                    </span>
                    <span className="text-xs font-bold">Press ENTER to Complete Order</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveShortcutStep(null);
                      handleFinalizeCheckout();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white text-emerald-900 text-xs font-black hover:bg-emerald-50 transition cursor-pointer shadow-xs"
                  >
                    Finish (₱{grandTotal.toFixed(2)})
                  </button>
                </div>
              </div>
            )}

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
                cart.map(item => {
                  const itemPromo = calculateMultiBuySubtotal(item, item.quantity || 1, item.isRetailPiece);
                  const isEligibleForMulti = hasMultiBuyPromo(item) && (!isBoxOrPackItem(item) || item.isRetailPiece);

                  return (
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

                        {/* Multi-Buy Promotion Applied Badge */}
                        {itemPromo.savings > 0 && (
                          <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                            <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>✨ Promo: {itemPromo.bundleCount}x ({itemPromo.promoQty} for ₱{itemPromo.promoPrice.toFixed(2)}) · Saved ₱{itemPromo.savings.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Quick Add Remainder to Trigger Multi-Buy Promo */}
                        {isEligibleForMulti && itemPromo.remainderCount > 0 && (
                          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, itemPromo.promoQty - itemPromo.remainderCount)}
                              className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                              title={`Add ${itemPromo.promoQty - itemPromo.remainderCount} more piece(s) to get promo discount`}
                            >
                              <Plus className="h-2.5 w-2.5" />
                              <span>+Add {itemPromo.promoQty - itemPromo.remainderCount} more for {itemPromo.promoQty} for ₱{itemPromo.promoPrice.toFixed(2)} Promo</span>
                            </button>
                          </div>
                        )}

                        {/* Box & Pack Tier Switch Button right on Cart Item */}
                        {isBoxOrPackItem(item) && (
                          <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleCartItemTier(item.id)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-2xs ${
                                item.isRetailPiece
                                  ? 'bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200'
                                  : 'bg-cyan-50 border-cyan-300 text-cyan-950 hover:bg-cyan-100'
                              }`}
                              title="Click to toggle between Wholesale (Box/Pack) and Retail (Piece)"
                            >
                              <Boxes className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>{item.isRetailPiece ? `🏷️ Retail Piece (₱${Number(item.unitPrice).toFixed(2)})` : `📦 Wholesale ${item.unit || 'Pack'} (₱${Number(item.unitPrice).toFixed(2)})`}</span>
                              <span className="text-[9px] font-black underline text-indigo-700 ml-1">
                                Switch to {item.isRetailPiece ? 'Wholesale' : 'Retail Piece'}
                              </span>
                            </button>
                          </div>
                        )}
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

                      <div className="w-20 text-right font-mono shrink-0">
                        {itemPromo.savings > 0 && (
                          <div className="text-[10px] line-through text-slate-400">
                            ₱{itemPromo.regularSubtotal.toFixed(2)}
                          </div>
                        )}
                        <div className="font-bold text-xs text-slate-900">
                          ₱{itemPromo.subtotal.toFixed(2)}
                        </div>
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
                  );
                })
              )}
            </div>

            {/* Subtotal & Checkout Action Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {totalCartSavings > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Multi-Buy Savings:
                  </span>
                  <span className="font-mono font-black">-₱{totalCartSavings.toFixed(2)}</span>
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (cart.length === 0) return;
                    if (activeShortcutStep === 'CONFIRM') {
                      setActiveShortcutStep(null);
                      handleFinalizeCheckout();
                    } else if (selectedStaff) {
                      setCheckoutWizardStep('ORDER_NATURE');
                    } else {
                      initiateCheckout();
                    }
                  }}
                  className={`h-12 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                    activeShortcutStep === 'CONFIRM'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-400 shadow-xl animate-pulse scale-[1.02]'
                      : cart.length > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse hover:animate-none'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={activeShortcutStep === 'CONFIRM' ? "Confirm and Complete Order [Enter]" : "Fast Keyboard Checkout [F9 or Enter]"}
                >
                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[9px] font-bold">
                    {activeShortcutStep === 'CONFIRM' ? '↵' : 'F9'}
                  </span>
                  <span>{activeShortcutStep === 'CONFIRM' ? 'Confirm Sale' : 'Fast Checkout'}</span>
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={initiateCheckout}
                  className={`h-12 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    cart.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Manual Finish</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 0: FAST CHECKOUT KEYBOARD WIZARD */}
      {checkoutWizardStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-150">
            
            {/* Header with Step Progress */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white font-black text-xs">
                  ⚡ FAST POS
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                    <span>Ergonomic Keyboard Checkout</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                      Zero-Mouse Flow
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Use Left / Right Arrow keys on your keyboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutWizardStep(null);
                  barcodeInputRef.current?.focus();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Cancel [Esc]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/50 text-center text-xs font-bold divide-x divide-slate-800">
              <div className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
                checkoutWizardStep === 'ORDER_NATURE' 
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' 
                  : 'text-slate-500'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                <span>Order Nature</span>
              </div>
              <div className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
                checkoutWizardStep === 'PAYMENT_METHOD' 
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' 
                  : 'text-slate-500'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                <span>Payment</span>
              </div>
              <div className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
                checkoutWizardStep === 'CONFIRM' 
                  ? 'bg-emerald-600/20 text-emerald-300 border-b-2 border-emerald-500' 
                  : 'text-slate-500'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono font-bold">3</span>
                <span>Confirm</span>
              </div>
            </div>

            {/* Wizard Body */}
            <div className="p-6 space-y-5">
              
              {/* Customer Identified Header */}
              {selectedStaff && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                      {((selectedStaff.firstName?.[0] || '') + (selectedStaff.lastName?.[0] || '')).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Customer Verified</div>
                      <div className="text-sm font-black text-white">{selectedStaff.firstName} {selectedStaff.lastName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{selectedStaff.employeeId} · {selectedStaff.department || 'Production'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Grand Total</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">₱{grandTotal.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cart.reduce((a, b) => a + (b.quantity || 1), 0)} items</div>
                  </div>
                </div>
              )}

              {/* STEP 1: ORDER NATURE */}
              {checkoutWizardStep === 'ORDER_NATURE' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-center">
                    <h4 className="text-lg font-black text-white">Select Order Nature</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Press <kbd className="px-2 py-0.5 rounded bg-blue-900 border border-blue-600 font-mono text-white text-[11px] font-bold">← Left Arrow (or 1)</kbd> for Dine In, or <kbd className="px-2 py-0.5 rounded bg-blue-900 border border-blue-600 font-mono text-white text-[11px] font-bold">Right Arrow (or 2) →</kbd> for Gate Pass
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Dine In Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('Dine In');
                        playBeep('scan');
                        setCheckoutWizardStep('PAYMENT_METHOD');
                      }}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer relative ${
                        orderType === 'Dine In'
                          ? 'bg-blue-950/60 border-blue-500 shadow-xl ring-2 ring-blue-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <span>← Left Arrow (1)</span>
                      </div>
                      <Utensils className="h-10 w-10 text-blue-400" />
                      <div>
                        <div className="text-base font-black text-white">Dine In</div>
                        <div className="text-[11px] text-slate-400 mt-1">Cafeteria pantry consumption</div>
                      </div>
                      {orderType === 'Dine In' && (
                        <div className="text-[10px] font-bold text-blue-300 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </div>
                      )}
                    </button>

                    {/* Gate Pass Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('Grocery');
                        playBeep('scan');
                        setCheckoutWizardStep('PAYMENT_METHOD');
                      }}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer relative ${
                        orderType === 'Grocery'
                          ? 'bg-blue-950/60 border-blue-500 shadow-xl ring-2 ring-blue-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <span>Right Arrow (2) →</span>
                      </div>
                      <ShoppingBag className="h-10 w-10 text-cyan-400" />
                      <div>
                        <div className="text-base font-black text-white">Gate Pass</div>
                        <div className="text-[11px] text-slate-400 mt-1">Auto-prints Exit Gate Pass</div>
                      </div>
                      {orderType === 'Grocery' && (
                        <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {checkoutWizardStep === 'PAYMENT_METHOD' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-center">
                    <h4 className="text-lg font-black text-white">Select Payment Tender</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Press <kbd className="px-2 py-0.5 rounded bg-blue-900 border border-blue-600 font-mono text-white text-[11px] font-bold">← Left Arrow (or 1)</kbd> for Salary Deduction, or <kbd className="px-2 py-0.5 rounded bg-blue-900 border border-blue-600 font-mono text-white text-[11px] font-bold">Right Arrow (or 2) →</kbd> for Cash
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Salary Deduction Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Salary Deduction');
                        playBeep('scan');
                        setCheckoutWizardStep('CONFIRM');
                      }}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer relative ${
                        paymentMethod === 'Salary Deduction'
                          ? 'bg-blue-950/60 border-blue-500 shadow-xl ring-2 ring-blue-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <span>← Left Arrow (1)</span>
                      </div>
                      <CreditCard className="h-10 w-10 text-emerald-400" />
                      <div>
                        <div className="text-base font-black text-white">Salary Deduction</div>
                        <div className="text-[11px] text-slate-400 mt-1">Auto-settled on payroll payout</div>
                      </div>
                      {paymentMethod === 'Salary Deduction' && (
                        <div className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </div>
                      )}
                    </button>

                    {/* Cash Tendered Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Cash');
                        playBeep('scan');
                        setCheckoutWizardStep('CONFIRM');
                      }}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer relative ${
                        paymentMethod === 'Cash'
                          ? 'bg-blue-950/60 border-blue-500 shadow-xl ring-2 ring-blue-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <span>Right Arrow (2) →</span>
                      </div>
                      <Banknote className="h-10 w-10 text-amber-400" />
                      <div>
                        <div className="text-base font-black text-white">Cash Payment</div>
                        <div className="text-[11px] text-slate-400 mt-1">Paid at canteen cash register</div>
                      </div>
                      {paymentMethod === 'Cash' && (
                        <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRM & COMPLETE SALE */}
              {checkoutWizardStep === 'CONFIRM' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-center">
                    <h4 className="text-lg font-black text-white">Ready to Finalize Purchase</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review choices and press <kbd className="px-2.5 py-0.5 rounded bg-emerald-700 font-mono text-white text-xs font-bold">ENTER</kbd> to complete sale
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Order Nature</span>
                        <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          {orderType === 'Dine In' ? <Utensils className="h-4 w-4 text-blue-400" /> : <ShoppingBag className="h-4 w-4 text-cyan-400" />}
                          <span>{orderType === 'Dine In' ? 'Dine In (Cafeteria)' : 'Gate Pass'}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Method</span>
                        <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          {paymentMethod === 'Salary Deduction' ? <CreditCard className="h-4 w-4 text-emerald-400" /> : <Banknote className="h-4 w-4 text-amber-400" />}
                          <span>{paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Purchase:</span>
                      <span className="font-mono text-2xl font-black text-emerald-400">₱{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutWizardStep(null);
                      handleFinalizeCheckout();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-3 transition cursor-pointer animate-pulse hover:animate-none"
                  >
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                      ENTER
                    </span>
                    <span>Confirm &amp; Complete Transaction</span>
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Keyboard Navigation Bar */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-3">
                {checkoutWizardStep !== 'ORDER_NATURE' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (checkoutWizardStep === 'CONFIRM') setCheckoutWizardStep('PAYMENT_METHOD');
                      else if (checkoutWizardStep === 'PAYMENT_METHOD') setCheckoutWizardStep('ORDER_NATURE');
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">↑ Up</kbd>
                    <span>Back</span>
                  </button>
                )}
                <span>·</span>
                <span className="text-[11px] text-slate-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Esc</kbd> Cancel
                </span>
              </div>

              <div className="text-[11px] text-blue-400 font-mono font-bold">
                {checkoutWizardStep === 'ORDER_NATURE' && 'Step 1/3: Left (Dine In) / Right (Gate Pass)'}
                {checkoutWizardStep === 'PAYMENT_METHOD' && 'Step 2/3: Left (Salary Deduction) / Right (Cash)'}
                {checkoutWizardStep === 'CONFIRM' && 'Step 3/3: Press ENTER to finalize'}
              </div>
            </div>

          </div>
        </div>
      )}

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
                  placeholder="Scan NKB052026-0024, NKB092026-0048, or NKB052026-0014..."
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
                <button
                  type="button"
                  onClick={() => setSupervisorBarcode('NKB052026-0014')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                >
                  Earl John DELOS SANTOS (IT Admin)
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
