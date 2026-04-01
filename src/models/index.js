const { getDb } = require("../config/database");
const bcrypt = require("bcryptjs");
const { initAuditLog } = require("./auditLog");

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'viewer'
                          CHECK(role IN ('viewer','analyst','admin')),
      status      TEXT    NOT NULL DEFAULT 'active'
                          CHECK(status IN ('active','inactive')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL CHECK(amount > 0),
      type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      notes       TEXT,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      deleted_at  TEXT    DEFAULT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  initAuditLog();

  const adminExists = db
    .prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
    .get();

  if (!adminExists) {
    const hash = bcrypt.hashSync("Admin@123", 10);
    db.prepare(
      `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `,
    ).run("Super Admin", "admin@finance.com", hash);
    console.log("✅ Default admin seeded  →  admin@finance.com / Admin@123");
  }

  console.log("✅ Database initialized");
}

module.exports = { initializeDatabase };
