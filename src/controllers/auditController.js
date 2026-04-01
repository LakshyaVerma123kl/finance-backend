const { getDb } = require("../config/database");

function listLogs(req, res) {
  const { user_id, action, entity, page = 1, limit = 30 } = req.query;
  const db = getDb();

  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];

  if (user_id) {
    query += ` AND user_id = ?`;
    params.push(user_id);
  }
  if (action) {
    query += ` AND action LIKE ?`;
    params.push(`%${action}%`);
  }
  if (entity) {
    query += ` AND entity = ?`;
    params.push(entity);
  }

  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
  const total = db.prepare(countQuery).get(params).count;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const rows = db.prepare(query).all([...params, parseInt(limit), offset]);

  return res.json({
    audit_logs: rows,
    meta: {
      total,
      page: +page,
      limit: +limit,
      pages: Math.ceil(total / limit),
    },
  });
}

module.exports = { listLogs };