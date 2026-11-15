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

// ---- Added entries: Table 2 ----

test('added Beers entries are flagged at 72 and not at 40', () => {
  const cases = [
    ['rivaroxaban', 'rivaroxaban'],
    ['Xarelto 20 mg', 'rivaroxaban'],
    ['dronedarone', 'dronedarone'],
    ['Multaq', 'dronedarone'],
    ['meprobamate', 'meprobamate'],
    ['benztropine', 'anticholinergic-antiparkinsonian'],
    ['trihexyphenidyl', 'anticholinergic-antiparkinsonian'],
    ['ergoloid mesylates', 'ergoloid-mesylates'],
    ['Hydergine', 'ergoloid-mesylates'],
    ['testosterone', 'androgens'],
    ['methyltestosterone', 'androgens'],
  ];
  for (const [drug, entryId] of cases) {
    assert.deepEqual(ids(checkBeers(72, [drug])), [entryId], drug);
    assert.deepEqual(checkBeers(40, [drug]), [], `${drug} at 40`);
  }
});

test('added Beers entries state the qualifier the app cannot check', () => {
  const rec = (drug) => checkBeers(72, [drug])[0].recommendation;
  assert.match(rec('rivaroxaban'), /long-term treatment of atrial fibrillation or venous thromboembolism/);
  assert.match(rec('rivaroxaban'), /only to long-term use/);
  assert.match(rec('dronedarone'), /permanent atrial fibrillation or severe or recently decompensated heart failure/);
  assert.match(rec('testosterone'), /unless indicated for confirmed hypogonadism with clinical symptoms/);
  assert.match(rec('benztropine'), /oral forms/);
});

// ---- Added entries: Table 3 ----

test('opioids are flagged under delirium', () => {
  for (const drug of ['oxycodone', 'morphine', 'Percocet', 'tramadol']) {
    assert.deepEqual(ids(checkDrugDisease(72, ['delirium'], [drug])), ['delirium-opioids'], drug);
  }
  assert.deepEqual(checkDrugDisease(40, ['delirium'], ['oxycodone']), []);
  assert.deepEqual(checkDrugDisease(72, ['dementia'], ['oxycodone']), []);
});

test('anticholinergics are flagged under history of falls or fractures', () => {
  assert.deepEqual(ids(checkDrugDisease(72, ['falls-fractures'], ['diphenhydramine'])), ['falls-anticholinergics']);
  assert.deepEqual(ids(checkDrugDisease(72, ['falls-fractures'], ['oxybutynin'])), ['falls-anticholinergics']);
  assert.deepEqual(checkDrugDisease(72, ['syncope'], ['diphenhydramine']), []);
});

test('dextromethorphan-quinidine is flagged in heart failure only as the combination', () => {
  for (const drug of ['dextromethorphan-quinidine', 'Dextromethorphan Hydrobromide/Quinidine Sulfate 20-10 mg', 'Nuedexta']) {
    assert.deepEqual(ids(checkDrugDisease(72, ['heart-failure'], [drug])), ['heart-failure-dextromethorphan-quinidine'], drug);
  }
  // Either drug alone (a cough medicine; an antiarrhythmic) is not the listed product.
  assert.deepEqual(checkDrugDisease(72, ['heart-failure'], ['dextromethorphan', 'quinidine']), []);
});

test('dronedarone is flagged in heart failure, with both symptom cases stated', () => {
  const flags = checkDrugDisease(72, ['heart-failure'], ['dronedarone']);
  assert.deepEqual(ids(flags), ['heart-failure-dronedarone']);
  assert.match(flags[0].recommendation, /without symptoms/);
  assert.match(flags[0].recommendation, /Avoid in heart failure with symptoms/);
  // It applies to all heart failure, so the reduced-ejection-fraction condition shows it too.
  assert.deepEqual(ids(checkDrugDisease(72, ['heart-failure-reduced-ef'], ['Multaq'])), ['heart-failure-dronedarone']);
});

test('aspirin is flagged under history of ulcers, alongside NSAIDs', () => {
  assert.deepEqual(ids(checkDrugDisease(72, ['peptic-ulcer'], ['aspirin'])), ['peptic-ulcer-aspirin']);
  assert.deepEqual(ids(checkDrugDisease(72, ['peptic-ulcer'], ['aspirin 81 mg', 'ibuprofen'])), ['peptic-ulcer-aspirin', 'peptic-ulcer-nsaids']);
  assert.deepEqual(checkDrugDisease(72, ['heart-failure'], ['aspirin']), []);
});

// ---- Added entries: Table 5 ----

test('added stack patterns fire for the listed pair and not for one drug alone', () => {
  assert.deepEqual(ids(checkStackPatterns(72, ['theophylline', 'cimetidine'])), ['theophylline-cimetidine']);
  assert.deepEqual(ids(checkStackPatterns(72, ['theophylline', 'Tagamet'])), ['theophylline-cimetidine']);
  assert.deepEqual(checkStackPatterns(72, ['theophylline', 'famotidine']), []);

  assert.deepEqual(ids(checkStackPatterns(72, ['phenytoin', 'Bactrim'])), ['phenytoin-trimethoprim-sulfamethoxazole']);
  assert.deepEqual(checkStackPatterns(72, ['phenytoin', 'clarithromycin']), []);

  assert.deepEqual(ids(checkStackPatterns(72, ['warfarin', 'sertraline'])), ['warfarin-ssri']);
  assert.deepEqual(ids(checkStackPatterns(72, ['Coumadin', 'Lexapro'])), ['warfarin-ssri']);
  assert.deepEqual(checkStackPatterns(72, ['warfarin', 'venlafaxine']), []);

  assert.deepEqual(checkStackPatterns(40, ['warfarin', 'sertraline']), []);
});
