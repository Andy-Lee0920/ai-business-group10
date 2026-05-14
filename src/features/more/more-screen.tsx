'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PartnerLink } from '../../types/slc.types';
import { MORE_MENU_ITEMS } from './more-menu';

interface Props {
  userId: string;
  existingLink: PartnerLink | null;
  pendingRequests: PartnerLink[];
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

  const sendPartnerAction = async (linkId: string, action: 'approve' | 'reject' | 'revoke') => {
    await fetch('/api/partner/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId, action }),
    });
    window.location.reload();
  };

  return (
    <div style={{ padding: '60px 24px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#C4614A', margin: '0 0 6px' }}>공유와 설정 관리</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', margin: 0 }}>관리</h1>
      </header>

      <section id="partner-invite" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#9B8E86', marginBottom: 12 }}>파트너 초대</h2>
        <p style={{ fontSize: 13, color: '#9B8E86', lineHeight: 1.55, margin: '0 0 14px' }}>
          파트너는 오늘 일정과 완료 상태만 읽기 전용으로 봅니다. 일정 추가나 완료 기록은 치료자만 할 수 있어요.
        </p>
        {pendingRequests.length > 0 && (
          <div style={{ background: '#FFF8F5', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F4D4C8', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#C4614A', marginBottom: 12 }}>파트너 연결 요청이 있어요</p>
            {pendingRequests.map((req) => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#2A1F1A' }}>{partnerDisplayName(req)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => sendPartnerAction(req.id, 'approve')} style={{ padding: '6px 14px', background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>승인하기</button>
                  <button onClick={() => sendPartnerAction(req.id, 'reject')} style={{ padding: '6px 14px', background: '#F0EDE8', color: '#9B8E86', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>나중에</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {existingLink?.status === 'approved' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F0EDE8', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#9B8E86', marginBottom: 6 }}>연결된 파트너</p>
            <p style={{ fontSize: 15, color: '#2A1F1A', fontWeight: 800, margin: '0 0 12px' }}>{partnerDisplayName(existingLink)}</p>
            <button onClick={() => sendPartnerAction(existingLink.id, 'revoke')} style={{ background: '#F0EDE8', color: '#9B8E86', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              연결 해제
            </button>
          </div>
        )}

        {inviteCode ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F0EDE8' }}>
            <p style={{ fontSize: 13, color: '#9B8E86', marginBottom: 8 }}>초대 코드 · 읽기 전용 연결</p>
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
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#9B8E86', marginBottom: 12 }}>케어 관리 메뉴</h2>
        {MORE_MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} style={{ display: 'block', padding: '14px 20px', background: '#fff', borderRadius: 14, border: '1.5px solid #F0EDE8', color: '#2A1F1A', textDecoration: 'none', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{item.label}</Link>
        ))}
      </section>

      <section id="notifications" style={{ marginBottom: 24, background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #F0EDE8' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A', margin: '0 0 8px' }}>알림 상태</h2>
        <p style={{ fontSize: 13, color: '#9B8E86', margin: 0 }}>알림 ON / 일정 15분 전 표시 예정</p>
      </section>

      <Link href="/auth/reset" style={{ display: 'block', padding: '14px 20px', background: '#F0EDE8', borderRadius: 999, color: '#9B8E86', textDecoration: 'none', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
        로그아웃
      </Link>
    </div>
  );
}

function partnerDisplayName(link: PartnerLink) {
  return link.partner_profile?.display_name?.trim() || '파트너';
}
