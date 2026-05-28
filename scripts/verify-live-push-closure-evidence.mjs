#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const args = parseArgs(process.argv.slice(2));
const errors = [];

if (!args.evidenceJson) errors.push('evidence JSON is required');
if (!args.l3Media) errors.push('L3 media is required');
if (!args.l4Media) errors.push('L4 media is required');
if (!args.l6Media) errors.push('L6 media is required');
if (args.platform === 'ios' && !args.iosInstallMedia) errors.push('iOS Home Screen install media is required');

for (const [label, file] of [
  ['evidence JSON', args.evidenceJson],
  ['L3 media', args.l3Media],
  ['L4 media', args.l4Media],
  ['L6 media', args.l6Media],
  ['iOS Home Screen install media', args.iosInstallMedia],
]) {
  if (file && !existsSync(file)) errors.push(`${label} file does not exist: ${file}`);
}

let evidence = null;
if (args.evidenceJson && existsSync(args.evidenceJson)) {
  try {
    evidence = JSON.parse(readFileSync(args.evidenceJson, 'utf8'));
  } catch {
    errors.push('evidence JSON must parse');
  }
}

if (evidence) validateEvidence(evidence, errors);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`${args.platform === 'ios' ? 'iOS Home Screen PWA' : 'Android'} live push closure evidence verified`);
console.log('- DB evidence contains push subscription and sent reminder dispatch');
console.log('- L3/L4/L6 physical media files exist');
if (args.platform === 'ios') console.log('- iOS Home Screen install media file exists');
console.log('- Manual review still required before closing GitHub issues');

function validateEvidence(evidence, errors) {
  if (!Array.isArray(evidence.pushSubscriptions) || evidence.pushSubscriptions.length < 1) {
    errors.push('L1 push_subscriptions evidence is required');
  }

  const dispatches = Array.isArray(evidence.reminderDispatches) ? evidence.reminderDispatches : [];
  const sentDispatches = dispatches.filter((row) => row?.status === 'sent');
  if (sentDispatches.length < 1) errors.push('L2 sent reminder_dispatches evidence is required');

  const dedupKeys = new Set();
  for (const row of sentDispatches) {
    const key = `${row.card_id ?? ''}:${row.scheduled_at ?? ''}:${row.channel ?? ''}`;
    if (dedupKeys.has(key)) errors.push(`duplicate sent dispatch found for ${key}`);
    dedupKeys.add(key);
  }

  if (!evidence.schedulerRerun?.attempted) errors.push('L7 scheduler rerun evidence is required');
}

function parseArgs(argv) {
  const parsed = {
    platform: 'android',
    evidenceJson: '',
    l3Media: '',
    l4Media: '',
    l6Media: '',
    iosInstallMedia: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--platform' && next && ['android', 'ios'].includes(next)) { parsed.platform = next; index += 1; continue; }
    if (arg === '--evidence-json' && next) { parsed.evidenceJson = next; index += 1; continue; }
    if (arg === '--l3-media' && next) { parsed.l3Media = next; index += 1; continue; }
    if (arg === '--l4-media' && next) { parsed.l4Media = next; index += 1; continue; }
    if (arg === '--l6-media' && next) { parsed.l6Media = next; index += 1; continue; }
    if (arg === '--ios-install-media' && next) { parsed.iosInstallMedia = next; index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }

  return parsed;
}

function fail(message) {
  console.error(`verify-live-push-closure-evidence: ${message}`);
  process.exit(1);
}
