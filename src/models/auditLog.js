const { getDb } = require("../config/database");

function initAuditLog() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      user_email  TEXT,
      user_role   TEXT,
      action      TEXT NOT NULL,
      entity      TEXT NOT NULL,
      entity_id   TEXT,
      details     TEXT,
      ip          TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function writeLog({
  user,
  action,
  entity,
  entityId = null,
  details = null,
  req = null,
}) {
  try {
    getDb()
      .prepare(
        `
      INSERT INTO audit_logs (user_id, user_email, user_role, action, entity, entity_id, details, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        user?.id ?? null,
        user?.email ?? null,
        user?.role ?? null,
        action,
        entity,
        entityId ? String(entityId) : null,
        details ? JSON.stringify(details) : null,
        req?.ip ?? null,
      );
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}

module.exports = { initAuditLog, writeLog };
