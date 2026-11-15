// Shared drug-name normalization and whole-word matching, used by every
// static-data check (Beers Criteria, drug-disease). Deterministic: no LLM, no
// network.

// Dosage units and dose-form words that carry no drug identity.
const NOISE_WORDS = new Set([
  'mg', 'mcg', 'g', 'ml', 'iu', 'unit', 'units',
  'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps',
  'caplet', 'caplets', 'pill', 'pills', 'oral', 'solution', 'suspension', 'liquid',
  'er', 'xr', 'xl', 'sr', 'cr', 'dr', 'ir', 'la', 'ec', 'odt',
  'extended', 'delayed', 'immediate', 'release',
  'hcl', 'hydrochloride',
]);

/**
 * Lowercase a drug name and split it into identity-bearing words: punctuation,
 * numbers / strengths ("10", "10mg", "0.5") and dose-form words are dropped.
 */
export function tokenize(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !/^\d/.test(w) && !NOISE_WORDS.has(w));
}

// Whole-word match: `needle` must appear as a contiguous run of whole words.
function containsWords(haystack, needle) {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((w, j) => haystack[i + j] === w)) return true;
  }
  return false;
}

/**
 * Pre-tokenize a list of generic / brand names. The result is a matcher:
 * call it with the tokenized words of a user-entered drug name and it returns
 * true when any listed name appears in it as whole words (never a substring).
 */
export function compileNames(names) {
  const compiled = names.map(tokenize).filter((n) => n.length > 0);
  return (words) => compiled.some((name) => containsWords(words, name));
}
