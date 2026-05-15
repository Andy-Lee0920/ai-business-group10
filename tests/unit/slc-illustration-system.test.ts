import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { slcAssets } from '../../src/design/slc-assets';

describe('Fevio SLC illustration system', () => {
  it('keeps canonical asset taxonomy with alt/decorative policy', () => {
    expect(slcAssets.onboarding.patientRole.alt).toContain('기록자');
    expect(slcAssets.partner.invite.alt).toBe('파트너 초대 일러스트');
    expect(slcAssets.home.injection.decorative).toBe(true);
    expect(slcAssets.empty.records.alt).toBe('기록이 없습니다');
  });

  it('maps every canonical asset to an existing public file', () => {
    const serialized = JSON.stringify(slcAssets);
    const paths = Array.from(serialized.matchAll(/"src":"([^"]+)"/gu)).map((match) => match[1]);
    expect(paths.length).toBeGreaterThan(10);
    for (const path of paths) {
      expect(existsSync(`public${path}`)).toBe(true);
    }
  });

  it('renders through the SLCIllustration primitive with next image and decorative handling', () => {
    const source = readFileSync('src/components/slc-illustration.tsx', 'utf8');
    expect(source).toContain("import Image from 'next/image'");
    expect(source).toContain("alt={decorative ? '' : asset.alt}");
    expect(source).toContain('aria-hidden={decorative ? true : undefined}');
  });
});
