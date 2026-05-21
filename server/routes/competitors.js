const express = require('express');
const { getDb } = require('../db');

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
  res.status(201).json(competitor);
});

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

module.exports = router;
