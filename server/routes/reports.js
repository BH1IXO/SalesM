const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/overview', (req, res) => {
  const db = getDb();

  const totalCustomers = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  const activeCustomers = db.prepare("SELECT COUNT(*) as c FROM customers WHERE status NOT IN ('won','lost')").get().c;
  const wonCustomers = db.prepare("SELECT COUNT(*) as c FROM customers WHERE status = 'won'").get().c;
  const lostCustomers = db.prepare("SELECT COUNT(*) as c FROM customers WHERE status = 'lost'").get().c;
  const totalPipeline = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM customers WHERE status NOT IN ('won','lost')").get().s;
  const wonAmount = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM customers WHERE status = 'won'").get().s;
  const totalExpenses = db.prepare('SELECT COALESCE(SUM(amount),0) as s FROM expenses').get().s;
  const avgDealSize = db.prepare("SELECT COALESCE(AVG(amount),0) as a FROM customers WHERE status = 'won'").get().a;

  res.json({
    totalCustomers, activeCustomers, wonCustomers, lostCustomers,
    totalPipeline, wonAmount, totalExpenses, avgDealSize,
    winRate: totalCustomers > 0 ? ((wonCustomers / (wonCustomers + lostCustomers)) * 100 || 0).toFixed(1) : 0,
  });
});

router.get('/pipeline', (req, res) => {
  const db = getDb();
  const stages = db.prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(amount),0) as total_amount
    FROM customers GROUP BY status ORDER BY
      CASE status
        WHEN 'leads' THEN 1 WHEN 'contact' THEN 2 WHEN 'needs' THEN 3
        WHEN 'proposal' THEN 4 WHEN 'negotiation' THEN 5
        WHEN 'contract' THEN 6 WHEN 'won' THEN 7 WHEN 'lost' THEN 8
      END
  `).all();
  res.json(stages);
});

router.get('/performance', (req, res) => {
  const db = getDb();
  const performance = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.team,
      COUNT(c.id) as total_customers,
      SUM(CASE WHEN c.status = 'won' THEN 1 ELSE 0 END) as won_count,
      SUM(CASE WHEN c.status = 'lost' THEN 1 ELSE 0 END) as lost_count,
      COALESCE(SUM(CASE WHEN c.status = 'won' THEN c.amount ELSE 0 END), 0) as won_amount,
      COALESCE(SUM(CASE WHEN c.status NOT IN ('won','lost') THEN c.amount ELSE 0 END), 0) as pipeline_amount,
      (SELECT COUNT(*) FROM activities a WHERE a.created_by = u.id) as activity_count,
      (SELECT COALESCE(SUM(e.amount),0) FROM expenses e WHERE e.created_by = u.id) as expense_total
    FROM users u
    LEFT JOIN customers c ON c.assigned_to = u.id
    WHERE u.role != 'admin'
    GROUP BY u.id
    ORDER BY won_amount DESC
  `).all();
  res.json(performance);
});

router.get('/expense-breakdown', (req, res) => {
  const db = getDb();
  const breakdown = db.prepare(`
    SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM expenses GROUP BY type ORDER BY total DESC
  `).all();
  res.json(breakdown);
});

module.exports = router;
