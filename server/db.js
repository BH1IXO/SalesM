const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'salesm.db');

console.log(`[DB] Data directory: ${DATA_DIR}`);
console.log(`[DB] Database path: ${DB_PATH}`);

let db;

function getDb() {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Migrations for existing databases
    const cols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
    if (!cols.includes('contact_title')) {
      db.exec("ALTER TABLE customers ADD COLUMN contact_title TEXT DEFAULT ''");
    }
    if (!cols.includes('leader_name')) {
      db.exec("ALTER TABLE customers ADD COLUMN leader_name TEXT DEFAULT ''");
      db.exec("ALTER TABLE customers ADD COLUMN leader_title TEXT DEFAULT ''");
      db.exec("ALTER TABLE customers ADD COLUMN leader_phone TEXT DEFAULT ''");
    }
    if (!cols.includes('amount_onetime')) {
      db.exec("ALTER TABLE customers ADD COLUMN amount_onetime REAL DEFAULT 0");
      db.exec("ALTER TABLE customers ADD COLUMN amount_monthly REAL DEFAULT 0");
      db.exec("ALTER TABLE customers ADD COLUMN amount_months INTEGER DEFAULT 1");
    }

    // Ensure operation_logs table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='operation_logs'").get();
    if (!tables) {
      db.exec(`CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT DEFAULT '',
        detail TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec("CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at)");
    }

    // Ensure payments table exists
    const paymentsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='payments'").get();
    if (!paymentsTable) {
      db.exec(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT DEFAULT '',
        reference_number TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec("CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)");
    }

    // Migrate activities.date to UTC+8 full datetime
    const sampleDate = db.prepare("SELECT date FROM activities WHERE length(date) <= 10 LIMIT 1").get();
    if (sampleDate) {
      db.exec(`
        UPDATE activities
        SET date = strftime('%Y-%m-%d %H:%M:%S', datetime(created_at, '+8 hours'))
        WHERE length(date) <= 10 AND created_at IS NOT NULL
      `);
      console.log('[DB] Migrated activities.date to UTC+8 datetime');
    }

    // Migrate: add channel_id and commission_rate to customers
    const custCols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
    if (!custCols.includes('channel_id')) {
      db.exec("ALTER TABLE customers ADD COLUMN channel_id INTEGER REFERENCES channels(id)");
      db.exec("ALTER TABLE customers ADD COLUMN commission_rate REAL DEFAULT 0");
      console.log('[DB] Added channel_id and commission_rate to customers');
    }

    console.log(`[DB] Database initialized at ${DB_PATH}`);
  }
  return db;
}

module.exports = { getDb, DATA_DIR };
