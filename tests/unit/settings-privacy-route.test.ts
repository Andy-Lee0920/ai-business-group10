import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsPrivacyPage = readFileSync('app/(authed)/settings/privacy/page.tsx', 'utf8');
const sharingPage = readFileSync('app/(authed)/settings/sharing/page.tsx', 'utf8');

describe('settings privacy and nested settings routes', () => {
  it('keeps data security information inside the authenticated settings shell', () => {
    expect(settingsPrivacyPage).toContain('데이터 보안');
    expect(settingsPrivacyPage).toContain('관리로 돌아가기');
    expect(settingsPrivacyPage).toContain('href="/settings"');
    expect(settingsPrivacyPage).not.toContain("redirect('/privacy')");
  });

  it('does not send nested settings sections back to home or the first-run app entry', () => {
    expect(sharingPage).toContain("redirect('/settings#partner-invite')");
    expect(sharingPage).not.toContain("redirect('/home')");
  });
});
