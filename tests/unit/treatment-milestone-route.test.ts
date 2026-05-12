import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { POST } from '../../app/api/treatment/milestone/route';

function request(body: unknown) {
  return new NextRequest('http://project-oznp0.vercel.app/api/treatment/milestone', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'project-oznp0.vercel.app', cookie: 'fevio_privacy_accepted=1' },
    body: JSON.stringify(body),
  });
}

describe('/api/treatment/milestone', () => {
  it('creates a demo-safe milestone payload and returns v2 care surface', async () => {
    const response = await POST(request({ startedAt: '2026-05-10', milestone: 'stimulation_start', confirmedAt: '2026-05-10' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ persisted: false, cycleId: 'demo-treatment-cycle', redirectTo: '/home' });
    expect(payload.careSurface).toMatchObject({ phaseCareDay: 'injection_day', surfaceCareDay: 'injection_day' });
  });

  it('rejects invalid dates with a Korean user-facing message', async () => {
    const response = await POST(request({ startedAt: 'May 10' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('YYYY-MM-DD');
  });
});
