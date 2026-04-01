const jwt = require("jsonwebtoken");
const { getDb } = require("../config/database");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm user still exists and is active
    const user = getDb()
      .prepare(`SELECT id, name, email, role, status FROM users WHERE id = ?`)
      .get(payload.id);

    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.status === "inactive")
      return res.status(403).json({ error: "Account is inactive" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
}

module.exports = { authenticate };
