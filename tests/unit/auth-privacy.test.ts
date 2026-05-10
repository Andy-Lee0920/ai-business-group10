import { describe, expect, it } from 'vitest';
import {
  PRIVACY_GATE_VERSION,
  acceptPrivacyGate,
  bootstrapCoupleShell,
  canCreateSensitiveRow,
} from '../../src/domain/auth-privacy';
import { getPrivacyContactEmail } from '../../src/config';

describe('auth/privacy bootstrap domain', () => {
  it('creates an idempotent couple shell with primary, partner placeholder, and state', () => {
    const first = bootstrapCoupleShell({ userId: 'user-1', email: 'primary@example.com', now: '2026-05-10T09:00:00.000Z' });
    const second = bootstrapCoupleShell({ userId: 'user-1', email: 'primary@example.com', now: '2026-05-10T09:05:00.000Z', existing: first });

    expect(first.members).toEqual([
      expect.objectContaining({ role: 'primary', userId: 'user-1' }),
      expect.objectContaining({ role: 'partner', userId: null }),
    ]);
    expect(first.state).toMatchObject({ privacyGateAcceptedAt: null, firstCaptureCompletedAt: null });
    expect(second).toEqual(first);
  });

  it('blocks sensitive rows until the privacy gate is accepted', () => {
    const shell = bootstrapCoupleShell({ userId: 'user-1', email: 'primary@example.com', now: '2026-05-10T09:00:00.000Z' });

    expect(canCreateSensitiveRow(shell.state)).toBe(false);

    const accepted = acceptPrivacyGate(shell.state, { userId: 'user-1', now: '2026-05-10T09:10:00.000Z' });

    expect(accepted).toMatchObject({
      privacyGateAcceptedAt: '2026-05-10T09:10:00.000Z',
      privacyGateAcceptedBy: 'user-1',
      privacyGateVersion: PRIVACY_GATE_VERSION,
    });
    expect(canCreateSensitiveRow(accepted)).toBe(true);
  });

  it('externalizes the privacy contact email while keeping a safe fallback', () => {
    expect(getPrivacyContactEmail({ PRIVACY_CONTACT_EMAIL: ' privacy@example.test ' })).toBe('privacy@example.test');
    expect(getPrivacyContactEmail({})).toBe('privacy@fevio.app');
  });
});
