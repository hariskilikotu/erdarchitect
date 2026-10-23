/**
 * Minimal migration runner.
 * Applies every .sql file in ./migrations (alphabetical order) exactly once
 * and records it in the schema_migrations table.
 *
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const db = require('./pool');

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await db.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip     ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`applied  ${file}`);
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migrations complete.');
      return db.end();
    })
    .catch(async (err) => {
      console.error('Migration failed:', err.message);
      await db.end().catch(() => {});
      process.exit(1);
    });
}

module.exports = migrate;
