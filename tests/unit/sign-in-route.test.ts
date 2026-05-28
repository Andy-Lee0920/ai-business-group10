import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuth = vi.hoisted(() => vi.fn());
const getUser = vi.hoisted(() => vi.fn());

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser, signInWithOAuth },
  }),
}));

describe('/auth/sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://project-oznp0.vercel.app');
  });

  it('sends users through the privacy gate before Google OAuth', async () => {
    const { GET } = await import('../../app/auth/sign-in/route');

    const response = await GET(new NextRequest('https://project-oznp0.vercel.app/auth/sign-in'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://project-oznp0.vercel.app/privacy?next=/auth/sign-in');
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });



  it('does not send an already signed-in user back to the privacy/sign-in loop', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    const { GET } = await import('../../app/auth/sign-in/route');

    const response = await GET(new NextRequest('https://project-oznp0.vercel.app/auth/sign-in?next=/settings/privacy'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://project-oznp0.vercel.app/settings/privacy');
    expect(response.headers.getSetCookie().join('\n')).toContain('fevio_privacy_gate_v1=accepted');
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it('forces account selection for repeated QA login/logout cycles after privacy acceptance', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' }, error: null });
    const { GET } = await import('../../app/auth/sign-in/route');

    const response = await GET(new NextRequest('https://project-oznp0.vercel.app/auth/sign-in', { headers: { cookie: 'fevio_privacy_gate_v1=accepted' } }));

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
