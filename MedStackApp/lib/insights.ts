// Stack insights: turns hubs (lib/hubs.ts) and stacked-drug patterns
// (/api/stack-patterns) into the short list shown in the "Stack insights" card.
//
// Pure and deterministic. Every sentence here is a fixed template: no LLM.
// Keep this file free of runtime imports so it can be unit tested with plain
// `node --test`.

import type { Hub } from '@/lib/hubs';
import type { Pair, StackPattern } from '@/types/medstack';

/** The card shows at most this many insights. */
export const MAX_INSIGHTS = 3;

export const INSIGHTS_DISCLAIMER = 'Informational tool, not medical advice.';
export const INSIGHTS_INCOMPLETE_NOTE = 'No insight does not mean this stack is safe.';
export const HUB_SOURCE = "MedStack's pairwise interaction results for this stack";

export type Insight = {
  key: string;
  kind: 'hub' | 'pattern';
  /** One plain-English line. */
  line: string;
  reason: string;
  recommendation: string;
  source: string;
};

export type InsightsResult = {
  /** At most MAX_INSIGHTS, hubs first, then stacked-drug patterns. */
  shown: Insight[];
  /** How many more exist beyond the cap. */
  hiddenCount: number;
  /**
   * Pair patterns left out of the card because the pair is already shown as
   * red. Keyed by pairKey(); the pair's own detail card mentions them instead.
   */
  pairNotes: Map<string, StackPattern[]>;
};

export const pairKey = (a: string, b: string) =>
  [a, b].map((d) => d.trim().toLowerCase()).sort().join('|');

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const SEVERITY_WORD = { red: 'stop', yellow: 'use caution', green: 'no known issue' } as const;

export function hubInsight(hub: Hub, labelFor: (name: string) => string): Insight {
  const drug = labelFor(hub.drug);
  const partners = hub.partners.map((p) => `${labelFor(p.name)} (${SEVERITY_WORD[p.severity]})`);
  return {
    key: `hub:${hub.drug.toLowerCase()}`,
    kind: 'hub',
    line: `${drug} interacts with ${hub.partners.length} other medications in this stack. It may be the one to ask a pharmacist about first.`,
    reason: `${drug} has a caution-or-higher interaction with ${joinNames(partners)}.`,
    recommendation: `Ask your clinician or pharmacist about ${drug} first. Reviewing one medication may resolve several interactions. Do not stop or change it on your own.`,
    source: HUB_SOURCE,
  };
}

export function patternInsight(pattern: StackPattern, labelFor: (name: string) => string): Insight {
  return {
    key: `pattern:${pattern.id}`,
    kind: 'pattern',
    line: `${pattern.label}: ${joinNames(pattern.drugsInvolved.map(labelFor))}.`,
    reason: pattern.reason,
    recommendation: pattern.recommendation,
    source: `${pattern.source}. Applies to adults 65+`,
  };
}

/**
 * A pair pattern "just repeats" the pairwise results when every drug pair it
 * covers is already shown as red. Count patterns are never repeats.
 */
function isAlreadyShownAsRed(pattern: StackPattern, redPairs: Set<string>): boolean {
  if (pattern.type !== 'pair' || pattern.pairs.length === 0) return false;
  return pattern.pairs.every(([a, b]) => redPairs.has(pairKey(a, b)));
}

export function buildInsights(
  hubs: Hub[],
  patterns: StackPattern[],
  pairs: Pair[],
  labelFor: (name: string) => string
): InsightsResult {
  const redPairs = new Set(pairs.filter((p) => p.severity === 'red').map((p) => pairKey(p.drugA, p.drugB)));

  const pairNotes = new Map<string, StackPattern[]>();
  const all: Insight[] = hubs.map((h) => hubInsight(h, labelFor));

  patterns.forEach((pattern) => {
    if (isAlreadyShownAsRed(pattern, redPairs)) {
      pattern.pairs.forEach(([a, b]) => {
        const key = pairKey(a, b);
        pairNotes.set(key, [...(pairNotes.get(key) || []), pattern]);
      });
      return;
    }
    all.push(patternInsight(pattern, labelFor));
  });

  return {
    shown: all.slice(0, MAX_INSIGHTS),
    hiddenCount: Math.max(0, all.length - MAX_INSIGHTS),
    pairNotes,
  };
}
