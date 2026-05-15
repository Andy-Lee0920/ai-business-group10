import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type UploadCall = { bucket: string; path: string; file: File; options: { contentType: string; upsert: false } };

const userResponses = vi.hoisted((): UserResponse[] => []);
const uploadCalls = vi.hoisted((): UploadCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, options: { contentType: string; upsert: false }) => {
          uploadCalls.push({ bucket, path, file, options });
          return { data: { path }, error: null };
        },
      }),
    },
  }),
}));

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, options: { contentType: string; upsert: false }) => {
          uploadCalls.push({ bucket, path, file, options });
          return { data: { path }, error: null };
        },
      }),
    },
  }),
}));

function multipartRequest(formData: FormData, init?: { url?: string; cookie?: string }) {
  const host = init?.url ? new URL(init.url).host : undefined;
  return new NextRequest(init?.url ?? 'http://localhost/api/onboard/photo-upload', {
    method: 'POST',
    headers: {
      ...(host ? { host } : {}),
      ...(init?.cookie ? { cookie: init.cookie } : {}),
    },
    body: formData,
  });
}

describe('/api/onboard/photo-upload', () => {
  beforeEach(() => {
    userResponses.length = 0;
    uploadCalls.length = 0;
  });

  it('returns 401 when the user is unauthenticated', async () => {
    userResponses.push({ data: { user: null }, error: null });
    const { POST } = await import('../../app/api/onboard/photo-upload/route');
    const formData = new FormData();
    formData.set('file', new File(['photo'], 'clinic.jpg', { type: 'image/jpeg' }));

    const response = await POST(multipartRequest(formData));
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'unauthorized' });
    expect(uploadCalls).toHaveLength(0);
  });

  it('uploads a presentation image after privacy acceptance without a signed-in user', async () => {
    userResponses.push({ data: { user: null }, error: null });
    const { POST } = await import('../../app/api/onboard/photo-upload/route');
    const formData = new FormData();
    formData.set('file', new File(['photo'], 'clinic.jpg', { type: 'image/jpeg' }));

    const response = await POST(multipartRequest(formData, {
      url: 'https://ai-business-group10.vercel.app/api/onboard/photo-upload',
      cookie: 'fevio_privacy_gate_v1=accepted',
    }));
    const payload = await response.json() as { path: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ path: expect.stringMatching(/^presentation\/[0-9a-f-]{36}\.jpg$/u) });
    expect(uploadCalls[0]).toMatchObject({
      bucket: 'clinic-photos',
      path: payload.path,
      options: { contentType: 'image/jpeg', upsert: false },
    });
  });

  it('returns 400 when the multipart image file is missing', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/onboard/photo-upload/route');

    const response = await POST(multipartRequest(new FormData()));
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'image file is required' });
    expect(uploadCalls).toHaveLength(0);
  });

  it('uploads an authenticated image to the private clinic-photos patient path and returns only path', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/onboard/photo-upload/route');
    const formData = new FormData();
    formData.set('file', new File(['photo'], 'clinic.png', { type: 'image/png' }));

    const response = await POST(multipartRequest(formData));
    const payload = await response.json() as { path: string; signedUrl?: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ path: expect.stringMatching(/^patient-1\/[0-9a-f-]{36}\.jpg$/u) });
    expect(payload.signedUrl).toBeUndefined();
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0]).toMatchObject({
      bucket: 'clinic-photos',
      path: payload.path,
      options: { contentType: 'image/png', upsert: false },
    });
  });
});
