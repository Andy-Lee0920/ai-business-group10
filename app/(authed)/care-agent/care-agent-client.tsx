'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { classifyConcernTriage } from '../../../src/domain/concern-triage';
import type { ConcernActionId, ConcernSummaryTemplateId } from '../../../src/types/concern-triage.types';

const ACTIONS: Record<ConcernActionId, { label: string; href?: string }> = {
  view_today_cards: { label: '오늘 카드', href: '/home' },
  route_add_medication: { label: '주사·복약', href: '/add' },
  route_clinic_update: { label: '병원 방문', href: '/clinic-update' },
  route_records_questions: { label: '질문 기록', href: '/records' },
  route_partner_settings: { label: '공유 설정', href: '/settings/sharing' },
  choose_reminder_strength: { label: '알림 방식', href: '/home' },
  show_operator_support: { label: '운영팀 안내' },
};

const SUMMARIES: Record<ConcernSummaryTemplateId, string> = {
  today_card_time_check: '오늘 카드로 안내할게요.',
  dose_confirm_route: '확인 화면으로 이동해요.',
  clinic_question_prepare: '질문으로 남길 수 있어요.',
  partner_role_boundary: '공유 범위를 확인해요.',
  reminder_strength_choice: '알림 방식을 고를 수 있어요.',
  care_route_overview: '필요한 화면을 골라주세요.',
  operator_static_support: '운영팀 안내를 보여드릴게요.',
};

export function CareAgentClient() {
  const [text, setText] = useState('');
  const hasInput = text.trim().length > 0;
  const result = useMemo(() => classifyConcernTriage({
    utterance: text,
    confirmedPhase: 'ovarian_stimulation',
    phaseCareDay: 'injection_day',
    todayCards: [],
    previousSignalTags: [],
    partnerConnected: false,
  }), [text]);

  return (
    <section style={wrapStyle} aria-label="케어 에이전트 입력">
      <label style={labelStyle} htmlFor="care-agent-input">확인할 내용</label>
      <textarea
        id="care-agent-input"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="예: 오늘 약 시간 확인"
        style={textStyle}
      />
      <p style={noteStyle}>자동 저장되지 않아요.</p>
      {hasInput ? (
        <>
          <div style={summaryStyle} role="status">{SUMMARIES[result.summary_template_id]}</div>
          <div style={actionGridStyle}>
            {result.action_ids.map((id) => {
              const action = ACTIONS[id];
              if (action.href) {
                return (
                  <Link key={id} href={action.href} style={actionStyle}>
                    {action.label}
                  </Link>
                );
              }
              return (
                <div key={id} style={actionStyle}>
                  {action.label}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

const wrapStyle = {
  display: 'grid',
  gap: 12,
  padding: 16,
  borderRadius: 22,
  background: 'rgba(246, 249, 244, 0.78)',
  border: '1px solid rgba(196, 211, 200, 0.7)',
} as const;

const labelStyle = {
  color: 'var(--slc-text)',
  fontSize: 13,
  fontWeight: 900,
} as const;

const textStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 16,
  border: '1px solid var(--slc-border)',
  padding: '12px 13px',
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--slc-text)',
  background: 'rgba(255,255,255,0.84)',
  resize: 'vertical',
} as const;

const summaryStyle = {
  padding: '10px 12px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.72)',
  color: 'var(--slc-text)',
  fontSize: 13,
  lineHeight: 1.35,
  fontWeight: 850,
} as const;

const actionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 9,
} as const;

const actionStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 42,
  padding: '10px 8px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-text)',
  textDecoration: 'none',
  fontSize: 13,
  lineHeight: 1.2,
  fontWeight: 900,
  textAlign: 'center',
} as const;

const noteStyle = {
  margin: '-4px 0 0',
  color: 'var(--slc-muted)',
  fontSize: 12,
  fontWeight: 750,
} as const;
