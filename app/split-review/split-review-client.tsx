'use client';

import { useEffect, useState } from 'react';
import { CtaButton, Notice, SegmentedButton } from '../../src/components/ui';
import { type AssignedTo } from '../../src/domain/line-split';

type Candidate = { sourceText: string; assignedTo: AssignedTo | null; orderIndex: number };
type ReviewState = { visitInputId: string; draftId: string; candidates: Candidate[] };

const OPTIONS = [
  { value: 'my_action', label: '내 할 일' },
  { value: 'partner_action', label: '파트너에게 공유' },
  { value: 'clinic_confirmation', label: '병원에 확인' },
  { value: 'excluded', label: '제외' },
];

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
    const items = state.candidates.map((candidate) => ({ sourceText: candidate.sourceText, assignedTo: candidate.assignedTo ?? 'my_action' }));
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

  return (
    <div className="split-list">
      {state.candidates.map((candidate, index) => (
        <section className="split-item" key={`${candidate.orderIndex}-${candidate.sourceText}`}>
          <p>{candidate.sourceText}</p>
          <SegmentedButton
            label={`${index + 1}번 항목 분류`}
            onSelect={(value) => assign(index, value)}
            options={OPTIONS}
            value={candidate.assignedTo ?? ''}
          />
        </section>
      ))}
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton onClick={confirm} type="button">확정하기</CtaButton>
    </div>
  );
}
