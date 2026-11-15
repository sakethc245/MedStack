// Heart failure and ejection fraction.
//
// The 2023 AGS Beers Criteria (Table 3, row "Heart failure") limit diltiazem
// and verapamil to heart failure with reduced ejection fraction, and apply the
// other heart failure entries to heart failure in general.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { checkDrugDisease, CONDITIONS } from '../src/drugDisease.js';
import { app } from '../src/server.js';

const HF = 'heart-failure';
const HFREF = 'heart-failure-reduced-ef';
const EF_QUALIFIER = 'Applies if your heart failure has reduced ejection fraction - ask your doctor.';
const CCB = 'heart-failure-nondihydropyridine-ccb';

test('diltiazem and verapamil are a normal flag for reduced-ejection-fraction heart failure', () => {
  for (const drug of ['diltiazem', 'verapamil', 'Cardizem']) {
    const flags = checkDrugDisease(72, [HFREF], [drug]);
    assert.equal(flags.length, 1, drug);
    assert.equal(flags[0].entryId, CCB);
    assert.equal(flags[0].conditionId, HFREF);
    assert.equal(flags[0].conditionLabel, 'Heart failure with reduced ejection fraction (HFrEF)');
    assert.equal(flags[0].qualifier, undefined);
    assert.equal(flags[0].recommendation, 'Avoid in heart failure with reduced ejection fraction.');
  }
});

test('with only general heart failure they are still shown, labeled with the qualifier', () => {
  const flags = checkDrugDisease(72, [HF], ['diltiazem']);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].entryId, CCB);
  assert.equal(flags[0].conditionId, HF);
  assert.equal(flags[0].conditionLabel, 'Heart failure');
  assert.equal(flags[0].qualifier, EF_QUALIFIER);
});

test('selecting both conditions gives one normal flag, not two', () => {
  const flags = checkDrugDisease(72, [HF, HFREF], ['verapamil']);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].conditionId, HFREF);
  assert.equal(flags[0].qualifier, undefined);
});

test('entries the paper applies to all heart failure are flagged for both conditions, without a qualifier', () => {
  for (const conditions of [[HF], [HFREF]]) {
    const flags = checkDrugDisease(72, conditions, ['cilostazol', 'ibuprofen', 'pioglitazone']);
    assert.deepEqual(
      flags.map((f) => f.entryId),
      ['heart-failure-cilostazol', 'heart-failure-nsaids', 'heart-failure-thiazolidinediones'],
      conditions[0]
    );
    for (const f of flags) {
      assert.equal(f.conditionId, HF);
      assert.equal(f.conditionLabel, 'Heart failure');
      assert.equal(f.qualifier, undefined);
    }
  }
});

test('diltiazem is not flagged for an unrelated condition, or under 65', () => {
  assert.deepEqual(checkDrugDisease(72, ['syncope', 'dementia'], ['diltiazem']), []);
  assert.deepEqual(checkDrugDisease(40, [HF, HFREF], ['diltiazem']), []);
});

test('only the reduced-ejection-fraction entry carries a qualifier', () => {
  const flags = checkDrugDisease(72, [HF], ['diltiazem', 'cilostazol', 'ibuprofen', 'pioglitazone']);
  assert.deepEqual(flags.filter((f) => f.qualifier).map((f) => f.entryId), [CCB]);
});

test('the reduced-ejection-fraction condition is offered with a hint and its codes', () => {
  const hfref = CONDITIONS.find((c) => c.id === HFREF);
  assert.ok(hfref, 'condition exists');
  assert.match(hfref.hint, /ejection fraction/);
  assert.deepEqual(hfref.codes, ['I50.2', 'I50.4']);
  const general = CONDITIONS.find((c) => c.id === HF);
  assert.deepEqual(general.codes, ['I50']);
  assert.ok(general.hint);
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
  const res = await fetch(`${base}/api/drug-disease-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

test('the endpoint accepts the new condition and returns the qualifier for general heart failure', async () => {
  const specific = await check({ age: 72, conditions: [HFREF], drugs: ['diltiazem'] });
  assert.equal(specific.status, 200);
  assert.equal(specific.data.flags[0].conditionId, HFREF);
  assert.equal('qualifier' in specific.data.flags[0], false);

  const general = await check({ age: 72, conditions: [HF], drugs: ['diltiazem'] });
  assert.equal(general.status, 200);
  assert.equal(general.data.flags[0].qualifier, EF_QUALIFIER);

  const list = await (await fetch(`${base}/api/conditions`)).json();
  const hfref = list.conditions.find((c) => c.id === HFREF);
  assert.match(hfref.hint, /ejection fraction/);
});
