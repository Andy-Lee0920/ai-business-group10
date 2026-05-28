import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = [
  'app/(authed)/records/page.tsx',
  'app/(authed)/home/page.tsx',
];

const loaders = [
  'src/features/records/records-page-loader.ts',
  'src/features/today/home-page-loader.tsx',
];

describe('presentation source injection contract', () => {
  it('keeps authed pages unaware of direct presentation/demo flags and fixture modules', () => {
    for (const pagePath of pages) {
      const source = readFileSync(pagePath, 'utf8');
      expect(source).not.toContain('isPresentationRequest');
      expect(source).not.toContain('presentation-testbed');
      expect(source).not.toContain('PresentationHomeDemo');
    }
  });

  it('uses loader seams that accept an explicit fixture or supabase data source', () => {
    expect(loaders.filter((path) => !existsSync(path))).toEqual([]);
    for (const loaderPath of loaders) {
      const source = readFileSync(loaderPath, 'utf8');
      expect(source).toContain('fixture');
      expect(source).toContain('supabase');
    }
  });
});
