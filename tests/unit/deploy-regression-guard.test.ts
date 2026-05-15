import { describe, expect, it } from 'vitest';
// @ts-expect-error Vitest imports runtime .mjs script helpers directly for regression coverage.
import { buildGreenEvidenceWarnings, extractCommitCandidates, isGreenEvidenceComment } from '../../scripts/check-green-evidence-comment.mjs';
// @ts-expect-error Vitest imports runtime .mjs script helpers directly for regression coverage.
import { validateProductionDeploySource } from '../../scripts/verify-production-deploy-source.mjs';

describe('production deployment regression guard', () => {
  it('blocks production deploys from branch-only commits', () => {
    const result = validateProductionDeploySource({
      head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      mainHead: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      branch: 'fix/home-hero',
      workingTreeClean: true,
      projectName: 'fevio',
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('current branch is fix/home-hero; production deploys must be from main or detached origin/main');
    expect(result.reasons[0]).toMatch(/current HEAD/);
  });

  it('allows detached origin/main production deploys when the tree is clean and linked to fevio', () => {
    const result = validateProductionDeploySource({
      head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      mainHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      branch: 'HEAD',
      workingTreeClean: true,
      projectName: 'fevio',
    });

    expect(result).toEqual({ ok: true, reasons: [] });
  });

  it('ignores numeric dates when extracting commit candidates', () => {
    const body = 'Green evidence on 20260515: commit 1b7115e, deploy passed';

    expect(extractCommitCandidates(body)).toEqual(['1b7115e']);
  });

  it('flags green evidence comments that cite commits not on main', () => {
    const body = 'Green evidence: commit 1b7115e, Deploy ID dpl_example, URL-action-result pass';
    const commits = extractCommitCandidates(body);
    const warnings = buildGreenEvidenceWarnings({ body, commits, missingCommits: [], branchOnlyCommits: ['1b7115e'] });

    expect(isGreenEvidenceComment(body)).toBe(true);
    expect(commits).toEqual(['1b7115e']);
    expect(warnings.join('\n')).toContain('not included in origin/main');
  });

  it('requires a commit SHA in closure-like green evidence', () => {
    const body = 'Green evidence: production deploy passed and URL-action-result pass';
    const warnings = buildGreenEvidenceWarnings({ body, commits: [], missingCommits: [], branchOnlyCommits: [] });

    expect(warnings).toContain('Green evidence comment does not include a commit SHA. Add the exact merged main commit used for QA/deploy evidence.');
  });
});
