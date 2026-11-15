export type Severity = 'red' | 'yellow' | 'green';

export type Drug = {
  id: string;
  /** Canonical name used for interaction lookups (from the scan or manual entry). */
  name: string;
  /** User-chosen label shown instead of `name`, e.g. "Advil" instead of "ibuprofen". */
  displayName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  groupId?: string | null;
};

export type Group = {
  id: string;
  name: string;
};

export type Pair = {
  drugA: string;
  drugB: string;
  severity: Severity;
  summary: string;
  action: string;
  sourceUrl?: string;
};

export type MapType = 'node' | 'list';

export type User = {
  id: string;
  email: string;
  /** Demo-only local credential — there is no auth backend, so this never leaves the device. */
  password: string;
  name: string;
  /**
   * Age in years, used only for the Beers Criteria check (65+).
   * `undefined` = never asked; `null` = asked and skipped.
   */
  age?: number | null;
};

/** One medication matched against the 2023 AGS Beers Criteria list. */
export type BeersFlag = {
  /** The drug name as it was sent (matches `Drug.name`). */
  drug: string;
  entryId: string;
  class: string;
  reason: string;
  recommendation: string;
  source: string;
};

export type Summary = { red: number; yellow: number; green: number };
