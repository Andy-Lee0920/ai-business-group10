import { Badge, Card, Notice } from '../../src/components/ui';
import { summarizeKeywordReview } from '../../src/domain/ivf-keyword-review';

const SAMPLE_CORRECTIONS = [
  { sourceText: '신선이식 설명 듣기', userSelectedCardType: 'clinic_visit' as const },
  { sourceText: '아침 루티너스', userSelectedCardType: 'medication' as const },
  { sourceText: '가볍게 산책', userSelectedCardType: 'general_action' as const },
];

export default function KeywordReviewPage() {
  const summary = summarizeKeywordReview(SAMPLE_CORRECTIONS);

  return (
    <main className="app-shell">
      <Card aria-labelledby="keyword-review-title">
        <p className="eyebrow">Keyword Review</p>
        <h2 id="keyword-review-title">IVF 키워드 리뷰 루프</h2>
        <p className="lead">사용자가 직접 고친 분류 사례만 모아, LLM 없이 사전을 안전하게 넓히는 운영 화면의 시작점입니다.</p>
        <Notice tone="sage">원문 전체나 민감한 메모를 노출하지 않고 후보 단어와 비율만 봅니다.</Notice>
        <ul className="status-list" aria-label="키워드 리뷰 요약">
          <li><Badge tone="sage">총 사례</Badge> {summary.total}건</li>
          <li><Badge tone="coral">미분류 비율</Badge> {(summary.unknownRatio * 100).toFixed(0)}%</li>
          <li><Badge tone="lavender">수정 사례</Badge> {summary.correctionCount}건</li>
        </ul>
        <section aria-label="후보 키워드">
          <h3>다음 PR 후보</h3>
          <p className="lead">{summary.suggestedKeywords.length ? summary.suggestedKeywords.join(', ') : '이번 분기 후보가 아직 없어요.'}</p>
        </section>
      </Card>
    </main>
  );
}
