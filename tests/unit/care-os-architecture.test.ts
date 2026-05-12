import { describe, expect, it } from 'vitest';
import {
  canPartnerPerformAction,
  deriveInjectionTrustState,
  deriveRoleBasedHomeIntent,
  detectCareSurfaceRuleConflicts,
  projectPartnerItemsBySharingScope,
  resolveCareCycleExperience,
  translateCareStateForRole,
  type CareCycleMembership,
  type PartnerPermissionAction,
} from '../../src/domain/care-os-architecture';
import type { PartnerActionViewItem } from '../../src/types/partner-view.types';

describe('Care OS architecture vertical contracts', () => {
  it('connects patient and partner to one care cycle while preserving different surface identities', () => {
    const memberships: CareCycleMembership[] = [
      { cycleId: 'cycle-1', userId: 'patient-1', role: 'patient', sharingScope: 'care', permissionLevel: 'assist_action' },
      { cycleId: 'cycle-1', userId: 'partner-1', role: 'partner', sharingScope: 'care', permissionLevel: 'assist_action' },
    ];

    expect(resolveCareCycleExperience({ cycleId: 'cycle-1', currentUserId: 'patient-1', memberships })).toMatchObject({
      cycleId: 'cycle-1',
      role: 'patient',
      surface: 'patient_care_management',
      partnerConnected: true,
    });
    expect(resolveCareCycleExperience({ cycleId: 'cycle-1', currentUserId: 'partner-1', memberships })).toMatchObject({
      cycleId: 'cycle-1',
      role: 'partner',
      surface: 'partner_assist_operation',
      partnerConnected: true,
    });
  });

  it('binds onboarding role answers to first-fold home intent', () => {
    expect(deriveRoleBasedHomeIntent({ roleContext: 'partner', partnerInviteSkipped: false })).toMatchObject({
      firstFold: 'partner_assist_entry',
      primaryCta: '오늘 도울 일 보기',
    });
    expect(deriveRoleBasedHomeIntent({ roleContext: 'together', partnerInviteSkipped: false })).toMatchObject({
      firstFold: 'shared_cycle_invite',
      primaryCta: '파트너 연결 확인',
    });
  });

  it('projects partner data by patient-owned sharing scope', () => {
    const items = [partnerItem({ title: '21:00 오비드렐 트리거 확인', description: '냉장 보관 후 복부 오른쪽', card_type: 'injection' })];

    const basic = projectPartnerItemsBySharingScope(items, 'basic');
    const care = projectPartnerItemsBySharingScope(items, 'care');
    const emotional = projectPartnerItemsBySharingScope(items, 'emotional');

    expect(JSON.stringify(basic)).not.toMatch(/오비드렐|냉장|복부/u);
    expect(basic[0]).toMatchObject({ title: '오늘 케어 일정', description: null, visibility: 'partner_safe' });
    expect(JSON.stringify(care)).toMatch(/오비드렐/u);
    expect(JSON.stringify(emotional)).toMatch(/정서 상태를 먼저 살펴 주세요/u);
  });

  it('allows partner assist actions but denies medical editing even when assist level is granted', () => {
    const actions: PartnerPermissionAction[] = ['read_schedule', 'send_support', 'record_assist', 'edit_dosage', 'edit_prescription'];

    expect(actions.map((action) => [action, canPartnerPerformAction('assist_action', action)] as const)).toEqual([
      ['read_schedule', true],
      ['send_support', true],
      ['record_assist', true],
      ['edit_dosage', false],
      ['edit_prescription', false],
    ]);
  });

  it('derives injection trust from who administered, who recorded, and patient confirmation', () => {
    expect(deriveInjectionTrustState({
      scheduledTime: '2026-05-12T12:00:00.000Z',
      actualTime: '2026-05-12T12:02:00.000Z',
      administeredBy: 'partner-1',
      recordedBy: 'partner-1',
      confirmedByPatient: false,
      confirmedAt: null,
    })).toMatchObject({ state: 'pending_patient_confirmation', patientCopy: '파트너가 기록했어요. 확인할까요?' });

    expect(deriveInjectionTrustState({
      scheduledTime: '2026-05-12T12:00:00.000Z',
      actualTime: '2026-05-12T12:02:00.000Z',
      administeredBy: 'patient-1',
      recordedBy: 'patient-1',
      confirmedByPatient: true,
      confirmedAt: '2026-05-12T12:03:00.000Z',
    })).toMatchObject({ state: 'completed_confirmed' });
  });

  it('translates the same care state into patient language and partner role language', () => {
    const patient = translateCareStateForRole({ phase: 'injection', title: '21:00 오비드렐 트리거 확인', role: 'patient' });
    const partner = translateCareStateForRole({ phase: 'injection', title: '21:00 오비드렐 트리거 확인', role: 'partner' });

    expect(patient.headline).toContain('내가 확인할 시간');
    expect(partner.headline).toContain('내가 도울 역할');
    expect(partner.body).not.toBe(patient.body);
  });

  it('reports rule conflicts before new semi-generative rules silently override a slot', () => {
    const conflicts = detectCareSurfaceRuleConflicts([
      { id: 'a', slot: 'hero', conditions: [{ field: 'careDay', op: 'eq', value: 'injection_day' }], priority: 1 },
      { id: 'b', slot: 'hero', conditions: [{ field: 'careDay', op: 'eq', value: 'injection_day' }], priority: 1 },
      { id: 'c', slot: 'partner', conditions: [{ field: 'careDay', op: 'eq', value: 'waiting_day' }], priority: 1 },
    ]);

    expect(conflicts).toEqual([{ slot: 'hero', ruleIds: ['a', 'b'], reason: 'same slot, same specificity, same priority' }]);
  });
});

function partnerItem(overrides: Partial<PartnerActionViewItem>): PartnerActionViewItem {
  return {
    safe_id: 'safe-1',
    title: '21:00 오비드렐 트리거 확인',
    scheduled_at: '2026-05-12T12:00:00.000Z',
    card_type: 'injection',
    description: '냉장 보관 후 복부 오른쪽',
    display_state: 'current',
    sync_revision: 1,
    partner_role: '확인자',
    partner_action: '시간과 준비물을 함께 확인해 주세요.',
    avoid_prompt: '재촉하지 않기',
    visibility: 'partner_safe',
    ...overrides,
  };
}
