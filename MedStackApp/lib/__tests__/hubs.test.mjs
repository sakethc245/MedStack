// Run with `npm test` (Node 22.18+ runs the TypeScript source directly).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findHubs, HUB_MIN_INTERACTIONS, HUB_MIN_STACK_SIZE } from '../hubs.ts';

const pair = (drugA, drugB, severity, extra = {}) => ({
  drugA,
  drugB,
  severity,
  summary: '',
  action: '',
  source: 'live',
  ...extra,
});

test('thresholds are the documented constants', () => {
  assert.equal(HUB_MIN_INTERACTIONS, 2);
  assert.equal(HUB_MIN_STACK_SIZE, 3);
});

test('two yellow-or-red interactions make a hub', () => {
  const hubs = findHubs(
    ['warfarin', 'ibuprofen', 'aspirin'],
    [
      pair('warfarin', 'ibuprofen', 'red'),
      pair('warfarin', 'aspirin', 'yellow'),
      pair('ibuprofen', 'aspirin', 'green'),
    ]
  );
  assert.equal(hubs.length, 1);
  assert.equal(hubs[0].drug, 'warfarin');
  assert.deepEqual(hubs[0].partners, [
    { name: 'ibuprofen', severity: 'red' },
    { name: 'aspirin', severity: 'yellow' },
  ]);
});

test('one interaction does not make a hub', () => {
  const hubs = findHubs(
    ['warfarin', 'ibuprofen', 'metformin'],
    [
      pair('warfarin', 'ibuprofen', 'red'),
      pair('warfarin', 'metformin', 'green'),
      pair('ibuprofen', 'metformin', 'green'),
    ]
  );
  assert.deepEqual(hubs, []);
});

test('green does not count', () => {
  const hubs = findHubs(
    ['a', 'b', 'c', 'd'],
    [pair('a', 'b', 'green'), pair('a', 'c', 'green'), pair('a', 'd', 'yellow')]
  );
  assert.deepEqual(hubs, []);
});

test('stacks under 3 drugs do nothing', () => {
  assert.deepEqual(findHubs(['a', 'b'], [pair('a', 'b', 'red')]), []);
  assert.deepEqual(findHubs([], []), []);
  // Stale pairs for drugs that left the stack must not create a hub either.
  assert.deepEqual(findHubs(['a', 'b'], [pair('a', 'b', 'red'), pair('a', 'c', 'red')]), []);
});

test('failed lookups (source "unknown") do not count', () => {
  const hubs = findHubs(
    ['a', 'b', 'c'],
    [pair('a', 'b', 'yellow', { source: 'unknown' }), pair('a', 'c', 'yellow', { source: 'unknown' })]
  );
  assert.deepEqual(hubs, []);
});

test('pairs for drugs no longer in the stack are ignored', () => {
  const hubs = findHubs(['a', 'b', 'c'], [pair('a', 'b', 'red'), pair('a', 'gone', 'red')]);
  assert.deepEqual(hubs, []);
});

test('matching is case-insensitive, duplicates count once, strongest hub first', () => {
  const hubs = findHubs(
    ['Alpha', 'beta', 'gamma', 'delta'],
    [
      pair('alpha', 'BETA', 'yellow'),
      pair('beta', 'alpha', 'red'), // same pair again: one partner, worst severity kept
      pair('alpha', 'gamma', 'yellow'),
      pair('alpha', 'delta', 'yellow'),
      pair('beta', 'gamma', 'red'),
    ]
  );
  assert.deepEqual(hubs.map((h) => h.drug), ['Alpha', 'beta', 'gamma']);
  assert.equal(hubs[0].partners.length, 3);
  assert.deepEqual(hubs[0].partners[0], { name: 'beta', severity: 'red' });
});
