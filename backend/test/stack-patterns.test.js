import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { checkStackPatterns } from '../src/stackPatterns.js';
import { app } from '../src/server.js';

const ids = (insights) => insights.map((i) => i.id);

// ---- Matcher ----

test('an opioid plus a benzodiazepine at age 72 returns an insight', () => {
  const insights = checkStackPatterns(72, ['oxycodone', 'lorazepam']);
  assert.deepEqual(ids(insights), ['opioid-benzodiazepine']);
  const [insight] = insights;
  assert.equal(insight.type, 'pair');
  assert.deepEqual(insight.drugsInvolved, ['oxycodone', 'lorazepam']);
  assert.deepEqual(insight.pairs, [['oxycodone', 'lorazepam']]);
  for (const field of ['label', 'reason', 'recommendation', 'source']) {
    assert.ok(insight[field], `insight has ${field}`);
  }
});

test('the same stack at age 40 returns none (Beers entries are 65+)', () => {
  assert.deepEqual(checkStackPatterns(40, ['oxycodone', 'lorazepam']), []);
  assert.deepEqual(checkStackPatterns(64, ['oxycodone', 'lorazepam']), []);
  assert.equal(checkStackPatterns(65, ['oxycodone', 'lorazepam']).length, 1);
});

test('missing or non-numeric age returns none', () => {
  for (const age of [undefined, null, NaN, '72']) {
    assert.deepEqual(checkStackPatterns(age, ['oxycodone', 'lorazepam']), [], String(age));
  }
});

test('three CNS-active drugs at age 72 returns an insight, two does not', () => {
  const three = checkStackPatterns(72, ['sertraline', 'zolpidem', 'quetiapine']);
  assert.deepEqual(ids(three), ['three-cns-active']);
  assert.equal(three[0].type, 'count');
  assert.deepEqual(three[0].drugsInvolved, ['sertraline', 'zolpidem', 'quetiapine']);
  assert.deepEqual(three[0].pairs, []);

  assert.deepEqual(checkStackPatterns(72, ['sertraline', 'zolpidem']), []);
  assert.deepEqual(checkStackPatterns(72, ['sertraline', 'zolpidem', 'metformin']), []);
});

test('brand names match, ignoring dosage and case', () => {
  const insights = checkStackPatterns(72, ['OxyContin 10 mg', 'Xanax', 'metformin']);
  assert.deepEqual(ids(insights), ['opioid-benzodiazepine']);
  assert.deepEqual(insights[0].drugsInvolved, ['OxyContin 10 mg', 'Xanax']);
});

test('two anticholinergic drugs are flagged, one is not', () => {
  assert.deepEqual(ids(checkStackPatterns(72, ['diphenhydramine', 'oxybutynin'])), ['multiple-anticholinergics']);
  assert.deepEqual(checkStackPatterns(72, ['diphenhydramine', 'metformin']), []);
});

test('the same drug entered twice does not count as two', () => {
  assert.deepEqual(checkStackPatterns(72, ['diphenhydramine', 'Diphenhydramine 25 mg']), []);
});

test('opioid with gabapentin, and lithium and warfarin pairs', () => {
  assert.deepEqual(ids(checkStackPatterns(72, ['tramadol', 'gabapentin'])), ['opioid-gabapentinoid']);
  assert.deepEqual(ids(checkStackPatterns(72, ['lithium', 'lisinopril'])), ['lithium-acei-arb']);
  assert.deepEqual(ids(checkStackPatterns(72, ['lithium', 'Lasix'])), ['lithium-loop-diuretic']);
  assert.deepEqual(ids(checkStackPatterns(72, ['warfarin', 'amiodarone'])), ['warfarin-amiodarone']);
  assert.deepEqual(ids(checkStackPatterns(72, ['Coumadin', 'Bactrim'])), ['warfarin-antibiotics']);
});

test('one stack can produce several insights, and lists every pair', () => {
  const insights = checkStackPatterns(80, ['oxycodone', 'lorazepam', 'alprazolam']);
  assert.deepEqual(ids(insights), ['opioid-benzodiazepine', 'three-cns-active']);
  assert.deepEqual(insights[0].pairs, [
    ['oxycodone', 'lorazepam'],
    ['oxycodone', 'alprazolam'],
  ]);
});

test('unrelated stacks, single drugs and whole-word matching return nothing', () => {
  assert.deepEqual(checkStackPatterns(72, ['metformin', 'lisinopril', 'atorvastatin']), []);
  assert.deepEqual(checkStackPatterns(72, ['oxycodone']), []);
  assert.deepEqual(checkStackPatterns(72, []), []);
  assert.deepEqual(checkStackPatterns(72, ['oxycodonex', 'lorazepamide']), []);
});

// ---- Endpoint ----

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function check(body) {
  const res = await fetch(`${base}/api/stack-patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

test('POST /api/stack-patterns returns insights in the documented shape', async () => {
  const { status, data } = await check({ age: 72, drugs: ['oxycodone', 'Ativan', 'metformin'] });
  assert.equal(status, 200);
  assert.equal(data.insights.length, 1);
  const [insight] = data.insights;
  assert.equal(insight.id, 'opioid-benzodiazepine');
  assert.deepEqual(insight.drugsInvolved, ['oxycodone', 'Ativan']);
  for (const field of ['label', 'reason', 'recommendation', 'source']) {
    assert.equal(typeof insight[field], 'string');
  }
});

test('age 40 and an empty stack return no insights', async () => {
  assert.deepEqual((await check({ age: 40, drugs: ['oxycodone', 'lorazepam'] })).data.insights, []);
  assert.deepEqual((await check({ age: 72, drugs: [] })).data.insights, []);
});

test('invalid age returns 400', async () => {
  for (const age of [undefined, null, '72', 72.5, -1, 121]) {
    const { status, data } = await check({ age, drugs: ['oxycodone', 'lorazepam'] });
    assert.equal(status, 400, `age ${age}`);
    assert.ok(data.error);
  }
});

test('invalid drugs return 400', async () => {
  assert.equal((await check({ age: 72 })).status, 400);
  assert.equal((await check({ age: 72, drugs: 'oxycodone' })).status, 400);
  assert.equal((await check({ age: 72, drugs: ['ok', 5] })).status, 400);
  const tooMany = Array.from({ length: 11 }, (_, i) => `drug${i}`);
  assert.equal((await check({ age: 72, drugs: tooMany })).status, 400);
});
