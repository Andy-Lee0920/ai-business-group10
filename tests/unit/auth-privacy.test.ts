import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  PRIVACY_GATE_VERSION,
  acceptPrivacyGate,
  assertSensitiveWriteAllowed,
  bootstrapCoupleShell,
  canCreateSensitiveRow,
  type CoupleShell,
  type CoupleState,
} from '../../src/domain/auth-privacy';
import { getPrivacyContactEmail } from '../../src/config';

const NOW = '2026-05-10T09:00:00.000Z';
const NOW_PLUS_10 = '2026-05-10T09:10:00.000Z';
const NOW_PLUS_20 = '2026-05-10T09:20:00.000Z';

function makeShell(userId = 'user-1', email = 'primary@example.com') {
  return bootstrapCoupleShell({ userId, email, now: NOW });
}

describe('auth/privacy bootstrap domain', () => {
  // ── 기존 테스트 ──────────────────────────────────────────────────────────

  it('creates an idempotent couple shell with primary, partner placeholder, and state', () => {
    const first = makeShell();
    const second = bootstrapCoupleShell({ userId: 'user-1', email: 'primary@example.com', now: NOW_PLUS_10, existing: first });

    expect(first.members).toEqual([
      expect.objectContaining({ role: 'primary', userId: 'user-1' }),
      expect.objectContaining({ role: 'partner', userId: null }),
    ]);
    expect(first.state).toMatchObject({ privacyGateAcceptedAt: null, firstCaptureCompletedAt: null });
    expect(second).toEqual(first);
  });

  it('blocks sensitive rows until the privacy gate is accepted', () => {
    const shell = makeShell();

    expect(canCreateSensitiveRow(shell.state)).toBe(false);

    const accepted = acceptPrivacyGate(shell.state, { userId: 'user-1', now: NOW_PLUS_10 });

    expect(accepted).toMatchObject({
      privacyGateAcceptedAt: NOW_PLUS_10,
      privacyGateAcceptedBy: 'user-1',
      privacyGateVersion: PRIVACY_GATE_VERSION,
    });
    expect(canCreateSensitiveRow(accepted)).toBe(true);
  });

  it('externalizes the privacy contact email while keeping a safe fallback', () => {
    expect(getPrivacyContactEmail({ PRIVACY_CONTACT_EMAIL: ' privacy@example.test ' })).toBe('privacy@example.test');
    expect(getPrivacyContactEmail({})).toBe('privacy@fevio.app');
  });

  // ── assertSensitiveWriteAllowed ──────────────────────────────────────────

  it('assertSensitiveWriteAllowed throws before gate acceptance', () => {
    const shell = makeShell();
    expect(() => assertSensitiveWriteAllowed(shell.state)).toThrow('Privacy Gate must be accepted');
  });

  it('assertSensitiveWriteAllowed throws for null and undefined', () => {
    expect(() => assertSensitiveWriteAllowed(null)).toThrow('Privacy Gate must be accepted');
    expect(() => assertSensitiveWriteAllowed(undefined)).toThrow('Privacy Gate must be accepted');
  });

  it('assertSensitiveWriteAllowed does not throw after acceptance', () => {
    const shell = makeShell();
    const accepted = acceptPrivacyGate(shell.state, { userId: 'user-1', now: NOW_PLUS_10 });
    expect(() => assertSensitiveWriteAllowed(accepted)).not.toThrow();
  });

  // ── acceptPrivacyGate — idempotency & immutability ───────────────────────

  it('acceptPrivacyGate is idempotent — double accept returns the same reference', () => {
    const shell = makeShell();
    const first = acceptPrivacyGate(shell.state, { userId: 'user-1', now: NOW_PLUS_10 });
    const second = acceptPrivacyGate(first, { userId: 'user-1', now: NOW_PLUS_20 });
    expect(second).toBe(first);
  });

  it('acceptPrivacyGate returns a new object and does not mutate the original', () => {
    const shell = makeShell();
    const original = shell.state;
    const accepted = acceptPrivacyGate(original, { userId: 'user-1', now: NOW_PLUS_10 });
    expect(accepted).not.toBe(original);
    expect(original.privacyGateAcceptedAt).toBeNull();
  });

  // ── canCreateSensitiveRow — boundary & edge cases ────────────────────────

  it('canCreateSensitiveRow returns false for null, undefined, and empty string', () => {
    expect(canCreateSensitiveRow(null)).toBe(false);
    expect(canCreateSensitiveRow(undefined)).toBe(false);
    expect(canCreateSensitiveRow({ privacyGateAcceptedAt: null })).toBe(false);
    // 빈 문자열은 타입상 string이지만 falsy — 방어적 확인
    expect(canCreateSensitiveRow({ privacyGateAcceptedAt: '' as unknown as null })).toBe(false);
  });

  // ── type-level assertions (Matt Pocock / expectTypeOf) ───────────────────

  it('bootstrapCoupleShell has the correct signature at the type level', () => {
    expectTypeOf(bootstrapCoupleShell).returns.toMatchTypeOf<CoupleShell>();
    expectTypeOf(bootstrapCoupleShell).parameter(0).toMatchTypeOf<{ userId: string; email: string; now: string }>();
  });

  it('canCreateSensitiveRow returns boolean', () => {
    expectTypeOf(canCreateSensitiveRow).returns.toBeBoolean();
  });

  it('acceptPrivacyGate returns CoupleState', () => {
    expectTypeOf(acceptPrivacyGate).returns.toMatchTypeOf<CoupleState>();
  });

  it('PRIVACY_GATE_VERSION is a string literal, not widened to string', () => {
    expectTypeOf(PRIVACY_GATE_VERSION).toEqualTypeOf<'v1.0-slc'>();
  });
});
