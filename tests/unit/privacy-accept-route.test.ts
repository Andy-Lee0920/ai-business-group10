import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const createCookieBackedSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient,
}));

vi.mock('../../src/lib/couple-bootstrap-admin', () => ({
  acceptPrivacyGateForUserWithServiceRole: vi.fn(),
  bootstrapCoupleForUserWithServiceRole: vi.fn(),
  isInitCoupleAmbiguityError: vi.fn(() => false),
}));

describe('/api/privacy/accept', () => {
  it('accepts the pre-auth privacy gate from an HTML form and redirects to the safe next path', async () => {
    const { POST } = await import('../../app/api/privacy/accept/route');
    const formData = new FormData();
    formData.set('next', '/auth/sign-in');

    const response = await POST(
      new NextRequest('https://project-oznp0.vercel.app/api/privacy/accept', {
        method: 'POST',
        headers: { accept: 'text/html', origin: 'https://project-oznp0.vercel.app' },
        body: formData,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://project-oznp0.vercel.app/auth/sign-in');
    expect(response.headers.getSetCookie().join('\n')).toContain('fevio_privacy_gate_v1=accepted');
    expect(createCookieBackedSupabaseClient).not.toHaveBeenCalled();
  });

  it('falls back to onboarding for unsafe or recursive next paths', async () => {
    const { POST } = await import('../../app/api/privacy/accept/route');
    const formData = new FormData();
    formData.set('next', '//evil.example');

    const response = await POST(
      new NextRequest('https://project-oznp0.vercel.app/api/privacy/accept', {
        method: 'POST',
        headers: { accept: 'text/html', origin: 'https://project-oznp0.vercel.app' },
        body: formData,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://project-oznp0.vercel.app/onboarding');
  });
});
