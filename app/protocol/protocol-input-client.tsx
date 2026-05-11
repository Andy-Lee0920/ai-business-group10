'use client';

import { useState } from 'react';
import { Badge, Card, CtaButton, Notice } from '../../src/components/ui';
import type { ProtocolDraftItem } from '../../src/domain/protocol-draft';

type ProtocolResponse = {
  visitInputId?: string;
  draftId?: string;
  drafts?: ProtocolDraftItem[];
  error?: string;
};

export function ProtocolInputClient() {
  const [rawInstruction, setRawInstruction] = useState('오늘 밤 10시 오비드렐 주사\n내일 오전 9시 병원 채혈');
  const [drafts, setDrafts] = useState<ProtocolDraftItem[]>([]);
  const [state, setState] = useState<{ tone: 'sage' | 'coral'; message: string } | null>(null);
  const [captureIds, setCaptureIds] = useState<{ visitInputId: string; draftId: string } | null>(null);

  async function createDraft() {
    setState(null);
    const response = await fetch('/api/protocol-drafts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rawInstruction }),
    });
    const payload = (await response.json().catch(() => ({}))) as ProtocolResponse;
    if (!response.ok || !payload.drafts || !payload.visitInputId || !payload.draftId) {
      setState({ tone: 'coral', message: payload.error ?? '초안을 만들지 못했어요. 입력은 그대로 둘게요.' });
      return;
    }
    setDrafts(payload.drafts);
    setCaptureIds({ visitInputId: payload.visitInputId, draftId: payload.draftId });
    setState({ tone: 'sage', message: '초안만 만들었어요. 확정 전에는 홈에 올라가지 않아요.' });
  }

  function editDraft(index: number, sourceText: string) {
    setDrafts((current) => current.map((item) => (item.orderIndex === index ? { ...item, sourceText } : item)));
  }

  function moveToReview() {
    if (!captureIds) return;
    sessionStorage.setItem('fevio.splitReview', JSON.stringify({
      ...captureIds,
      candidates: drafts.map((item) => ({
        sourceText: item.sourceText,
        assignedTo: null,
        orderIndex: item.orderIndex,
        suggestedCardType: item.suggestedCardType,
        scheduledAt: item.scheduledAt,
        careDate: item.careDate,
        description: item.uncertaintyReason ?? '병원 안내에서 만든 확정 전 초안',
        userMarkedImportant: item.suggestedCardType === 'injection',
        partnerVisible: item.suggestedCardType === 'injection' || item.suggestedCardType === 'clinic_visit',
      })),
    }));
    window.location.href = `/split-review?draftId=${encodeURIComponent(captureIds.draftId)}`;
  }

  return (
    <div className="capture-form">
      <label className="field-label" htmlFor="protocol-input">병원 안내문</label>
      <textarea id="protocol-input" rows={8} value={rawInstruction} onChange={(event) => setRawInstruction(event.target.value)} />
      {state ? <Notice tone={state.tone}>{state.message}</Notice> : null}
      <CtaButton type="button" onClick={createDraft}>초안으로 나누기</CtaButton>
      {drafts.length ? (
        <div className="split-list" aria-label="프로토콜 초안 목록">
          {drafts.map((item) => (
            <Card as="article" key={`${item.orderIndex}-${item.sourceText}`} tone={item.confidence === 'needs_confirmation' ? 'coral' : 'sage'}>
              <Badge tone={item.confidence === 'needs_confirmation' ? 'coral' : 'sage'}>{item.suggestedCardType}</Badge>
              <label className="field-label" htmlFor={`protocol-draft-${item.orderIndex}`}>초안 문구</label>
              <textarea
                id={`protocol-draft-${item.orderIndex}`}
                rows={3}
                value={item.sourceText}
                onChange={(event) => editDraft(item.orderIndex, event.target.value)}
              />
              {item.uncertaintyReason ? <p>{item.uncertaintyReason}</p> : <p>확정 전 한 번만 확인하면 돼요.</p>}
            </Card>
          ))}
          <CtaButton type="button" variant="secondary" onClick={moveToReview}>확정 화면에서 직접 고르기</CtaButton>
        </div>
      ) : null}
    </div>
  );
}
