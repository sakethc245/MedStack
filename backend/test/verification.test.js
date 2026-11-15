// Unverified data must never reach users: every matcher ignores any entry
// whose `verified` field is not "confirmed" or "corrected".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isVerified, VERIFIED_STATUSES } from '../src/verification.js';
import { createBeersChecker } from '../src/beers.js';
import { createDrugDiseaseChecker } from '../src/drugDisease.js';
import { createStackPatternChecker } from '../src/stackPatterns.js';
import { createClassNames } from '../src/drugClasses.js';

const readData = (file) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8'));

// ---- isVerified ----

test('only "confirmed" and "corrected" count as verified', () => {
  assert.deepEqual([...VERIFIED_STATUSES], ['confirmed', 'corrected']);
  assert.equal(isVerified({ verified: 'confirmed' }), true);
  assert.equal(isVerified({ verified: 'corrected' }), true);
  for (const entry of [{ verified: 'unverified' }, { verified: 'removed' }, { verified: true }, { verified: '' }, {}, null, undefined]) {
    assert.equal(isVerified(entry), false, JSON.stringify(entry));
  }
});

// ---- Beers ----

const beersEntry = (id, generic, verified) => ({
  id,
  generics: [generic],
  brands: [],
  class: 'Test class',
  reason: 'reason',
  recommendation: 'Avoid.',
  source: 'test',
  ...(verified === undefined ? {} : { verified }),
});

test('Beers checker ignores unverified entries and entries with no verified field', () => {
  const { checkBeers } = createBeersChecker({
    minimumAge: 65,
    source: 'test',
    entries: [
      beersEntry('a', 'alphadrug', 'confirmed'),
      beersEntry('b', 'betadrug', 'corrected'),
      beersEntry('c', 'gammadrug', 'unverified'),
      beersEntry('d', 'deltadrug', undefined),
    ],
  });
  const flags = checkBeers(72, ['alphadrug', 'betadrug', 'gammadrug', 'deltadrug']);
  assert.deepEqual(flags.map((f) => f.entryId), ['a', 'b']);
});

// ---- Drug classes ----

const classData = {
  classes: {
    'verified-class': { generics: ['goodone'], brands: ['goodbrand'], verified: 'confirmed' },
    'unverified-class': { generics: ['badone'], brands: ['badbrand'], verified: 'unverified' },
    'unstamped-class': { generics: ['nostamp'], brands: [] },
  },
};

test('an unverified drug class contributes no names; an unknown class still throws', () => {
  const classNames = createClassNames(classData);
  assert.deepEqual(classNames(['verified-class']), ['goodone', 'goodbrand']);
  assert.deepEqual(classNames(['unverified-class', 'unstamped-class']), []);
  assert.deepEqual(classNames(['verified-class', 'unverified-class']), ['goodone', 'goodbrand']);
  assert.throws(() => classNames(['no-such-class'], 'test'), /unknown drug class/);
});

// ---- Drug-disease ----

const condition = (id, verified) => ({ id, label: `Label ${id}`, codes: ['X00'], synonyms: [], verified });
const ddEntry = (id, conditionId, generic, verified, drugClasses) => ({
  id,
  conditionId,
  generics: generic ? [generic] : [],
  brands: [],
  ...(drugClasses ? { drugClasses } : {}),
  class: 'Test class',
  reason: 'reason',
  recommendation: 'Avoid.',
  minAge: 65,
  source: 'test',
  verified,
});

function ddChecker(entries) {
  return createDrugDiseaseChecker({
    conditionData: { conditions: [condition('good', 'confirmed'), condition('unchecked', 'unverified')] },
    ruleData: { entries },
    classNames: createClassNames(classData),
  });
}

test('drug-disease checker ignores unverified entries', () => {
  const { checkDrugDisease } = ddChecker([
    ddEntry('ok', 'good', 'alphadrug', 'confirmed'),
    ddEntry('fixed', 'good', 'betadrug', 'corrected'),
    ddEntry('pending', 'good', 'gammadrug', 'unverified'),
  ]);
  const flags = checkDrugDisease(72, ['good'], ['alphadrug', 'betadrug', 'gammadrug']);
  assert.deepEqual(flags.map((f) => f.entryId), ['ok', 'fixed']);
});

test('an unverified condition is not offered, is not a known id, and produces no flags', () => {
  const { CONDITIONS, isKnownCondition, checkDrugDisease } = ddChecker([
    ddEntry('on-unchecked-condition', 'unchecked', 'alphadrug', 'confirmed'),
  ]);
  assert.deepEqual(CONDITIONS.map((c) => c.id), ['good']);
  assert.equal(isKnownCondition('good'), true);
  assert.equal(isKnownCondition('unchecked'), false);
  assert.deepEqual(checkDrugDisease(72, ['unchecked'], ['alphadrug']), []);
});

