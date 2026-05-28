#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { extname, basename } from 'node:path';
import { scoreVisionModelRuns } from './vision-model-quality.mjs';

const DEFAULT_CURRENT_MODEL = 'anthropic/claude-haiku-4.5';
const DEFAULT_CANDIDATE_MODEL = 'google/gemini-3-flash-preview';
const PROMPT = [
  '의료 판단 금지, 일정 후보만 추출.',
  '이미지의 병원 안내 본문을 읽고 저장 전 사용자가 확인할 일정 후보만 JSON으로 반환한다.',
  'Return JSON only: {"candidates":[{"type":"injection"|"medication"|"clinic","title":string,"scheduled_at":string|null,"dose":string|null,"unit":string|null}]}',
  '오후/밤/저녁은 12시간을 더한다. 오후 9시는 21:00이다.',
  '고날에프, 메노푸어, 세트로타이드, 오비드렐, 퓨리곤은 원문에 복용이라고 쓰지 않는 한 injection이다.',
].join(' ');

const args = parseArgs(process.argv.slice(2));
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) fail('OPENROUTER_API_KEY is required. Run with production-safe sample images only.');
if (!args.samples.length) fail('At least one --sample <path> is required.');
if (!args.expect) fail('--expect <json> is required. Format: {"samples":[{"id":"file-stem","expected":[...]}]}');

const expected = JSON.parse(readFileSync(args.expect, 'utf8'));
const models = [args.currentModel, args.candidateModel];
const runs = [];
for (const samplePath of args.samples) {
  const sampleId = args.sampleIds.get(samplePath) ?? basename(samplePath, extname(samplePath));
  for (const model of models) {
    const candidates = await extractCandidates({ apiKey, model, imageDataUrl: toDataUrl(samplePath) });
    runs.push({ model, sampleId, candidates });
  }
}

const result = scoreVisionModelRuns({ samples: expected.samples, runs });
console.log(JSON.stringify({ comparedAt: new Date().toISOString(), currentModel: args.currentModel, candidateModel: args.candidateModel, runs, result }, null, 2));

async function extractCandidates({ apiKey, model, imageDataUrl }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: [{ type: 'text', text: '병원 안내문 사진에서 일정 후보를 JSON으로 추출하세요.' }, { type: 'image_url', image_url: { url: imageDataUrl } }] },
      ],
    }),
  });
  if (!response.ok) throw new Error(`${model} failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return parseCandidates(data?.choices?.[0]?.message?.content ?? '');
}

function parseCandidates(content) {
  const json = content.match(/```(?:json)?\s*([\s\S]*?)```/u)?.[1] ?? content;
  const parsed = JSON.parse(json);
  return Array.isArray(parsed?.candidates) ? parsed.candidates : [];
}

function toDataUrl(path) {
  const mime = extname(path).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
}

function parseArgs(argv) {
  const parsed = {
    currentModel: process.env.OPENROUTER_CURRENT_VISION_MODEL ?? DEFAULT_CURRENT_MODEL,
    candidateModel: process.env.OPENROUTER_CANDIDATE_VISION_MODEL ?? DEFAULT_CANDIDATE_MODEL,
    expect: '',
    samples: [],
    sampleIds: new Map(),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--current-model' && next) { parsed.currentModel = next; index += 1; continue; }
    if (arg === '--candidate-model' && next) { parsed.candidateModel = next; index += 1; continue; }
    if (arg === '--expect' && next) { parsed.expect = next; index += 1; continue; }
    if (arg === '--sample' && next) { parsed.samples.push(next); index += 1; continue; }
    if (arg === '--sample-id' && next) {
      const [path, id] = next.split('=');
      if (path && id) parsed.sampleIds.set(path, id);
      index += 1;
      continue;
    }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`compare-openrouter-vision-models: ${message}`);
  process.exit(1);
}
