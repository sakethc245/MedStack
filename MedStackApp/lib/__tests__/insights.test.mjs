// Run with `npm test` (Node 22.18+ runs the TypeScript source directly).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights, MAX_INSIGHTS, pairKey } from '../insights.ts';

const same = (name) => name;
const pair = (drugA, drugB, severity) => ({ drugA, drugB, severity, summary: '', action: '', source: 'live' });
const hub = (drug, ...partners) => ({ drug, partners: partners.map((name) => ({ name, severity: 'yellow' })) });
const pairPattern = (id, a, b) => ({
  id,
  label: `Label ${id}`,
  type: 'pair',
  drugsInvolved: [a, b],
  pairs: [[a, b]],
  reason: 'reason',
  recommendation: 'recommendation',
  source: 'AGS 2023 Beers Criteria, Table 5',
});
const countPattern = (id, ...drugs) => ({
  id,
  label: `Label ${id}`,
  type: 'count',
  drugsInvolved: drugs,
  pairs: [],
  reason: 'reason',
  recommendation: 'recommendation',
  source: 'AGS 2023 Beers Criteria, Table 5',
});

test('hubs come first, then patterns, each with a fixed-template line', () => {
  const result = buildInsights(
    [hub('warfarin', 'ibuprofen', 'aspirin')],
    [countPattern('three-cns-active', 'a', 'b', 'c')],
    [],
    same
  );
  assert.deepEqual(result.shown.map((i) => i.kind), ['hub', 'pattern']);
  assert.equal(
    result.shown[0].line,
    'warfarin interacts with 2 other medications in this stack. It may be the one to ask a pharmacist about first.'
  );
  assert.equal(result.shown[1].line, 'Label three-cns-active: a, b and c.');
  assert.equal(result.hiddenCount, 0);
});

test('a pair pattern already shown as red is left out and noted on the pair instead', () => {
  const pattern = pairPattern('opioid-benzodiazepine', 'oxycodone', 'lorazepam');
  const result = buildInsights([], [pattern], [pair('Lorazepam', 'oxycodone', 'red')], same);
  assert.deepEqual(result.shown, []);
  assert.deepEqual(result.pairNotes.get(pairKey('oxycodone', 'lorazepam')), [pattern]);
});

test('a pair pattern whose pair is yellow, green or missing is shown', () => {
  const pattern = pairPattern('opioid-benzodiazepine', 'oxycodone', 'lorazepam');
  for (const pairs of [[pair('oxycodone', 'lorazepam', 'yellow')], [pair('oxycodone', 'lorazepam', 'green')], []]) {
    const result = buildInsights([], [pattern], pairs, same);
    assert.equal(result.shown.length, 1);
    assert.equal(result.pairNotes.size, 0);
  }
});

test('a pair pattern is only left out when every pair it covers is red', () => {
  const pattern = {
    ...pairPattern('opioid-benzodiazepine', 'oxycodone', 'lorazepam'),
    drugsInvolved: ['oxycodone', 'lorazepam', 'alprazolam'],
    pairs: [
      ['oxycodone', 'lorazepam'],
      ['oxycodone', 'alprazolam'],
    ],
  };
  const result = buildInsights([], [pattern], [pair('oxycodone', 'lorazepam', 'red')], same);
  assert.equal(result.shown.length, 1);
});

test('count patterns are never treated as repeats', () => {
  const result = buildInsights(
    [],
    [countPattern('three-cns-active', 'a', 'b', 'c')],
    [pair('a', 'b', 'red'), pair('a', 'c', 'red'), pair('b', 'c', 'red')],
    same
  );
  assert.equal(result.shown.length, 1);
});

test(`at most ${MAX_INSIGHTS} insights are shown and the rest are counted`, () => {
  const result = buildInsights(
    [hub('a', 'b', 'c'), hub('b', 'a', 'c')],
    [countPattern('p1', 'a', 'b', 'c'), countPattern('p2', 'a', 'b'), countPattern('p3', 'b', 'c')],
    [],
    same
  );
  assert.equal(result.shown.length, MAX_INSIGHTS);
  assert.deepEqual(result.shown.map((i) => i.kind), ['hub', 'hub', 'pattern']);
  assert.equal(result.hiddenCount, 2);
});

test('display names are used in the text', () => {
  const labelFor = (name) => (name === 'ibuprofen' ? 'Advil' : name);
  const result = buildInsights([hub('ibuprofen', 'warfarin', 'aspirin')], [], [], labelFor);
  assert.match(result.shown[0].line, /^Advil interacts with 2/);
  assert.match(result.shown[0].reason, /warfarin \(use caution\) and aspirin \(use caution\)/);
});
