import { describe, expect, it } from 'vitest';
import { RECORDS_SURFACE_COPY, countRecordsActivity, defaultRecordsTab } from '../../src/domain/records-surface-contract';

describe('records surface contract', () => {
  it('keeps the records product language anchored to journal and shared records', () => {
    expect(RECORDS_SURFACE_COPY.tabs).toEqual({
      journal: '커플저널',
      community: '공유 기록',
    });
    expect(RECORDS_SURFACE_COPY.header.lead(2)).toBe('커플저널과 공유 기록을 한 화면에서 전환해요. 최근 기록 2건');
    expect(RECORDS_SURFACE_COPY.community.title).toBe('사진으로 남기는 확인 기록');
    expect(RECORDS_SURFACE_COPY.community.photoHint).toContain('개인정보');
    expect(RECORDS_SURFACE_COPY.community.photoUploadFailed).toContain('사진 저장 공간');
  });

  it('counts only journal entries and shared-record posts as records activity', () => {
    expect(countRecordsActivity({
      journalEntries: ['journal-1'],
      communityPosts: ['post-1', 'post-2'],
    })).toBe(3);
  });

  it('defaults linked couples to journal and unlinked users to community', () => {
    expect(defaultRecordsTab(true)).toBe('journal');
    expect(defaultRecordsTab(false)).toBe('community');
  });
});
