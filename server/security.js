import jwt from 'jsonwebtoken';

export function createSecurity(jwtSecret) {
  function sign(user) {
    return jwt.sign({ sub: String(user.id), role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d', issuer: 'zakaria-mansour-marketplace' });
  }

  function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = req.cookies?.zm_session || (header.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'يجب تسجيل الدخول أولًا.' });
    try {
      req.auth = jwt.verify(token, jwtSecret, { issuer: 'zakaria-mansour-marketplace' });
      next();
    } catch {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'جلسة الدخول غير صالحة أو انتهت.' });
    }
  }

  const allow = (...roles) => (req, res, next) => {
    if (!roles.includes(req.auth?.role)) return res.status(403).json({ error: 'FORBIDDEN', message: 'ليس لديك صلاحية لهذا الإجراء.' });
    next();
  };

  function signDownload({ grantId, userId, fileId }) {
    return jwt.sign({ sub: String(userId), grantId, fileId, purpose: 'digital-download' }, jwtSecret, { expiresIn: '5m', issuer: 'zakaria-mansour-marketplace', audience: 'digital-download' });
  }

  function verifyDownload(token) {
    return jwt.verify(token, jwtSecret, { issuer: 'zakaria-mansour-marketplace', audience: 'digital-download' });
  }

  return { sign, authenticate, allow, signDownload, verifyDownload };
}
