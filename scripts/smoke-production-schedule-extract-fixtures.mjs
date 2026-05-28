#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { scoreVisionModelRuns } from './vision-model-quality.mjs';

const FIXTURE_BASE_URL = 'https://raw.githubusercontent.com/Andy-Lee0920/ai-business-group10/main/tests/fixtures/vision-model';
const samples = [
  'tests/fixtures/vision-model/clinic-note-ovidrel.png',
  'tests/fixtures/vision-model/clinic-note-mixed.png',
];
const expected = JSON.parse(readFileSync('tests/fixtures/vision-model/expected-candidates.json', 'utf8'));
const env = readLocalEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('smoke-production-schedule-extract-fixtures: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const endpoint = `${supabaseUrl.replace(/\/$/u, '')}/functions/v1/schedule-extract`;
const runs = [];
const results = [];

for (const samplePath of samples) {
  const sampleId = basename(samplePath, extname(samplePath));
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'image',
      imagePath: `synthetic/${sampleId}.png`,
      patientId: 'synthetic-smoke',
      signedUrl: `${FIXTURE_BASE_URL}/${sampleId}.png`,
    }),
  });
  const payload = await response.json().catch(async () => ({ error: await response.text() }));
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  runs.push({ model: 'production default', sampleId, candidates });
  results.push({ sample: sampleId, status: response.status, ok: response.ok, candidates });
}

const score = scoreVisionModelRuns({ samples: expected.samples, runs });
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), function: 'schedule-extract', model: 'production default', results, score }, null, 2));

function readLocalEnv() {
  try {
    return Object.fromEntries(readFileSync('.env.local', 'utf8')
      .split(/\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/gu, '')];
      }));
  } catch {
    return {};
  }
}
