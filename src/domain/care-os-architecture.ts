import type { CareSurfaceCondition, CareSurfaceSlot } from '../types/care-surface.types';
import type { PartnerActionViewItem } from '../types/partner-view.types';

export type CareOsRole = 'patient' | 'partner';
export type PatientSharingScope = 'basic' | 'care' | 'emotional';
export type PartnerPermissionLevel = 'read' | 'soft_action' | 'assist_action';
export type RoleContext = 'patient' | 'partner' | 'together' | 'primary_solo' | 'primary_with_partner';
export type PartnerPermissionAction = 'read_schedule' | 'send_support' | 'record_assist' | 'edit_dosage' | 'edit_prescription';

export type CareCycleMembership = {
  cycleId: string;
  userId: string;
  role: CareOsRole;
  sharingScope: PatientSharingScope;
  permissionLevel: PartnerPermissionLevel;
};

export type CareCycleExperience = {
  cycleId: string;
  role: CareOsRole;
  surface: 'patient_care_management' | 'partner_assist_operation';
  partnerConnected: boolean;
  sharingScope: PatientSharingScope;
  permissionLevel: PartnerPermissionLevel;
};

export type RoleBasedHomeIntent = {
  role: RoleContext;
  firstFold: 'patient_care_management' | 'partner_assist_entry' | 'shared_cycle_invite';
  primaryCta: string;
};

export type InjectionLogDraft = {
  scheduledTime: string;
  actualTime: string | null;
  administeredBy: string | null;
  recordedBy: string;
  confirmedByPatient: boolean;
  confirmedAt: string | null;
};

export type InjectionTrustState = {
  state: 'scheduled' | 'pending_patient_confirmation' | 'completed_confirmed';
  patientCopy: string;
  partnerCopy: string;
};

export type RoleTranslationInput = {
  phase: 'injection' | 'clinic' | 'waiting' | 'routine';
  title: string;
  role: CareOsRole;
};

export type RoleTranslation = {
  headline: string;
  body: string;
  cta: string;
};

export type RuleConflictInput = {
  id: string;
  slot: CareSurfaceSlot;
  conditions: CareSurfaceCondition[];
  priority: number;
};

export type RuleConflict = {
  slot: CareSurfaceSlot;
  ruleIds: string[];
  reason: 'same slot, same specificity, same priority';
};

export function resolveCareCycleExperience({ cycleId, currentUserId, memberships }: { cycleId: string; currentUserId: string; memberships: readonly CareCycleMembership[] }): CareCycleExperience {
  const membership = memberships.find((candidate) => candidate.cycleId === cycleId && candidate.userId === currentUserId);
  if (!membership) throw new Error('care cycle membership not found');
  const partnerConnected = memberships.some((candidate) => candidate.cycleId === cycleId && candidate.role !== membership.role);

  return {
    cycleId,
    role: membership.role,
    surface: membership.role === 'patient' ? 'patient_care_management' : 'partner_assist_operation',
    partnerConnected,
    sharingScope: membership.sharingScope,
    permissionLevel: membership.permissionLevel,
  };
}

export function deriveRoleBasedHomeIntent({ roleContext, partnerInviteSkipped }: { roleContext: RoleContext; partnerInviteSkipped: boolean }): RoleBasedHomeIntent {
  if (roleContext === 'partner') {
    return { role: roleContext, firstFold: 'partner_assist_entry', primaryCta: '오늘 도울 일 보기' };
  }
  if (roleContext === 'together' || (!partnerInviteSkipped && roleContext === 'primary_with_partner')) {
    return { role: roleContext, firstFold: 'shared_cycle_invite', primaryCta: '파트너 연결 확인' };
  }
  return { role: roleContext, firstFold: 'patient_care_management', primaryCta: '오늘 케어 보기' };
}

export function projectPartnerItemsBySharingScope(items: readonly PartnerActionViewItem[], scope: PatientSharingScope): PartnerActionViewItem[] {
  return items.map((item) => {
    if (scope === 'basic') {
      return {
        ...item,
        partner_action: '오늘의 큰 흐름만 함께 확인해 주세요.',
        avoid_prompt: '약 이름, 용량, 원문 메모를 묻지 않기',
        visibility: 'partner_safe',
      };
    }

    if (scope === 'emotional') {
      return {
        ...item,
        partner_action: `${item.partner_action} 정서 상태를 먼저 살펴 주세요.`,
        visibility: item.visibility === 'private_summary' ? 'private_summary' : 'partner_safe',
      };
    }

    return item;
  });
}

export function canPartnerPerformAction(level: PartnerPermissionLevel, action: PartnerPermissionAction): boolean {
  if (action === 'edit_dosage' || action === 'edit_prescription') return false;
  if (action === 'read_schedule') return true;
  if (action === 'send_support') return level === 'soft_action' || level === 'assist_action';
  if (action === 'record_assist') return level === 'assist_action';
  return false;
}

export function deriveInjectionTrustState(log: InjectionLogDraft): InjectionTrustState {
  if (!log.actualTime) {
    return {
      state: 'scheduled',
      patientCopy: '아직 완료 기록이 없어요.',
      partnerCopy: '정해진 시간이 오면 기록 보조만 할 수 있어요.',
    };
  }

  if (!log.confirmedByPatient || !log.confirmedAt) {
    return {
      state: 'pending_patient_confirmation',
      patientCopy: '파트너가 기록했어요. 확인할까요?',
      partnerCopy: '기록을 남겼어요. 최종 확인은 환자가 해요.',
    };
  }

  return {
    state: 'completed_confirmed',
    patientCopy: '확인된 완료 기록이에요.',
    partnerCopy: '환자가 최종 확인했어요.',
  };
}

export function translateCareStateForRole(input: RoleTranslationInput): RoleTranslation {
  if (input.role === 'patient') {
    if (input.phase === 'injection') return { headline: '내가 확인할 시간', body: `${input.title}을 병원 지시 기준으로 확인해요.`, cta: '준비 확인' };
    if (input.phase === 'clinic') return { headline: '오늘 확인할 맥락', body: '지난 케어 기록과 진료 후 안내를 차분히 확인해요.', cta: '맥락 확인' };
    if (input.phase === 'waiting') return { headline: '쉬어도 되는 시간', body: '확인할 일정만 남기고 몸의 여백을 지켜요.', cta: '다음 일정 보기' };
    return { headline: '오늘 케어 보기', body: '확정된 일정만 확인해요.', cta: '확인하기' };
  }

  if (input.phase === 'injection') return { headline: '내가 도울 역할', body: '시간을 함께 지키는 역할이에요. 준비물을 먼저 챙겨 주세요.', cta: '도울 일 보기' };
  if (input.phase === 'clinic') return { headline: '동행자로 할 일', body: '이동과 진료 후 기록을 함께 맡아요.', cta: '동행 준비' };
  if (input.phase === 'waiting') return { headline: '조용히 곁에 있기', body: '결과를 묻기보다 쉬는 시간을 지켜 주세요.', cta: '곁에 있기' };
  return { headline: '함께 확인할 일', body: '필요한 일 하나만 조용히 돕습니다.', cta: '확인하기' };
}

export function detectCareSurfaceRuleConflicts(rules: readonly RuleConflictInput[]): RuleConflict[] {
  const groups = new Map<string, RuleConflictInput[]>();
  for (const rule of rules) {
    const key = `${rule.slot}:${rule.conditions.length}:${rule.priority}`;
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      slot: group[0]!.slot,
      ruleIds: group.map((rule) => rule.id),
      reason: 'same slot, same specificity, same priority' as const,
    }));
}
