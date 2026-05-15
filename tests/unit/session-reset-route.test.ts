import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.hoisted(() => vi.fn());

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { signOut },
  }),
}));

function request() {
  return new NextRequest('https://project-oznp0.vercel.app/auth/reset', {
    headers: {
      cookie: [
        'fevio_privacy_accepted=1',
        'fevio_onboarding_first_card=abc',
        'fevio_onboarding_role_context=partner',
        'fevio_onboarding_care_cycle_state=abc',
        'fevio_treatment_milestones=abc',
        'fevio_treatment_cards=abc',
        'sb-awetgcuczwdytctwfyjl-auth-token=token',
      ].join('; '),
    },
  });
}

describe('/auth/reset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signs out and clears app/session state while preserving privacy acceptance before returning to sign-in', async () => {
    const { GET } = await import('../../app/auth/reset/route');

    const response = await GET(request());
    const setCookie = response.headers.getSetCookie().join('\n');

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://project-oznp0.vercel.app/auth/sign-in');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setCookie).not.toContain('fevio_privacy_accepted=;');
    expect(setCookie).toContain('fevio_onboarding_first_card=;');
    expect(setCookie).toContain('fevio_onboarding_role_context=;');
    expect(setCookie).toContain('fevio_onboarding_care_cycle_state=;');
    expect(setCookie).toContain('fevio_treatment_milestones=;');
    expect(setCookie).toContain('fevio_treatment_cards=;');
    expect(setCookie).toContain('sb-awetgcuczwdytctwfyjl-auth-token=;');
    expect(setCookie).not.toContain('fevio_privacy_gate_v1=;');
  });
});
