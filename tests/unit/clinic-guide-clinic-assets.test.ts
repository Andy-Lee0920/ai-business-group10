import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const form = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

describe('Clinic Guide clinic asset contract', () => {
  it('renders clinic update surfaces through SLCIllustration and canonical slcAssets only', () => {
    expect(form).toContain("import { SLCIllustration } from '../../components/slc-illustration'");
    expect(form).toContain("import { slcAssets } from '../../design/slc-assets'");
    expect(form).toContain('asset={slcAssets.clinic.visitClipboard}');
    expect(form).toContain('asset={slcAssets.clinic.diff}');
    expect(form).toContain('asset={slcAssets.clinic.fallback}');
    expect(form).not.toContain('<img');
  });

  it('places clinic visuals on entry, diff review, and manual fallback states', () => {
    expect(form.indexOf("step === 'entry'")).toBeLessThan(form.indexOf('asset={slcAssets.clinic.visitClipboard}'));
    expect(form.indexOf('asset={slcAssets.clinic.visitClipboard}')).toBeLessThan(form.indexOf('copy.photoAction'));
    expect(form.indexOf("step === 'diff_review'")).toBeLessThan(form.indexOf('asset={slcAssets.clinic.diff}'));
    expect(form.indexOf("step === 'manual_entry'")).toBeLessThan(form.indexOf('asset={slcAssets.clinic.fallback}'));
    expect(form.indexOf('asset={slcAssets.clinic.fallback}')).toBeLessThan(form.indexOf('직접 입력 form 열기'));
  });
});
