const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const messages = db.prepare(
    'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  const unreadCount = db.prepare(
    'SELECT COUNT(*) as c FROM messages WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id).c;
  res.json({ messages, unreadCount });
});

router.patch('/:id/read', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.patch('/read-all', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
