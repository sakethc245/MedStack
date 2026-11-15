// Drug-disease check: flags medications that are potentially inappropriate
// with a condition the user has selected.
//
// Deterministic by design: every rule comes from the static data files in
// ./data (conditions.json, drug_disease.json, and the shared class lists in
// drug_classes.json). This module never calls an LLM or any network service,
// and never logs its inputs — conditions are health data.

import { readFileSync } from 'node:fs';
import { tokenize, compileNames } from './drugNames.js';
import { classNames } from './drugClasses.js';

const readData = (file) => JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), 'utf8'));

const conditionData = readData('conditions.json');
const ruleData = readData('drug_disease.json');

/** Conditions offered in the picker: { id, label, codes, synonyms }. */
export const CONDITIONS = conditionData.conditions.map(({ id, label, codes, synonyms }) => ({
  id,
  label,
  codes,
  synonyms,
}));

const CONDITION_LABELS = new Map(CONDITIONS.map((c) => [c.id, c.label]));

export const isKnownCondition = (id) => typeof id === 'string' && CONDITION_LABELS.has(id);

// Resolve each entry's own names plus the names of any drug classes it cites.
const ENTRIES = ruleData.entries.map((entry) => {
  const names = [
    ...entry.generics,
    ...entry.brands,
    ...classNames(entry.drugClasses || [], `drug_disease.json: entry "${entry.id}"`),
  ];
  if (!CONDITION_LABELS.has(entry.conditionId)) {
    throw new Error(`drug_disease.json: entry "${entry.id}" cites unknown condition "${entry.conditionId}"`);
  }
  return { entry, matches: compileNames(names) };
});

/**
 * An entry applies when the user's age meets its own minimum. Beers-sourced
 * entries carry minAge 65; entries from other sources may set a lower one (or
 * 0 for "any age"). A missing or non-numeric age only satisfies minAge 0.
 */
function meetsMinAge(age, minAge) {
  const min = Number.isFinite(minAge) ? minAge : 0;
  if (min <= 0) return true;
  return typeof age === 'number' && Number.isFinite(age) && age >= min;
}

/**
 * @param {number} age
 * @param {string[]} conditionIds  ids from conditions.json the user selected
 * @param {string[]} drugs         drug names as the user entered / scanned them
 * @returns {{drug:string, conditionId:string, conditionLabel:string, entryId:string, class:string, reason:string, recommendation:string, source:string}[]}
 *   One flag per (drug, matching entry).
 */
export function checkDrugDisease(age, conditionIds, drugs) {
  if (!Array.isArray(conditionIds) || !Array.isArray(drugs)) return [];
  const selected = new Set(conditionIds.filter(isKnownCondition));
  if (selected.size === 0) return [];

  const applicable = ENTRIES.filter(
    ({ entry }) => selected.has(entry.conditionId) && meetsMinAge(age, entry.minAge)
  );
  if (applicable.length === 0) return [];

  const flags = [];
  for (const drug of drugs) {
    if (typeof drug !== 'string') continue;
    const words = tokenize(drug);
    if (words.length === 0) continue;
    for (const { entry, matches } of applicable) {
      if (matches(words)) {
        flags.push({
          drug,
          conditionId: entry.conditionId,
          conditionLabel: CONDITION_LABELS.get(entry.conditionId),
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
