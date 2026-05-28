'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Badge, CtaButton, Notice, SegmentedButton, classNames } from '../../src/components/ui';
import { mustInlineQuote } from '../../src/domain/care-cards';
import { type AssignedTo, type CardType } from '../../src/domain/line-split';
import type { SplitReviewCandidate, SplitReviewState } from '../../src/lib/split-review-source';
import type { ForbiddenPhraseHit } from '../../src/types/description-guard.types';
import { validateDescription } from '../../src/utils/description-guard';

type Candidate = SplitReviewCandidate;
type ReviewState = SplitReviewState;
type SourceRange = {
  candidateIndex: number;
  start: number | null;
  end: number | null;
  approximated: boolean;
};
type HighlightRange = SourceRange & {
  start: number;
  end: number;
};

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

const CARD_TYPE_LABELS: Record<CardType, string> = {
  injection: '주사',
  medication: '복약',
  clinic_visit: '병원 방문',
  clinic_confirmation: '병원 확인',
  partner_support: '파트너 도움',
  record: '기록',
  general_action: '일반 할 일',
};

const ASSIGNED_LABELS: Record<AssignedTo, string> = {
  my_action: '내 할 일',
  partner_action: '파트너에게 공유',
  clinic_confirmation: '병원에 확인',
  excluded: '제외',
};

type SplitReviewClientProps = {
  initialReview?: ReviewState | null;
};

export function SplitReviewClient({ initialReview = null }: SplitReviewClientProps) {
  const [state, setState] = useState<ReviewState | null>(initialReview);
  const [error, setError] = useState<string | null>(null);
  const [openQuoteIndex, setOpenQuoteIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('fevio.splitReview');
    const storedReview = stored ? readStoredReview(stored) : null;
    if (!storedReview) return;
    setState((current) => mergeReviewState(current, storedReview));
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

  if (!state || state.candidates.length === 0) {
    return <Notice tone="coral">나눌 병원 메모가 없습니다. 먼저 Capture에서 메모를 입력해 주세요.</Notice>;
  }

  const warnings = state.candidates.flatMap((candidate) => validateDescription(candidate.sourceText).warnings);
  const hasWarnings = warnings.length > 0;
  const rawText = state.rawText.trim() ? state.rawText : state.candidates.map((candidate) => candidate.sourceText).join('\n');
  const openQuote = openQuoteIndex === null ? null : state.candidates[openQuoteIndex] ?? null;

  return (
    <section className="split-review" aria-labelledby="split-review-title">
      <header className="split-review__header">
        <p className="eyebrow">확정 전 원문 대조</p>
        <h1 id="split-review-title">병원 안내에서 나온 후보를 확인해요</h1>
        <p className="lead">확정하기 전에는 홈 카드로 저장되지 않아요.</p>
      </header>
      <div className="split-review__workspace">
        <aside className="split-review__raw" aria-label="병원 안내 원문" data-testid="split-review-raw-text">
          <div className="split-review__raw-heading">
            <h2>병원 안내 원문</h2>
            <span>후보 문장 표시</span>
          </div>
          <div className="split-review__raw-copy">
            <RawTextHighlights candidates={state.candidates} rawText={rawText} />
          </div>
        </aside>
        <div className="split-review__cards" data-testid="split-review-candidate-list">
          {state.candidates.map((candidate, index) => (
            <CandidateCard
              candidate={candidate}
              index={index}
              key={`${candidate.orderIndex}-${candidate.sourceText}`}
              onAssign={assign}
              onOpenQuote={() => setOpenQuoteIndex(index)}
              rawText={rawText}
            />
          ))}
        </div>
      </div>
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton onClick={confirm} type="button">{hasWarnings ? '그래도 저장하고 확정하기' : '확정하기'}</CtaButton>
      {openQuote ? <SourceQuoteSheet candidate={openQuote} onClose={() => setOpenQuoteIndex(null)} /> : null}
    </section>
  );
}

function CandidateCard({
  candidate,
  index,
  rawText,
  onAssign,
  onOpenQuote,
}: {
  candidate: Candidate;
  index: number;
  rawText: string;
  onAssign(index: number, assignedTo: string): void;
  onOpenQuote(): void;
}) {
  const requiresInlineQuote = mustInlineQuote(candidate);
  const sourceRange = resolveSourceRange(rawText, candidate, index);
  const cardTypeLabel = candidate.suggestedCardType ? CARD_TYPE_LABELS[candidate.suggestedCardType] : '분류 전';
  const assignedLabel = candidate.assignedTo ? ASSIGNED_LABELS[candidate.assignedTo] : '소유자 선택 전';

  return (
    <section
      className={classNames('split-item', 'split-review-card', requiresInlineQuote && 'split-review-card--mandatory')}
      data-testid={`split-review-candidate-${index}`}
    >
      <div className="split-review-card__topline">
        <span>후보 {index + 1}</span>
        <div className="split-review-card__meta">
          <span>{cardTypeLabel}</span>
          <span>{assignedLabel}</span>
          {requiresInlineQuote ? <strong>원문 고정</strong> : null}
        </div>
      </div>
      {candidate.scheduledAt || candidate.careDate ? (
        <p className="lead">{candidate.scheduledAt ? `예상 시간 ${candidate.scheduledAt.slice(11, 16)}` : `예상 날짜 ${candidate.careDate}`}</p>
      ) : null}
      {requiresInlineQuote ? (
        <blockquote className="split-review-card__inline-quote" data-testid={`mandatory-inline-quote-${index}`}>
          {sourceRange.approximated ? <span className="split-review__approx" aria-label="근사 원문 위치">≈</span> : null}
          {candidate.sourceText}
        </blockquote>
      ) : (
        <button className="split-review-card__quote-toggle" onClick={onOpenQuote} type="button">
          원문 보기
        </button>
      )}
      <DescriptionWarning hits={validateDescription(candidate.sourceText).warnings} />
      <SegmentedButton
        label={`${index + 1}번 항목 분류`}
        onSelect={(value) => onAssign(index, value)}
        options={OPTIONS}
        value={candidate.assignedTo ?? ''}
      />
    </section>
  );
}

function RawTextHighlights({ rawText, candidates }: { rawText: string; candidates: Candidate[] }) {
  const ranges = buildSourceRanges(rawText, candidates);
  if (!rawText.trim()) return <p>원문을 불러오지 못했어요. 후보 문장으로 확인해 주세요.</p>;
  if (ranges.length === 0) return <p>{rawText}</p>;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) parts.push(<span key={`plain-${cursor}`}>{rawText.slice(cursor, range.start)}</span>);
    parts.push(
      <mark data-testid={`source-highlight-${range.candidateIndex}`} key={`mark-${range.candidateIndex}-${range.start}`}>
        {rawText.slice(range.start, range.end)}
        {range.approximated ? <span className="split-review__approx" aria-label="근사 원문 위치">≈</span> : null}
      </mark>,
    );
    cursor = range.end;
  }

  if (cursor < rawText.length) parts.push(<span key={`plain-${cursor}`}>{rawText.slice(cursor)}</span>);
  return <p>{parts}</p>;
}

