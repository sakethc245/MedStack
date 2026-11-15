// Verification gate for the clinical data files.
//
// Every entry in ./data carries a `verified` field set during the source audit
// (see docs/DATA_VERIFICATION.md):
//   "confirmed"  - matches the primary source
//   "corrected"  - was changed to match the primary source
//   "unverified" - could not be confirmed
// Only "confirmed" and "corrected" data may reach users. Anything else,
// including an entry with no `verified` field at all, is ignored by every
// matcher. New data therefore stays switched off until someone verifies it.

export const VERIFIED_STATUSES = Object.freeze(['confirmed', 'corrected']);

export function isVerified(entry) {
  return Boolean(entry) && VERIFIED_STATUSES.includes(entry.verified);
}
