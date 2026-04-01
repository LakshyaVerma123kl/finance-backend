const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/database");
const { validationResult } = require("express-validator");
const { writeLog } = require("../models/auditLog");

function register(req, res) {
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
    user: { id: result.lastInsertRowid, email, role },
    action: "REGISTER",
    entity: "user",
    entityId: result.lastInsertRowid,
    req,
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: { id: result.lastInsertRowid, name, email, role },
  });
}

function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const db = getDb();

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });
  if (user.status === "inactive")
    return res.status(403).json({ error: "Account is inactive" });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid)
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  writeLog({ user, action: "LOGIN", entity: "user", entityId: user.id, req });

  return res.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, me };
