const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/:customerId/activities', (req, res) => {
  const db = getDb();
  const activities = db.prepare(
    'SELECT a.*, u.name as creator_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.customer_id = ? ORDER BY a.date DESC'
  ).all(req.params.customerId);
  res.json(activities);
});

router.post('/:customerId/activities', (req, res) => {
  const db = getDb();
  const { type, description, date, next_follow_up } = req.body;

  if (!type) return res.status(400).json({ error: '活动类型不能为空' });

  const now = date || new Date().toISOString().split('T')[0];
  const result = db.prepare(
    'INSERT INTO activities (customer_id, type, description, date, created_by, next_follow_up) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.customerId, type, description || '', now, req.user.id, next_follow_up || null);

  db.prepare('UPDATE customers SET last_follow_up = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.customerId);

  const activity = db.prepare('SELECT a.*, u.name as creator_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?').get(result.lastInsertRowid);
  res.status(201).json(activity);
});

module.exports = router;
