import { NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

import { GET } from '../../app/api/schedule/route';

describe('/api/schedule SLC read route', () => {
  it('does not expose legacy schedule POST from the deprecated care-OS flow', async () => {
    const module = await import('../../app/api/schedule/route');
    expect('POST' in module).toBe(false);
  });

  it('requires authentication before reading schedule items', async () => {
    const response = await GET();
    const payload = await response.json() as { error: string };
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    expect(payload.error).toBe('unauthorized');
  });
});
