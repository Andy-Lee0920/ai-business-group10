import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PartnerShareLinkRepository } from '../../src/services/partner-share-link-service';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };

const userResponses = vi.hoisted((): UserResponse[] => []);
const repository = vi.hoisted((): PartnerShareLinkRepository => ({
  listByUser: vi.fn(),
  revokeByOwner: vi.fn(),
}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
  }),
}));

vi.mock('../../src/lib/partner-share-link-repository', () => ({
  createPartnerShareLinkRepository: () => repository,
}));

function postRequest(path: string) {
  return new NextRequest(`http://localhost${path}`, { method: 'POST' });
}

describe('partner share link API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userResponses.length = 0;
  });

  it('GET /api/partner-share-links returns active link summaries without token hashes', async () => {
    userResponses.push({ data: { user: { id: 'user-1' } }, error: null });
    vi.mocked(repository.listByUser).mockResolvedValue([
      {
        id: 'link-1',
        created_by: 'user-1',
        created_at: '2026-05-10T01:00:00.000Z',
        expires_at: '2026-05-17T01:00:00.000Z',
        revoked_at: null,
        last_accessed_at: null,
      },
    ]);
    const { GET } = await import('../../app/api/partner-share-links/route');

    const response = await GET();
    const payload = (await response.json()) as { links: unknown[] };

    expect(response.status).toBe(200);
    expect(JSON.stringify(payload)).not.toContain('token_hash');
    expect(payload.links).toEqual([
      {
        id: 'link-1',
        createdAt: '2026-05-10T01:00:00.000Z',
        expiresAt: '2026-05-17T01:00:00.000Z',
        lastAccessedAt: null,
        revokedAt: null,
      },
    ]);
  });

  it('POST revoke returns revoked_at for an owned link', async () => {
    userResponses.push({ data: { user: { id: 'user-1' } }, error: null });
    vi.mocked(repository.revokeByOwner).mockResolvedValue({
      id: 'link-1',
      created_by: 'user-1',
      created_at: '2026-05-10T01:00:00.000Z',
      expires_at: '2026-05-17T01:00:00.000Z',
      revoked_at: '2026-05-11T01:00:00.000Z',
    });
    const { POST } = await import('../../app/api/partner-share-links/[id]/revoke/route');

    const response = await POST(postRequest('/api/partner-share-links/link-1/revoke'), {
      params: Promise.resolve({ id: 'link-1' }),
    });

    await expect(response.json()).resolves.toEqual({ revoked_at: '2026-05-11T01:00:00.000Z' });
    expect(response.status).toBe(200);
    expect(repository.revokeByOwner).toHaveBeenCalledWith('link-1', 'user-1', expect.any(String));
  });

  it('POST revoke rejects another user link without leaking raw user data', async () => {
    userResponses.push({ data: { user: { id: 'user-2' } }, error: null });
    vi.mocked(repository.revokeByOwner).mockResolvedValue(null);
    const { POST } = await import('../../app/api/partner-share-links/[id]/revoke/route');

    const response = await POST(postRequest('/api/partner-share-links/link-1/revoke'), {
      params: Promise.resolve({ id: 'link-1' }),
    });
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(403);
    expect(body).toContain('권한이 없습니다');
    expect(body).not.toContain('user-2');
    expect(body).not.toContain('token');
  });
});
