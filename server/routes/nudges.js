const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { nowCN } = require('../utils/time');

router.get('/', (req, res) => {
  const db = getDb();
  const nudges = db.prepare(
    'SELECT id, customer_id, nudged_user_id, created_by, created_at FROM nudges WHERE is_active = 1'
  ).all();
  res.json(nudges);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { customer_id } = req.body;

  const customer = db.prepare('SELECT id, name, assigned_to FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ error: '客户不存在' });
  if (!customer.assigned_to) return res.status(400).json({ error: '该客户暂无负责人' });

  const existing = db.prepare(
    'SELECT id FROM nudges WHERE customer_id = ? AND is_active = 1'
  ).get(customer_id);
  if (existing) return res.json({ message: '已催促', nudge_id: existing.id });

  const now = nowCN();
  const result = db.prepare(
    'INSERT INTO nudges (customer_id, nudged_user_id, created_by, created_at) VALUES (?, ?, ?, ?)'
  ).run(customer_id, customer.assigned_to, req.user.id, now);

  const actorName = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id)?.name || '';
  db.prepare(
    'INSERT INTO messages (user_id, customer_id, customer_name, actor_name, activity_type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(customer.assigned_to, customer_id, customer.name, actorName, 'nudge', `请尽快跟进客户「${customer.name}」`, now);

  res.json({ message: '催促已发送', nudge_id: result.lastInsertRowid });
});

module.exports = router;
