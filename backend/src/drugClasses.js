// Shared drug class lists (./data/drug_classes.json), used by the drug-disease
// and stack-pattern checks so the lists live in exactly one place.

import { readFileSync } from 'node:fs';
import { isVerified } from './verification.js';

/**
 * Build a `classNames(classKeys, citedBy)` lookup over a class-list data file.
 *
 * It returns every generic and brand name in the given classes. A class that
 * is not verified contributes no names, so unverified data never reaches a
 * matcher. An unknown class key throws, so a typo in a data file fails at
 * startup (and in tests) instead of silently matching nothing.
 */
export function createClassNames(classData) {
  return function classNames(classKeys, citedBy = 'a data file') {
    const names = [];
    for (const key of classKeys) {
      const cls = classData.classes[key];
      if (!cls || typeof cls !== 'object') {
        throw new Error(`${citedBy} cites unknown drug class "${key}"`);
      }
      if (!isVerified(cls)) continue;
      names.push(...cls.generics, ...cls.brands);
    }
    return names;
  };
}

const data = JSON.parse(readFileSync(new URL('./data/drug_classes.json', import.meta.url), 'utf8'));

export const classNames = createClassNames(data);
