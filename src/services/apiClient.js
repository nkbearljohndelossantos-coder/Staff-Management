// ==============================================================================
// NKB MANUFACTURING -- PRODUCTION REST API CLIENT
// Native fetch with Bearer token injection, failure discrimination, and event dispatch
// ==============================================================================

const TOKEN_KEY = 'nkb_auth_token';
const EXPIRY_KEY = 'nkb_auth_expires_at';

export const getStoredToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(EXPIRY_KEY);
    if (!token) return null;
    if (expiresAt && Date.now() > Number(expiresAt)) {
      clearStoredToken();
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
};

export const setStoredToken = (token, expiresInMs = 24 * 60 * 60 * 1000) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresInMs));
  } catch (e) {
    console.warn('Failed to persist auth token:', e);
  }
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch (e) {}
};

/**
 * Structured API Error class distinguishing network, auth, and server failures
 */
export class ApiError extends Error {
  constructor(message, status, type = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type; // 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'VALIDATION_ERROR'
    this.details = details;
  }
}

/**
 * Core API Request Wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine base URL: uses current origin in production
  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr) {
    throw new ApiError(
      'Server unreachable. Please verify network connectivity or production VPS status.',
      0,
      'NETWORK_ERROR',
      networkErr
    );
  }

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ApiError(
        'Invalid JSON response from server.',
        response.status,
        'SERVER_ERROR'
      );
    }
  } else {
    // If text/html was returned (e.g. Hostinger SPA fallback when /api is not routed)
    const rawText = await response.text();
    throw new ApiError(
      `Endpoint returned unexpected non-JSON response (${response.status}). Expected backend REST API.`,
      response.status,
      'SERVER_ERROR',
      rawText.slice(0, 200)
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (response.status === 401 && token) {
        clearStoredToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nkb_auth_session_expired'));
        }
      }
      throw new ApiError(
        data.error || 'Authentication failed or access denied.',
        response.status,
        'AUTH_ERROR',
        data
      );
    }

    throw new ApiError(
      data.error || `Request failed with status ${response.status}`,
      response.status,
      response.status >= 500 ? 'SERVER_ERROR' : 'VALIDATION_ERROR',
      data
    );
  }

  return data;
}

// ==============================================================================
// Typed API Endpoints
// ==============================================================================

export const api = {
  // Authentication
  login: (username, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  loginBarcode: (barcode, pin) =>
    apiRequest('/api/auth/barcode', {
      method: 'POST',
      body: JSON.stringify({ barcode, pin })
    }),

  getMe: () => apiRequest('/api/auth/me'),

  // Staff Masterlist & Structure
  getStaff: () => apiRequest('/api/staff'),
  getDepartments: () => apiRequest('/api/staff/departments'),
  getPositions: () => apiRequest('/api/staff/positions'),
  createStaff: (staffData) =>
    apiRequest('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    }),
  updateStaff: (id, staffData) =>
    apiRequest(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData)
    }),
  deleteStaff: (id) =>
    apiRequest(`/api/staff/${id}`, {
      method: 'DELETE'
    }),
  batchSyncStaff: (staffList) =>
    apiRequest('/api/staff/batch-sync', {
      method: 'POST',
      body: JSON.stringify({ staff: staffList })
    }),

  // Canteen Inventory & Transactions
  getInventory: () => apiRequest('/api/canteen/inventory'),
  getReceipts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/canteen/receipts${q ? `?${q}` : ''}`);
  },
  createReceipt: (receiptData) =>
    apiRequest('/api/canteen/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData)
    }),
  getDeductions: () => apiRequest('/api/canteen/deductions'),
  getBalances: () => apiRequest('/api/canteen/balances'),
  getSalesInvoices: () => apiRequest('/api/canteen/invoices'),
  createSalesInvoice: (invoiceData) =>
    apiRequest('/api/canteen/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    }),
  getActiveDrawer: () => apiRequest('/api/canteen/drawer/active'),
  getDrawerTransactions: () => apiRequest('/api/canteen/drawer/transactions'),
  openDrawer: (cashierId, cashierName, openingCash) =>
    apiRequest('/api/canteen/drawer/open', {
      method: 'POST',
      body: JSON.stringify({
        cashier_id: cashierId,
        cashier_name: cashierName,
        opening_cash: openingCash
      })
    }),
  closeDrawer: (id, closingCash) =>
    apiRequest(`/api/canteen/drawer/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ closing_cash: closingCash })
    }),

  // System Health
  getHealth: () => apiRequest('/api/health')
};