test('a verified entry does not match through an unverified drug class', () => {
  const { checkDrugDisease } = ddChecker([
    ddEntry('via-classes', 'good', null, 'confirmed', ['verified-class', 'unverified-class']),
  ]);
  assert.deepEqual(checkDrugDisease(72, ['good'], ['goodone']).map((f) => f.entryId), ['via-classes']);
  assert.deepEqual(checkDrugDisease(72, ['good'], ['badone', 'badbrand']), []);
});

test('an entry citing a condition or class that does not exist still fails loudly', () => {
  assert.throws(() => ddChecker([ddEntry('typo', 'no-such-condition', 'alphadrug', 'confirmed')]), /unknown condition/);
  assert.throws(() => ddChecker([ddEntry('typo', 'good', null, 'unverified', ['no-such-class'])]), /unknown drug class/);
});

// ---- Stack patterns ----

const pairPattern = (id, verified) => ({
  id,
  label: `Label ${id}`,
  type: 'pair',
  groupA: ['verified-class'],
  groupB: ['second-class'],
  reason: 'reason',
  recommendation: 'Avoid.',
  minAge: 65,
  source: 'test',
  verified,
});

test('stack-pattern checker ignores unverified patterns and unverified classes', () => {
  const classes = {
    classes: {
      ...classData.classes,
      'second-class': { generics: ['othertwo'], brands: [], verified: 'corrected' },
    },
  };
  const check = createStackPatternChecker({
    data: {
      patterns: [
        pairPattern('ok', 'confirmed'),
        pairPattern('pending', 'unverified'),
        { ...pairPattern('via-unverified-class', 'confirmed'), groupA: ['unverified-class'] },
      ],
    },
    classNames: createClassNames(classes),
  });
  assert.deepEqual(check(72, ['goodone', 'othertwo']).map((i) => i.id), ['ok']);
  assert.deepEqual(check(72, ['badone', 'othertwo']), []);
});

// ---- The shipped data files ----

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertStamped(kind, id, entry) {
  assert.ok(
    ['confirmed', 'corrected', 'unverified'].includes(entry.verified),
    `${kind} "${id}" needs verified = confirmed | corrected | unverified`
  );
  assert.ok(typeof entry.verifiedAgainst === 'string' && entry.verifiedAgainst.length > 0, `${kind} "${id}" needs verifiedAgainst`);
  assert.match(String(entry.verifiedOn), DATE, `${kind} "${id}" needs verifiedOn (YYYY-MM-DD)`);
}

test('every entry in every data file carries verified, verifiedAgainst and verifiedOn', () => {
  readData('beers.json').entries.forEach((e) => assertStamped('Beers entry', e.id, e));
  readData('drug_disease.json').entries.forEach((e) => assertStamped('drug-disease entry', e.id, e));
  readData('stack_patterns.json').patterns.forEach((p) => assertStamped('stack pattern', p.id, p));
  readData('conditions.json').conditions.forEach((c) => assertStamped('condition', c.id, c));
  Object.entries(readData('drug_classes.json').classes).forEach(([key, cls]) => assertStamped('drug class', key, cls));
});

test('drugs the audit removed are no longer flagged', () => {
  const dd = createDrugDiseaseChecker({
    conditionData: readData('conditions.json'),
    ruleData: readData('drug_disease.json'),
    classNames: createClassNames(readData('drug_classes.json')),
  });
  // Dropped from the 2023 tables (the paper's Table 8).
  assert.deepEqual(dd.checkDrugDisease(72, ['heart-failure'], ['rosiglitazone', 'Avandia']), []);
  assert.deepEqual(dd.checkDrugDisease(72, ['syncope', 'parkinson-disease', 'dementia'], ['thioridazine']), []);
  // Still flagged: the drugs the 2023 tables do list.
  assert.equal(dd.checkDrugDisease(72, ['heart-failure'], ['pioglitazone']).length, 1);
  assert.equal(dd.checkDrugDisease(72, ['syncope'], ['olanzapine']).length, 1);
  // An alias RxNorm matched to an unrelated drug must not trigger the warfarin pattern.
  const patterns = createStackPatternChecker({
    data: readData('stack_patterns.json'),
    classNames: createClassNames(readData('drug_classes.json')),
  });
  assert.deepEqual(patterns(72, ['warfarin', 'cotrimoxazole']), []);
  assert.equal(patterns(72, ['warfarin', 'Bactrim']).length, 1);
});
