// Shared drug class lists (./data/drug_classes.json), used by the drug-disease
// and stack-pattern checks so the lists live in exactly one place.

import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('./data/drug_classes.json', import.meta.url), 'utf8'));

/**
 * Every generic and brand name in the given classes.
 * Throws on an unknown class key, so a typo in a data file fails at startup
 * (and in tests) instead of silently matching nothing.
 */
export function classNames(classKeys, citedBy = 'a data file') {
  const names = [];
  for (const key of classKeys) {
    const cls = data.classes[key];
    if (!cls) throw new Error(`${citedBy} cites unknown drug class "${key}"`);
    names.push(...cls.generics, ...cls.brands);
  }
  return names;
}
