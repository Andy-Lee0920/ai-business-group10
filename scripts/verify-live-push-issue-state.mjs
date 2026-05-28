#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REQUIRED_ISSUES = [377, 380, 382, 383];
const LIVE_CHILD_ISSUES = new Map([
  [382, 'physical Android live push evidence'],
  [383, 'physical iOS Home Screen PWA live push evidence'],
]);
const PARENT_ISSUES = [377, 380];

const args = parseArgs(process.argv.slice(2));
const issues = loadIssues(args);
const byNumber = new Map(issues.map((issue) => [Number(issue.number), normalizeState(issue.state)]));
const errors = [];

for (const number of REQUIRED_ISSUES) {
  if (!byNumber.has(number)) errors.push(`#${number} missing from issue state payload`);
}

for (const [number, evidenceLabel] of LIVE_CHILD_ISSUES) {
  const state = byNumber.get(number);
  if (state && state !== 'OPEN') {
    errors.push(`#${number} must remain OPEN until ${evidenceLabel} is attached`);
  }
}

const liveRedOpen = [...LIVE_CHILD_ISSUES.keys()].some((number) => byNumber.get(number) === 'OPEN');
if (liveRedOpen) {
  for (const number of PARENT_ISSUES) {
    const state = byNumber.get(number);
    if (state && state !== 'OPEN') errors.push(`#${number} must remain OPEN while #382/#383 live-device Reds remain open`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

for (const number of REQUIRED_ISSUES) console.log(`#${number} ${byNumber.get(number)}`);
console.log('live push issue state guard passed');

function loadIssues(parsedArgs) {
  if (parsedArgs.issuesJson) return JSON.parse(readFileSync(parsedArgs.issuesJson, 'utf8'));

  const output = execFileSync('gh', [
    'issue', 'list',
    '--repo', parsedArgs.repo,
    '--state', 'all',
    '--search', '377 OR 380 OR 382 OR 383',
    '--json', 'number,state,title,url',
    '--limit', '10',
  ], { encoding: 'utf8' });
  return JSON.parse(output);
}

function normalizeState(value) {
  return String(value ?? '').toUpperCase();
}

function parseArgs(argv) {
  const parsed = {
    repo: 'Andy-Lee0920/ai-business-group10',
    issuesJson: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--repo' && next) { parsed.repo = next; index += 1; continue; }
    if (arg === '--issues-json' && next) { parsed.issuesJson = next; index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }

  return parsed;
}

function fail(message) {
  console.error(`verify-live-push-issue-state: ${message}`);
  process.exit(1);
}
