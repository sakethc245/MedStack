import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLabel, summarizeInteraction } from './groq.js';
import { fetchInteractionText } from './firecrawl.js';
import { checkBeers, beersApplies, BEERS_SOURCE } from './beers.js';
import { CONDITIONS, isKnownCondition, checkDrugDisease } from './drugDisease.js';
import { checkStackPatterns } from './stackPatterns.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Render / Cloud Run sit behind one reverse proxy; trust it so rate limiting
// keys on the real client IP instead of the proxy's.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '12mb' })); // base64 images can be large

// ---- Rate limiting ----
// Every API call below spends Groq / Firecrawl credits, so cap per-IP usage.
const limiter = (max) =>
  rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please wait a minute and try again.' },
  });
const scanLimiter = limiter(10); // vision call per request
const interactionLimiter = limiter(30); // up to 3 scrapes + 1 LLM call per request
const stackLimiter = limiter(10); // fans out to every pair in the stack
const beersLimiter = limiter(30); // local lookup only, no upstream calls
const conditionsLimiter = limiter(30); // static list
const drugDiseaseLimiter = limiter(30); // local lookup only, no upstream calls
const stackPatternsLimiter = limiter(30); // local lookup only, no upstream calls

const MAX_STACK_SIZE = 10; // 10 drugs = 45 pairs
const MAX_DRUG_NAME_LENGTH = 80;
const MAX_CONDITIONS = 20;
const isValidAge = (age) => Number.isInteger(age) && age >= 0 && age <= 120;
const isDrugName = (d) =>
  typeof d === 'string' && d.trim().length > 0 && d.length <= MAX_DRUG_NAME_LENGTH;

// ---- Health check (Cloud Run readiness) ----
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    groq: Boolean(process.env.GROQ_API_KEY),
    firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
  });
});

// ---- Scan a pill bottle label ----
// Body: { image: "<base64>", mimeType?: "image/jpeg" }
app.post('/api/scan', scanLimiter, async (req, res) => {
  try {
    const { image, mimeType } = req.body || {};
    if (!image) return res.status(400).json({ error: 'Missing image' });
    const clean = String(image).replace(/^data:[^;]+;base64,/, '');
    const result = await extractLabel(clean, mimeType || 'image/jpeg');
    if (!result.drug) {
      return res.status(422).json({ error: 'No medication detected on label', raw: result });
    }
    res.json(result);
  } catch (err) {
    console.error('[scan]', err.code, err.message);
    res.status(502).json({ error: 'Scan failed', code: err.code || 'UNKNOWN' });
  }
});

// ---- Check a single drug pair ----
// Body: { drugA, drugB }
// Strategy: resolve the specific pairwise page live via Firecrawl, then Groq
// rewrites it into plain English + severity. No hardcoded answers.
app.post('/api/interaction', interactionLimiter, async (req, res) => {
  const { drugA, drugB } = req.body || {};
  if (!isDrugName(drugA) || !isDrugName(drugB)) {
    return res.status(400).json({ error: 'Need drugA and drugB' });
  }

  const result = await resolveInteraction(drugA, drugB);
  res.json({ drugA, drugB, ...result });
});

// ---- Check an entire stack: every pair ----
// Body: { drugs: ["warfarin", "ibuprofen", ...] }
app.post('/api/stack-check', stackLimiter, async (req, res) => {
  const { drugs } = req.body || {};
  if (!Array.isArray(drugs) || drugs.length < 2) {
    return res.json({ pairs: [], summary: { red: 0, yellow: 0, green: 0 } });
  }
  if (drugs.length > MAX_STACK_SIZE) {
    return res
      .status(400)
      .json({ error: `Too many medications — the limit is ${MAX_STACK_SIZE} per check.` });
  }
  if (!drugs.every(isDrugName)) {
    return res.status(400).json({ error: 'Each medication must be a short text name.' });
  }

const pairs = [];
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const r = await resolveInteraction(drugs[i], drugs[j]);
      pairs.push({ drugA: drugs[i], drugB: drugs[j], ...r });
      // Throttle regardless of outcome — a failed/rate-limited call still hit
      // Firecrawl, so skipping the delay on failure only makes the rate limit worse.
      await new Promise((s) => setTimeout(s, 1200));
    }
  }

  const summary = pairs.reduce(
    (acc, p) => {
      acc[p.severity] = (acc[p.severity] || 0) + 1;
      return acc;
    },
    { red: 0, yellow: 0, green: 0 }
  );

  res.json({ pairs, summary });
});

// ---- Beers Criteria check (adults 65+) ----
// Body: { age: 72, drugs: ["diphenhydramine", ...] }
// Pure lookup against the static 2023 AGS Beers Criteria data file — never
// calls Groq or Firecrawl.
app.post('/api/beers-check', beersLimiter, (req, res) => {
  const { age, drugs } = req.body || {};
  if (!isValidAge(age)) {
    return res.status(400).json({ error: 'Age must be a whole number from 0 to 120.' });
  }
  if (!Array.isArray(drugs)) {
    return res.status(400).json({ error: 'Need a drugs array.' });
  }
  if (drugs.length > MAX_STACK_SIZE) {
    return res
      .status(400)
      .json({ error: `Too many medications — the limit is ${MAX_STACK_SIZE} per check.` });
  }
  if (!drugs.every(isDrugName)) {
    return res.status(400).json({ error: 'Each medication must be a short text name.' });
  }
  res.json({
    applies: beersApplies(age),
    flags: checkBeers(age, drugs),
    source: BEERS_SOURCE,
  });
});

