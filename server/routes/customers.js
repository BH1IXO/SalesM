const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, assigned_to, priority, search } = req.query;

  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (assigned_to) { sql += ' AND assigned_to = ?'; params.push(assigned_to); }
  if (priority) { sql += ' AND priority = ?'; params.push(priority); }
  if (search) {
    sql += ' AND (name LIKE ? OR contact LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY updated_at DESC';
  const customers = db.prepare(sql).all(...params);
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: '客户不存在' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, industry, size, contact, phone, email, status, amount, expected_close_date, priority, assigned_to, budget, pain_points, solution, decision_chain } = req.body;

  if (!name) return res.status(400).json({ error: '客户名称不能为空' });

  const now = new Date().toISOString().split('T')[0];
  const result = db.prepare(`
    INSERT INTO customers (name, industry, size, contact, phone, email, status, amount, expected_close_date, priority, assigned_to, budget, pain_points, solution, decision_chain, last_follow_up, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, industry || '', size || '', contact || '', phone || '', email || '', status || 'leads', amount || 0, expected_close_date || '', priority || 'medium', assigned_to || req.user.id, budget || 0, pain_points || '', solution || '', decision_chain || '', now, now, now);

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const fields = ['name', 'industry', 'size', 'contact', 'phone', 'email', 'status', 'amount', 'expected_close_date', 'priority', 'assigned_to', 'budget', 'pain_points', 'solution', 'decision_chain', 'last_follow_up', 'loss_reason', 'loss_competitor'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }

  if (updates.length === 0) return res.json(existing);

  updates.push('updated_at = ?');
  params.push(new Date().toISOString().split('T')[0]);
  params.push(req.params.id);

  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

router.patch('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: '状态不能为空' });

  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const now = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE customers SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);

  const STAGE_NAMES = { leads: '线索', contact: '初步接触', needs: '需求确认', proposal: '方案提交', negotiation: '打单谈判', contract: '合同签署', won: '赢单', lost: '输单' };
  db.prepare('INSERT INTO activities (customer_id, type, description, date, created_by) VALUES (?, ?, ?, ?, ?)').run(
    req.params.id, 'call', `状态变更为：${STAGE_NAMES[status] || status}`, now, req.user.id
  );

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const uploadDir = path.join(__dirname, '..', 'uploads', String(req.params.id));
  try { fs.rmSync(uploadDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
