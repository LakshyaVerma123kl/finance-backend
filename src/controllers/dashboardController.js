const { getDb } = require("../config/database");

function getSummary(req, res) {
  const db = getDb();

  const totals = db
    .prepare(
      `
    SELECT
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END) AS net_balance,
      COUNT(*) AS total_records
    FROM financial_records
    WHERE deleted_at IS NULL
  `,
    )
    .get();

  return res.json({ summary: totals });
}

function getCategoryTotals(req, res) {
  const db = getDb();

  const rows = db
    .prepare(
      `
    SELECT category, type,
           SUM(amount) AS total,
           COUNT(*)    AS count
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `,
    )
    .all();

  return res.json({ category_totals: rows });
}

function getMonthlyTrends(req, res) {
  const db = getDb();

  const rows = db
    .prepare(
      `
    SELECT
      strftime('%Y-%m', date) AS month,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END) AS net
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `,
    )
    .all();

  return res.json({ monthly_trends: rows });
}

function getRecentActivity(req, res) {
  const db = getDb();
  const limit = parseInt(req.query.limit) || 10;

  const records = db
    .prepare(
      `
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name AS created_by
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    WHERE r.deleted_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT ?
  `,
    )
    .all(limit);

  return res.json({ recent_activity: records });
}

function getWeeklyTrends(req, res) {
  const db = getDb();

  const rows = db
    .prepare(
      `
    SELECT
      strftime('%Y-W%W', date) AS week,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY week
    ORDER BY week DESC
    LIMIT 8
  `,
    )
    .all();

  return res.json({ weekly_trends: rows });
}

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyTrends,
};
