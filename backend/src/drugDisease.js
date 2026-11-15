// Drug-disease check: flags medications that are potentially inappropriate
// with a condition the user has selected.
//
// Deterministic by design: every rule comes from the static data files in
// ./data (conditions.json, drug_disease.json, and the shared class lists in
// drug_classes.json). This module never calls an LLM or any network service,
// and never logs its inputs — conditions are health data.

import { readFileSync } from 'node:fs';
import { tokenize, compileNames } from './drugNames.js';
import { classNames as defaultClassNames } from './drugClasses.js';
import { isVerified } from './verification.js';

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
 * Build the drug-disease checker over its data files. Conditions, entries and
 * drug classes that are not verified ("confirmed" or "corrected") are ignored:
 * an unverified condition is not offered and is not a known id, and an
 * unverified entry never produces a flag.
 *
 * Two optional fields let the data follow a source that limits a criterion to
 * a narrower condition:
 *   - a condition's `includes` lists broader conditions whose entries also
 *     apply when it is selected (reduced-ejection-fraction heart failure is
 *     still heart failure);
 *   - an entry's `alsoShowFor` lists other conditions under which the flag is
 *     still shown, each with a `qualifier` sentence saying when it applies, so
 *     the flag is labeled rather than silently dropped.
 */
export function createDrugDiseaseChecker({ conditionData, ruleData, classNames }) {
  const allConditionIds = new Set(conditionData.conditions.map((c) => c.id));

  /** Conditions offered in the picker: { id, label, codes, synonyms, hint? }. */
  const CONDITIONS = conditionData.conditions
    .filter(isVerified)
    .map(({ id, label, codes, synonyms, hint }) => ({ id, label, codes, synonyms, ...(hint ? { hint } : {}) }));

  const labels = new Map(CONDITIONS.map((c) => [c.id, c.label]));
  const isKnownCondition = (id) => typeof id === 'string' && labels.has(id);

  // condition id -> the broader conditions it includes (verified ones only).
  const includes = new Map();
  for (const condition of conditionData.conditions) {
    for (const broader of condition.includes || []) {
      if (!allConditionIds.has(broader)) {
        throw new Error(`conditions.json: condition "${condition.id}" includes unknown condition "${broader}"`);
      }
    }
    includes.set(condition.id, (condition.includes || []).filter((id) => labels.has(id)));
  }

  // Resolve each entry's own names plus the names of any drug classes it cites.
  const entries = [];
  for (const entry of ruleData.entries) {
    // A typo in a data file should fail loudly, verified or not.
    if (!allConditionIds.has(entry.conditionId)) {
      throw new Error(`drug_disease.json: entry "${entry.id}" cites unknown condition "${entry.conditionId}"`);
    }
    for (const also of entry.alsoShowFor || []) {
      if (!allConditionIds.has(also.conditionId)) {
        throw new Error(`drug_disease.json: entry "${entry.id}" alsoShowFor cites unknown condition "${also.conditionId}"`);
      }
      if (typeof also.qualifier !== 'string' || !also.qualifier.trim()) {
        throw new Error(`drug_disease.json: entry "${entry.id}" alsoShowFor "${also.conditionId}" needs a qualifier sentence`);
      }
    }
    const classBased = classNames(entry.drugClasses || [], `drug_disease.json: entry "${entry.id}"`);
    if (!isVerified(entry) || !labels.has(entry.conditionId)) continue;
    entries.push({
      entry,
      alsoShowFor: (entry.alsoShowFor || []).filter((also) => labels.has(also.conditionId)),
      matches: compileNames([...entry.generics, ...entry.brands, ...classBased]),
    });
  }

  // Which condition (if any) makes this entry apply for the selected set.
  // The entry's own condition wins and gives a normal flag; otherwise the first
  // selected `alsoShowFor` condition gives a flag carrying its qualifier.
  function matchCondition({ entry, alsoShowFor }, selected) {
    if (selected.has(entry.conditionId)) return { conditionId: entry.conditionId };
    const also = alsoShowFor.find((a) => selected.has(a.conditionId));
    return also ? { conditionId: also.conditionId, qualifier: also.qualifier } : null;
  }

  /**
   * @param {number} age
   * @param {string[]} conditionIds  ids from conditions.json the user selected
   * @param {string[]} drugs         drug names as the user entered / scanned them
   * @returns {{drug:string, conditionId:string, conditionLabel:string, entryId:string, class:string, reason:string, recommendation:string, source:string, qualifier?:string}[]}
   *   One flag per (drug, matching entry). `qualifier` is present only when
   *   the flag is shown under an `alsoShowFor` condition.
   */
  function checkDrugDisease(age, conditionIds, drugs) {
    if (!Array.isArray(conditionIds) || !Array.isArray(drugs)) return [];
    const selected = new Set();
    for (const id of conditionIds.filter(isKnownCondition)) {
      selected.add(id);
      for (const broader of includes.get(id) || []) selected.add(broader);
    }
    if (selected.size === 0) return [];

    const applicable = [];
    for (const item of entries) {
      if (!meetsMinAge(age, item.entry.minAge)) continue;
      const via = matchCondition(item, selected);
      if (via) applicable.push({ ...item, via });
    }
    if (applicable.length === 0) return [];

    const flags = [];
    for (const drug of drugs) {
      if (typeof drug !== 'string') continue;
      const words = tokenize(drug);
      if (words.length === 0) continue;
      for (const { entry, matches, via } of applicable) {
        if (matches(words)) {
          flags.push({
            drug,
            conditionId: via.conditionId,
            conditionLabel: labels.get(via.conditionId),
            entryId: entry.id,
            class: entry.class,
            reason: entry.reason,
            recommendation: entry.recommendation,
            source: entry.source,
            ...(via.qualifier ? { qualifier: via.qualifier } : {}),
          });
        }
      }
    }
    return flags;
  }

  return { CONDITIONS, isKnownCondition, checkDrugDisease };
}

const readData = (file) => JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), 'utf8'));

const checker = createDrugDiseaseChecker({
  conditionData: readData('conditions.json'),
  ruleData: readData('drug_disease.json'),
  classNames: defaultClassNames,
});

export const CONDITIONS = checker.CONDITIONS;
export const isKnownCondition = checker.isKnownCondition;
export const checkDrugDisease = checker.checkDrugDisease;
