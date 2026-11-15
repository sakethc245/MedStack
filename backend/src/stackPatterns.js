// Stack patterns: concerns that come from drugs adding up across the whole
// stack (for example an opioid with a benzodiazepine, or three CNS-active
// drugs), rather than from one pair looked up on its own.
//
// Deterministic by design: every rule comes from ./data/stack_patterns.json
// and the shared class lists in ./data/drug_classes.json. This module never
// calls an LLM or any network service, and never logs its inputs.

import { readFileSync } from 'node:fs';
import { tokenize, compileNames } from './drugNames.js';
import { classNames as defaultClassNames } from './drugClasses.js';
import { isVerified } from './verification.js';

// Same rule as the drug-disease check: a missing or non-numeric age only
// satisfies entries with no minimum age.
function meetsMinAge(age, minAge) {
  const min = Number.isFinite(minAge) ? minAge : 0;
  if (min <= 0) return true;
  return typeof age === 'number' && Number.isFinite(age) && age >= min;
}

/**
 * Build the stack-pattern checker over its data file. Patterns and drug
 * classes that are not verified ("confirmed" or "corrected") are ignored.
 */
export function createStackPatternChecker({ data, classNames }) {
  const matcherFor = (pattern, classKeys) =>
    compileNames(classNames(classKeys, `stack_patterns.json: pattern "${pattern.id}"`));

  const patterns = [];
  for (const pattern of data.patterns) {
    // Validate every pattern, verified or not, so a broken data file fails loudly.
    let compiled;
    if (pattern.type === 'pair') {
      compiled = { pattern, inA: matcherFor(pattern, pattern.groupA), inB: matcherFor(pattern, pattern.groupB) };
    } else if (pattern.type === 'count') {
      if (!Number.isInteger(pattern.minCount) || pattern.minCount < 2) {
        throw new Error(`stack_patterns.json: pattern "${pattern.id}" needs an integer minCount of 2 or more`);
      }
      compiled = { pattern, inGroup: matcherFor(pattern, pattern.groups) };
    } else {
      throw new Error(`stack_patterns.json: pattern "${pattern.id}" has unknown type "${pattern.type}"`);
    }
    if (isVerified(pattern)) patterns.push(compiled);
  }

  /**
   * @param {number} age
   * @param {string[]} drugs  drug names as the user entered / scanned them
   * @returns {{id:string, label:string, type:'pair'|'count', drugsInvolved:string[], pairs:string[][], reason:string, recommendation:string, source:string}[]}
   *   `pairs` lists each [groupA drug, groupB drug] combination for a "pair"
   *   pattern and is empty for a "count" pattern.
   */
  return function checkStackPatterns(age, drugs) {
    if (!Array.isArray(drugs)) return [];

    // Distinct drugs only, so the same name entered twice is not "two drugs".
    const seen = new Set();
    const stack = [];
    for (const drug of drugs) {
      if (typeof drug !== 'string') continue;
      const words = tokenize(drug);
      const key = words.join(' ');
      if (words.length === 0 || seen.has(key)) continue;
      seen.add(key);
      stack.push({ drug, words });
    }
    if (stack.length < 2) return [];

    const insights = [];
    for (const entry of patterns) {
      const { pattern } = entry;
      if (!meetsMinAge(age, pattern.minAge)) continue;

      let drugsInvolved = [];
      const pairs = [];
      if (pattern.type === 'pair') {
        const a = stack.filter((d) => entry.inA(d.words));
        const b = stack.filter((d) => entry.inB(d.words));
        // Needs two different drugs: one product that sits in both groups is not a combination.
        for (const x of a) {
          for (const y of b) {
            if (x !== y) pairs.push([x.drug, y.drug]);
          }
        }
        if (pairs.length === 0) continue;
        const involved = new Set(pairs.flat());
        drugsInvolved = stack.filter((d) => involved.has(d.drug)).map((d) => d.drug);
      } else {
        const members = stack.filter((d) => entry.inGroup(d.words));
        if (members.length < pattern.minCount) continue;
        drugsInvolved = members.map((d) => d.drug);
      }

      insights.push({
        id: pattern.id,
        label: pattern.label,
        type: pattern.type,
        drugsInvolved,
        pairs,
        reason: pattern.reason,
        recommendation: pattern.recommendation,
        source: pattern.source,
      });
    }
    return insights;
  };
}

const data = JSON.parse(readFileSync(new URL('./data/stack_patterns.json', import.meta.url), 'utf8'));

export const checkStackPatterns = createStackPatternChecker({ data, classNames: defaultClassNames });
