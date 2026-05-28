import { describe, expect, it, vi } from 'vitest';

type RpcResponse = { data: unknown; error: { message: string } | null };
type RpcCall = { name: string; args: Record<string, string> };

const rpcCalls = vi.hoisted((): RpcCall[] => []);
const rpcResponses = vi.hoisted((): RpcResponse[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    rpc: async (name: string, args: Record<string, string>) => {
      rpcCalls.push({ name, args });
      return rpcResponses.shift() ?? { data: null, error: { message: 'missing mock response' } };
    },
  }),
}));

describe('partner cards API route', () => {
  it('returns polling-safe role translated partner projection for usable tokens', async () => {
    rpcResponses.push(
      { data: true, error: null },
      {
        data: [
          {
            safe_id: 'safe-injection',
            title: '고날에프 주사',
            scheduled_at: '2026-05-10T12:30:00.000Z',
            card_type: 'injection',
            description: '오늘 21시 고날에프 1회',
            display_state: 'completed',
            revision: 7,
          },
        ],
        error: null,
      },
    );
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/live-token/cards'), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-fevio-sync-strategy')).toBe('polling');
    expect(rpcCalls.at(-1)).toMatchObject({ name: 'get_partner_action_view' });
    expect(payload.items[0]).toMatchObject({
      display_state: 'completed',
      sync_revision: 7,
      partner_role: '확인자',
      partner_action: expect.stringContaining('완료된 항목'),
      avoid_prompt: expect.stringContaining('재촉하지 않기'),
      visibility: 'partner_safe',
    });
    expect(JSON.stringify(payload)).not.toContain('source_text');
    expect(JSON.stringify(payload)).not.toContain('고날에프');
    expect(JSON.stringify(payload)).not.toContain('오늘 21시');
    expect(JSON.stringify(payload)).not.toContain('token_hash');
  });



  it('applies patient-owned basic sharing scope before returning partner projection', async () => {
    rpcResponses.push(
      { data: true, error: null },
      {
        data: [
          {
            safe_id: 'safe-basic',
            title: '21:00 오비드렐 트리거 확인',
            scheduled_at: '2026-05-10T12:30:00.000Z',
            card_type: 'injection',
            description: '냉장 보관 후 복부 오른쪽',
            display_state: 'current',
            revision: 1,
            sharing_scope: 'basic',
          },
        ],
        error: null,
      },
    );
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/live-token/cards'), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items[0]).not.toHaveProperty('title');
    expect(payload.items[0]).not.toHaveProperty('description');
    expect(JSON.stringify(payload)).not.toMatch(/오비드렐|냉장|복부/u);
  });

  it('adds emotional support copy without adding medical interpretation authority', async () => {
    rpcResponses.push(
      { data: true, error: null },
      {
        data: [
          {
            safe_id: 'safe-emotional',
            title: '다음 피검 일정',
            scheduled_at: '2026-05-20T00:30:00.000Z',
            card_type: 'clinic_confirmation',
            description: '다음 검사 시간을 함께 확인',
            display_state: 'current',
            revision: 1,
            sharing_scope: 'emotional',
          },
        ],
        error: null,
      },
    );
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/live-token/cards'), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload.items[0]).toMatchObject({
      partner_action: expect.stringContaining('정서 상태를 먼저 살펴 주세요'),
      visibility: 'partner_safe',
    });
    expect(serialized).not.toMatch(/성공|실패|임신|비임신|수치 해석|처방 수정/u);
  });

  it('returns 404 for expired partner tokens', async () => {
    rpcResponses.push({ data: false, error: null });
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/expired/cards'), {
      params: Promise.resolve({ token: 'expired' }),
    });

    expect(response.status).toBe(404);
    expect(rpcCalls.at(-1)?.name).toBe('is_partner_share_link_usable');
  });

  it('returns 404 for revoked partner tokens', async () => {
    rpcResponses.push({ data: false, error: null });
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/revoked/cards'), {
      params: Promise.resolve({ token: 'revoked' }),
    });

    expect(response.status).toBe(404);
  });
});
