import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  CornerDownLeft,
  Users,
  Briefcase,
  ScanLine,
  Calculator,
  Landmark,
  Utensils,
  Database,
  FileText,
  Network,
  QrCode,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  Package,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { isTabAuthorized } from '../../utils/rolePermissions';

export default function CommandPalette({ isOpen, onClose }) {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    staffList,
    departments,
    positions,
    canteenInventory,
    exportFullSystemBackup,
    openDigitalId,
    isSuperAdmin
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Progressive Escape registration:
  // Tier 1 (Priority 80 - SUGGESTION): If search query is typed and results are active, Escape clears query first.
  // Tier 2 (Priority 60 - COMMAND_PALETTE): If query is already blank, Escape closes the palette itself.
  const hasActiveQuery = Boolean(query && query.trim().length > 0);

  useEscapeKey(
    'command-palette-suggestions',
    ESCAPE_PRIORITY.SUGGESTION,
    isOpen && hasActiveQuery,
    () => {
      setQuery('');
    }
  );

  useEscapeKey(
    'command-palette-modal',
    ESCAPE_PRIORITY.COMMAND_PALETTE,
    isOpen,
    () => {
      onClose();
    }
  );

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Command palette navigation items
  const allNavItems = [
    { id: 'staff', label: 'Staff & IDs Masterlist', icon: Users, category: 'Navigation', shortcut: 'HR' },
    { id: 'positions', label: 'Positions & Departments', icon: Briefcase, category: 'Navigation', shortcut: 'HR' },
    { id: 'attendance', label: 'Barcode Clock-In Kiosk', icon: ScanLine, category: 'Navigation', shortcut: 'HR' },
    { id: 'payroll', label: 'Payroll Engine & 13th Month', icon: Calculator, category: 'Navigation', shortcut: 'Payroll' },
    { id: 'coopLoans', label: 'Coop, Loans & Canteen Deductions', icon: Landmark, category: 'Navigation', shortcut: 'Coop' },
    { id: 'canteenHub', label: 'Canteen POS & Supplies Inventory', icon: Utensils, category: 'Navigation', shortcut: 'Canteen' },
    { id: 'itAdminHub', label: 'IT Admin Universal Records', icon: Database, category: 'Navigation', shortcut: 'IT' },
    { id: 'employeePortal', label: 'My Payslips & Personal ESS', icon: FileText, category: 'Navigation', shortcut: 'ESS' },
    { id: 'conceptMap', label: 'Enterprise Concept Map', icon: Network, category: 'Navigation', shortcut: 'Architecture' }
  ];

  // Quick actions
  const actionItems = [
    {
      id: 'action-digital-id',
      label: 'Open My Digital ID Badge (Barcode & QR)',
      icon: QrCode,
      category: 'Actions',
      perform: () => {
        openDigitalId();
        onClose();
      }
    },
    {
      id: 'action-export-db',
      label: 'Export Full System Database Backup (JSON)',
      icon: Download,
      category: 'Actions',
      perform: () => {
        exportFullSystemBackup();
        onClose();
      }
    }
  ];

  // Filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Authorized Nav Items
    const authorizedNavs = allNavItems
      .filter(item => isTabAuthorized(item.id, currentUser?.role))
      .map(item => ({
        ...item,
        type: 'tab',
        perform: () => {
          setActiveTab(item.id);
          onClose();
        }
      }));

    // 2. Staff matches
    const staffMatches = (staffList || [])
      .filter(s => {
        if (!q) return false;
        const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        return name.includes(q) || (s.employeeId && s.employeeId.toLowerCase().includes(q));
      })
      .slice(0, 5)
      .map(s => {
        const dept = departments.find(d => d.id === s.departmentId);
        const pos = positions.find(p => p.id === s.positionId);
        return {
          id: `staff-${s.id}`,
          label: `${s.firstName} ${s.lastName} (${s.employeeId})`,
          subtitle: `${pos?.title || 'Staff'} • ${dept?.name || 'General'}`,
          icon: Users,
          category: 'Staff Directory',
          perform: () => {
            openDigitalId(s);
            onClose();
          }
        };
      });

    // 3. Canteen inventory matches
    const inventoryMatches = (canteenInventory || [])
      .filter(item => {
        if (!q) return false;
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.barcode && item.barcode.toLowerCase().includes(q)) ||
          (item.brand && item.brand.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map(item => ({
        id: `inv-${item.id}`,
        label: `${item.name} (${item.brand || 'Item'})`,
        subtitle: `₱${Number(item.sellingPrice || 0).toFixed(2)} • Stock: ${item.quantity || 0} ${item.unit || 'pcs'}`,
        icon: Package,
        category: 'Canteen Supplies',
        perform: () => {
          setActiveTab('canteenHub');
          onClose();
        }
      }));

    if (!q) {
      return [...actionItems, ...authorizedNavs];
    }

    const matchedNavs = authorizedNavs.filter(nav =>
      nav.label.toLowerCase().includes(q) || nav.shortcut?.toLowerCase().includes(q)
    );
    const matchedActions = actionItems.filter(act => act.label.toLowerCase().includes(q));

    return [...matchedActions, ...matchedNavs, ...staffMatches, ...inventoryMatches];
  }, [query, allNavItems, actionItems, staffList, departments, positions, canteenInventory, currentUser, setActiveTab, openDigitalId, onClose]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected && typeof selected.perform === 'function') {
        selected.perform();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        
        {/* Command Search Bar Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
            <Command className="h-4 w-4" />
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, tabs, employees, barcodes, or supplies..."
              className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Clear Search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200/80 text-slate-600 text-[10px] font-mono font-bold">
            <span>ESC</span>
          </div>
        </div>

        {/* Results / Suggestions List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1" ref={listRef}>
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No commands or records found matching "{query}".
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => item.perform && item.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition ${
                        isSelected
                          ? 'bg-white/10 text-cyan-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {item.label}
                      </div>
                      {item.subtitle && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.category}
                    </span>

                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Keyboard Hints Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">ESC</kbd>
            <span>Progressive close</span>
          </div>
        </div>

      </div>
    </div>
  );
}
