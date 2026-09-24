/**
 * Offline Queue & Auto-Sync Manager for NKB Portal
 * Ensures factory kiosks and canteen registers continue working without internet interruptions.
 */

const OFFLINE_QUEUE_KEY = 'nkb_offline_queue';

export function getOfflineQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(action) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  const entry = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...action
  };
  queue.push(entry);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function removeOfflineAction(id) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue().filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Hook or listener for network changes
 */
export function initOfflineSyncListener(onSync) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    const queue = getOfflineQueue();
    if (queue.length > 0 && typeof onSync === 'function') {
      onSync(queue);
    }
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
