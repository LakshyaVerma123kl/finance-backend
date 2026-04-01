const bcrypt = require("bcryptjs");
const { getDb } = require("../config/database");
const { validationResult } = require("express-validator");
const { writeLog } = require("../models/auditLog");

function listUsers(req, res) {
  const { status, role, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let where = `WHERE 1=1`;
  const params = [];
  if (status) {
    where += ` AND status = ?`;
    params.push(status);
  }
  if (role) {
    where += ` AND role = ?`;
    params.push(role);
  }

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM users ${where}`)
    .get(...params).count;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const users = db
    .prepare(
      `SELECT id, name, email, role, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, parseInt(limit), offset);

  return res.json({
    users,
    meta: {
      total,
      page: +page,
      limit: +limit,
      pages: Math.ceil(total / limit),
    },
  });
}

function getUser(req, res) {
  const user = getDb()
    .prepare(
      `SELECT id, name, email, role, status, created_at FROM users WHERE id = ?`,
    )
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
}

function createUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = "viewer" } = req.body;
  const db = getDb();

  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get(email);
  if (existing)
    return res.status(409).json({ error: "Email already registered" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      `
    INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
  `,
    )
    .run(name, email, hash, role);

  writeLog({
    user: req.user,
    action: "CREATE_USER",
    entity: "user",
    entityId: result.lastInsertRowid,
    details: { name, email, role },
    req,
  });

  return res.status(201).json({
    message: "User created",
    user: { id: result.lastInsertRowid, name, email, role },
  });
}

function updateUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const user = db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (
    String(req.user.id) === String(req.params.id) &&
    req.body.role &&
    req.body.role !== req.user.role
  ) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  const name = req.body.name ?? user.name;
  const role = req.body.role ?? user.role;
  const status = req.body.status ?? user.status;

  db.prepare(
    `
    UPDATE users SET name = ?, role = ?, status = ?, updated_at = datetime('now') WHERE id = ?
  `,
  ).run(name, role, status, req.params.id);

  writeLog({
    user: req.user,
    action: "UPDATE_USER",
    entity: "user",
    entityId: req.params.id,
    details: { name, role, status },
    req,
  });

  return res.json({
    message: "User updated",
    user: { id: user.id, name, role, status },
  });
}

function deleteUser(req, res) {
  const db = getDb();
  if (String(req.user.id) === String(req.params.id)) {
    return res
      .status(400)
      .json({ error: "You cannot delete your own account" });
  }

  const user = db
    .prepare(`SELECT id, email FROM users WHERE id = ?`)
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);

  writeLog({
    user: req.user,
    action: "DELETE_USER",
    entity: "user",
    entityId: req.params.id,
    details: { deleted_email: user.email },
    req,
  });

  return res.json({ message: "User deleted" });
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
