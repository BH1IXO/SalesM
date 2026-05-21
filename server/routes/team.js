const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const members = db.prepare(
    'SELECT id, username, name, role, avatar, team, phone, email, active, created_at FROM users ORDER BY id'
  ).all();
  res.json(members);
});

module.exports = router;
