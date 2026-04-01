const Database = require("better-sqlite3");
const path = require("path");

let db;

function getDb() {
  if (!db) {
    const dbPath =
      process.env.DB_PATH ||
      path.join(__dirname, "../../finance.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

// Allow tests to reset the singleton between suites
function resetDb() {
  if (db) {
    try { db.close(); } catch (_) {}
    db = null;
  }
}

module.exports = { getDb, resetDb };