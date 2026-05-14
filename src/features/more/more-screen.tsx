'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PartnerLink } from '../../types/slc.types';

interface Props {
  userId: string;
  existingLink: PartnerLink | null;
  pendingRequests: Array<PartnerLink & { partner?: { email?: string } | null }>;
}

export function MoreScreen({ userId: _userId, existingLink, pendingRequests }: Props) {
  const [inviteCode, setInviteCode] = useState<string | null>(existingLink?.invite_code ?? null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    const res = await fetch('/api/partner/invite', { method: 'POST' });
    const data = await res.json() as { inviteCode?: string };
    if (data.inviteCode) setInviteCode(data.inviteCode);
    setGenerating(false);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/invite/${inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approvePending = async (linkId: string, action: 'approve' | 'reject') => {
    await fetch('/api/partner/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId, action }),
    });
    window.location.reload();
  };

  return (
    <div style={{ padding: '60px 24px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 24 }}>더보기</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#9B8E86', marginBottom: 12 }}>파트너 연결</h2>
        {pendingRequests.length > 0 && (
          <div style={{ background: '#FFF8F5', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F4D4C8', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#C4614A', marginBottom: 12 }}>파트너 연결 요청이 있어요</p>
            {pendingRequests.map((req) => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#2A1F1A' }}>{req.partner?.email ?? '파트너'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approvePending(req.id, 'approve')} style={{ padding: '6px 14px', background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>승인</button>
                  <button onClick={() => approvePending(req.id, 'reject')} style={{ padding: '6px 14px', background: '#F0EDE8', color: '#9B8E86', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>거절</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {inviteCode ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F0EDE8' }}>
            <p style={{ fontSize: 13, color: '#9B8E86', marginBottom: 8 }}>초대 링크</p>
            <p style={{ fontSize: 13, color: '#C4614A', fontFamily: 'monospace', marginBottom: 12, wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`}
            </p>
            <button onClick={copyLink} style={{ background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '복사됨 ✓' : '링크 복사'}
            </button>
          </div>
        ) : (
          <button
            onClick={generateLink}
            disabled={generating}
            style={{ background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, padding: '13px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: generating ? 0.7 : 1 }}
          >
            {generating ? '생성 중...' : '파트너 초대 링크 만들기'}
          </button>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#9B8E86', marginBottom: 12 }}>바로가기</h2>
        <Link href="/clinic-update" style={{ display: 'block', padding: '14px 20px', background: '#fff', borderRadius: 14, border: '1.5px solid #F0EDE8', color: '#2A1F1A', textDecoration: 'none', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>진료 결과 업데이트</Link>
        <Link href="/add" style={{ display: 'block', padding: '14px 20px', background: '#fff', borderRadius: 14, border: '1.5px solid #F0EDE8', color: '#2A1F1A', textDecoration: 'none', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>일정 직접 추가</Link>
        <Link href="/privacy" style={{ display: 'block', padding: '14px 20px', background: '#fff', borderRadius: 14, border: '1.5px solid #F0EDE8', color: '#9B8E86', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>개인정보 및 의료 안내</Link>
      </section>
    </div>
  );
}
