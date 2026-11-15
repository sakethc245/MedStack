import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function beersCheck(body) {
  const res = await fetch(`${base}/api/beers-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

test('age 70 with diphenhydramine returns a flag', async () => {
  const { status, data } = await beersCheck({ age: 70, drugs: ['diphenhydramine', 'metformin'] });
  assert.equal(status, 200);
  assert.equal(data.applies, true);
  assert.equal(data.flags.length, 1);
  assert.equal(data.flags[0].drug, 'diphenhydramine');
  assert.match(data.source, /2023/);
});

test('age 40 returns no flags', async () => {
  const { status, data } = await beersCheck({ age: 40, drugs: ['diphenhydramine'] });
  assert.equal(status, 200);
  assert.equal(data.applies, false);
  assert.deepEqual(data.flags, []);
});

test('missing or invalid age returns 400', async () => {
  for (const age of [undefined, null, '70', 70.5, -1, 121]) {
    const { status, data } = await beersCheck({ age, drugs: ['diphenhydramine'] });
    assert.equal(status, 400, `age ${age}`);
    assert.ok(data.error);
  }
});

test('invalid drugs return 400', async () => {
  assert.equal((await beersCheck({ age: 70 })).status, 400);
  assert.equal((await beersCheck({ age: 70, drugs: ['ok', 5] })).status, 400);
  const tooMany = Array.from({ length: 11 }, (_, i) => `drug${i}`);
  assert.equal((await beersCheck({ age: 70, drugs: tooMany })).status, 400);
});

test('an empty stack is fine', async () => {
  const { status, data } = await beersCheck({ age: 70, drugs: [] });
  assert.equal(status, 200);
  assert.deepEqual(data.flags, []);
});
