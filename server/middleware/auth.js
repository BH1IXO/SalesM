const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'salesm-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
