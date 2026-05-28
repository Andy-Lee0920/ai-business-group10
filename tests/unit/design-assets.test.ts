import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fevioAssets, getFevioIconAsset, type FevioIconAssetName } from '../../src/design/assets';

describe('Fevio production design assets', () => {
  it('provides reusable product icons for the P1 care surfaces', () => {
    const required: FevioIconAssetName[] = ['actionTimer', 'careHandoff', 'clinicNote', 'quietEmpathy', 'ivfCycle'];
    for (const name of required) {
      const asset = getFevioIconAsset(name);
      expect(asset.path).toMatch(/^\/assets\/fevio\/.+\.svg$/u);
      expect(asset.role.length).toBeGreaterThan(10);
      expect(existsSync(`public${asset.path}`)).toBe(true);
      expect(readFileSync(`public${asset.path}`, 'utf8')).toContain('<title');
    }
  });

  it('keeps the logo and icon inventory explicit', () => {
    expect(fevioAssets.logo.path).toBe('/logo.svg');
    expect(Object.keys(fevioAssets.icons)).toHaveLength(5);
  });
});
