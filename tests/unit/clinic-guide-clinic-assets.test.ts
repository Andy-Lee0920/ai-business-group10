import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const form = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

describe('Clinic Guide clinic asset contract', () => {
  it('renders clinic update surfaces through SLCIllustration and canonical slcAssets only', () => {
    expect(form).toContain("import { SLCIllustration } from '../../components/slc-illustration'");
    expect(form).toContain("import { slcAssets } from '../../design/slc-assets'");
    expect(form).toContain('asset={slcAssets.clinic.updateBanner}');
    expect(form).toContain('asset={slcAssets.clinic.visitClipboard}');
    expect(form).toContain('asset={slcAssets.clinic.diff}');
    expect(form).toContain('asset={slcAssets.clinic.fallback}');
    expect(form).not.toContain('<img');
  });

  it('places clinic visuals on entry, diff review, and manual fallback states', () => {
    expect(form.indexOf('asset={slcAssets.clinic.updateBanner}')).toBeLessThan(form.indexOf('오늘 병원 업데이트'));
    expect(form.indexOf('asset={slcAssets.clinic.visitClipboard}')).toBeLessThan(form.indexOf('오늘 병원<br />업데이트가 필요해요'));
    const draftPanelBody = form.slice(form.indexOf('function DraftPanel'));
    expect(draftPanelBody.indexOf('asset={slcAssets.clinic.diff}')).toBeLessThan(draftPanelBody.indexOf('<h2'));
    expect(form.indexOf('asset={slcAssets.clinic.fallback}')).toBeLessThan(form.indexOf('검색 결과가 없어요'));
  });
});
