import { describe, expect, expectTypeOf, it } from 'vitest';
import type { PartnerShareLinkSummary } from '../../src/types/partner-share-link.types';
import {
  listActiveLinksForUser,
  revokeLink,
  type PartnerShareLinkRepository,
} from '../../src/services/partner-share-link-service';

type LinkFixture = {
  id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_accessed_at: string | null;
};

const NOW = '2026-05-11T01:00:00.000Z';

function createRepository(rows: LinkFixture[]): PartnerShareLinkRepository {
  return {
    async listByUser(userId) {
      return rows.filter((row) => row.created_by === userId);
    },
    async revokeByOwner(linkId, userId, revokedAt) {
      const row = rows.find((candidate) => candidate.id === linkId);
      if (!row || row.created_by !== userId) return null;
      row.revoked_at = revokedAt;
      return { ...row };
    },
  };
}

function fixtures(): LinkFixture[] {
  return [
    {
      id: 'link-1',
      created_by: 'user-1',
      created_at: '2026-05-10T01:00:00.000Z',
      expires_at: '2026-05-17T01:00:00.000Z',
      revoked_at: null,
      last_accessed_at: null,
    },
    {
      id: 'link-2',
      created_by: 'user-1',
      created_at: '2026-05-09T01:00:00.000Z',
      expires_at: '2026-05-16T01:00:00.000Z',
      revoked_at: '2026-05-10T02:00:00.000Z',
      last_accessed_at: '2026-05-10T01:30:00.000Z',
    },
  ];
}

describe('partner share link service', () => {
  it('revokeLink — 본인 소유 링크는 revoked_at을 설정한다', async () => {
    const result = await revokeLink('link-1', 'user-1', createRepository(fixtures()), () => NOW);

    expect(result.revoked_at).toBe(NOW);
  });

  it('revokeLink — 다른 사용자 소유 링크는 throw', async () => {
    await expect(revokeLink('link-1', 'user-2', createRepository(fixtures()), () => NOW)).rejects.toThrow('권한이 없습니다');
  });

  it('listActiveLinksForUser — revoked link는 제외', async () => {
    const links = await listActiveLinksForUser('user-1', createRepository(fixtures()));

    expect(links).toHaveLength(1);
    expect(links.every((link) => link.revokedAt === null)).toBe(true);
  });

  it('listActiveLinksForUser — active links use camelCase summary shape', async () => {
    const [link] = await listActiveLinksForUser('user-1', createRepository(fixtures()));

    expect(link).toEqual({
      id: 'link-1',
      createdAt: '2026-05-10T01:00:00.000Z',
      expiresAt: '2026-05-17T01:00:00.000Z',
      lastAccessedAt: null,
      revokedAt: null,
    });
  });

  it('revokeLink — 빈 link id는 의미 있는 에러를 던진다', async () => {
    await expect(revokeLink('', 'user-1', createRepository(fixtures()), () => NOW)).rejects.toThrow('link id가 필요합니다');
  });

  it('revokeLink — 빈 user id는 의미 있는 에러를 던진다', async () => {
    await expect(revokeLink('link-1', '', createRepository(fixtures()), () => NOW)).rejects.toThrow('user id가 필요합니다');
  });

  it('expectTypeOf — PartnerShareLinkSummary shape', () => {
    expectTypeOf<PartnerShareLinkSummary>().toMatchTypeOf<{ id: string; revokedAt: string | null }>();
    expectTypeOf(listActiveLinksForUser).returns.resolves.toEqualTypeOf<PartnerShareLinkSummary[]>();
    expectTypeOf(revokeLink).returns.resolves.toEqualTypeOf<{ revoked_at: string }>();
  });
});
