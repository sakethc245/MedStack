import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { checkDrugDisease, CONDITIONS } from '../src/drugDisease.js';
import { app } from '../src/server.js';

// ---- Matcher ----

test('metoclopramide with Parkinson disease at age 72 is flagged', () => {
  const flags = checkDrugDisease(72, ['parkinson-disease'], ['metoclopramide']);
  assert.equal(flags.length, 1);
  const [flag] = flags;
  assert.equal(flag.drug, 'metoclopramide');
  assert.equal(flag.conditionId, 'parkinson-disease');
  assert.equal(flag.conditionLabel, 'Parkinson disease');
  assert.equal(flag.entryId, 'parkinson-antiemetics');
  for (const field of ['class', 'reason', 'recommendation', 'source']) {
    assert.ok(flag[field], `flag has ${field}`);
  }
});

test('the same inputs at age 40 return nothing (Beers entries are 65+)', () => {
  assert.deepEqual(checkDrugDisease(40, ['parkinson-disease'], ['metoclopramide']), []);
  assert.deepEqual(checkDrugDisease(64, ['parkinson-disease'], ['metoclopramide']), []);
  assert.equal(checkDrugDisease(65, ['parkinson-disease'], ['metoclopramide']).length, 1);
});

test('missing or non-numeric age returns nothing', () => {
  for (const age of [undefined, null, NaN, '72']) {
    assert.deepEqual(checkDrugDisease(age, ['parkinson-disease'], ['metoclopramide']), [], String(age));
  }
});

test('a condition the user did not select returns nothing', () => {
  assert.deepEqual(checkDrugDisease(72, ['heart-failure'], ['metoclopramide']), []);
});

test('an empty conditions list returns no flags', () => {
  assert.deepEqual(checkDrugDisease(72, [], ['metoclopramide', 'ibuprofen']), []);
});

test('brand names match, ignoring dosage and case', () => {
  const flags = checkDrugDisease(72, ['parkinson-disease'], ['Reglan 10 mg tablet']);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].entryId, 'parkinson-antiemetics');
});

test('drug classes resolve to their listed generics and brands', () => {
  const ids = (flags) => flags.map((f) => f.entryId);
  assert.deepEqual(ids(checkDrugDisease(80, ['heart-failure'], ['ibuprofen'])), ['heart-failure-nsaids']);
  assert.deepEqual(ids(checkDrugDisease(80, ['ckd-stage-4-5'], ['Celebrex'])), ['ckd-nsaids']);
  assert.deepEqual(ids(checkDrugDisease(80, ['dementia'], ['lorazepam'])), ['dementia-benzodiazepines']);
});

test('documented exceptions are not flagged', () => {
  // Quetiapine and clozapine are exempt from the Parkinson antipsychotic entry.
  assert.deepEqual(checkDrugDisease(72, ['parkinson-disease'], ['quetiapine', 'clozapine']), []);
  // Urinary antimuscarinics are exempt from the enlarged-prostate entry.
  assert.deepEqual(checkDrugDisease(72, ['bph'], ['oxybutynin']), []);
});

test('whole words only, and unlisted drugs are not flagged', () => {
  assert.deepEqual(checkDrugDisease(72, ['parkinson-disease'], ['metformin', 'reglanex']), []);
});

test('one drug can be flagged for several selected conditions', () => {
  const flags = checkDrugDisease(72, ['dementia', 'falls-fractures'], ['zolpidem']);
  assert.deepEqual(flags.map((f) => f.conditionId).sort(), ['dementia', 'falls-fractures']);
});

test('every condition has an id, a label and at least one code', () => {
  assert.ok(CONDITIONS.length >= 8);
  for (const c of CONDITIONS) {
    assert.ok(c.id && c.label, c.id);
    assert.ok(Array.isArray(c.codes) && c.codes.length > 0, `${c.id} codes`);
  }
});

// ---- Endpoints ----

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function check(body) {
  const res = await fetch(`${base}/api/drug-disease-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

test('GET /api/conditions returns the list with codes', async () => {
  const res = await fetch(`${base}/api/conditions`);
  assert.equal(res.status, 200);
  const { conditions } = await res.json();
  const parkinson = conditions.find((c) => c.id === 'parkinson-disease');
  assert.equal(parkinson.label, 'Parkinson disease');
  assert.deepEqual(parkinson.codes, ['G20']);
});

test('POST /api/drug-disease-check flags a matching drug and condition', async () => {
  const { status, data } = await check({ age: 72, conditions: ['parkinson-disease'], drugs: ['Reglan', 'metformin'] });
  assert.equal(status, 200);
  assert.equal(data.flags.length, 1);
  assert.equal(data.flags[0].drug, 'Reglan');
  assert.equal(data.flags[0].conditionLabel, 'Parkinson disease');
});

test('age 40, an unselected condition, and empty conditions all return no flags', async () => {
  for (const body of [
    { age: 40, conditions: ['parkinson-disease'], drugs: ['metoclopramide'] },
    { age: 72, conditions: ['heart-failure'], drugs: ['metoclopramide'] },
    { age: 72, conditions: [], drugs: ['metoclopramide'] },
  ]) {
    const { status, data } = await check(body);
    assert.equal(status, 200);
    assert.deepEqual(data.flags, []);
  }
});

test('invalid condition ids return 400', async () => {
  for (const conditions of [['not-a-condition'], ['parkinson-disease', 7], 'parkinson-disease', undefined]) {
    const { status, data } = await check({ age: 72, conditions, drugs: ['metoclopramide'] });
    assert.equal(status, 400, JSON.stringify(conditions));
    assert.ok(data.error);
  }
  const tooMany = Array.from({ length: 21 }, () => 'parkinson-disease');
  assert.equal((await check({ age: 72, conditions: tooMany, drugs: [] })).status, 400);
});

test('invalid age returns 400', async () => {
  for (const age of [undefined, null, '72', 72.5, -1, 121]) {
    const { status } = await check({ age, conditions: ['parkinson-disease'], drugs: ['metoclopramide'] });
    assert.equal(status, 400, `age ${age}`);
  }
});

test('invalid drugs return 400', async () => {
  const conditions = ['parkinson-disease'];
  assert.equal((await check({ age: 72, conditions })).status, 400);
  assert.equal((await check({ age: 72, conditions, drugs: ['ok', 5] })).status, 400);
  const tooMany = Array.from({ length: 11 }, (_, i) => `drug${i}`);
  assert.equal((await check({ age: 72, conditions, drugs: tooMany })).status, 400);
});
