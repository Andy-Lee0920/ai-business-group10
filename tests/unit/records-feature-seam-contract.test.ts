import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const requiredSeams = [
  'src/domain/records-surface-contract.ts',
  'src/features/records/journal/journal-preview.tsx',
  'src/features/records/community/community-preview.tsx',
  'src/domain/couple-journal.ts',
  'src/domain/community-identity.ts',
  'src/domain/community-moderation.ts',
  'src/domain/community-empathy.ts',
  'src/types/journal.types.ts',
  'src/types/community.types.ts',
];

describe('records feature seam contract', () => {
  it('has explicit journal/community feature, domain, and type seams', () => {
    expect(requiredSeams.filter((path) => !existsSync(path))).toEqual([]);
  });

  it('keeps records-screen as a shell that delegates journal/community previews', () => {
    const source = readFileSync('src/features/records/records-screen.tsx', 'utf8');

    expect(source).toContain("../../domain/records-surface-contract");
    expect(source).toContain("./journal/journal-preview");
    expect(source).toContain("./community/community-preview");
    expect(source).toContain('<JournalPreview');
    expect(source).toContain('<CommunityPreview');
  });

  it('routes records copy and activity math through the product contract seam', () => {
    const recordsScreen = readFileSync('src/features/records/records-screen.tsx', 'utf8');
    const journalPreview = readFileSync('src/features/records/journal/journal-preview.tsx', 'utf8');
    const communityPreview = readFileSync('src/features/records/community/community-preview.tsx', 'utf8');

    expect(recordsScreen).toContain('countRecordsActivity({ journalEntries, communityPosts })');
    expect(recordsScreen).toContain('defaultRecordsTab(isPartnerLinked)');
    expect(journalPreview).toContain("../../../domain/records-surface-contract");
    expect(communityPreview).toContain("../../../domain/records-surface-contract");
  });
});
