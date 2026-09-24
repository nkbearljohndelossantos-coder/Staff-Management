import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

/**
 * Reusable Table Row 3-Dot Action Dropdown Menu
 * Integrated with progressive Escape key stack (Priority: 100 - DROPDOWN)
 *
 * @param {Object} props
 * @param {string} props.id Unique identifier for the dropdown
 * @param {Array<{ label: string, icon?: any, onClick: () => void, danger?: boolean, disabled?: boolean, badge?: string }>} props.actions
 * @param {string} [props.align='right'] Dropdown alignment: 'right' | 'left'
 * @param {string} [props.buttonClassName]
 */
export default function TableActionDropdown({
  id,
  actions = [],
  align = 'right',
  buttonClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownId = `dropdown-${id || Math.random().toString(36).substring(2, 9)}`;

  // Progressive Escape dismissal: Closes dropdown FIRST before palette or modals
  useEscapeKey(dropdownId, ESCAPE_PRIORITY.DROPDOWN, isOpen, () => {
    setIsOpen(false);
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);
    };
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* 3-Dot Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="More actions"
        className={
          buttonClassName ||
          `p-1.5 rounded-xl border transition cursor-pointer flex items-center justify-center ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200/80'
          }`
        }
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          className={`absolute z-30 mt-1.5 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150 ${
            align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {actions.map((action, idx) => {
            if (!action) return null;
            const Icon = action.icon;
            const isDanger = Boolean(action.danger);
            const isDisabled = Boolean(action.disabled);

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (typeof action.onClick === 'function') {
                    action.onClick(e);
                  }
                }}
                className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isDanger
                    ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {Icon && (
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isDanger ? 'text-rose-500' : 'text-slate-500'
                      }`}
                    />
                  )}
                  <span className="truncate">{action.label}</span>
                </div>

                {action.badge && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {action.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
