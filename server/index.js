const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDb } = require('./db');
const { seed } = require('./seed');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

getDb();
seed();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', authMiddleware, require('./routes/customers'));
app.use('/api/customers', authMiddleware, require('./routes/activities'));
app.use('/api/customers', authMiddleware, require('./routes/expenses'));
app.use('/api/competitors', authMiddleware, require('./routes/competitors'));
app.use('/api/team', authMiddleware, require('./routes/team'));
app.use('/api/reports', authMiddleware, require('./routes/reports'));
app.use('/api/customers', authMiddleware, require('./routes/documents'));
app.use('/api/document-categories', authMiddleware, require('./routes/documentCategories'));
app.use('/api/admin', authMiddleware, require('./routes/admin'));
app.use('/api/applications', require('./routes/applications'));

app.get('/api/data/export', authMiddleware, (req, res) => {
  const db = getDb();
  const data = {
    customers: db.prepare('SELECT * FROM customers').all(),
    activities: db.prepare('SELECT * FROM activities').all(),
    expenses: db.prepare('SELECT * FROM expenses').all(),
    competitors: db.prepare('SELECT * FROM competitors').all(),
    customer_competitors: db.prepare('SELECT * FROM customer_competitors').all(),
    documents: db.prepare('SELECT * FROM documents').all(),
    document_categories: db.prepare('SELECT * FROM document_categories').all(),
    customer_collaborators: db.prepare('SELECT * FROM customer_collaborators').all(),
    exportDate: new Date().toISOString(),
  };
  res.json(data);
});

app.post('/api/data/import', authMiddleware, (req, res) => {
  const db = getDb();
  const { customers, activities, expenses, competitors, customer_competitors, documents, document_categories } = req.body;

  try {
    const importAll = db.transaction(() => {
      if (customers) {
        db.prepare('DELETE FROM customer_competitors').run();
        db.prepare('DELETE FROM expenses').run();
        db.prepare('DELETE FROM activities').run();
        db.prepare('DELETE FROM customers').run();
        const stmt = db.prepare(`INSERT INTO customers (name, industry, size, contact, phone, email, status, amount, expected_close_date, priority, assigned_to, budget, pain_points, solution, decision_chain, last_follow_up, loss_reason, loss_competitor, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const c of customers) {
          stmt.run(c.name, c.industry, c.size, c.contact, c.phone, c.email, c.status, c.amount, c.expected_close_date, c.priority, c.assigned_to, c.budget, c.pain_points, c.solution, c.decision_chain, c.last_follow_up, c.loss_reason, c.loss_competitor, c.created_at, c.updated_at);
        }
      }
      if (activities) {
        db.prepare('DELETE FROM activities').run();
        const stmt = db.prepare('INSERT INTO activities (customer_id, type, description, date, created_by, next_follow_up) VALUES (?, ?, ?, ?, ?, ?)');
        for (const a of activities) stmt.run(a.customer_id, a.type, a.description, a.date, a.created_by, a.next_follow_up);
      }
      if (expenses) {
        db.prepare('DELETE FROM expenses').run();
        const stmt = db.prepare('INSERT INTO expenses (customer_id, activity_id, type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const e of expenses) stmt.run(e.customer_id, e.activity_id, e.type, e.amount, e.description, e.date, e.created_by);
      }
      if (competitors) {
        db.prepare('DELETE FROM competitors').run();
        const stmt = db.prepare('INSERT INTO competitors (name, strengths, weaknesses, pricing, typical_customers, tactics) VALUES (?, ?, ?, ?, ?, ?)');
        for (const c of competitors) stmt.run(c.name, c.strengths, c.weaknesses, c.pricing, c.typical_customers, c.tactics);
      }
      if (customer_competitors) {
        db.prepare('DELETE FROM customer_competitors').run();
        const stmt = db.prepare('INSERT INTO customer_competitors (customer_id, competitor_id, customer_feedback, our_advantage, our_disadvantage) VALUES (?, ?, ?, ?, ?)');
        for (const cc of customer_competitors) stmt.run(cc.customer_id, cc.competitor_id, cc.customer_feedback, cc.our_advantage, cc.our_disadvantage);
      }
      if (document_categories) {
        db.prepare('DELETE FROM document_categories WHERE is_system = 0').run();
        const stmt = db.prepare('INSERT INTO document_categories (name, is_system, created_by) VALUES (?, ?, ?)');
        for (const dc of document_categories) {
          if (!dc.is_system) stmt.run(dc.name, 0, dc.created_by);
        }
      }
      if (documents) {
        db.prepare('DELETE FROM documents').run();
        const stmt = db.prepare('INSERT INTO documents (customer_id, category_id, filename, original_name, size, mime_type, notes, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const d of documents) stmt.run(d.customer_id, d.category_id, d.filename, d.original_name, d.size, d.mime_type, d.notes, d.uploaded_by, d.created_at);
      }
    });
    importAll();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '导入失败: ' + err.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`SalesM server running on http://localhost:${PORT}`);
});
