import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cycleAdr = 'docs/04-decisions/0011-cycle-event-state-machine.md';
const resultAdr = 'docs/04-decisions/0012-result-protection-mode.md';

describe('ADR 0011/0012 CycleEvent and Result Protection architecture', () => {
  it('accepts a CycleEvent state machine with confirmedPhase as the only surface source', () => {
    const adr = readFileSync(cycleAdr, 'utf8');

    expect(adr).toContain('## Status\nAccepted');
    expect(adr).toContain('CycleEvent');
    expect(adr).toContain('predictedPhase');
    expect(adr).toContain('suggestedPhase');
    expect(adr).toContain('confirmedPhase');
    expect(adr).toContain('reduceCycleState(events: CycleEvent[]): CyclePhaseState');
    expect(adr).toContain('home, partner, and notification surfaces read confirmedPhase only');

    const requiredEvents = [
      'period_started',
      'stimulation_started',
      'follicle_scan_recorded',
      'trigger_scheduled',
      'retrieval_scheduled',
      'retrieval_done',
      'retrieval_cancelled',
      'embryo_culture_started',
      'freeze_all_decided',
      'fresh_transfer_cancelled',
      'frozen_transfer_preparation_started',
      'embryo_transfer_scheduled',
      'embryo_transfer_done',
      'beta_test_scheduled',
      'beta_test_recorded',
      'cycle_closed',
    ];

    for (const event of requiredEvents) expect(adr).toContain(event);
    expect(adr).toContain('stimulation → retrieval_cancelled → cycle_cancelled | stimulation_extended');
    expect(adr).toContain('retrieval → fresh_transfer_cancelled → freeze_all');
    expect(adr).toContain('beta_test_recorded: negative → result_protection');
    expect(adr).toContain('beta_test_recorded: repeat_needed → beta_followup');
  });

  it('accepts Result Protection Mode and forbids unsafe post-negative-result behavior', () => {
    const adr = readFileSync(resultAdr, 'utf8');

    expect(adr).toContain('## Status\nAccepted');
    expect(adr).toContain("cycle_outcome: 'negative'");
    expect(adr).toContain("cycle_status: 'closed_for_now' | 'review_available' | 'next_cycle_planning'");
    expect(adr).toContain("review_visibility: 'hidden_until_user_opens'");
    expect(adr).toContain('C immediate → B delayed 48h → A ambient');
    expect(adr).toContain('Result Protection Mode is always free');
    expect(adr).toContain('### Consequences.Forbidden');
    expect(adr).toContain('next cycle preparation push');
    expect(adr).toContain('failure-cause analysis');
    expect(adr).toContain('embryo grade scoring');
    expect(adr).toContain('paywall');
  });
});