// ---- Conditions list for the picker ----
app.get('/api/conditions', conditionsLimiter, (_req, res) => {
  res.json({ conditions: CONDITIONS });
});

// ---- Drug-disease check ----
// Body: { age: 72, conditions: ["parkinson-disease"], drugs: ["metoclopramide"] }
// Pure lookup against static data files. Conditions are health data: they are
// never logged, stored, or passed to Groq, Firecrawl or any other service.
app.post('/api/drug-disease-check', drugDiseaseLimiter, (req, res) => {
  const { age, conditions, drugs } = req.body || {};
  if (!isValidAge(age)) {
    return res.status(400).json({ error: 'Age must be a whole number from 0 to 120.' });
  }
  if (!Array.isArray(conditions)) {
    return res.status(400).json({ error: 'Need a conditions array.' });
  }
  if (conditions.length > MAX_CONDITIONS) {
    return res
      .status(400)
      .json({ error: `Too many conditions — the limit is ${MAX_CONDITIONS} per check.` });
  }
  if (!conditions.every(isKnownCondition)) {
    return res.status(400).json({ error: 'Each condition must be an id from /api/conditions.' });
  }
  if (!Array.isArray(drugs)) {
    return res.status(400).json({ error: 'Need a drugs array.' });
  }
  if (drugs.length > MAX_STACK_SIZE) {
    return res
      .status(400)
      .json({ error: `Too many medications — the limit is ${MAX_STACK_SIZE} per check.` });
  }
  if (!drugs.every(isDrugName)) {
    return res.status(400).json({ error: 'Each medication must be a short text name.' });
  }
  res.json({ flags: checkDrugDisease(age, conditions, drugs) });
});

// ---- Stack patterns (drugs that add up across the whole stack) ----
// Body: { age: 72, drugs: ["oxycodone", "lorazepam", ...] }
// Pure lookup against static data files. Medications are health data: the
// request is never logged, stored, or passed to Groq, Firecrawl or any other
// service.
app.post('/api/stack-patterns', stackPatternsLimiter, (req, res) => {
  const { age, drugs } = req.body || {};
  if (!isValidAge(age)) {
    return res.status(400).json({ error: 'Age must be a whole number from 0 to 120.' });
  }
  if (!Array.isArray(drugs)) {
    return res.status(400).json({ error: 'Need a drugs array.' });
  }
  if (drugs.length > MAX_STACK_SIZE) {
    return res
      .status(400)
      .json({ error: `Too many medications — the limit is ${MAX_STACK_SIZE} per check.` });
  }
  if (!drugs.every(isDrugName)) {
    return res.status(400).json({ error: 'Each medication must be a short text name.' });
  }
  res.json({ insights: checkStackPatterns(age, drugs) });
});

/**
 * Core resolution: resolve the specific pairwise page live (Firecrawl -> Groq).
 * A genuine "no interaction listed" becomes green; a live failure becomes an
 * honest "unknown/yellow" rather than a canned answer.
 */
const interactionCache = new Map();
const pairKey = (a, b) => [a, b].map((d) => d.trim().toLowerCase()).sort().join('|');

async function resolveInteraction(drugA, drugB) {
  const key = pairKey(drugA, drugB);
  if (interactionCache.has(key)) return interactionCache.get(key);
  const result = await computeInteraction(drugA, drugB);
  if (result.source === 'live') {
    interactionCache.set(key, result);
  }
  return result;
}

function unknownResult(drugA, drugB) {
  return {
    severity: 'yellow',
    summary: `We couldn't retrieve interaction data for ${drugA} and ${drugB} right now.`,
    action: 'Confirm with a pharmacist before combining them.',
    source: 'unknown',
  };
}

async function computeInteraction(drugA, drugB) {
  if (!process.env.FIRECRAWL_API_KEY || !process.env.GROQ_API_KEY) {
    return unknownResult(drugA, drugB);
  }
  try {
    const result = await fetchInteractionText(drugA, drugB);

    // drugB never appears on drugA's interaction index (or vice versa):
    // Drugs.com lists no known interaction — a genuine "all clear".
    if (result.noInteractionListed) {
      return {
        severity: 'green',
        summary: `Drugs.com lists no known interaction between ${drugA} and ${drugB}.`,
        action: 'No special action needed, but tell your pharmacist about everything you take.',
        source: 'live',
        sourceUrl: result.sourceUrl,
      };
    }

    // Resolved to the specific pairwise page — let Groq summarize its content.
    if (result.resolved && result.text && result.text.length > 80) {
      const summary = await summarizeInteraction(drugA, drugB, result.text);
      return { ...summary, source: 'live', sourceUrl: result.sourceUrl };
    }

    // Live path returned nothing usable — be honest rather than guess.
    return unknownResult(drugA, drugB);
  } catch (err) {
    console.warn(`[interaction] ${drugA}+${drugB} live failed:`, err.message);
    return unknownResult(drugA, drugB);
  }
}

// ---- Serve the built frontend (single Cloud Run service) ----
const clientDir = path.join(__dirname, '..', 'public');
app.use(express.static(clientDir));
app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));

// Always listen, except under `node --test` (which sets NODE_TEST_CONTEXT), so
// tests can import the app and bind their own throwaway port.
if (!process.env.NODE_TEST_CONTEXT) {
  app.listen(PORT, () => console.log(`MedStack backend listening on :${PORT}`));
}

export { app };
