const express = require('express');
const { getDb } = require('../db');
const { logAction } = require('../utils/logger');
const { nowCN, todayCN } = require('../utils/time');

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

  const now = date || todayCN();
  const result = db.prepare(
    'INSERT INTO activities (customer_id, type, description, date, created_by, next_follow_up) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.customerId, type, description || '', now, req.user.id, next_follow_up || null);

  db.prepare('UPDATE customers SET last_follow_up = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.customerId);

  const activity = db.prepare('SELECT a.*, u.name as creator_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?').get(result.lastInsertRowid);
  logAction(req, '添加跟进记录', `客户#${req.params.customerId}`, `${type}: ${description || ''}`);

  try {
    const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(req.params.customerId);
    const actorName = req.user.name || req.user.username;
    const customerName = customer?.name || '';
    const ACTIVITY_LABELS = { call: '电话/微信沟通', visit: '上门拜访', email: '邮件往来', meeting: '会议', demo: '产品演示', other: '其他' };
    const typeLabel = ACTIVITY_LABELS[type] || type;
    const content = `${actorName} 对客户 ${customerName} 添加了${typeLabel}记录`;

    const recipients = db.prepare('SELECT id FROM users WHERE active = 1 AND id != ?').all(req.user.id);
    const msgNow = nowCN();
    const insertMsg = db.prepare(
      'INSERT INTO messages (user_id, activity_id, customer_id, customer_name, actor_name, activity_type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const r of recipients) {
      insertMsg.run(r.id, result.lastInsertRowid, parseInt(req.params.customerId), customerName, actorName, type, content, msgNow);
    }
  } catch (e) {
    console.error('[Messages] Failed to create notifications:', e.message);
  }

  res.status(201).json(activity);
});

module.exports = router;
