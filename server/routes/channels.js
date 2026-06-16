const express = require('express');
const { getDb } = require('../db');
const { logAction } = require('../utils/logger');
const { todayCN } = require('../utils/time');

const router = express.Router();

function requireExecutive(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'executive') {
    return res.status(403).json({ error: '需要管理层权限' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// ── Channel CRUD ──

router.get('/', (req, res) => {
  const db = getDb();
  const channels = db.prepare(`
    SELECT ch.*,
      COALESCE((SELECT COUNT(*) FROM customers c WHERE c.channel_id = ch.id), 0) as customer_count,
      COALESCE((SELECT SUM(cc.amount) FROM channel_commissions cc WHERE cc.channel_id = ch.id), 0) as total_commission
    FROM channels ch
    ORDER BY ch.updated_at DESC
  `).all();
  res.json(channels);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const channel = db.prepare(`
    SELECT ch.*,
      COALESCE((SELECT COUNT(*) FROM customers c WHERE c.channel_id = ch.id), 0) as customer_count,
      COALESCE((SELECT SUM(cc.amount) FROM channel_commissions cc WHERE cc.channel_id = ch.id), 0) as total_commission
    FROM channels ch WHERE ch.id = ?
  `).get(req.params.id);
  if (!channel) return res.status(404).json({ error: '渠道不存在' });
  res.json(channel);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, contact, phone, email, company, commission_rate, notes } = req.body;
  if (!name) return res.status(400).json({ error: '渠道名称不能为空' });

  const now = todayCN();
  const result = db.prepare(`
    INSERT INTO channels (name, contact, phone, email, company, commission_rate, notes, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, contact || '', phone || '', email || '', company || '', Number(commission_rate) || 0, notes || '', req.user.id, now, now);

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(result.lastInsertRowid);
  logAction(req, '创建渠道', channel.name);
  res.status(201).json(channel);
});

router.put('/:id', requireExecutive, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '渠道不存在' });

  const fields = ['name', 'contact', 'phone', 'email', 'company', 'commission_rate', 'status', 'notes'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(f === 'commission_rate' ? (Number(req.body[f]) || 0) : req.body[f]);
    }
  }

  if (updates.length === 0) return res.json(existing);

  updates.push('updated_at = ?');
  params.push(todayCN());
  params.push(req.params.id);

  db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  logAction(req, '编辑渠道', existing.name);
  res.json(channel);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '渠道不存在' });

  const customerCount = db.prepare('SELECT COUNT(*) as cnt FROM customers WHERE channel_id = ?').get(req.params.id).cnt;
  if (customerCount > 0) {
    return res.status(400).json({ error: `该渠道下还有 ${customerCount} 个关联客户，请先解除关联` });
  }

  db.prepare('DELETE FROM channel_commissions WHERE channel_id = ?').run(req.params.id);
  db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);
  logAction(req, '删除渠道', existing.name);
  res.json({ success: true });
});

// ── Channel customers ──

router.get('/:id/customers', requireExecutive, (req, res) => {
  const db = getDb();
  const customers = db.prepare(`
    SELECT c.*, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) as received_amount
    FROM customers c WHERE c.channel_id = ?
    ORDER BY c.updated_at DESC
  `).all(req.params.id);
  res.json(customers);
});

// ── Channel commissions ──

router.get('/:id/commissions', requireExecutive, (req, res) => {
  const db = getDb();
  const commissions = db.prepare(`
    SELECT cc.*, c.name as customer_name, u.name as creator_name
    FROM channel_commissions cc
    LEFT JOIN customers c ON cc.customer_id = c.id
    LEFT JOIN users u ON cc.created_by = u.id
    WHERE cc.channel_id = ?
    ORDER BY cc.created_at DESC
  `).all(req.params.id);
  res.json(commissions);
});

router.post('/:id/commissions', requireExecutive, (req, res) => {
  const db = getDb();
  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) return res.status(404).json({ error: '渠道不存在' });

  const { customer_id, amount, commission_rate, status, payment_date, payment_method, reference_number, notes } = req.body;
  if (!customer_id) return res.status(400).json({ error: '请选择客户' });
  if (!amount || amount <= 0) return res.status(400).json({ error: '金额必须大于0' });

  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND channel_id = ?').get(customer_id, req.params.id);
  if (!customer) return res.status(400).json({ error: '该客户不属于此渠道' });

  const result = db.prepare(`
    INSERT INTO channel_commissions (channel_id, customer_id, amount, commission_rate, status, payment_date, payment_method, reference_number, notes, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, customer_id, amount, Number(commission_rate) || 0, status || 'pending', payment_date || '', payment_method || '', reference_number || '', notes || '', req.user.id, todayCN());

  const commission = db.prepare(`
    SELECT cc.*, c.name as customer_name, u.name as creator_name
    FROM channel_commissions cc
    LEFT JOIN customers c ON cc.customer_id = c.id
    LEFT JOIN users u ON cc.created_by = u.id
    WHERE cc.id = ?
  `).get(result.lastInsertRowid);
  logAction(req, '添加居间费用', channel.name, `客户: ${customer.name}, 金额: ¥${amount}`);
  res.status(201).json(commission);
});

router.delete('/:id/commissions/:commissionId', requireAdmin, (req, res) => {
  const db = getDb();
  const commission = db.prepare('SELECT * FROM channel_commissions WHERE id = ? AND channel_id = ?').get(req.params.commissionId, req.params.id);
  if (!commission) return res.status(404).json({ error: '记录不存在' });

  db.prepare('DELETE FROM channel_commissions WHERE id = ?').run(req.params.commissionId);
  logAction(req, '删除居间费用', `渠道#${req.params.id}`, `金额: ¥${commission.amount}`);
  res.json({ success: true });
});

module.exports = router;
