import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SplitReviewClient } from '../../app/split-review/split-review-client';
import type { SplitReviewCandidate, SplitReviewState } from '../../src/lib/split-review-source';

function candidate(input: Partial<SplitReviewCandidate> & Pick<SplitReviewCandidate, 'sourceText' | 'assignedTo' | 'suggestedCardType' | 'orderIndex'>): SplitReviewCandidate {
  return {
    sourceOffsetStart: null,
    sourceOffsetEnd: null,
    scheduledAt: null,
    careDate: null,
    description: null,
    userMarkedImportant: false,
    partnerVisible: false,
    ...input,
  };
}

function review(candidates: SplitReviewCandidate[], rawText = '원문은 서버에서만 내려오는 확인 자료입니다.'): SplitReviewState {
  return {
    visitInputId: 'visit-1',
    draftId: 'draft-1',
    rawText,
    candidates,
  };
}

function renderReview(candidates: SplitReviewCandidate[], rawText?: string) {
  return renderToStaticMarkup(React.createElement(SplitReviewClient, { initialReview: review(candidates, rawText) }));
}

function cardMarkup(markup: string, index: number) {
  const marker = `data-testid="split-review-candidate-${index}"`;
  const start = markup.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = markup.indexOf(`data-testid="split-review-candidate-${index + 1}"`, start + marker.length);
  return markup.slice(start, next === -1 ? markup.length : next);
}

describe('split-review mandatory source quote rendering', () => {
  it('renders injection/my_action source text inline and without a toggle', () => {
    const markup = renderReview([
      candidate({
        sourceText: '오늘 밤 10시 오비드렐 주사',
        sourceOffsetStart: 0,
        sourceOffsetEnd: 15,
        assignedTo: 'my_action',
        suggestedCardType: 'injection',
        orderIndex: 0,
      }),
    ], '오늘 밤 10시 오비드렐 주사');

    const card = cardMarkup(markup, 0);
    expect(card).toContain('data-testid="mandatory-inline-quote-0"');
    expect(card).toContain('오늘 밤 10시 오비드렐 주사');
    expect(card).not.toContain('원문 보기');
  });

  it('renders medication/my_action source text inline', () => {
    const markup = renderReview([
      candidate({
        sourceText: '아침 식후 약 한 알 복용',
        assignedTo: 'my_action',
        suggestedCardType: 'medication',
        orderIndex: 0,
      }),
    ]);

    const card = cardMarkup(markup, 0);
    expect(card).toContain('data-testid="mandatory-inline-quote-0"');
    expect(card).toContain('아침 식후 약 한 알 복용');
  });

  it.each([
    ['partner injection', candidate({ sourceText: '남편이 주사 준비 도와주기', assignedTo: 'partner_action', suggestedCardType: 'injection', orderIndex: 0 })],
    ['clinic visit my action', candidate({ sourceText: '내일 오전 병원 방문', assignedTo: 'my_action', suggestedCardType: 'clinic_visit', orderIndex: 0 })],
    ['excluded medication', candidate({ sourceText: '중복 약 메모 제외', assignedTo: 'excluded', suggestedCardType: 'medication', orderIndex: 0 })],
  ])('keeps non-mandatory %s source text behind the quote toggle', (_label, item) => {
    const markup = renderReview([item]);
    const card = cardMarkup(markup, 0);

    expect(card).toContain('원문 보기');
    expect(card).not.toContain('mandatory-inline-quote');
    expect(card).not.toContain(item.sourceText);
  });

  it('marks null-offset substring fallback with the approximated marker', () => {
    const markup = renderReview([
      candidate({
        sourceText: '내일 오전 병원 방문',
        assignedTo: 'my_action',
        suggestedCardType: 'clinic_visit',
        orderIndex: 0,
      }),
    ], '오늘 밤 10시 오비드렐 주사\n내일 오전 병원 방문');

    expect(markup).toContain('data-testid="source-highlight-0"');
    expect(markup).toContain('aria-label="근사 원문 위치"');
    expect(markup).toContain('≈');
  });

  it('imports the domain policy instead of redefining the mandatory quote rule in the component', () => {
    const source = readFileSync('app/split-review/split-review-client.tsx', 'utf8');

    expect(source).toContain("import { mustInlineQuote } from '../../src/domain/care-cards'");
    expect(source).not.toContain("suggestedCardType === 'injection'");
    expect(source).not.toContain("suggestedCardType === 'medication'");
  });
});
