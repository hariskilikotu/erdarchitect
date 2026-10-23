const db = require('../db/pool');

/**
 * Insert a contribution and return the saved row.
 * All values are passed as parameters ($1..$4) to prevent SQL injection.
 */
exports.create = async ({ name, email, phone, amount }) => {
  const { rows } = await db.query(
    `INSERT INTO contributions (name, email, phone, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, amount, created_at`,
    [name, email, phone, amount]
  );
  return rows[0];
};

/**
 * Aggregate numbers (no personal data).
 */
exports.getSummary = async () => {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS total
       FROM contributions`
  );
  return rows[0];
};
