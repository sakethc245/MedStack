import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBeers, tokenize } from '../src/beers.js';

test('age 70 with diphenhydramine is flagged', () => {
  const flags = checkBeers(70, ['diphenhydramine']);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].drug, 'diphenhydramine');
  assert.equal(flags[0].entryId, 'first-gen-antihistamines');
  for (const field of ['class', 'reason', 'recommendation', 'source']) {
    assert.ok(flags[0][field], `flag has ${field}`);
  }
});

test('age 40 with diphenhydramine is not flagged', () => {
  assert.deepEqual(checkBeers(40, ['diphenhydramine']), []);
});

test('threshold is 65: 64 gets none, 65 gets a flag', () => {
  assert.deepEqual(checkBeers(64, ['diphenhydramine']), []);
  assert.equal(checkBeers(65, ['diphenhydramine']).length, 1);
});

test('brand names match', () => {
  assert.equal(checkBeers(70, ['Benadryl'])[0].entryId, 'first-gen-antihistamines');
  assert.equal(checkBeers(70, ['Ambien'])[0].entryId, 'z-drugs');
  assert.equal(checkBeers(70, ['Tylenol PM'])[0].entryId, 'first-gen-antihistamines');
});

test('dosage, form words, case and punctuation are ignored', () => {
  for (const name of ['  Diphenhydramine 25 mg tablet ', 'DIPHENHYDRAMINE HCl, 25mg', 'zolpidem ER 12.5 mg']) {
    assert.equal(checkBeers(70, [name]).length, 1, name);
  }
});

test('metformin and other unlisted drugs are not flagged', () => {
  assert.deepEqual(checkBeers(70, ['metformin', 'lisinopril', 'atorvastatin']), []);
});

test('matches whole words, not substrings', () => {
  // "soma" is a listed brand; it must not match inside another word.
  assert.deepEqual(checkBeers(70, ['somatropin']), []);
  assert.deepEqual(checkBeers(70, ['tylenol']), []);
});

test('missing or invalid age returns no flags', () => {
  for (const age of [undefined, null, NaN, '70', 'old', {}, Infinity * 0]) {
    assert.deepEqual(checkBeers(age, ['diphenhydramine']), [], String(age));
  }
});

test('only the flagged drugs in a mixed stack are returned', () => {
  const flags = checkBeers(80, ['metformin', 'lorazepam', 'omeprazole']);
  assert.deepEqual(flags.map((f) => f.drug).sort(), ['lorazepam', 'omeprazole']);
});

test('tokenize strips strengths and form words', () => {
  assert.deepEqual(tokenize('Zolpidem ER 12.5 mg tablets'), ['zolpidem']);
  assert.deepEqual(tokenize('Tylenol PM'), ['tylenol', 'pm']);
});
