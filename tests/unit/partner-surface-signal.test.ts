import { describe, expect, it } from 'vitest';
import { derivePartnerSurfaceSignal } from '../../src/domain/partner-surface-signal';
import type { CareSurfaceComposition } from '../../src/types/care-surface.types';

function composition(intensity: number): CareSurfaceComposition {
  return {
    slots: {
      hero: 'CompactHeroGreeting',
      primary_card: 'MissionCardPair',
      secondary_card: null,
      stats_row: 'QuickStatRow',
      checklist: 'QuietChecklist',
      partner: 'PartnerConnectBar',
    },
    intensity,
    suppressedSlots: [],
    appliedRules: [],
    trace: [],
  };
}

describe('derivePartnerSurfaceSignal', () => {
  it.each([
    [1, 'critical'],
    [0.65, 'elevated'],
    [0.4, 'routine'],
    [0.1, 'quiet'],
  ] as const)('maps intensity %s to urgency tier %s', (intensity, tier) => {
    expect(derivePartnerSurfaceSignal(composition(intensity), 'injection')).toMatchObject({ urgencyTier: tier, intensity });
  });

  it('does not expose raw medical trigger, milestone, or proximity fields', () => {
    const signal = derivePartnerSurfaceSignal(composition(1), 'injection');
    const json = JSON.stringify(signal);

    expect(json).not.toMatch(/trigger_shot|overrideReason|milestone|proximityDays|egg_retrieval|embryo_transfer/u);
    expect(signal.momentCopy).toContain('곁');
  });
});
