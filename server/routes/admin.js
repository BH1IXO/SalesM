const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

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
  res.json(user);
});

router.post('/users/:id/reset-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入新密码' });
  if (password.length < 6) return res.status(400).json({ error: '密码长度不能少于6位' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '用户不存在' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, req.params.id);
  res.json({ success: true });
});

module.exports = router;
