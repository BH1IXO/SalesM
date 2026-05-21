const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDb } = require('../db');

const UPLOAD_BASE = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, String(req.params.customerId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const router = express.Router();

router.get('/:customerId/documents', (req, res) => {
  const db = getDb();
  const docs = db.prepare(`
    SELECT d.*, dc.name as category_name, u.name as uploader_name
    FROM documents d
    LEFT JOIN document_categories dc ON d.category_id = dc.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.customer_id = ?
    ORDER BY d.created_at DESC
  `).all(req.params.customerId);
  res.json(docs);
});

router.post('/:customerId/documents', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择要上传的文件' });

  const db = getDb();
  const { category_id, notes } = req.body;
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  const result = db.prepare(`
    INSERT INTO documents (customer_id, category_id, filename, original_name, size, mime_type, notes, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.customerId,
    category_id || null,
    req.file.filename,
    originalName,
    req.file.size,
    req.file.mimetype,
    notes || '',
    req.user.id
  );

  const doc = db.prepare(`
    SELECT d.*, dc.name as category_name, u.name as uploader_name
    FROM documents d
    LEFT JOIN document_categories dc ON d.category_id = dc.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(doc);
});

router.delete('/:customerId/documents/:docId', (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND customer_id = ?')
    .get(req.params.docId, req.params.customerId);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const filePath = path.join(UPLOAD_BASE, String(req.params.customerId), doc.filename);
  try { fs.unlinkSync(filePath); } catch (e) { /* file may already be gone */ }

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.docId);
  res.json({ success: true });
});

router.get('/:customerId/documents/:docId/download', (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND customer_id = ?')
    .get(req.params.docId, req.params.customerId);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const filePath = path.join(UPLOAD_BASE, String(req.params.customerId), doc.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });

  const inline = req.query.inline === '1';
  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`
  );
  res.sendFile(filePath);
});

module.exports = router;
