import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = 'app/api/records/journal/route.ts';

describe('records journal route contract', () => {
  it('adds a couple-scoped journal GET/POST API without billing artifacts', () => {
    expect(existsSync(route)).toBe(true);
    const source = readFileSync(route, 'utf8');

    expect(source).toContain("from('couple_journal_entries')");
    expect(source).toContain('author_role: actor.role');
    expect(source).toContain('pain_score: actor.role === \'primary\'');
    expect(source).toContain('partner_link_required');
    expect(source).toContain('hasApprovedPartnerLink');
    expect(source).toContain('photoUrls');
    expect(source).toContain('normalizePhotoUrls');
    expect(source).not.toContain('photo_urls: []');
    expect(source).not.toMatch(/receipt|financial|subsidy/iu);
  });
});
