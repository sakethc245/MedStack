// Hub detection: find a medication that has caution-or-worse interactions with
// several others in the stack, so the user knows which one to ask about first.
//
// Pure and deterministic: it only reads the pair results the app already got
// from /api/stack-check. No network, no LLM. Keep this file free of runtime
// imports so it can be unit tested with plain `node --test`.

import type { Pair, Severity } from '@/types/medstack';

/** A drug is a hub when it has yellow or red interactions with at least this many other drugs. */
export const HUB_MIN_INTERACTIONS = 2;
/** Hubs are only reported for stacks of at least this many drugs. */
export const HUB_MIN_STACK_SIZE = 3;

export type HubPartner = { name: string; severity: Severity };

export type Hub = {
  /** The hub drug's name, as it appears in the stack. */
  drug: string;
  /** The other drugs it has a yellow or red interaction with. */
  partners: HubPartner[];
};

const rank = (s: Severity) => (s === 'red' ? 2 : s === 'yellow' ? 1 : 0);

/**
 * @param drugNames  names of the drugs currently in the stack
 * @param pairs      pair results from /api/stack-check
 * @returns hubs, strongest first (most partners, then most red interactions)
 */
export function findHubs(drugNames: string[], pairs: Pair[]): Hub[] {
  // Original casing by lowercased name; also drops duplicate names.
  const stack = new Map<string, string>();
  drugNames.forEach((name) => {
    const key = name.trim().toLowerCase();
    if (key && !stack.has(key)) stack.set(key, name);
  });
  if (stack.size < HUB_MIN_STACK_SIZE) return [];

  // For each drug: partner -> worst severity seen with that partner.
  const partnersOf = new Map<string, Map<string, Severity>>();
  const link = (from: string, to: string, severity: Severity) => {
    const partners = partnersOf.get(from) || new Map<string, Severity>();
    const seen = partners.get(to);
    if (!seen || rank(severity) > rank(seen)) partners.set(to, severity);
    partnersOf.set(from, partners);
  };

  pairs.forEach((p) => {
    // Green does not count.
    if (p.severity !== 'yellow' && p.severity !== 'red') return;
    // A failed lookup is reported as yellow with source "unknown". That is not
    // a known interaction, so it must not make a drug look like a hub.
    if (p.source === 'unknown') return;
    const a = p.drugA.trim().toLowerCase();
    const b = p.drugB.trim().toLowerCase();
    // Ignore stale results for drugs no longer in the stack.
    if (a === b || !stack.has(a) || !stack.has(b)) return;
    link(a, b, p.severity);
    link(b, a, p.severity);
  });

  const hubs: Hub[] = [];
  partnersOf.forEach((partners, key) => {
    if (partners.size < HUB_MIN_INTERACTIONS) return;
    hubs.push({
      drug: stack.get(key) as string,
      partners: [...partners.entries()]
        .map(([name, severity]) => ({ name: stack.get(name) as string, severity }))
        .sort((x, y) => rank(y.severity) - rank(x.severity) || x.name.localeCompare(y.name)),
    });
  });

  const redCount = (h: Hub) => h.partners.filter((p) => p.severity === 'red').length;
  return hubs.sort(
    (x, y) =>
      y.partners.length - x.partners.length || redCount(y) - redCount(x) || x.drug.localeCompare(y.drug)
  );
}
