import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ScanBarcode, 
  Search, 
  Plus, 
  Minus, 
  X, 
  Check, 
  CheckCircle2, 
  Package, 
  Sparkles, 
  Tag, 
  Percent, 
  DollarSign, 
  FileText, 
  Utensils, 
  ShoppingBag, 
  Keyboard, 
  HelpCircle, 
  AlertCircle,
  CornerDownLeft,
  ArrowUpDown,
  Boxes
} from 'lucide-react';
import { cleanScanInput } from '../../utils/scanResolver';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

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

/**
 * CanteenItemScanModal
 * 
 * Screen-fitted pop-up screen for looking up, scanning, and entering details
 * (Quantity, Unit Price, Discount, Order Nature, Notes) for canteen inventory items
 * with high-efficiency ergonomic keyboard shortcut keys.
 */
export default function CanteenItemScanModal({
  isOpen,
  onClose,
  canteenInventory = [],
  onConfirmItem,
  initialItem = null, // If passed, modal opens in edit mode for this cart item
  defaultOrderType = 'Dine In'
}) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Active / Selected Item for Detail Entry
  const [activeItem, setActiveItem] = useState(null);

  // Detail Entry Fields
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [itemOrderType, setItemOrderType] = useState(defaultOrderType);
  const [notes, setNotes] = useState('');

  // Custom Item Mode (Cooked cafeteria viand / unlisted item)
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Cooked Cafeteria Meal');

  // Hotkey Guide Overlay Toggle
  const [showHotkeyGuide, setShowHotkeyGuide] = useState(false);

  // Input Refs for Ergonomic Hotkey Focusing
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const notesInputRef = useRef(null);
  const customNameRef = useRef(null);
  const itemListContainerRef = useRef(null);

  // Register with global progressive Escape stack
  useEscapeKey('canteen-item-scan-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  // Extract unique categories from inventory
  const categories = useMemo(() => {
    const set = new Set();
    canteenInventory.forEach(it => {
      if (it.category) set.add(it.category);
    });
    Object.values(STANDARD_SUPPLIES_CATALOG).forEach(it => {
      if (it.category) set.add(it.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [canteenInventory]);

  // Filtered & Ranked Items List
  const filteredItems = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const cleanQ = cleanScanInput(q).toLowerCase();

    const candidates = [];
    const seenBarcodes = new Set();

    // 1. Inventory Items
    canteenInventory.forEach(item => {
      const code = item.barcode || item.id;
      if (seenBarcodes.has(code)) return;

      const name = (item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const bCode = (item.barcode || '').toLowerCase();

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      if (!matchCategory) return;

      if (!q) {
        candidates.push(item);
        seenBarcodes.add(code);
        return;
      }

      if (bCode.includes(cleanQ) || name.includes(q) || brand.includes(q) || cat.includes(q)) {
        candidates.push(item);
        seenBarcodes.add(code);
      }
    });

    // 2. Standard Catalog Items
    Object.entries(STANDARD_SUPPLIES_CATALOG).forEach(([code, std]) => {
      if (seenBarcodes.has(code)) return;

      const name = (std.name || '').toLowerCase();
      const brand = (std.brand || '').toLowerCase();
      const cat = (std.category || '').toLowerCase();
      const bCode = code.toLowerCase();

      const matchCategory = selectedCategory === 'ALL' || std.category === selectedCategory;
      if (!matchCategory) return;

      if (!q) {
        if (candidates.length < 50) {
          candidates.push({
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
          seenBarcodes.add(code);
        }
        return;
      }

      if (bCode.includes(cleanQ) || name.includes(q) || brand.includes(q) || cat.includes(q)) {
        candidates.push({
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
        seenBarcodes.add(code);
      }
    });

    // Rank: exact barcode > barcode prefix > name starts with > contains
    return candidates.sort((a, b) => {
      if (!q) return 0;
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
    }).slice(0, 100);
  }, [searchQuery, selectedCategory, canteenInventory]);

  // Set active item when initialItem changes or on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      setActiveItem(initialItem);
      setQuantity(initialItem.quantity || 1);
      setUnitPrice(Number(initialItem.unitPrice || initialItem.sellingPrice || 0));
      setDiscountPercent(initialItem.discountPercent || 0);
      setItemOrderType(initialItem.orderType || defaultOrderType);
      setNotes(initialItem.notes || '');
      setIsCustomMode(Boolean(initialItem.isCustom));
      setCustomName(initialItem.name || '');
      setCustomCategory(initialItem.category || 'Cooked Cafeteria Meal');

      // Auto-focus quantity field for instant modification
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 100);
    } else {
      // Default to first item if available
      if (filteredItems.length > 0) {
        selectItem(filteredItems[0]);
      }
      setIsCustomMode(false);
      setCustomName('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialItem]);

  // Select Item helper
  const selectItem = (item) => {
    if (!item) return;
    setActiveItem(item);
    setIsCustomMode(false);
    setQuantity(1);
    setUnitPrice(Number(item.sellingPrice || item.unitPrice || 0));
    setDiscountPercent(0);
    setItemOrderType(defaultOrderType);
    setNotes('');
  };

  // Switch to custom item creation mode
  const activateCustomMode = () => {
    setIsCustomMode(true);
    setActiveItem(null);
    setCustomName('');
    setUnitPrice(0);
    setQuantity(1);
    setDiscountPercent(0);
    setNotes('');
    setTimeout(() => {
      customNameRef.current?.focus();
    }, 100);
  };

  // Computations
  const finalUnitPrice = Math.max(0, unitPrice * (1 - discountPercent / 100));
  const subtotal = finalUnitPrice * Math.max(1, quantity);
  const discountSavings = (unitPrice * (discountPercent / 100)) * Math.max(1, quantity);

  // Confirm and Submit Item to Cart
  const handleConfirm = useCallback(() => {
    if (isCustomMode) {
      const cleanName = customName.trim();
      if (!cleanName) {
        alert('Please enter a product or meal name.');
        customNameRef.current?.focus();
        return;
      }
      if (unitPrice <= 0) {
        alert('Please enter a valid unit price greater than ₱0.');
        priceInputRef.current?.focus();
        return;
      }

      onConfirmItem({
        id: initialItem?.id || `custom-${Date.now()}`,
        name: cleanName,
        brand: 'Cafeteria Kitchen',
        barcode: initialItem?.barcode || `CUSTOM-${Date.now().toString().slice(-6)}`,
        unitPrice: finalUnitPrice,
        originalPrice: unitPrice,
        discountPercent: discountPercent,
        quantity: Math.max(1, quantity),
        orderType: itemOrderType,
        category: customCategory,
        notes: notes.trim(),
        isCustom: true
      });
      onClose();
      return;
    }

    if (!activeItem) {
      alert('Please select an item from the list or scan a barcode.');
      searchInputRef.current?.focus();
      return;
    }

    onConfirmItem({
      id: initialItem?.id || activeItem.id || `item-${Date.now()}`,
      barcode: activeItem.barcode || '',
      name: activeItem.name,
      brand: activeItem.brand || 'NKB',
      size: activeItem.size || activeItem.unit || '',
      unitPrice: finalUnitPrice,
      originalPrice: unitPrice,
      discountPercent: discountPercent,
      quantity: Math.max(1, quantity),
      orderType: itemOrderType,
      category: activeItem.category || 'General',
      notes: notes.trim(),
      isCustom: false
    });
    onClose();
  }, [isCustomMode, customName, unitPrice, finalUnitPrice, discountPercent, quantity, itemOrderType, customCategory, notes, initialItem, activeItem, onConfirmItem, onClose]);

  // Global Keyboard Listener for Ergonomic Hotkeys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Toggle Hotkey Guide Overlay on F1 or '?' (when not typing in an input)
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHotkeyGuide(prev => !prev);
        return;
      }

      // Check for Alt+ combinations
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'q') {
          // Alt+Q: Focus Quantity
          e.preventDefault();
          qtyInputRef.current?.focus();
          qtyInputRef.current?.select();
          return;
        }
        if (key === 'p') {
          // Alt+P: Focus Unit Price
          e.preventDefault();
          priceInputRef.current?.focus();
          priceInputRef.current?.select();
          return;
        }
        if (key === 'd') {
          // Alt+D: Cycle Discount Preset (0% -> 5% -> 10% -> 20% -> 0%)
          e.preventDefault();
          setDiscountPercent(prev => {
            if (prev === 0) return 5;
            if (prev === 5) return 10;
            if (prev === 10) return 20;
            return 0;
          });
          return;
        }
        if (key === 'n') {
          // Alt+N: Focus Notes
          e.preventDefault();
          notesInputRef.current?.focus();
          notesInputRef.current?.select();
          return;
        }
        if (key === 'o') {
          // Alt+O: Toggle Order Nature
          e.preventDefault();
          setItemOrderType(prev => (prev === 'Dine In' ? 'Grocery' : 'Dine In'));
          return;
        }
        if (key === 'u') {
          // Alt+U: Custom / Cooked Meal Entry
          e.preventDefault();
          activateCustomMode();
          return;
        }
        if (key === 's') {
          // Alt+S: Focus Search
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          return;
        }
      }

      // Focus Search on F3 or '/' (when not already in an input)
      if (e.key === 'F3' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Quantity adjustments via '+' or '-' when not typing in text fields
      const isTypingText = document.activeElement === notesInputRef.current || document.activeElement === customNameRef.current;
      if (!isTypingText) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setQuantity(q => q + 1);
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setQuantity(q => Math.max(1, q - 1));
          return;
        }
      }

      // Arrow navigation in items list (when focusing search or outside inputs)
      if (document.activeElement === searchInputRef.current || document.activeElement?.tagName === 'BODY') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => {
            const next = prev < filteredItems.length - 1 ? prev + 1 : 0;
            if (filteredItems[next]) selectItem(filteredItems[next]);
            return next;
          });
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => {
            const next = prev > 0 ? prev - 1 : filteredItems.length - 1;
            if (filteredItems[next]) selectItem(filteredItems[next]);
            return next;
          });
          return;
        }
      }

      // Enter or Ctrl+Enter: Confirm and Add to Cart
      if (e.key === 'Enter') {
        // If focusing search input and haven't selected anything yet, select first match
        if (document.activeElement === searchInputRef.current && filteredItems.length > 0 && !activeItem) {
          e.preventDefault();
          selectItem(filteredItems[0]);
          qtyInputRef.current?.focus();
          qtyInputRef.current?.select();
          return;
        }
        // Otherwise, confirm and add
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, activeItem, isCustomMode, customName, unitPrice, finalUnitPrice, discountPercent, quantity, itemOrderType, notes, handleConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Screen-Fitted Modal Window */}
      <div className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none">
        
        {/* Modal Top Header Bar */}
        <header className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <ScanBarcode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  {initialItem ? 'Edit Cart Item Details' : 'Canteen Scanner & Item Details Entry'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700">
                  {initialItem ? 'Modifying Cart' : 'Quick Lookup Pop-up'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Ergonomic keyboard shortcuts enabled · Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">F1</kbd> for cheat sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHotkeyGuide(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showHotkeyGuide 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Keyboard Shortcut Guide (F1)"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 text-cyan-400 font-mono text-[9px]">F1</kbd>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Pop-up (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Hotkey Guide Drawer / Banner (Expandable) */}
        {showHotkeyGuide && (
          <div className="px-5 py-3 bg-cyan-950/40 border-b border-cyan-500/30 text-cyan-200 text-xs shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-bold mb-1.5 text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Ergonomic Cashier Keyboard Shortcuts Cheat Sheet:
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono">No mouse required!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px] font-mono">
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+Q</span>: Focus Quantity
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">+/-</span>: Adjust Qty
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+P</span>: Edit Price
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+D</span>: Cycle Discount
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+O</span>: Dine / Grocery
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+N</span>: Item Notes
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">F3 or /</span>: Focus Search
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">↑ / ↓</span>: Navigate List
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">Alt+U</span>: Custom Item
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-emerald-400 font-bold">Enter</span>: Add / Confirm
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-rose-400 font-bold">Esc</span>: Close Pop-up
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                <span className="text-white font-bold">F1</span>: Hide Hints
              </div>
            </div>
          </div>
        )}

        {/* Modal Main Body (2 Columns - Perfectly Screen-Fitted with Internal Scroll) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Panel: Fast Scanner & Inventory Browser (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-900/60 p-4 sm:p-5 gap-3.5">
            
            {/* Search & Barcode Scanner Input */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ScanBarcode className="h-4 w-4 text-cyan-400" />
                  <span>Scan Barcode or Search Item</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[9px]">F3 or /</kbd>
                </label>
                <button
                  type="button"
                  onClick={activateCustomMode}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Custom Meal / Unlisted Item</span>
                  <kbd className="px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[9px]">Alt+U</kbd>
                </button>
              </div>

              <div className="relative">
                <ScanBarcode className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder="Scan barcode gun or type keyword (e.g. 4800016644012, bread, coffee)..."
                  className="w-full h-11 pl-11 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar text-xs">
              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? 'All Items' : cat}
                </button>
              ))}
            </div>

            {/* Results Count & Keyboard Navigation Hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 shrink-0 border-b border-slate-800/80 pb-2">
              <span>Matching Items ({filteredItems.length})</span>
              <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
                Click or use <kbd className="px-1 bg-slate-800 text-slate-300 rounded">↑</kbd> <kbd className="px-1 bg-slate-800 text-slate-300 rounded">↓</kbd> then <kbd className="px-1 bg-slate-800 text-slate-300 rounded">Enter</kbd>
              </span>
            </div>

            {/* Scrollable Inventory Items List */}
            <div 
              ref={itemListContainerRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 divide-y divide-slate-800/50"
            >
              {filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Package className="h-10 w-10 text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-400">No items found matching "{searchQuery}"</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Try another keyword, scan with barcode gun, or click <strong>Custom Meal Entry</strong> above.
                  </p>
                  <button
                    type="button"
                    onClick={activateCustomMode}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30"
                  >
                    + Enter as Custom Canteen Item
                  </button>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = activeItem?.id === item.id || activeItem?.barcode === item.barcode;
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <div
                      key={item.id || item.barcode}
                      onClick={() => {
                        setHighlightedIndex(idx);
                        selectItem(item);
                      }}
                      className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-cyan-950/70 border-2 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/20' 
                          : isHighlighted 
                            ? 'bg-slate-800/80 border border-slate-700' 
                            : 'hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {item.name}
                          </span>
                          {item.brand && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold shrink-0">
                              {item.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="font-mono text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {item.barcode || '480-SCAN'}
                          </span>
                          {item.category && <span>· {item.category}</span>}
                          {item.quantity !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.quantity > 10 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : item.quantity > 0 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            }`}>
                              {item.quantity > 10 ? `${item.quantity} in stock` : item.quantity > 0 ? `Low: ${item.quantity}` : 'Out of stock'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black font-mono text-cyan-300">
                          ₱{Number(item.sellingPrice || item.unitPrice || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.size || item.unit || 'Unit'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Panel: Ergonomic Item Detail Entry (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between min-h-0 bg-slate-950 p-4 sm:p-5 gap-4">
            
            <div className="space-y-4 overflow-y-auto pr-1 min-h-0">
              
              {/* Selected Item Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-cyan-400" />
                    Target Item
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800">
                    {isCustomMode ? 'Custom Entry' : activeItem?.barcode || 'Select item'}
                  </span>
                </div>

                {isCustomMode ? (
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1">
                      Custom Meal / Product Name *
                    </label>
                    <input
                      ref={customNameRef}
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Special Pork Adobo Meal, Extra Rice..."
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-amber-500/50 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ) : activeItem ? (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {activeItem.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">{activeItem.brand || 'NKB'}</span>
                      <span>·</span>
                      <span>{activeItem.category || 'Standard'}</span>
                      {activeItem.size && <span>· {activeItem.size}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">
                    Select an item from the left panel or scan a barcode to begin.
                  </div>
                )}
              </div>

              {/* Field 1: Quantity with Ergonomic Hotkey Alt+Q */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Quantity</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">Alt+Q</kbd>
                    <span className="text-[10px] text-slate-500 font-normal">(+/- keys)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Units: {quantity}x
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg cursor-pointer active:scale-95 transition"
                    title="Decrease Quantity (-)"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-11 text-center font-mono font-black text-xl bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg cursor-pointer active:scale-95 transition"
                    title="Increase Quantity (+)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Quantity Presets */}
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {[1, 2, 3, 5, 10, 24].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuantity(val)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                        quantity === val
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Unit Price with Ergonomic Hotkey Alt+P */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Unit Price (₱)</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">Alt+P</kbd>
                  </label>
                  {activeItem && unitPrice !== Number(activeItem.sellingPrice || activeItem.unitPrice || 0) && (
                    <button
                      type="button"
                      onClick={() => setUnitPrice(Number(activeItem.sellingPrice || activeItem.unitPrice || 0))}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Reset (₱{Number(activeItem.sellingPrice || activeItem.unitPrice || 0).toFixed(2)})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono font-bold text-slate-500 text-sm">₱</span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-10 pl-8 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Field 3: Discount / Promo Preset with Hotkey Alt+D */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Discount / Promo</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">Alt+D</kbd>
                  </label>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      -₱{discountSavings.toFixed(2)} off
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '0% Reg', val: 0 },
                    { label: '5% Off', val: 5 },
                    { label: '10% Staff', val: 10 },
                    { label: '20% Senior', val: 20 }
                  ].map(disc => (
                    <button
                      key={disc.val}
                      type="button"
                      onClick={() => setDiscountPercent(disc.val)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        discountPercent === disc.val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {disc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Order Nature with Hotkey Alt+O */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Order Nature</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">Alt+O</kbd>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {itemOrderType === 'Grocery' ? 'Gate Pass Exit' : 'Pantry Meal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemOrderType('Dine In')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      itemOrderType === 'Dine In'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Utensils className="h-3.5 w-3.5" />
                    <span>Dine In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemOrderType('Grocery')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      itemOrderType === 'Grocery'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Grocery Takeout</span>
                  </button>
                </div>
              </div>

              {/* Field 5: Notes & Remarks with Hotkey Alt+N */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Item Notes / Remarks</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">Alt+N</kbd>
                  </label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>

                <input
                  ref={notesInputRef}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Extra hot water, Packaged in plastic, Takeout box..."
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>

            </div>

            {/* Subtotal Calculation & Action Buttons */}
            <div className="pt-3 border-t border-slate-800 space-y-3 shrink-0">
              
              {/* Live Subtotal Display */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex items-center justify-between shadow-inner">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Calculated Subtotal
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    ₱{finalUnitPrice.toFixed(2)} × {quantity} {quantity === 1 ? 'item' : 'items'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    ₱{subtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Confirm / Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Cancel</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px]">Esc</kbd>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!isCustomMode && !activeItem}
                  className={`flex-1 h-12 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                    isCustomMode || activeItem
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black ring-2 ring-cyan-400/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{initialItem ? 'Update Cart Item' : 'Add to Purchase Register'}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[10px]">Enter ↵</kbd>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Persistent Hotkey Footer Bar */}
        <footer className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Alt+Q</kbd> Qty
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Alt+P</kbd> Price
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Alt+D</kbd> Discount
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Alt+O</kbd> Dine/Grocery
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Alt+N</kbd> Notes
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">Enter</kbd> Confirm &amp; Add
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd> Exit
            </span>
          </div>
        </footer>

      </div>

    </div>
  );
}