function SourceQuoteSheet({ candidate, onClose }: { candidate: Candidate; onClose(): void }) {
  return (
    <div className="split-review-quote-sheet" role="presentation">
      <button aria-label="원문 닫기" className="split-review-quote-sheet__backdrop" onClick={onClose} type="button" />
      <section aria-modal="true" className="split-review-quote-sheet__panel" role="dialog" aria-label="원문 보기">
        <span aria-hidden="true" className="split-review-quote-sheet__handle" />
        <h2>원문 보기</h2>
        <blockquote>{candidate.sourceText}</blockquote>
        <button className="secondary-cta" onClick={onClose} type="button">닫기</button>
      </section>
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

function readStoredReview(stored: string): ReviewState | null {
  try {
    const payload = JSON.parse(stored) as Partial<ReviewState>;
    if (typeof payload.visitInputId !== 'string' || typeof payload.draftId !== 'string') return null;
    if (!Array.isArray(payload.candidates)) return null;
    return {
      visitInputId: payload.visitInputId,
      draftId: payload.draftId,
      rawText: typeof payload.rawText === 'string' ? payload.rawText : '',
      candidates: payload.candidates.map(normalizeCandidate),
    };
  } catch {
    return null;
  }
}

function normalizeCandidate(candidate: Partial<Candidate>, index: number): Candidate {
  return {
    sourceText: typeof candidate.sourceText === 'string' ? candidate.sourceText : '',
    sourceOffsetStart: typeof candidate.sourceOffsetStart === 'number' ? candidate.sourceOffsetStart : null,
    sourceOffsetEnd: typeof candidate.sourceOffsetEnd === 'number' ? candidate.sourceOffsetEnd : null,
    assignedTo: candidate.assignedTo ?? null,
    orderIndex: typeof candidate.orderIndex === 'number' ? candidate.orderIndex : index,
    suggestedCardType: candidate.suggestedCardType ?? null,
    scheduledAt: typeof candidate.scheduledAt === 'string' ? candidate.scheduledAt : null,
    careDate: typeof candidate.careDate === 'string' ? candidate.careDate : null,
    description: typeof candidate.description === 'string' ? candidate.description : null,
    userMarkedImportant: candidate.userMarkedImportant === true,
    partnerVisible: candidate.partnerVisible === true,
  };
}

function mergeReviewState(current: ReviewState | null, stored: ReviewState): ReviewState {
  if (!current) return stored;
  if (current.candidates.length === 0 && stored.candidates.length > 0) {
    return { ...stored, rawText: current.rawText || stored.rawText };
  }
  if (!current.rawText && stored.rawText) return { ...current, rawText: stored.rawText };
  return current;
}

function buildSourceRanges(rawText: string, candidates: Candidate[]) {
  let cursor = 0;
  return candidates
    .map((candidate, index) => resolveSourceRange(rawText, candidate, index))
    .filter(isHighlightRange)
    .sort((left, right) => left.start - right.start)
    .filter((range) => {
      if (range.start < cursor) return false;
      cursor = range.end;
      return true;
    });
}

function resolveSourceRange(rawText: string, candidate: Candidate, candidateIndex: number): SourceRange {
  const exactStart = candidate.sourceOffsetStart;
  const exactEnd = candidate.sourceOffsetEnd;
  const hasExactRange =
    exactStart !== null
    && exactEnd !== null
    && exactStart >= 0
    && exactEnd >= exactStart
    && exactEnd <= rawText.length
    && rawText.slice(exactStart, exactEnd) === candidate.sourceText;

  if (hasExactRange) return { candidateIndex, start: exactStart, end: exactEnd, approximated: false };

  const fallbackStart = candidate.sourceText ? rawText.indexOf(candidate.sourceText) : -1;
  if (fallbackStart >= 0) {
    return {
      candidateIndex,
      start: fallbackStart,
      end: fallbackStart + candidate.sourceText.length,
      approximated: true,
    };
  }

  return { candidateIndex, start: null, end: null, approximated: true };
}

function isHighlightRange(range: SourceRange): range is HighlightRange {
  return range.start !== null && range.end !== null && range.end > range.start;
}
