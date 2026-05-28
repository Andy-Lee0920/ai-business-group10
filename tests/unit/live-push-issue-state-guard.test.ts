import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-live-push-issue-state.mjs';

function writeIssues(issues: Array<{ number: number; state: string; title?: string }>) {
  const dir = mkdtempSync(join(tmpdir(), 'fevio-push-issues-'));
  const path = join(dir, 'issues.json');
  writeFileSync(path, JSON.stringify(issues));
  return path;
}

const openIssueSet = [
  { number: 377, state: 'OPEN', title: 'PWA infra parent' },
  { number: 380, state: 'OPEN', title: 'scheduler parent' },
  { number: 382, state: 'OPEN', title: 'Android live smoke' },
  { number: 383, state: 'OPEN', title: 'iOS live smoke' },
];

describe('live push issue state guard', () => {
  it('passes while physical live-smoke children and push parents remain open', () => {
    const output = execFileSync('node', [scriptPath, '--issues-json', writeIssues(openIssueSet)], { encoding: 'utf8' });

    expect(output).toContain('#382 OPEN');
    expect(output).toContain('#383 OPEN');
    expect(output).toContain('live push issue state guard passed');
  });

  it('fails if Android live-smoke issue is closed before physical evidence is recorded', () => {
    const issuesPath = writeIssues(openIssueSet.map((issue) => issue.number === 382 ? { ...issue, state: 'CLOSED' } : issue));

    const result = spawnSync('node', [scriptPath, '--issues-json', issuesPath], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#382 must remain OPEN until physical Android live push evidence is attached');
  });

  it('fails if a push parent is closed while live-device child Reds remain open', () => {
    const issuesPath = writeIssues(openIssueSet.map((issue) => issue.number === 377 ? { ...issue, state: 'CLOSED' } : issue));

    const result = spawnSync('node', [scriptPath, '--issues-json', issuesPath], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#377 must remain OPEN while #382/#383 live-device Reds remain open');
  });
});
