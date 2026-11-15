import { api } from '@/lib/api';
import { SAFETY_LINE } from '@/lib/safety';
import type { BeersFlag, Condition, ConditionFlag } from '@/types/medstack';

export const CONDITION_DISCLAIMER = 'Informational tool, not medical advice.';
export const CONDITION_INCOMPLETE_NOTE =
  'This list is not complete: no flag does not mean a medication is safe.';

// The conditions list is static, so fetch it once per app session.
let cached: Condition[] | null = null;

export async function loadConditions(): Promise<Condition[]> {
  if (cached) return cached;
  const data = await api.conditions();
  if (!Array.isArray(data?.conditions)) throw new Error('Conditions list unavailable');
  cached = data.conditions as Condition[];
  return cached;
}

/** Case-insensitive search over label, ICD-10 codes and synonyms. */
export function matchesConditionSearch(c: Condition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.label, ...c.codes, ...(c.synonyms || [])].some((text) => text.toLowerCase().includes(q));
}

export function conditionFlagsForDrug(name: string, flags: ConditionFlag[]): ConditionFlag[] {
  const key = name.toLowerCase();
  return flags.filter((f) => f.drug.toLowerCase() === key);
}

/** How many Beers and condition flags each medication has, keyed by lowercased name. */
export type NoteCounts = Map<string, { beers: number; conditions: number }>;

export function countNotes(beersFlags: BeersFlag[], conditionFlags: ConditionFlag[]): NoteCounts {
  const counts: NoteCounts = new Map();
  const bump = (drug: string, kind: 'beers' | 'conditions') => {
    const key = drug.toLowerCase();
    const entry = counts.get(key) || { beers: 0, conditions: 0 };
    entry[kind] += 1;
    counts.set(key, entry);
  };
  beersFlags.forEach((f) => bump(f.drug, 'beers'));
  conditionFlags.forEach((f) => bump(f.drug, 'conditions'));
  return counts;
}

/** Number of distinct medications with at least one condition flag. */
export function conditionFlaggedCount(flags: ConditionFlag[]): number {
  return new Set(flags.map((f) => f.drug.toLowerCase())).size;
}

export function conditionSummaryLine(count: number): string {
  const subject = count === 1 ? '1 medication' : `${count} medications`;
  return `${subject} may be a concern with your conditions. ${SAFETY_LINE}`;
}
