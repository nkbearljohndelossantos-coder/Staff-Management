// ==============================================================================
// NKB MANUFACTURING -- IN-MEMORY SLIDING WINDOW RATE LIMITER
// Zero external dependencies; safe for standalone Node.js Express environments
// ==============================================================================

const requestBuckets = new Map();

// Periodic sweep to prevent memory leaks from inactive IPs
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestBuckets.entries()) {
    if (now - record.resetTime > 60000) {
      requestBuckets.delete(key);
    }
  }
}, 60000).unref();

/**
 * Creates an Express rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs Window in milliseconds (e.g. 60000 for 1 min)
 * @param {number} options.maxRequests Maximum requests allowed per window
 * @param {string} options.message Error message returned when limit exceeded
 */
export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 5;
  const message = options.message || 'Too many requests. Please wait before trying again.';

  return (req, res, next) => {
    // Extract client IP address securely
    const clientIp = (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown-client'
    );

    const bucketKey = `${req.baseUrl || ''}${req.path || ''}:${clientIp}`;
    const now = Date.now();

    let record = requestBuckets.get(bucketKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      requestBuckets.set(bucketKey, record);
    } else {
      record.count += 1;
    }

    // Set standard rate limit headers
    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds
      });
    }

    next();
  };
};

export const barcodeRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 5,   // max 5 barcode attempts per minute per IP
  message: 'Too many barcode login attempts. Please wait 1 minute before trying again.'
});
