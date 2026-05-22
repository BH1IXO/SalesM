const express = require('express');
const { getDb } = require('../db');
const { logAction } = require('../utils/logger');
const { todayCN } = require('../utils/time');

const router = express.Router();

router.get('/:customerId/expenses', (req, res) => {
  const db = getDb();
  const expenses = db.prepare(
    'SELECT e.*, u.name as creator_name FROM expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.customer_id = ? ORDER BY e.date DESC'
  ).all(req.params.customerId);
  res.json(expenses);
});

router.post('/:customerId/expenses', (req, res) => {
  const db = getDb();
  const { activity_id, type, amount, description, date } = req.body;

  if (!type || amount === undefined) return res.status(400).json({ error: '费用类型和金额不能为空' });

  const now = date || todayCN();
  const result = db.prepare(
    'INSERT INTO expenses (customer_id, activity_id, type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.customerId, activity_id || null, type, amount, description || '', now, req.user.id);

  const expense = db.prepare('SELECT e.*, u.name as creator_name FROM expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?').get(result.lastInsertRowid);
  logAction(req, '添加费用', `客户#${req.params.customerId}`, `${type}: ¥${amount}`);
  res.status(201).json(expense);
});

module.exports = router;
