#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const errors = [];

const requiredFiles = [
  'docs/04-decisions/0013-confirm-spine-canonical.md',
  'docs/04-decisions/0014-medication-reference-image-deterministic.md',
  'docs/qa/mvp-visible-delta-audit.md',
  'docs/qa/pwa-live-push-smoke.md',
  'scripts/verify-live-push-closure-evidence.mjs',
  'scripts/verify-live-push-issue-state.mjs',
  'scripts/verify-live-push-device-readiness.mjs',
  'scripts/verify-mvp-visible-delta-completion.mjs',
  'scripts/verify-production-pwa-prereqs.mjs',
  'src/domain/reminder-dispatch.ts',
  'src/domain/medication-reference-assets.ts',
  'app/(authed)/home/page.tsx',
  'app/partner/[token]/PartnerRoleSurface.tsx',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) errors.push(`missing required artifact: ${file}`);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'smoke:pwa:production',
  'smoke:push:prepare',
  'smoke:push:evidence',
  'smoke:push:archive',
  'smoke:push:bundle',
  'verify:push:closure',
  'verify:push:issues',
  'verify:push:devices',
  'verify:mvp:complete',
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`missing npm script: ${script}`);
}

const audit = existsSync('docs/qa/mvp-visible-delta-audit.md') ? readFileSync('docs/qa/mvp-visible-delta-audit.md', 'utf8') : '';
for (const requiredText of [
  'split_candidates → care_action_cards',
  'care_action_cards primary',
  'WINDOW_RADIUS_MINUTES = 5',
  '(card_id, scheduled_at, channel)',
  'Remaining Reds',
  '#382 Android live push',
  '#383 iOS live push',
]) {
  if (!audit.includes(requiredText)) errors.push(`audit missing required text: ${requiredText}`);
}

const runbook = existsSync('docs/qa/pwa-live-push-smoke.md') ? readFileSync('docs/qa/pwa-live-push-smoke.md', 'utf8') : '';
for (const requiredText of [
  'npm run smoke:push:prepare -- --user-id',
  'npm run smoke:push:evidence -- --user-id',
  'npm run verify:push:closure',
  'npm run verify:push:issues',
  'npm run verify:push:devices',
  'npm run verify:mvp:complete',
  'Do not close #382',
  'Do not close #383',
]) {
  if (!runbook.includes(requiredText)) errors.push(`runbook missing required text: ${requiredText}`);
}

if (!offline) {
  try {
    const issueGuard = execFileSync('npm', ['run', 'verify:push:issues'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (!issueGuard.includes('#382 OPEN') || !issueGuard.includes('#383 OPEN')) {
      errors.push('live push issue guard did not report #382/#383 OPEN');
    }
  } catch (error) {
    errors.push(`live push issue guard failed: ${error.stderr || error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('MVP visible delta local readiness verified');
console.log('- Canonical care card spine artifacts are present');
console.log('- Reminder/PWA/live-smoke helper commands are present');
console.log('- Audit and runbook preserve live-device Reds');
console.log('- Device readiness guard is available for physical live-smoke preflight');
console.log('- Final completion gate requires Android and iOS physical evidence bundles');
if (!offline) console.log('- GitHub issue state guard passed');
console.log('Remaining Red: #382 Android physical live push evidence');
console.log('Remaining Red: #383 iOS Home Screen PWA physical live push evidence');
console.log('Do not mark goal complete from this readiness check alone');
