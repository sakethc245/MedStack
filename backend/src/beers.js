// Beers Criteria check: flags medications that appear on the 2023 AGS Beers
// Criteria list for adults 65 and older.
//
// Deterministic by design: every rule comes from the static data file in
// ./data/beers.json. This module never calls an LLM or any network service.

import { readFileSync } from 'node:fs';
import { tokenize, compileNames } from './drugNames.js';
import { isVerified } from './verification.js';

// Re-exported for existing callers; the implementation lives in drugNames.js.
export { tokenize };

/**
 * Build the Beers checker over a data file. Entries that are not verified
 * ("confirmed" or "corrected") are ignored.
 */
export function createBeersChecker(data) {
  const minAge = data.minimumAge;
  const entries = data.entries.filter(isVerified).map((entry) => ({
    entry,
    matches: compileNames([...entry.generics, ...entry.brands]),
  }));

  /** True when `age` is a real number at or above the Beers age threshold. */
  function beersApplies(age) {
    return typeof age === 'number' && Number.isFinite(age) && age >= minAge;
  }

  /**
   * @param {number} age
   * @param {string[]} drugs  drug names as the user entered / scanned them
   * @returns {{drug:string, entryId:string, class:string, reason:string, recommendation:string, source:string}[]}
   *   One flag per (drug, matching entry). Empty when age is missing, not a
   *   number, or under 65.
   */
  function checkBeers(age, drugs) {
    if (!beersApplies(age) || !Array.isArray(drugs)) return [];

    const flags = [];
    for (const drug of drugs) {
      if (typeof drug !== 'string') continue;
      const words = tokenize(drug);
      if (words.length === 0) continue;
      for (const { entry, matches } of entries) {
        if (matches(words)) {
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

  return { minAge, source: data.source, beersApplies, checkBeers };
}

const data = JSON.parse(readFileSync(new URL('./data/beers.json', import.meta.url), 'utf8'));
const checker = createBeersChecker(data);

export const BEERS_MIN_AGE = checker.minAge;
export const BEERS_SOURCE = checker.source;
export const beersApplies = checker.beersApplies;
export const checkBeers = checker.checkBeers;
