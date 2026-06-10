import { describe, expect, it } from 'vitest';
import {
  classifyConcernTriage,
  projectCareAgentReadSurface,
  recommendReminderStrength,
} from '../../src/domain/concern-triage';

const TODAY_CARDS = [
  {
    card_id: 'card-injection',
    type: 'injection' as const,
    scheduled_at: '2026-05-30T21:00:00.000+09:00',
    reminder_status: 'enabled' as const,
    display_safety_level: 'critical' as const,
  },
  {
    card_id: 'card-medication',
    type: 'medication' as const,
    scheduled_at: '2026-05-30T09:00:00.000+09:00',
    reminder_status: 'enabled' as const,
    display_safety_level: 'normal' as const,
  },
];

describe('concern-triage fixed schema classifier', () => {
  it('returns fixed ids only and never returns raw card specifics', () => {
    const result = classifyConcernTriage({
      utterance: '오비드렐 250mcg를 21시에 맞는 게 맞는지 확인하고 싶어요',
      confirmedPhase: 'ovarian_stimulation',
      phaseCareDay: 'injection_day',
      todayCards: TODAY_CARDS,
      previousSignalTags: ['injection_timing_anxiety'],
      partnerConnected: true,
    });

    expect(result).toMatchObject({
      intent: 'injection_timing_anxiety',
      summary_template_id: 'today_card_time_check',
      related_card_id: 'card-injection',
      should_persist_signal: true,
    });
    expect(result.action_ids).toEqual(['view_today_cards', 'route_add_medication', 'choose_reminder_strength']);
    expect(JSON.stringify(result)).not.toMatch(/오비드렐|250mcg|21시|21:00|프로게스테론|원문/u);
  });

  it('bypasses classification and signal persistence for crisis keywords', () => {
    const result = classifyConcernTriage({
      utterance: '죽고 싶다는 생각이 들어요',
      confirmedPhase: 'embryo_transfer',
      phaseCareDay: 'two_week_wait_day',
      todayCards: TODAY_CARDS,
      previousSignalTags: [],
      partnerConnected: false,
    });

    expect(result).toMatchObject({
      intent: 'crisis_support',
      summary_template_id: 'operator_static_support',
      action_ids: ['show_operator_support'],
      should_persist_signal: false,
      related_card_id: null,
    });
  });

  it('projects read-only care surface slots from computeCareSurface instead of inventing widgets', () => {
    const projection = projectCareAgentReadSurface({
      confirmedPhase: 'ovarian_stimulation',
      phaseCareDay: 'injection_day',
      cardCount: 2,
      partnerConnected: true,
    });

    expect(projection.component_registry).toBe('CareSurfaceComponent');
    expect(projection.slots.hero).toBeDefined();
    expect(Object.values(projection.slots)).not.toContain('CareAgentWidget');
  });

  it('recommends reminder strength as a notification preference without changing display safety', () => {
    expect(recommendReminderStrength(TODAY_CARDS[0])).toEqual({
      recommended_strength: 'strong',
      reason: 'card_type_default',
      display_safety_level: 'critical',
    });
    expect(recommendReminderStrength(TODAY_CARDS[1])).toEqual({
      recommended_strength: 'quiet',
      reason: 'card_type_default',
      display_safety_level: 'normal',
    });
  });
});
