import type { CardType } from '../types/care-cards.types';

export type PartnerVisibility = 'partner_safe' | 'private_summary';

export type PartnerRoleProjectionInput = {
  card_type: CardType;
  display_state?: string;
};

export type PartnerRoleProjection = {
  partner_role: string;
  partner_action: string;
  avoid_prompt: string;
  visibility: PartnerVisibility;
};

const DEFAULT_PROJECTION: PartnerRoleProjection = {
  partner_role: '함께 확인하는 사람',
  partner_action: '확정된 할 일만 차분히 함께 확인해 주세요.',
  avoid_prompt: '원문 메모나 민감한 내용을 캐묻지 않기',
  visibility: 'partner_safe',
};

const PROJECTION_BY_CARD_TYPE: Record<CardType, PartnerRoleProjection> = {
  injection: {
    partner_role: '확인자',
    partner_action: '주사 시간 30분 전 준비물과 조용한 공간을 함께 확인해 주세요.',
    avoid_prompt: '마지막 순간 질문하거나 재촉하지 않기',
    visibility: 'partner_safe',
  },
  medication: {
    partner_role: '복약 확인자',
    partner_action: '약 이름과 시간을 카드 기준으로 함께 확인해 주세요.',
    avoid_prompt: '용량이나 투여 여부를 대신 판단하지 않기',
    visibility: 'partner_safe',
  },
  clinic_visit: {
    partner_role: '동행자',
    partner_action: '이동 시간, 준비물, 상담 후 다음 일정을 함께 확인해 주세요.',
    avoid_prompt: '혼자 기억하게 두거나 바로 판단하지 않기',
    visibility: 'partner_safe',
  },
  clinic_confirmation: {
    partner_role: '정보 공동 수신자',
    partner_action: '병원에서 확정된 내용과 다음 확인 항목을 같이 읽어 주세요.',
    avoid_prompt: '결과를 단정하거나 의료 판단을 덧붙이지 않기',
    visibility: 'partner_safe',
  },
  partner_support: {
    partner_role: '지원자',
    partner_action: '사용자가 요청한 도움 행동을 부담 없이 하나씩 맡아 주세요.',
    avoid_prompt: '도움을 점검이나 평가처럼 말하지 않기',
    visibility: 'partner_safe',
  },
  record: {
    partner_role: '기록 동반자',
    partner_action: '공유된 요약만 확인하고 필요한 다음 행동을 함께 정리해 주세요.',
    avoid_prompt: '민감한 원문 기록을 요구하지 않기',
    visibility: 'private_summary',
  },
  general_action: DEFAULT_PROJECTION,
};

export function translateCareCardToPartnerRole(input: PartnerRoleProjectionInput): PartnerRoleProjection {
  const base = PROJECTION_BY_CARD_TYPE[input.card_type] ?? DEFAULT_PROJECTION;
  if (input.display_state === 'completed') {
    return {
      ...base,
      partner_action: `완료된 항목이에요. ${base.partner_role} 역할은 다음 확인까지 조용히 유지해 주세요.`,
    };
  }
  return base;
}
