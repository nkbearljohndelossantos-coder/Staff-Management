import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function NotificationBell() {
  const {
    inAppNotifications = [],
    markNotificationAsRead,
    clearAllNotifications
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = inAppNotifications.filter(n => !n.read).length;

  // Progressive Escape dismissal
  useEscapeKey('notification-bell-dropdown', ESCAPE_PRIORITY.POPUP, isOpen, () => setIsOpen(false));

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'danger':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative h-8 w-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer shadow-sm"
        title="Notifications & System Alerts"
      >
        <Bell className="h-4 w-4 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {inAppNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications && clearAllNotifications()}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {inAppNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No notifications yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  System alerts, approval updates, and shift logs will appear here.
                </p>
              </div>
            ) : (
              inAppNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationAsRead && markNotificationAsRead(notif.id)}
                  className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                    notif.read
                      ? 'bg-white dark:bg-slate-900 opacity-75 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-medium'
                  }`}
                >
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs ${notif.read ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-black text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {!notif.read && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        <span>Click to mark read</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Auto-synced with biometric, payroll &amp; HR approval workflows
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
