import type { BeersFlag } from '@/types/medstack';

/** The Beers Criteria apply to adults this age and older. */
export const BEERS_MIN_AGE = 65;
export const BEERS_SOURCE_LABEL = 'AGS 2023 Beers Criteria';
export const BEERS_DISCLAIMER = 'Informational tool, not medical advice.';

/**
 * Parse an age typed by the user.
 * Returns the age, `null` for an empty field, or `'invalid'`.
 */
export function parseAge(text: string): number | null | 'invalid' {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d{1,3}$/.test(trimmed)) return 'invalid';
  const age = Number(trimmed);
  return age <= 120 ? age : 'invalid';
}

export function flagsForDrug(name: string, flags: BeersFlag[]): BeersFlag[] {
  const key = name.toLowerCase();
  return flags.filter((f) => f.drug.toLowerCase() === key);
}

/** Lowercased names of every flagged drug. */
export function flaggedNames(flags: BeersFlag[]): Set<string> {
  return new Set(flags.map((f) => f.drug.toLowerCase()));
}

export function beersSummaryLine(count: number): string {
  const subject = count === 1 ? '1 medication is' : `${count} medications are`;
  return `${subject} on the Beers list for adults 65+. Talk to your clinician or pharmacist before changing anything.`;
}
