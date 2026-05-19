#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? '';
}

function runStep(label, command, args) {
  try {
    const output = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write(output);
    return true;
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    console.error(`${label} failed`);
    return false;
  }
}

const offline = process.argv.includes('--offline');
const errors = [];
const androidEvidenceJson = readArg('--android-evidence-json');
const iosEvidenceJson = readArg('--ios-evidence-json');
const androidL3 = readArg('--android-l3-media');
const androidL4 = readArg('--android-l4-media');
const androidL6 = readArg('--android-l6-media');
const iosInstall = readArg('--ios-install-media');
const iosL3 = readArg('--ios-l3-media');
const iosL4 = readArg('--ios-l4-media');
const iosL6 = readArg('--ios-l6-media');

for (const [flag, value] of [
  ['--android-evidence-json', androidEvidenceJson],
  ['--android-l3-media', androidL3],
  ['--android-l4-media', androidL4],
  ['--android-l6-media', androidL6],
  ['--ios-evidence-json', iosEvidenceJson],
  ['--ios-install-media', iosInstall],
  ['--ios-l3-media', iosL3],
  ['--ios-l4-media', iosL4],
  ['--ios-l6-media', iosL6],
]) {
  if (!value) errors.push(`missing required completion evidence: ${flag}`);
}

if (!offline) {
  if (!runStep('MVP readiness check', 'npm', ['run', 'verify:mvp:readiness'])) {
    errors.push('MVP readiness check failed');
  }
  if (!runStep('live push issue state check', 'npm', ['run', 'verify:push:issues'])) {
    errors.push('live push issue state check failed');
  }
}

if (!errors.length) {
  const androidOk = runStep('Android live push closure evidence check', 'npm', [
    'run', 'verify:push:closure', '--',
    '--platform', 'android',
    '--evidence-json', androidEvidenceJson,
    '--l3-media', androidL3,
    '--l4-media', androidL4,
    '--l6-media', androidL6,
  ]);
  const iosOk = runStep('iOS live push closure evidence check', 'npm', [
    'run', 'verify:push:closure', '--',
    '--platform', 'ios',
    '--evidence-json', iosEvidenceJson,
    '--ios-install-media', iosInstall,
    '--l3-media', iosL3,
    '--l4-media', iosL4,
    '--l6-media', iosL6,
  ]);
  if (!androidOk) errors.push('Android live push closure evidence check failed');
  if (!iosOk) errors.push('iOS live push closure evidence check failed');
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error('Do not mark the goal complete until every completion evidence requirement passes.');
  process.exit(1);
}

console.log('MVP visible delta completion verified');
console.log('- Canonical visible-delta readiness passed');
console.log('- Android physical live push closure evidence passed');
console.log('- iOS Home Screen PWA live push closure evidence passed');
