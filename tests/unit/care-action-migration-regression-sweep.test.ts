import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_SRC_TEST_ROOTS = ['app', 'src', 'tests'] as const;
const RUNTIME_ROOTS = ['app', 'src'] as const;

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function sourceFiles(roots: readonly string[]) {
  const files: string[] = [];
  const visit = (path: string) => {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (path.includes('node_modules') || path.includes('.next')) return;
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (/\.(ts|tsx)$/.test(path)) files.push(path);
  };
  for (const root of roots) visit(root);
  return files;
}

describe('Issue #440 Slice 5 final migration regression sweep', () => {
  it('has no deprecated care action candidate runtime term while preserving split_candidates as the split draft table', () => {
    const forbidden = ['care_action', 'candidates'].join('_');
    const offenders = sourceFiles(APP_SRC_TEST_ROOTS)
      .filter((file) => !file.endsWith('care-action-migration-regression-sweep.test.ts'))
      .filter((file) => source(file).includes(forbidden));

    expect(offenders).toEqual([]);
    expect(source('app/api/clinic-update/route.ts')).toContain("from('split_candidates')");
    expect(source('app/api/onboard/candidates/confirm/route.ts')).toContain("from('split_candidates')");
  });

  it('keeps direct care_action_cards inserts centralized in the canonical writer', () => {
    const offenders = sourceFiles(RUNTIME_ROOTS)
      .filter((file) => file !== 'src/lib/canonical-care-action-writer.ts')
      .filter((file) => /from\(['"]care_action_cards['"]\)[\s\S]{0,500}\.insert\(/.test(source(file)));

    expect(offenders).toEqual([]);
    expect(source('app/api/schedule/add/route.ts')).not.toContain("from('care_action_cards')");
    expect(source('app/api/clinic-update/route.ts')).toContain('createConfirmedCareActions');
    expect(source('app/api/clinic-update/route.ts')).toContain("from('split_candidates')");
  });

  it('guards partner-visible reads with the approved linked patient scope before serialization', () => {
    const partnerPage = source('app/(authed)/partner/page.tsx');
    const partnerReader = source('src/features/partner/read-partner-care-cards.ts');
    const partnerProjection = source('src/features/partner/partner-care-card-projection.ts');
    const linkIndex = partnerPage.indexOf("from('partner_links')");
    const facadeIndex = partnerPage.indexOf('getPartnerVisibleCareCards(supabase', linkIndex);
    const serializeIndex = partnerPage.indexOf('serializePartnerViewCards', facadeIndex);
    const cardIndex = partnerReader.indexOf("from('care_action_cards')");
    const patientScopeIndex = partnerReader.indexOf("eq('created_by', input.linkedPatientId)");
    const visibleIndex = partnerReader.indexOf("eq('partner_visible', true)");

    expect(linkIndex).toBeGreaterThanOrEqual(0);
    expect(facadeIndex).toBeGreaterThan(linkIndex);
    expect(serializeIndex).toBeGreaterThan(facadeIndex);
    expect(partnerPage).toContain("select('patient_id, status')");
    expect(partnerPage).toContain("eq('partner_id', user.id)");
    expect(partnerPage).toContain("link.status !== 'approved'");
    expect(partnerPage).toContain('linkedPatientId: link.patient_id');
    expect(cardIndex).toBeGreaterThanOrEqual(0);
    expect(patientScopeIndex).toBeGreaterThan(cardIndex);
    expect(visibleIndex).toBeGreaterThan(patientScopeIndex);
    expect(partnerReader).toContain('linked patient/couple scope');
    expect(partnerReader).toContain('This intentionally has no schedule_items fallback');
    expect(partnerProjection).toContain('Do not replace this with the patient/home projection');
    expect(partnerPage + partnerReader).not.toContain("from('schedule_items')");
  });

  it('keeps schedule_items as legacy fallback/read compatibility, not the preferred schedule read model', () => {
    for (const file of [
      'src/features/today/home-page-loader.tsx',
      'app/api/schedule/route.ts',
      'app/(authed)/calendar/page.tsx',
      'app/(authed)/add/page.tsx',
      'app/(authed)/clinic-update/page.tsx',
    ]) {
      const text = source(file);
      expect(text.indexOf("from('care_action_cards')")).toBeGreaterThanOrEqual(0);
      expect(text.indexOf("from('schedule_items')")).toBeGreaterThan(text.indexOf("from('care_action_cards')"));
      expect(text).toContain('mergeCanonicalScheduleItemsWithLegacyFallback');
    }

    expect(source('app/api/schedule/add/route.ts')).toContain('Legacy compatibility write');
    expect(source('app/api/schedule/[id]/route.ts')).toContain('Legacy compatibility fallback');
    expect(source('app/api/schedule/complete/route.ts')).toContain("source: 'care_action_cards'");
  });

  it('has no stray migration notes or debug statements in runtime code', () => {
    const forbidden = [String.raw`\bTO${'DO'}\b`, String.raw`\bFIX${'ME'}\b`, ['console', String.raw`\.`, 'log', String.raw`\(`].join(''), String.raw`\b${'debug'}ger\b`];
    const pattern = new RegExp(forbidden.join('|'));
    const offenders = sourceFiles(RUNTIME_ROOTS)
      .filter((file) => file !== 'src/domain/slc-mobile-quality.ts')
      .filter((file) => pattern.test(source(file)));

    expect(offenders).toEqual([]);
  });
});
