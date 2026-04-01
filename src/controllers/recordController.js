const { getDb } = require("../config/database");
const { validationResult } = require("express-validator");
const { writeLog } = require("../models/auditLog");
const { toCSV } = require("../utils/csvExport");

function buildWhere(query) {
  const { type, category, from, to, search } = query;
  let sql = `WHERE r.deleted_at IS NULL`;
  const params = [];

  if (type) {
    sql += ` AND r.type = ?`;
    params.push(type);
  }
  if (category) {
    sql += ` AND r.category LIKE ?`;
    params.push(`%${category}%`);
  }
  if (from) {
    sql += ` AND r.date >= ?`;
    params.push(from);
  }
  if (to) {
    sql += ` AND r.date <= ?`;
    params.push(to);
  }
  if (search) {
    sql += ` AND (r.notes LIKE ? OR r.category LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  return { sql, params };
}

function listRecords(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const { sql, params } = buildWhere(req.query);
  const db = getDb();

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM financial_records r ${sql}`)
    .get(...params).count;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const records = db
    .prepare(
      `
    SELECT r.*, u.name as created_by_name
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    ${sql} ORDER BY r.date DESC LIMIT ? OFFSET ?
  `,
    )
    .all(...params, parseInt(limit), offset);

  return res.json({
    records,
    meta: {
      total,
      page: +page,
      limit: +limit,
      pages: Math.ceil(total / limit),
    },
  });
}

function exportCSV(req, res) {
  const { sql, params } = buildWhere(req.query);
  const db = getDb();

  const records = db
    .prepare(
      `
    SELECT r.*, u.name as created_by_name
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    ${sql} ORDER BY r.date DESC
  `,
    )
    .all(...params);

  const csv = toCSV(records);

  writeLog({
    user: req.user,
    action: "EXPORT_CSV",
    entity: "financial_record",
    details: { filters: req.query },
    req,
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="records_${Date.now()}.csv"`,
  );
  return res.send(csv);
}

function getRecord(req, res) {
  const record = getDb()
    .prepare(
      `
    SELECT r.*, u.name as created_by_name
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    WHERE r.id = ? AND r.deleted_at IS NULL
  `,
    )
    .get(req.params.id);

  if (!record) return res.status(404).json({ error: "Record not found" });
  return res.json({ record });
}

function createRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { amount, type, category, date, notes } = req.body;
  const result = getDb()
    .prepare(
      `
    INSERT INTO financial_records (amount, type, category, date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(amount, type, category, date, notes ?? null, req.user.id);

  writeLog({
    user: req.user,
    action: "CREATE_RECORD",
    entity: "financial_record",
    entityId: result.lastInsertRowid,
    details: { amount, type, category, date },
    req,
  });

  return res.status(201).json({
    message: "Record created",
    record: { id: result.lastInsertRowid, amount, type, category, date, notes },
  });
}

function updateRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const record = db
    .prepare(
      `SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL`,
    )
    .get(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });

  const amount = req.body.amount ?? record.amount;
  const type = req.body.type ?? record.type;
  const category = req.body.category ?? record.category;
  const date = req.body.date ?? record.date;
  const notes = req.body.notes ?? record.notes;

  db.prepare(
    `
    UPDATE financial_records
    SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(amount, type, category, date, notes, req.params.id);

  writeLog({
    user: req.user,
    action: "UPDATE_RECORD",
    entity: "financial_record",
    entityId: req.params.id,
    details: { amount, type, category, date },
    req,
  });

  return res.json({
    message: "Record updated",
    record: { id: record.id, amount, type, category, date, notes },
  });
}

function deleteRecord(req, res) {
  const db = getDb();
  const record = db
    .prepare(
      `SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL`,
    )
    .get(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });

  db.prepare(
    `UPDATE financial_records SET deleted_at = datetime('now') WHERE id = ?`,
  ).run(req.params.id);

  writeLog({
    user: req.user,
    action: "DELETE_RECORD",
    entity: "financial_record",
    entityId: req.params.id,
    req,
  });

  return res.json({ message: "Record soft-deleted" });
}

module.exports = {
  listRecords,
  exportCSV,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
};
