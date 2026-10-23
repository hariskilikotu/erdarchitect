const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');

// Swap the real PostgreSQL pool for an in-memory Postgres emulator.
const mem = newDb();
const { Pool } = mem.adapters.createPg();
const memPool = new Pool();

const poolPath = require.resolve('../src/db/pool');
require.cache[poolPath] = {
  id: poolPath,
  filename: poolPath,
  loaded: true,
  exports: {
    query: (text, params) => memPool.query(text, params),
    end: () => memPool.end(),
  },
};

const app = require('../src/app');

let server;
let base;

before(async () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'db', 'migrations', '001_create_contributions.sql'),
    'utf8'
  );
  await memPool.query(sql);

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (body) =>
  fetch(`${base}/api/contributions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const valid = {
  name: 'Asha Rao',
  email: 'Asha@Example.com',
  phone: '+91 98765 43210',
  amount: '1500.50',
};

test('serves the HTML form', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="contribution-form"/);
});

test('saves a valid contribution to the database', async () => {
  const res = await post(valid);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.contribution.name, 'Asha Rao');
  assert.equal(body.contribution.email, 'asha@example.com'); // lowercased
  assert.equal(body.contribution.amount, 1500.5);

  const { rows } = await memPool.query('SELECT * FROM contributions WHERE id = $1', [
    body.contribution.id,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].phone, '+91 98765 43210');
  assert.equal(Number(rows[0].amount), 1500.5);
});

test('summary reflects stored contributions', async () => {
  await post({ ...valid, email: 'second@example.com', amount: '500' });
  const res = await fetch(`${base}/api/contributions/summary`);
  const body = await res.json();
  assert.equal(body.count, 2);
  assert.equal(body.total, 2000.5);
});

test('rejects missing fields', async () => {
  const res = await post({});
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.deepEqual(Object.keys(body.errors).sort(), ['amount', 'email', 'name', 'phone']);
});

test('rejects invalid email, phone and amount', async () => {
  for (const [field, value] of [
    ['email', 'not-an-email'],
    ['phone', 'abc'],
    ['phone', '123'],
    ['amount', '-5'],
    ['amount', '0'],
    ['amount', 'ten'],
    ['amount', '10.123'],
  ]) {
    const res = await post({ ...valid, [field]: value });
    assert.equal(res.status, 400, `${field}=${value} should be rejected`);
    const body = await res.json();
    assert.ok(body.errors[field], `${field}=${value} should report an error`);
  }
});

test('does not save rejected submissions', async () => {
  const before = await memPool.query('SELECT COUNT(*)::int AS n FROM contributions');
  await post({ ...valid, amount: '-1' });
  const after = await memPool.query('SELECT COUNT(*)::int AS n FROM contributions');
  assert.equal(after.rows[0].n, before.rows[0].n);
});

test('treats SQL injection text as plain data', async () => {
  const evil = "Robert'); DROP TABLE contributions;--";
  const res = await post({ ...valid, name: evil, email: 'bobby@example.com' });
  assert.equal(res.status, 201);
  const { rows } = await memPool.query('SELECT name FROM contributions WHERE email = $1', [
    'bobby@example.com',
  ]);
  assert.equal(rows[0].name, evil);
});

test('returns 400 for malformed JSON', async () => {
  const res = await fetch(`${base}/api/contributions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  assert.equal(res.status, 400);
});
