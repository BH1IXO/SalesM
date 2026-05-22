const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

router.use(requireAdmin);

router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, name, role, avatar, team, phone, email, active, must_change_password, created_at FROM users ORDER BY id'
  ).all();
  res.json(users);
});

router.post('/users', (req, res) => {
  const { username, password, name, role, team } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, name, role, team, must_change_password) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(username, hash, name, role || 'sales', team || '');

  const user = db.prepare(
    'SELECT id, username, name, role, avatar, team, phone, email, active, must_change_password, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);
  logAction(req, '创建用户', username, `角色: ${role || 'sales'}`);
  res.status(201).json(user);
});

router.put('/users/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '用户不存在' });

  const fields = ['name', 'role', 'team', 'phone', 'email', 'active', 'avatar'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare(
    'SELECT id, username, name, role, avatar, team, phone, email, active, must_change_password, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  logAction(req, '更新用户', user.username);
  res.json(user);
});

router.post('/users/:id/reset-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入新密码' });
  if (password.length < 6) return res.status(400).json({ error: '密码长度不能少于6位' });

  const db = getDb();
  const existing = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '用户不存在' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, req.params.id);
  logAction(req, '重置密码', existing.username);
  res.json({ success: true });
});

router.delete('/users/:id', (req, res) => {
  const db = getDb();
  const targetId = parseInt(req.params.id);

  if (targetId === req.user.id) {
    return res.status(400).json({ error: '不能删除自己的账号' });
  }

  const target = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: '用户不存在' });

  if (target.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND active = 1").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: '不能删除最后一个管理员' });
    }
  }

  const customerCount = db.prepare('SELECT COUNT(*) as c FROM customers WHERE assigned_to = ?').get(targetId).c;
  const { transferTo } = req.body || {};

  if (customerCount > 0 && !transferTo) {
    return res.status(400).json({ error: '该用户名下有客户，请选择转移目标', customerCount });
  }

  if (transferTo) {
    const transferUser = db.prepare('SELECT id FROM users WHERE id = ? AND id != ?').get(transferTo, targetId);
    if (!transferUser) return res.status(400).json({ error: '转移目标用户不存在' });
  }

  const deleteTransaction = db.transaction(() => {
    if (customerCount > 0 && transferTo) {
      db.prepare('UPDATE customers SET assigned_to = ? WHERE assigned_to = ?').run(transferTo, targetId);
    }
    db.prepare('DELETE FROM customer_collaborators WHERE user_id = ?').run(targetId);
    db.prepare('UPDATE activities SET created_by = NULL WHERE created_by = ?').run(targetId);
    db.prepare('UPDATE expenses SET created_by = NULL WHERE created_by = ?').run(targetId);
    db.prepare('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = ?').run(targetId);
    db.prepare('UPDATE document_categories SET created_by = NULL WHERE created_by = ?').run(targetId);
    db.prepare('UPDATE operation_logs SET user_id = NULL WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  });

  deleteTransaction();
  logAction(req, '删除用户', target.username, `姓名: ${target.name}, 客户转移: ${customerCount > 0 ? transferTo : '无'}`);
  res.json({ success: true });
});

router.get('/logs', (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as c FROM operation_logs').get().c;
  const logs = db.prepare('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({ logs, total, page, limit });
});

module.exports = router;
