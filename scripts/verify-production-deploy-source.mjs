#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const DEFAULT_MAIN_REF = 'origin/main';
const DEFAULT_EXPECTED_PROJECT = 'fevio';

export function formatGuardFailure(reasons) {
  return [
    'Production deploy guard failed.',
    '',
    ...reasons.map((reason) => `- ${reason}`),
    '',
    'Fix: merge the PR into main, fetch origin/main, check out that exact commit, then deploy.',
    'Emergency override: set FEVIO_ALLOW_NON_MAIN_PROD_DEPLOY=1 and include the reason in the issue/PR evidence.',
  ].join('\n');
}

export function validateProductionDeploySource({
  head,
  mainHead,
  branch,
  workingTreeClean,
  projectName,
  expectedProject = DEFAULT_EXPECTED_PROJECT,
  allowOverride = false,
}) {
  const reasons = [];

  if (!allowOverride && head !== mainHead) {
    reasons.push(`current HEAD ${head.slice(0, 12)} is not ${DEFAULT_MAIN_REF} ${mainHead.slice(0, 12)}`);
  }

  if (!allowOverride && branch !== 'HEAD' && branch !== 'main') {
    reasons.push(`current branch is ${branch}; production deploys must be from main or detached origin/main`);
  }

  if (!workingTreeClean) {
    reasons.push('working tree has uncommitted changes');
  }

  if (projectName && projectName !== expectedProject) {
    reasons.push(`linked Vercel project is ${projectName}, expected ${expectedProject}`);
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim();
}

function readVercelProjectName() {
  if (!existsSync('.vercel/project.json')) return null;
  const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
  return typeof project.projectName === 'string' ? project.projectName : null;
}

function main() {
  execFileSync('git', ['fetch', 'origin', 'main'], { stdio: 'inherit' });

  const head = git(['rev-parse', 'HEAD']);
  const mainHead = git(['rev-parse', DEFAULT_MAIN_REF]);
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const status = git(['status', '--porcelain']);
  const projectName = readVercelProjectName();

  const result = validateProductionDeploySource({
    head,
    mainHead,
    branch,
    workingTreeClean: status.length === 0,
    projectName,
    allowOverride: process.env.FEVIO_ALLOW_NON_MAIN_PROD_DEPLOY === '1',
  });

  if (!result.ok) {
    console.error(formatGuardFailure(result.reasons));
    process.exit(1);
  }

  console.log(`Production deploy source verified: ${head.slice(0, 12)} on ${branch}, project=${projectName ?? 'unlinked'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
