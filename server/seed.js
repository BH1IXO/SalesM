const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

function seedCategories(db) {
  const catCount = db.prepare('SELECT COUNT(*) as c FROM document_categories').get().c;
  if (catCount > 0) return;
  const insertCat = db.prepare('INSERT INTO document_categories (name, is_system) VALUES (?, 1)');
  const names = ['PPT演示', '报价表', '销售详情', '会议纪要', '备忘录', '合同文档', '技术方案', '需求文档', '其他'];
  for (const n of names) insertCat.run(n);
}

function seed() {
  const db = getDb();

  seedCategories(db);

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding database...');
  const hash = bcrypt.hashSync('123456', 10);

  db.prepare(
    'INSERT INTO users (username, password_hash, name, role, avatar, team, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('liutao', hash, '刘涛', 'admin', '', 'all', 1);

  console.log('Seed complete! Default login: liutao / 123456 (must change password on first login)');
}

if (require.main === module) {
  seed();
} else {
  module.exports = { seed };
}
