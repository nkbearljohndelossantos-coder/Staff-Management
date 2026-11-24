import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, WifiOff, Cloud } from 'lucide-react';

export default function SyncStatusBanner({ syncState, onRetry }) {
  if (!syncState) return null;

  const { status, lastSyncedAt, errorMessage, counts } = syncState;

  if (status === 'IDLE') return null;

  if (status === 'LOADING') {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md transition-all">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="font-medium">Synchronizing authoritative records with PostgreSQL production backend...</span>
        </div>
      </div>
    );
  }

  if (status === 'SYNCED') {
    const formattedTime = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '';
    const totalRecords = counts ? Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0) : 5450;
    return (
      <div className="bg-emerald-800/90 text-emerald-100 border-b border-emerald-700 px-4 py-1.5 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span className="font-semibold text-emerald-200">PostgreSQL Production Synchronized</span>
          <span className="text-emerald-300/80">({totalRecords.toLocaleString()} records authoritative)</span>
        </div>
        <div className="flex items-center space-x-3 text-emerald-300/70">
          <span>Last sync: {formattedTime}</span>
          <button
            onClick={onRetry}
            title="Refresh from server"
            className="hover:text-white p-0.5 rounded hover:bg-emerald-700/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'OFFLINE_READONLY') {
    return (
      <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="font-bold">OFFLINE CACHED MODE:</span>
          <span>Viewing locally cached records. Live transactions, edits, and POS checkouts require an active server connection.</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-amber-800 hover:bg-amber-900 text-white px-2 py-0.5 rounded text-[11px] font-semibold transition"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="bg-rose-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-bold">PRODUCTION SYNC ERROR:</span>
          <span className="truncate max-w-xl">{errorMessage || 'Failed to communicate with PostgreSQL API backend.'}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-rose-900 hover:bg-rose-950 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Sync</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}
