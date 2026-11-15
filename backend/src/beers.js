// Beers Criteria check: flags medications that appear on the 2023 AGS Beers
// Criteria list for adults 65 and older.
//
// Deterministic by design: every rule comes from the static data file in
// ./data/beers.json. This module never calls an LLM or any network service.

import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('./data/beers.json', import.meta.url), 'utf8'));

export const BEERS_MIN_AGE = data.minimumAge;
export const BEERS_SOURCE = data.source;

// Dosage units and dose-form words that carry no drug identity.
const NOISE_WORDS = new Set([
  'mg', 'mcg', 'g', 'ml', 'iu', 'unit', 'units',
  'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps',
  'caplet', 'caplets', 'pill', 'pills', 'oral', 'solution', 'suspension', 'liquid',
  'er', 'xr', 'xl', 'sr', 'cr', 'dr', 'ir', 'la', 'ec', 'odt',
  'extended', 'delayed', 'immediate', 'release',
  'hcl', 'hydrochloride',
]);

/**
 * Lowercase a drug name and split it into identity-bearing words: punctuation,
 * numbers / strengths ("10", "10mg", "0.5") and dose-form words are dropped.
 */
export function tokenize(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !/^\d/.test(w) && !NOISE_WORDS.has(w));
}

// Whole-word match: `needle` must appear as a contiguous run of whole words.
function containsWords(haystack, needle) {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((w, j) => haystack[i + j] === w)) return true;
  }
  return false;
}

const ENTRIES = data.entries.map((entry) => ({
  entry,
  names: [...entry.generics, ...entry.brands].map(tokenize),
}));

/** True when `age` is a real number at or above the Beers age threshold. */
export function beersApplies(age) {
  return typeof age === 'number' && Number.isFinite(age) && age >= BEERS_MIN_AGE;
}

/**
 * @param {number} age
 * @param {string[]} drugs  drug names as the user entered / scanned them
 * @returns {{drug:string, entryId:string, class:string, reason:string, recommendation:string, source:string}[]}
 *   One flag per (drug, matching entry). Empty when age is missing, not a
 *   number, or under 65.
 */
export function checkBeers(age, drugs) {
  if (!beersApplies(age) || !Array.isArray(drugs)) return [];

  const flags = [];
  for (const drug of drugs) {
    if (typeof drug !== 'string') continue;
    const words = tokenize(drug);
    if (words.length === 0) continue;
    for (const { entry, names } of ENTRIES) {
      if (names.some((name) => containsWords(words, name))) {
        flags.push({
          drug,
          entryId: entry.id,
          class: entry.class,
          reason: entry.reason,
          recommendation: entry.recommendation,
          source: entry.source,
        });
      }
    }
  }
  return flags;
}
