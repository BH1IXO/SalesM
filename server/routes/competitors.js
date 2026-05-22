const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDb, DATA_DIR } = require('../db');
const { logAction } = require('../utils/logger');

const UPLOAD_BASE = path.join(DATA_DIR, 'uploads', 'competitors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  },
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const competitors = db.prepare('SELECT * FROM competitors ORDER BY id').all();
  res.json(competitors);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, strengths, weaknesses, pricing, typical_customers, tactics } = req.body;
  if (!name) return res.status(400).json({ error: '竞品名称不能为空' });

  const result = db.prepare(
    'INSERT INTO competitors (name, strengths, weaknesses, pricing, typical_customers, tactics) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, strengths || '', weaknesses || '', pricing || '', typical_customers || '', tactics || '');

  const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(result.lastInsertRowid);
  logAction(req, '添加竞品', name);
  res.status(201).json(competitor);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '竞品不存在' });

  const fields = ['name', 'strengths', 'weaknesses', 'pricing', 'typical_customers', 'tactics'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (updates.length === 0) return res.json(existing);

  params.push(req.params.id);
  db.prepare(`UPDATE competitors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  logAction(req, '编辑竞品', competitor.name);
  res.json(competitor);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '竞品不存在' });

  const uploadDir = path.join(UPLOAD_BASE, String(req.params.id));
  try { fs.rmSync(uploadDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

  db.prepare('UPDATE customers SET loss_competitor = NULL WHERE loss_competitor = ?').run(req.params.id);
  db.prepare('DELETE FROM competitors WHERE id = ?').run(req.params.id);
  logAction(req, '删除竞品', existing.name);
  res.json({ success: true });
});

// ── Customer competitors ──

router.get('/customer/:customerId', (req, res) => {
  const db = getDb();
  const ccs = db.prepare(`
    SELECT cc.*, c.name as competitor_name, c.strengths, c.weaknesses, c.pricing, c.typical_customers, c.tactics
    FROM customer_competitors cc
    JOIN competitors c ON cc.competitor_id = c.id
    WHERE cc.customer_id = ?
  `).all(req.params.customerId);
  res.json(ccs);
});

router.post('/customer/:customerId', (req, res) => {
  const db = getDb();
  const { competitor_id, customer_feedback, our_advantage, our_disadvantage } = req.body;
  if (!competitor_id) return res.status(400).json({ error: '请选择竞品' });

  const result = db.prepare(
    'INSERT INTO customer_competitors (customer_id, competitor_id, customer_feedback, our_advantage, our_disadvantage) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.customerId, competitor_id, customer_feedback || '', our_advantage || '', our_disadvantage || '');

  const cc = db.prepare(`
    SELECT cc.*, c.name as competitor_name FROM customer_competitors cc JOIN competitors c ON cc.competitor_id = c.id WHERE cc.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(cc);
});

// ── Competitor files ──

router.get('/:id/files', (req, res) => {
  const db = getDb();
  const files = db.prepare(`
    SELECT cf.*, u.name as uploader_name
    FROM competitor_files cf
    LEFT JOIN users u ON cf.uploaded_by = u.id
    WHERE cf.competitor_id = ?
    ORDER BY cf.created_at DESC
  `).all(req.params.id);
  res.json(files);
});

router.post('/:id/files', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });

  const db = getDb();
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const { notes } = req.body;

  const result = db.prepare(
    'INSERT INTO competitor_files (competitor_id, filename, original_name, size, mime_type, notes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, req.file.filename, originalName, req.file.size, req.file.mimetype, notes || '', req.user.id);

  const file = db.prepare(`
    SELECT cf.*, u.name as uploader_name
    FROM competitor_files cf
    LEFT JOIN users u ON cf.uploaded_by = u.id
    WHERE cf.id = ?
  `).get(result.lastInsertRowid);

  logAction(req, '上传竞品文件', `竞品#${req.params.id}`, originalName);
  res.status(201).json(file);
});

router.delete('/:id/files/:fileId', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM competitor_files WHERE id = ? AND competitor_id = ?').get(req.params.fileId, req.params.id);
  if (!file) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_BASE, String(req.params.id), file.filename);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

  db.prepare('DELETE FROM competitor_files WHERE id = ?').run(req.params.fileId);
  logAction(req, '删除竞品文件', `竞品#${req.params.id}`, file.original_name);
  res.json({ success: true });
});

router.get('/:id/files/:fileId/download', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM competitor_files WHERE id = ? AND competitor_id = ?').get(req.params.fileId, req.params.id);
  if (!file) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_BASE, String(req.params.id), file.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });

  const inline = req.query.inline === '1';
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
  res.sendFile(filePath);
});

module.exports = router;
