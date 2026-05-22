const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');
const { nowCN } = require('../utils/time');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

router.post('/', (req, res) => {
  const { username, name } = req.body;
  if (!username || !name) {
    return res.status(400).json({ error: '用户名和姓名不能为空' });
  }

  const db = getDb();
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '该用户名已被使用' });
  }

  const existingApp = db.prepare("SELECT id FROM account_applications WHERE username = ? AND status = 'pending'").get(username);
  if (existingApp) {
    return res.status(400).json({ error: '该用户名已有待审批的申请' });
  }

  db.prepare('INSERT INTO account_applications (username, name, created_at) VALUES (?, ?, ?)').run(username, name, nowCN());
  res.status(201).json({ success: true, message: '申请已提交，请等待管理员审批' });
});

router.get('/', authMiddleware, requireAdmin, (req, res) => {
  const db = getDb();
  const applications = db.prepare("SELECT * FROM account_applications WHERE status = 'pending' ORDER BY created_at DESC").all();
  res.json(applications);
});

router.post('/:id/approve', authMiddleware, requireAdmin, (req, res) => {
  const db = getDb();
  const app = db.prepare("SELECT * FROM account_applications WHERE id = ? AND status = 'pending'").get(req.params.id);
  if (!app) return res.status(404).json({ error: '申请不存在或已处理' });

  const role = req.body.role || 'sales';

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(app.username);
  if (existingUser) {
    db.prepare("UPDATE account_applications SET status = 'approved' WHERE id = ?").run(req.params.id);
    return res.status(400).json({ error: '该用户名已存在，申请已自动标记为通过' });
  }

  const hash = bcrypt.hashSync('123456', 10);
  const createAndApprove = db.transaction(() => {
    db.prepare(
      'INSERT INTO users (username, password_hash, name, role, team, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
    ).run(app.username, hash, app.name, role, '', nowCN());
    db.prepare("UPDATE account_applications SET status = 'approved' WHERE id = ?").run(req.params.id);
  });
  createAndApprove();

  logAction(req, '审批通过申请', app.username, `角色: ${role}`);
  res.json({ success: true, message: `用户 ${app.name} 已创建，默认密码 123456` });
});

router.post('/:id/reject', authMiddleware, requireAdmin, (req, res) => {
  const db = getDb();
  const app = db.prepare("SELECT * FROM account_applications WHERE id = ? AND status = 'pending'").get(req.params.id);
  if (!app) return res.status(404).json({ error: '申请不存在或已处理' });

  db.prepare("UPDATE account_applications SET status = 'rejected' WHERE id = ?").run(req.params.id);
  logAction(req, '拒绝申请', app.username);
  res.json({ success: true });
});

module.exports = router;
