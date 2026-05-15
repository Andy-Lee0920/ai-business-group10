#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateProductionDeploySource, formatGuardFailure } = await import('./verify-production-deploy-source.mjs');

const PRODUCTION_ALIAS = 'https://project-oznp0.vercel.app';
const REQUIRED_SMOKE = [
  { path: '/home', expectedStatus: 307, expectedLocation: '/auth/sign-in' },
  { path: '/settings', expectedStatus: 307, expectedLocation: '/auth/sign-in' },
  { path: '/privacy', expectedStatus: 200 },
];

function run(command, args, options = {}) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function capture(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function ensureProjectLink() {
  if (existsSync('.vercel/project.json')) return;
  mkdirSync('.vercel', { recursive: true });
  throw new Error('Missing .vercel/project.json. Link the real Fevio project before production deploy. Do not deploy to an unlinked/wrong project.');
}

function verifySource() {
  run('git', ['fetch', 'origin', 'main']);
  const project = require(`${process.cwd()}/.vercel/project.json`);
  const result = validateProductionDeploySource({
    head: capture('git', ['rev-parse', 'HEAD']),
    mainHead: capture('git', ['rev-parse', 'origin/main']),
    branch: capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
    workingTreeClean: capture('git', ['status', '--porcelain']).length === 0,
    projectName: project.projectName,
    allowOverride: process.env.FEVIO_ALLOW_NON_MAIN_PROD_DEPLOY === '1',
  });

  if (!result.ok) throw new Error(formatGuardFailure(result.reasons));
}

function maybeRunLocalChecks() {
  if (process.env.FEVIO_SKIP_LOCAL_CHECKS === '1') {
    console.log('Skipping local checks because FEVIO_SKIP_LOCAL_CHECKS=1. CI must be green before deploy.');
    return;
  }
  run('npm', ['run', 'typecheck']);
  run('npm', ['test']);
  run('npm', ['run', 'build']);
  run('npm', ['run', 'test:e2e']);
}

function deploy() {
  console.log(`\n$ npx vercel deploy --prod --yes`);
  const result = spawnSync('npx', ['vercel', 'deploy', '--prod', '--yes'], { encoding: 'utf8' });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);

  const output = `${result.stdout}\n${result.stderr}`;
  const deploymentId = output.match(/"id":\s*"(dpl_[^"]+)"/)?.[1] ?? 'unknown';
  const deploymentUrl = output.match(/"url":\s*"(https:\/\/[^"]+)"/)?.[1] ?? output.match(/Production:\s+(https:\/\/\S+)/)?.[1] ?? 'unknown';
  return { deploymentId, deploymentUrl };
}

async function smoke() {
  for (const check of REQUIRED_SMOKE) {
    const response = await fetch(`${PRODUCTION_ALIAS}${check.path}`, { redirect: 'manual' });
    const location = response.headers.get('location');
    if (response.status !== check.expectedStatus) {
      throw new Error(`${check.path} returned ${response.status}, expected ${check.expectedStatus}`);
    }
    if (check.expectedLocation && location !== check.expectedLocation) {
      throw new Error(`${check.path} redirected to ${location}, expected ${check.expectedLocation}`);
    }
    console.log(`Smoke pass: ${check.path} -> ${response.status}${location ? ` ${location}` : ''}`);
  }
}

async function main() {
  ensureProjectLink();
  verifySource();
  maybeRunLocalChecks();
  const deployment = deploy();
  await smoke();

  const commit = capture('git', ['rev-parse', '--short=12', 'HEAD']);
  console.log('\nProduction Green evidence block:');
  console.log(`- Commit: ${commit}`);
  console.log(`- Deploy ID: ${deployment.deploymentId}`);
  console.log(`- URL: ${PRODUCTION_ALIAS}`);
  console.log('- Smoke: /home and /settings redirect to /auth/sign-in; /privacy returns 200');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
