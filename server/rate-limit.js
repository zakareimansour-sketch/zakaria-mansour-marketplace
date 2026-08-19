const stores = new Map();

export function rateLimit({ windowMs, max, keyPrefix = 'global', message = 'طلبات كثيرة. حاول لاحقًا.' }) {
  return (req, res, next) => {
    const identity = req.auth?.sub || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();
    let entry = stores.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    stores.set(key, entry);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'RATE_LIMITED', message });
    }
    if (stores.size > 10000) for (const [storedKey, value] of stores) if (value.resetAt <= now) stores.delete(storedKey);
    next();
  };
}

export function clearRateLimitsForTests() { stores.clear(); }
