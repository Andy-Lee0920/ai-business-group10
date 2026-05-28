'use client';

import { useEffect, useState } from 'react';
import { Badge, CtaButton, Notice, SegmentedButton } from '../../src/components/ui';
import { type AssignedTo, type CardType } from '../../src/domain/line-split';
import type { ForbiddenPhraseHit } from '../../src/types/description-guard.types';
import { validateDescription } from '../../src/utils/description-guard';

type Candidate = {
  sourceText: string;
  sourceOffsetStart?: number | null;
  sourceOffsetEnd?: number | null;
  assignedTo: AssignedTo | null;
  orderIndex: number;
  suggestedCardType?: CardType | null;
  scheduledAt?: string | null;
  careDate?: string | null;
  description?: string | null;
  userMarkedImportant?: boolean;
  partnerVisible?: boolean;
};
type ReviewState = { visitInputId: string; draftId: string; candidates: Candidate[] };

const OPTIONS = [
  { value: 'my_action', label: '내 할 일' },
  { value: 'partner_action', label: '파트너에게 공유' },
  { value: 'clinic_confirmation', label: '병원에 확인' },
  { value: 'excluded', label: '제외' },
];

const WARNING_LABELS: Record<ForbiddenPhraseHit['category'], string> = {
  dosage_change: '용량 조정 표현',
  diagnosis: '진단/병명 추론 표현',
  success_rate: '성공률 단정 표현',
  treatment_strategy: '치료 전략 변경 표현',
};

export function SplitReviewClient() {
  const [state, setState] = useState<ReviewState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('fevio.splitReview');
    if (stored) setState(JSON.parse(stored) as ReviewState);
  }, []);

  function assign(index: number, assignedTo: string) {
    setState((current) => {
      if (!current) return current;
      const candidates = current.candidates.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, assignedTo: assignedTo as AssignedTo } : candidate,
      );
      return { ...current, candidates };
    });
  }

  async function confirm() {
    if (!state) return;
    const items = state.candidates.map((candidate) => ({
      sourceText: candidate.sourceText,
      sourceOffsetStart: candidate.sourceOffsetStart ?? null,
      sourceOffsetEnd: candidate.sourceOffsetEnd ?? null,
      assignedTo: candidate.assignedTo ?? 'my_action',
      suggestedCardType: candidate.suggestedCardType ?? null,
      scheduledAt: candidate.scheduledAt ?? null,
      careDate: candidate.careDate ?? null,
      description: candidate.description ?? null,
      userMarkedImportant: candidate.userMarkedImportant === true,
      partnerVisible: candidate.partnerVisible === true,
    }));
    const response = await fetch('/api/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ draftId: state.draftId, visitInputId: state.visitInputId, items }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? '확정하지 못했습니다.');
      return;
    }

    sessionStorage.removeItem('fevio.splitReview');
    window.location.href = '/?capture=confirmed';
  }

  if (!state) return <Notice tone="coral">나눌 병원 메모가 없습니다. 먼저 Capture에서 메모를 입력해 주세요.</Notice>;

  const warnings = state.candidates.flatMap((candidate) => validateDescription(candidate.sourceText).warnings);
  const hasWarnings = warnings.length > 0;

  return (
    <div className="split-list">
      {state.candidates.map((candidate, index) => (
        <section className="split-item" key={`${candidate.orderIndex}-${candidate.sourceText}`}>
          <p>{candidate.sourceText}</p>
          {candidate.scheduledAt || candidate.careDate ? (
            <p className="lead">{candidate.scheduledAt ? `예상 시간 ${candidate.scheduledAt.slice(11, 16)}` : `예상 날짜 ${candidate.careDate}`}</p>
          ) : null}
          <DescriptionWarning hits={validateDescription(candidate.sourceText).warnings} />
          <SegmentedButton
            label={`${index + 1}번 항목 분류`}
            onSelect={(value) => assign(index, value)}
            options={OPTIONS}
            value={candidate.assignedTo ?? ''}
          />
        </section>
      ))}
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton onClick={confirm} type="button">{hasWarnings ? '그래도 저장하고 확정하기' : '확정하기'}</CtaButton>
    </div>
  );
}

function DescriptionWarning({ hits }: { hits: ForbiddenPhraseHit[] }) {
  if (hits.length === 0) return null;

  return (
    <div className="description-warning" role="status" aria-label="의료 판단 표현 확인">
      <div className="description-warning__heading">
        <span aria-hidden="true">⚠️</span>
        <strong>의료 판단 표현 확인</strong>
      </div>
      <p>이 설명은 저장할 수 있지만, 용량·진단·성공률·치료 전략 판단처럼 보일 수 있어요.</p>
      <div className="description-warning__badges">
        {hits.map((hit) => (
          <Badge key={`${hit.category}-${hit.offset}-${hit.matched}`} tone="coral">
            {WARNING_LABELS[hit.category]}
          </Badge>
        ))}
      </div>
    </div>
  );
}
