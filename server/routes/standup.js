const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();

  const days = Math.min(Math.max(parseInt(req.query.days) || 2, 1), 90);
  const today = new Date(Date.now() + 8 * 3600 * 1000);
  const fromDate = new Date(today.getTime() - days * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const toDate = today.toISOString().slice(0, 10);

  const activities = db.prepare(`
    SELECT a.id, a.customer_id, a.type, a.description, a.date, a.next_follow_up,
           a.created_by, a.created_at, u.name AS creator_name, u.team AS creator_team,
           c.name AS customer_name, c.status AS customer_status,
           c.amount AS customer_amount,
           COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) AS customer_received,
           c.assigned_to, au.name AS assigned_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN users au ON c.assigned_to = au.id
    WHERE a.date >= ?
    ORDER BY a.date DESC, a.created_at DESC
  `).all(fromDate);

  const users = db.prepare(
    `SELECT id, name, team, role FROM users WHERE active = 1`
  ).all();

  res.json({ activities, users, dateRange: { from: fromDate, to: toDate } });
});

module.exports = router;
