import { describe, expect, it, vi } from 'vitest';
import { computeStatus } from '../../src/types/slc.types';

describe('SLC schedule status', () => {
  it('marks schedules more than 15 minutes away as upcoming', () => {
    vi.setSystemTime(new Date('2026-05-14T00:00:00.000Z'));
    expect(computeStatus('2026-05-14T00:20:00.000Z')).toBe('upcoming');
    vi.useRealTimers();
  });

  it('marks schedules within 15 minutes as due soon', () => {
    vi.setSystemTime(new Date('2026-05-14T00:00:00.000Z'));
    expect(computeStatus('2026-05-14T00:10:00.000Z')).toBe('due_soon');
    vi.useRealTimers();
  });

  it('marks schedules older than the grace window as missed', () => {
    vi.setSystemTime(new Date('2026-05-14T01:00:00.000Z'));
    expect(computeStatus('2026-05-14T00:00:00.000Z')).toBe('missed');
    vi.useRealTimers();
  });
});
