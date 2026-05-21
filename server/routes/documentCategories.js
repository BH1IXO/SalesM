const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM document_categories ORDER BY is_system DESC, name ASC').all();
  res.json(categories);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '分类名称不能为空' });

  const existing = db.prepare('SELECT id FROM document_categories WHERE name = ?').get(name.trim());
  if (existing) return res.status(400).json({ error: '分类已存在' });

  const result = db.prepare(
    'INSERT INTO document_categories (name, is_system, created_by) VALUES (?, 0, ?)'
  ).run(name.trim(), req.user.id);

  const category = db.prepare('SELECT * FROM document_categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(category);
});

module.exports = router;
