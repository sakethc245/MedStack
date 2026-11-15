// Follow-ups to the data audit: drugs removed from class lists because the
// table does not state they are covered, and entries added from the gaps the
// audit listed. Every expectation here comes from a row of the 2023 AGS Beers
// Criteria (see each entry's `verifiedAgainst`).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBeers } from '../src/beers.js';
import { checkDrugDisease } from '../src/drugDisease.js';
import { checkStackPatterns } from '../src/stackPatterns.js';

const ids = (items) => items.map((i) => i.entryId || i.id);

// ---- Classification changes ----

test('gabapentin and pregabalin are no longer flagged by the falls antiepileptics entry', () => {
  // Table 3's falls row says only "Antiepileptics".
  assert.deepEqual(checkDrugDisease(72, ['falls-fractures'], ['gabapentin', 'pregabalin', 'Neurontin', 'Lyrica']), []);
  // Drugs RxClass lists as antiepileptics are still flagged.
  assert.deepEqual(ids(checkDrugDisease(72, ['falls-fractures'], ['phenytoin'])), ['falls-antiepileptics']);
  assert.deepEqual(ids(checkDrugDisease(72, ['falls-fractures'], ['levetiracetam'])), ['falls-antiepileptics']);
});

test('gabapentinoids still count toward three CNS-active drugs, where Table 5 names them', () => {
  assert.deepEqual(ids(checkStackPatterns(72, ['gabapentin', 'sertraline', 'zolpidem'])), ['three-cns-active']);
  assert.deepEqual(ids(checkStackPatterns(72, ['pregabalin', 'lorazepam', 'quetiapine'])), ['three-cns-active']);
  // And the opioid pairing is unchanged.
  assert.deepEqual(ids(checkStackPatterns(72, ['oxycodone', 'pregabalin'])), ['opioid-gabapentinoid']);
});

test('trimethoprim-sulfamethoxazole needs both drug names or a brand', () => {
  assert.deepEqual(checkStackPatterns(72, ['warfarin', 'sulfamethoxazole']), []);
  assert.deepEqual(checkStackPatterns(72, ['warfarin', 'trimethoprim']), []);
  for (const name of ['sulfamethoxazole-trimethoprim', 'Trimethoprim/Sulfamethoxazole DS 800-160 mg', 'Bactrim', 'Septra']) {
    assert.deepEqual(ids(checkStackPatterns(72, ['warfarin', name])), ['warfarin-antibiotics'], name);
  }
  assert.deepEqual(ids(checkStackPatterns(72, ['warfarin', 'clarithromycin'])), ['warfarin-antibiotics']);
});

test('sacubitril alone is not treated as an ACE inhibitor or ARB; the combination still is', () => {
  assert.deepEqual(checkStackPatterns(72, ['lithium', 'sacubitril']), []);
  assert.deepEqual(ids(checkStackPatterns(72, ['lithium', 'Entresto'])), ['lithium-acei-arb']);
  assert.deepEqual(ids(checkStackPatterns(72, ['lithium', 'sacubitril-valsartan'])), ['lithium-acei-arb']);
});
