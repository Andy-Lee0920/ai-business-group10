#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SHA_PATTERN = /\b[0-9a-f]{7,40}\b/gi;

export function isGreenEvidenceComment(body) {
  return /green evidence|green\s*[:：]|url-action-result|production deploy|deploy id|배포|검증|완료 증거/i.test(body);
}

export function extractCommitCandidates(body) {
  const matches = body.match(SHA_PATTERN) ?? [];
  return [...new Set(matches.map((match) => match.toLowerCase()))]
    .filter((match) => !/^\d+$/.test(match));
}

export function buildGreenEvidenceWarnings({ body, commits, missingCommits, branchOnlyCommits }) {
  if (!isGreenEvidenceComment(body)) return [];
  const warnings = [];
  if (commits.length === 0) {
    warnings.push('Green evidence comment does not include a commit SHA. Add the exact merged main commit used for QA/deploy evidence.');
  }
  for (const commit of missingCommits) warnings.push(`Referenced commit ${commit} is not available in this repository checkout.`);
  for (const commit of branchOnlyCommits) warnings.push(`Referenced commit ${commit} is not included in origin/main. Do not close the issue or treat this evidence as production-green until the PR is merged and production is redeployed from main.`);
  return warnings;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function hasCommit(commit) {
  try {
    git(['rev-parse', '--verify', `${commit}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function isAncestorOfMain(commit) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', commit, 'origin/main'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const body = process.env.COMMENT_BODY ?? '';
  const output = process.env.GREEN_EVIDENCE_WARNING_FILE ?? 'green-evidence-warning.md';
  git(['fetch', 'origin', 'main']);

  const commits = extractCommitCandidates(body);
  const missingCommits = commits.filter((commit) => !hasCommit(commit));
  const branchOnlyCommits = commits.filter((commit) => hasCommit(commit) && !isAncestorOfMain(commit));
  const warnings = buildGreenEvidenceWarnings({ body, commits, missingCommits, branchOnlyCommits });

  if (warnings.length === 0) {
    writeFileSync(output, '');
    console.log('Green evidence guard passed.');
    return;
  }

  writeFileSync(output, [
    '### Green evidence guard warning',
    '',
    'This issue comment looks like closure/deploy evidence, but it can still drift from production.',
    '',
    ...warnings.map((warning) => `- ${warning}`),
    '',
    'Required sequence: merge PR → deploy production from `origin/main` → smoke the live URL → update the issue with the merged commit and deploy ID.',
  ].join('\n'));
  console.error(warnings.join('\n'));
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
