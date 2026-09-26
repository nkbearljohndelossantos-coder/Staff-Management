import React, { useState, useEffect } from 'react';
import { 
  ScanBarcode, 
  Store, 
  Utensils, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Wallet, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  Minimize2,
  Clock,
  Sparkles,
  ShieldCheck,
  Receipt
} from 'lucide-react';

export default function CanteenCustomerDisplay() {
  const [displayState, setDisplayState] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_pos_display_sync');
      return saved ? JSON.parse(saved) : {
        cart: [],
        lastScannedItem: null,
        orderType: 'Dine In',
        paymentMethod: 'Cash',
        customer: null,
        grandTotal: 0,
        status: 'IDLE',
        voidNotice: null,
        completedReceipt: null
      };
    } catch {
      return {
        cart: [],
        lastScannedItem: null,
        orderType: 'Dine In',
        paymentMethod: 'Cash',
        customer: null,
        grandTotal: 0,
        status: 'IDLE',
        voidNotice: null,
        completedReceipt: null
      };
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenRes, setScreenRes] = useState(() => {
    if (typeof window !== 'undefined' && window.screen) {
      return `${window.screen.width}×${window.screen.height}`;
    }
    return '1920×1080';
  });

  // Track Display Resize & Resolution
  useEffect(() => {
    const updateRes = () => {
      if (typeof window !== 'undefined' && window.screen) {
        setScreenRes(`${window.screen.width}×${window.screen.height}`);
      }
    };
    window.addEventListener('resize', updateRes);
    return () => window.removeEventListener('resize', updateRes);
  }, []);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to BroadcastChannel and localStorage events from primary monitor
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('nkb_canteen_pos_channel');
      bc.onmessage = (event) => {
        if (event.data) {
          setDisplayState(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel unavailable:', e);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'nkb_canteen_pos_display_sync' && e.newValue) {
        try {
          setDisplayState(JSON.parse(e.newValue));
        } catch (err) {
          console.warn('Storage sync parse error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const {
    cart = [],
    lastScannedItem,
    orderType = 'Dine In',
    paymentMethod = 'Cash',
    customer,
    grandTotal = 0,
    status = 'IDLE',
    voidNotice,
    completedReceipt
  } = displayState;

  const totalItemsCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const customerFullName = customer ? (
    customer.name ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.rawName ||
    customer.employeeId ||
    'Staff Member'
  ) : '';

  const customerInitials = customer ? (
    ((customer.firstName?.[0] || '') + (customer.lastName?.[0] || '')).toUpperCase() ||
    customerFullName.slice(0, 2).toUpperCase() ||
    'ID'
  ) : '';

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-slate-700 selection:text-white overflow-hidden p-4 sm:p-6 lg:p-8 select-none">
      
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <img
            src="/LogoC.png"
            alt="NKB Logo"
            className="h-12 w-12 object-contain drop-shadow"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                NKB MANUFACTURING CANTEEN
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                Customer Display
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Dual-Monitor Point-of-Sale Register · Live Customer Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>HDMI 2nd Monitor ({screenRes}) Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Display (F11)'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Display Body */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 min-h-0">
        
        {/* Left Column: Scanned Item Highlight & Itemized Basket (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 min-h-0">
          
          {/* Recently Scanned Item Highlight Banner */}
          {lastScannedItem ? (
            <div className="rounded-2xl border-2 border-white/20 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                  <ScanBarcode className="h-4 w-4 text-white" />
                  Item Scanned Just Now
                </span>
                <span className="font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {lastScannedItem.barcode || '480-SCAN'}
                </span>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {lastScannedItem.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold text-xs">
                      {lastScannedItem.brand || 'NKB Standard'}
                    </span>
                    {lastScannedItem.size && (
                      <span className="text-xs text-slate-400 font-mono">
                        Size: {lastScannedItem.size}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Unit Price</div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    ₱{Number(lastScannedItem.unitPrice || lastScannedItem.sellingPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-center gap-3 text-slate-400">
              <ScanBarcode className="h-6 w-6 text-slate-500 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">
                Waiting for cashier barcode scan...
              </span>
            </div>
          )}

          {/* Void / Supervisor Alert Banner */}
          {voidNotice && (
            <div className="rounded-2xl bg-rose-950/80 border border-rose-500/40 p-4 text-rose-200 flex items-center gap-3 animate-in fade-in duration-200 shadow-lg">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Supervisor Void Authorized
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {voidNotice.message || 'Item removed from purchase transaction.'} (Authorized by {voidNotice.supervisorName || 'Supervisor'})
                </p>
              </div>
            </div>
          )}

          {/* Completed Order Confirmation Banner */}
          {completedReceipt && (
            <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-emerald-200 flex items-center gap-3 animate-in fade-in duration-200 shadow-lg">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Payment Confirmed · Transaction Completed
                </p>
                <p className="text-sm font-medium mt-0.5">
                  Receipt #{completedReceipt.receiptNo} · Official record generated for {completedReceipt.customerName || customerFullName || 'Employee'}.
                </p>
              </div>
            </div>
          )}

          {/* Itemized Cart Table */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-lg min-h-[260px]">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Store className="h-4 w-4 text-slate-400" />
                Current Purchase Register ({totalItemsCount} items)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Live Synchronized</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                    <ScanBarcode className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Cart is Currently Empty</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Please present your items or employee meal choices to the counter.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Item &amp; Brand</th>
                      <th className="px-3 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cart.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-850/60 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-300">{item.brand || 'NKB'}</span>
                            {item.size && <span>· {item.size}</span>}
                            {item.barcode && <span className="font-mono text-[10px] text-slate-500">[{item.barcode}]</span>}
                            {item.discountPercent > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                -{item.discountPercent}% Discount
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[10px] text-cyan-300 italic">
                                Note: {item.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-white text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                            {item.quantity}x
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-300 text-sm">
                          ₱{Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white text-base">
                          ₱{(Number(item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Customer Info, Order Nature, Payment, Grand Total (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          
          <div className="space-y-5">
            
            {/* Customer Identification Card */}
            <div className={`rounded-2xl border p-5 shadow-lg transition-all duration-300 ${
              customer 
                ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <UserCheck className={`h-4 w-4 ${customer ? 'text-emerald-400' : 'text-white'}`} />
                  Customer Employee Identification
                </span>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  customer 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}>
                  {customer ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Verified
                    </>
                  ) : (
                    'Required at Checkout'
                  )}
                </span>
              </div>

              {customer ? (
                <div className="mt-4 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                  {customer.avatar ? (
                    <img
                      src={customer.avatar}
                      alt={customerFullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/40 shadow-lg bg-slate-950 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-slate-900 border-2 border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black text-xl shadow-lg shrink-0 font-mono tracking-wider">
                      {customerInitials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-0.5">
                      <span>Customer Name</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug truncate">
                      {customerFullName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold text-slate-300">
                        {customer.employeeId || 'ID Verified'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 truncate max-w-[200px]">
                        {customer.departmentName || customer.department || 'Production & Manufacturing'}
                      </span>
                      {customer.positionTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                          {customer.positionTitle}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Badge Verified
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3.5 text-slate-400">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    <ScanBarcode className="h-6 w-6 text-slate-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Awaiting Employee Badge Scan</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Please scan your employee barcode badge or provide your Employee ID at the counter to identify your name and complete checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Nature & Payment Mode Badges */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Order Nature */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Order Nature
                </div>
                <div className="flex items-center gap-2 text-white font-black text-base">
                  {orderType === 'Dine In' ? (
                    <>
                      <Utensils className="h-5 w-5 text-white" />
                      <span>Dine In</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 text-white" />
                      <span>Grocery Takeout</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {orderType === 'Grocery' ? 'Gate Pass security exit clearance will be printed.' : 'Cafeteria pantry consumption.'}
                </p>
              </div>

              {/* Payment Method */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Payment Method
                </div>
                <div className="flex items-center gap-2 text-white font-black text-base">
                  {paymentMethod === 'Cash' && (
                    <>
                      <Banknote className="h-5 w-5 text-white" />
                      <span>Cash Tendered</span>
                    </>
                  )}
                  {paymentMethod === 'Salary Deduction' && (
                    <>
                      <CreditCard className="h-5 w-5 text-white" />
                      <span>Salary Deduction</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {paymentMethod === 'Salary Deduction' ? 'Auto-settled via Coop on payroll disbursement.' : 'Paid at canteen cash register.'}
                </p>
              </div>

            </div>

          </div>

          {/* Grand Total Display */}
          <div className="rounded-3xl bg-white text-slate-950 p-6 sm:p-7 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
              <span>Amount Due / Total</span>
              <span>{totalItemsCount} Total Items</span>
            </div>

            <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-slate-950 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-sans text-slate-500">PHP</span>
              <span>₱{Number(grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-slate-900" />
                NKB Official Enterprise Receipt
              </span>
              <span>VAT-Exempt Company Welfare</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer Info */}
      <footer className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          NKB Manufacturing Corp. · Canteen POS Terminal (Canteen Admin: Nannette MANUEL · NKB052026-0024)
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>POS Barcode Sync v2.0</span>
          <span>·</span>
          <span>Press F11 for Full Screen</span>
        </div>
      </footer>

    </div>
  );
}
