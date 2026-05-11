import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const RUN_DOC = 'docs/03-engineering/slc-release-gate-run-2026-05-11.md';
const CHECKLIST = 'docs/03-engineering/slc-release-gate-checklist.md';
const BOARDS = 'docs/03-engineering/project-boards.md';
const PR_TEMPLATE = '.github/PULL_REQUEST_TEMPLATE.md';

describe('SLC release-gate evidence (#56)', () => {
  const runDoc = readFileSync(RUN_DOC, 'utf8');
  const checklist = readFileSync(CHECKLIST, 'utf8');
  const boards = readFileSync(BOARDS, 'utf8');
  const prTemplate = readFileSync(PR_TEMPLATE, 'utf8');

  it('records the production evidence needed to close the release gate without secret values', () => {
    for (const required of [
      'Status: executed evidence for `#56`',
      'https://project-oznp0.vercel.app',
      'https://ai-business-group10.vercel.app',
      'GitHub Actions',
      '`/api/reminders/send-due` without auth',
      '`401`',
      'Question 01',
      'LIVE SYNC',
      'two iPhone frames',
      'full human Google OAuth login was not completed',
    ]) {
      expect(runDoc).toContain(required);
    }

    expect(runDoc).not.toMatch(/RESEND_API_KEY=.+/u);
    expect(runDoc).not.toMatch(/REMINDER_DISPATCH_SECRET=.+/u);
  });

  it('keeps non-core email delivery from blocking SLC closure', () => {
    expect(runDoc).toContain('Non-core email sending and external scheduler proof do not block');
    expect(runDoc).toContain('Email/scheduler proof');
    expect(runDoc).toContain('Not a blocker');
    expect(checklist).toContain('Email reminder path is explicitly scoped out for this QA run as non-core');
    expect(boards).toContain('[x] [BOOST] Email 1회 리마인드 동작');
  });

  it('links the checklist and board burnup to the committed run artifact', () => {
    expect(checklist).toContain(RUN_DOC);
    expect(boards).toContain(RUN_DOC);
    expect(boards).toContain('[x] SLC manual QA checklist evidence recorded');
    expect(prTemplate).toContain('docs/03-engineering/slc-release-gate-checklist.md');
    expect(prTemplate).toContain('release-gate run artifact');
  });
});
