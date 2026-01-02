/**
 * Simple in-memory rate limiter per enterpriseId.
 * For production, replace with Redis or API Gateway limiters.
 */
const windows = new Map();

export function rateLimit(options = {}) {
  const {
    requestsPerMinute = 60,
    burstCapacity = 10,
    penaltyBoxDurationMs = 300_000
  } = options;

  const windowMs = 60_000;

  return function rateLimitMiddleware(req, res, next) {
    const enterpriseId = (req.user?.enterpriseId || req.body?.enterpriseId || '').toString();
    if (!enterpriseId) return next(); // do not block unidentified; upstream auth should handle

    const now = Date.now();
    const record = windows.get(enterpriseId) || { count: 0, windowStart: now, blockedUntil: 0 };

    if (record.blockedUntil > now) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please retry later.',
          actionable: 'Wait a few minutes or contact your admin to increase limits.',
          retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000)
        }
      });
    }

    // reset window
    if (now - record.windowStart >= windowMs) {
      record.count = 0;
      record.windowStart = now;
    }

    record.count += 1;
    windows.set(enterpriseId, record);

    if (record.count > requestsPerMinute + burstCapacity) {
      record.blockedUntil = now + penaltyBoxDurationMs;
      windows.set(enterpriseId, record);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please retry later.',
          actionable: 'Wait a few minutes or contact your admin to increase limits.',
          retryAfterSeconds: Math.ceil(penaltyBoxDurationMs / 1000)
        }
      });
    }

    return next();
  };
}

