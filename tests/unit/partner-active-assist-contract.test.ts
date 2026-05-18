import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const client = readFileSync('app/partner/[token]/PartnerActionViewClient.tsx', 'utf8');
const surface = readFileSync('app/partner/[token]/PartnerRoleSurface.tsx', 'utf8');
const assistRoute = readFileSync('app/api/partner/[token]/assist/route.ts', 'utf8');

describe('Partner active assist contract', () => {
  it('polls cards every 3 seconds only while visible and stops on unmount', () => {
    expect(client).toContain("document.visibilityState !== 'visible'");
    expect(client).toContain('setTimeout(load, 3_000)');
    expect(client).toContain("document.addEventListener('visibilitychange'");
    expect(client).toContain("document.removeEventListener('visibilitychange'");
    expect(client).toContain('clearTimeout(timer)');
    expect(client).not.toContain('setTimeout(load, 5_000)');
  });

  it('records partner assist through the token route without exposing raw ids in the view model', () => {
    expect(client).toContain("action: 'record_assist'");
    expect(client).toContain('cardId: item.safe_id');
    expect(surface).toContain('도움 완료');
    expect(surface).toContain('도움 기록됨');
    expect(surface).toContain("item.card_type === 'injection'");
    expect(assistRoute).toContain('resolveCardIdFromSafeId');
    expect(assistRoute).toContain('safePartnerItemId(candidate.id)');
  });
});
