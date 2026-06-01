const express = require('express');
const { getDb } = require('../db');
const { logAction } = require('../utils/logger');
const { todayCN } = require('../utils/time');

const router = express.Router();

router.get('/:customerId/payments', (req, res) => {
  const db = getDb();
  const payments = db.prepare(
    'SELECT p.*, u.name as creator_name FROM payments p LEFT JOIN users u ON p.created_by = u.id WHERE p.customer_id = ? ORDER BY p.payment_date DESC'
  ).all(req.params.customerId);
  res.json(payments);
});

router.post('/:customerId/payments', (req, res) => {
  const db = getDb();
  const { amount, payment_date, payment_method, reference_number, notes } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: '回款金额必须大于0' });

  const date = payment_date || todayCN();
  const result = db.prepare(
    'INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.customerId, amount, date, payment_method || '', reference_number || '', notes || '', req.user.id);

  const payment = db.prepare('SELECT p.*, u.name as creator_name FROM payments p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = ?').get(result.lastInsertRowid);
  logAction(req, '添加回款', `客户#${req.params.customerId}`, `¥${amount}`);
  res.status(201).json(payment);
});

router.delete('/:customerId/payments/:id', (req, res) => {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND customer_id = ?').get(req.params.id, req.params.customerId);
  if (!payment) return res.status(404).json({ error: '回款记录不存在' });

  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  logAction(req, '删除回款', `客户#${req.params.customerId}`, `¥${payment.amount}`);
  res.json({ success: true });
});

module.exports = router;
