import { useEffect, useRef } from 'react';

/**
 * Progressive Escape Key Priority Tiers
 * Higher priority items are dismissed FIRST on Escape keypress.
 */
export const ESCAPE_PRIORITY = {
  DROPDOWN: 100,       // Table 3-dot action menus, context dropdowns, popup menus
  SUGGESTION: 80,      // Autocomplete search suggestions, typeahead popovers
  COMMAND_PALETTE: 60, // Global Command Palette (Ctrl+K)
  MODAL: 40,           // Modals, dialogs, confirmation dialogs, identity cards
  FLYOUT: 20,          // Mobile slide-over navigation drawers, cart flyouts
  DOCKED_TAB: 10       // Docked mini-tabs, floating panels, docked preview sheets
};

class EscapeStackManager {
  constructor() {
    this.stack = [];
    this.isListening = false;
    this.initListener();
  }

  initListener() {
    if (typeof window === 'undefined' || this.isListening) return;

    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          const handled = this.handleEscape(event);
          if (handled) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        }
      },
      { capture: true }
    );

    this.isListening = true;
  }

  /**
   * Register a dismissible layer with priority
   */
  register({ id, priority = ESCAPE_PRIORITY.MODAL, onClose }) {
    if (!id || typeof onClose !== 'function') return () => {};

    const entry = {
      id,
      priority,
      onClose,
      timestamp: Date.now()
    };

    // Remove existing if re-registering same id
    this.stack = this.stack.filter((item) => item.id !== id);
    this.stack.push(entry);

    return () => {
      this.unregister(id);
    };
  }

  /**
   * Unregister an entry by ID
   */
  unregister(id) {
    this.stack = this.stack.filter((item) => item.id !== id);
  }

  /**
   * Progressive LIFO Dismissal:
   * 1. Sort by Priority descending (e.g. Dropdowns 100 > Suggestions 80 > Palette 60 > Modals 40 > Flyouts 20 > Docked 10)
   * 2. If priorities are equal, sort by Timestamp descending (Last In, First Out)
   * 3. Invoke ONLY the top layer's onClose callback.
   */
  handleEscape() {
    if (this.stack.length === 0) return false;

    // Sort: highest priority first; if tied, newest first
    const sorted = [...this.stack].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp - a.timestamp;
    });

    const topItem = sorted[0];
    if (topItem && typeof topItem.onClose === 'function') {
      // Unregister before calling to prevent double-firing
      this.unregister(topItem.id);
      try {
        topItem.onClose();
        return true;
      } catch (err) {
        console.warn(`Error dismissing layer ${topItem.id}:`, err);
        return true;
      }
    }

    return false;
  }

  /**
   * Inspect current active stack for debugging
   */
  getActiveStack() {
    return [...this.stack];
  }
}

export const escapeStackManager = new EscapeStackManager();

/**
 * React hook to automatically bind a component's open state to the Progressive Escape Stack
 */
export function useEscapeKey(id, priority, isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof onClose !== 'function') {
      escapeStackManager.unregister(id);
      return;
    }

    const unregister = escapeStackManager.register({
      id,
      priority,
      onClose: () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    });

    return () => {
      unregister();
    };
  }, [id, priority, isOpen]);
}
