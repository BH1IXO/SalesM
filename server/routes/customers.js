const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb, DATA_DIR } = require('../db');
const { logAction } = require('../utils/logger');
const { nowCN, todayCN } = require('../utils/time');

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
  const { name, industry, size, contact, contact_title, phone, email, leader_name, leader_title, leader_phone, status, amount_onetime, amount_monthly, amount_months, expected_close_date, priority, assigned_to, budget, pain_points, solution, decision_chain } = req.body;

  if (!name) return res.status(400).json({ error: '客户名称不能为空' });

  const onetime = Number(amount_onetime) || 0;
  const monthly = Number(amount_monthly) || 0;
  const months = Number(amount_months) || 1;
  const amount = onetime + monthly * months;

  const now = todayCN();  const result = db.prepare(`
    INSERT INTO customers (name, industry, size, contact, contact_title, phone, email, leader_name, leader_title, leader_phone, status, amount, amount_onetime, amount_monthly, amount_months, expected_close_date, priority, assigned_to, budget, pain_points, solution, decision_chain, last_follow_up, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, industry || '', size || '', contact || '', contact_title || '', phone || '', email || '', leader_name || '', leader_title || '', leader_phone || '', status || 'leads', amount, onetime, monthly, months, expected_close_date || '', priority || 'medium', assigned_to || req.user.id, budget || 0, pain_points || '', solution || '', decision_chain || '', now, now, now);

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  logAction(req, '创建客户', customer.name);
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const fields = ['name', 'industry', 'size', 'contact', 'contact_title', 'phone', 'email', 'leader_name', 'leader_title', 'leader_phone', 'status', 'amount_onetime', 'amount_monthly', 'amount_months', 'expected_close_date', 'priority', 'assigned_to', 'budget', 'pain_points', 'solution', 'decision_chain', 'last_follow_up', 'loss_reason', 'loss_competitor'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }

  if (req.body.amount_onetime !== undefined || req.body.amount_monthly !== undefined || req.body.amount_months !== undefined) {
    const onetime = Number(req.body.amount_onetime ?? existing.amount_onetime) || 0;
    const monthly = Number(req.body.amount_monthly ?? existing.amount_monthly) || 0;
    const months = Number(req.body.amount_months ?? existing.amount_months) || 1;
    updates.push('amount = ?');
    params.push(onetime + monthly * months);
  }

  if (updates.length === 0) return res.json(existing);

  updates.push('updated_at = ?');
  params.push(todayCN());
  params.push(req.params.id);

  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  logAction(req, '编辑客户', existing.name);
  res.json(customer);
});

router.patch('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: '状态不能为空' });

  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const now = todayCN();  db.prepare('UPDATE customers SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);

  const STAGE_NAMES = { leads: '线索', contact: '初步接触', needs: '需求确认', proposal: '方案提交', negotiation: '打单谈判', contract: '合同签署', won: '赢单', lost: '输单' };
  db.prepare('INSERT INTO activities (customer_id, type, description, date, created_by) VALUES (?, ?, ?, ?, ?)').run(
    req.params.id, 'call', `状态变更为：${STAGE_NAMES[status] || status}`, now, req.user.id
  );

  logAction(req, '客户状态变更', existing.name, `→ ${STAGE_NAMES[status] || status}`);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '客户不存在' });

  const uploadDir = path.join(DATA_DIR, 'uploads', String(req.params.id));
  try { fs.rmSync(uploadDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  logAction(req, '删除客户', existing.name);
  res.json({ success: true });
});

// ── Collaborators ──

router.get('/:customerId/collaborators', (req, res) => {
  const db = getDb();
  const collaborators = db.prepare(`
    SELECT cc.id, cc.user_id, cc.created_at, u.username, u.name, u.avatar, u.role, u.team
    FROM customer_collaborators cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.customer_id = ?
    ORDER BY cc.created_at
  `).all(req.params.customerId);
  res.json(collaborators);
});

router.post('/:customerId/collaborators', (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: '请选择团队成员' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM customer_collaborators WHERE customer_id = ? AND user_id = ?')
    .get(req.params.customerId, user_id);
  if (existing) return res.status(400).json({ error: '该成员已是协作者' });

  db.prepare('INSERT INTO customer_collaborators (customer_id, user_id) VALUES (?, ?)').run(req.params.customerId, user_id);

  const collaborator = db.prepare(`
    SELECT cc.id, cc.user_id, cc.created_at, u.username, u.name, u.avatar, u.role, u.team
    FROM customer_collaborators cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.customer_id = ? AND cc.user_id = ?
  `).get(req.params.customerId, user_id);
  logAction(req, '添加协作者', `客户#${req.params.customerId}`, collaborator?.name || '');
  res.status(201).json(collaborator);
});

router.delete('/:customerId/collaborators/:userId', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM customer_collaborators WHERE customer_id = ? AND user_id = ?')
    .get(req.params.customerId, req.params.userId);
  if (!existing) return res.status(404).json({ error: '协作者不存在' });

  db.prepare('DELETE FROM customer_collaborators WHERE customer_id = ? AND user_id = ?').run(req.params.customerId, req.params.userId);
  res.json({ success: true });
});

module.exports = router;
