import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuth = vi.hoisted(() => vi.fn());

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { signInWithOAuth },
  }),
}));

describe('/auth/sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://project-oznp0.vercel.app');
  });

  it('forces account selection for repeated QA login/logout cycles', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' }, error: null });
    const { GET } = await import('../../app/auth/sign-in/route');

    const response = await GET(new NextRequest('https://project-oznp0.vercel.app/auth/sign-in'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://project-oznp0.vercel.app/auth/callback',
        queryParams: { prompt: 'select_account' },
      },
    });
  });
});
