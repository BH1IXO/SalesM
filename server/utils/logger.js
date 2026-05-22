const { getDb } = require('../db');

function logAction(req, action, target, detail) {
  try {
    const db = getDb();
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.name || req.user.username) : 'unknown';
    db.prepare('INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, username, action, target || '', detail || '', req.ip || '');
  } catch (e) {
    console.error('[Log] Failed to write operation log:', e.message);
  }
}

module.exports = { logAction };
