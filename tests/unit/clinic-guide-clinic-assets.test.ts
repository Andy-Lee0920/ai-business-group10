import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const form = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

describe('Clinic Guide clinic asset contract', () => {
  it('renders clinic update through the shared ambient story background only', () => {
    expect(form).toContain("import { AmbientStoryBackground } from '../../components/ambient-story-background'");
    expect(form).toContain("import { slcAssets } from '../../design/slc-assets'");
    expect(form).toContain('asset={slcAssets.clinic.visitClipboard}');
    expect(form).not.toContain('SLCIllustration');
    expect(form).not.toContain('slcAssets.clinic.diff');
    expect(form).not.toContain('slcAssets.clinic.fallback');
    expect(form).not.toContain('<img');
  });

  it('keeps clinic update copy readable while PNG is ambient rather than state-specific', () => {
    expect(form).toContain("step === 'entry'");
    expect(form).toContain("step === 'diff_review'");
    expect(form).toContain("step === 'manual_entry'");
    expect(form).toContain('copy.photoAction');
    expect(form).toContain('진료 내용 직접 남기기');
    expect(form).toContain('질문으로 정리하기');
  });
});
