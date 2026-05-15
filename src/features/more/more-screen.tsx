'use client';
import { useState, type ReactNode } from 'react';
import type { PartnerLink } from '../../types/slc.types';
import { MORE_MENU_ITEMS } from './more-menu';
import { SettingsRow } from '../../components/ui';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';

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
    <div style={{ minHeight: '100dvh', padding: '60px 20px 112px', background: 'var(--slc-bg)' }}>
      <header style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: '#C4614A', margin: '0 0 6px' }}>공유와 설정 관리</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#2A1F1A', margin: 0, letterSpacing: '-0.03em' }}>관리</h1>
      </header>

      <section id="partner-invite" style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 12, alignItems: 'center', padding: '18px 18px 12px' }}>
          <div>
            <h2 style={sectionTitleStyle}>파트너 공유</h2>
            <p style={sectionLeadStyle}>파트너는 오늘 일정과 완료 상태만 읽기 전용으로 봅니다.</p>
          </div>
          <SLCIllustration asset={slcAssets.partner.syncOverview} size="icon" style={{ width: 78, justifySelf: 'end' }} />
        </div>

        {pendingRequests.length > 0 && (
          <div style={{ margin: '0 14px 12px', background: '#FFF8F5', borderRadius: 16, padding: '14px 16px', border: '1px solid #F4D4C8' }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#C4614A', margin: '0 0 12px' }}>파트너 연결 요청이 있어요</p>
            {pendingRequests.map((req) => (
              <div key={req.id} style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#2A1F1A', fontWeight: 800 }}>{partnerDisplayName(req)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => sendPartnerAction(req.id, 'approve')} style={pillButtonStyle('primary')}>승인하기</button>
                  <button onClick={() => sendPartnerAction(req.id, 'reject')} style={pillButtonStyle('muted')}>나중에</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {existingLink?.status === 'approved' && (
          <div style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid #F0EDE8' }}>
            <p style={{ fontSize: 13, color: '#9B8E86', margin: '0 0 6px', fontWeight: 800 }}>연결된 파트너</p>
            <p style={{ fontSize: 15, color: '#2A1F1A', fontWeight: 900, margin: '0 0 12px' }}>{partnerDisplayName(existingLink)}</p>
            <button onClick={() => sendPartnerAction(existingLink.id, 'revoke')} style={pillButtonStyle('muted')}>연결 해제</button>
          </div>
        )}

        {inviteCode ? (
          <div style={{ margin: '0 14px 14px', background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid #F0EDE8' }}>
            <p style={{ fontSize: 13, color: '#9B8E86', margin: '0 0 8px', fontWeight: 800 }}>초대 코드 · 읽기 전용 연결</p>
            <p style={{ fontSize: 12, color: '#C4614A', fontFamily: 'monospace', margin: '0 0 12px', wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`}
            </p>
            <button onClick={copyLink} style={pillButtonStyle('primary')}>{copied ? '복사됨 ✓' : '링크 복사'}</button>
          </div>
        ) : (
          <div style={{ padding: '0 14px 14px' }}>
            <button onClick={generateLink} disabled={generating} style={{ ...pillButtonStyle('primary'), width: '100%', minHeight: 46, opacity: generating ? 0.7 : 1 }}>
              {generating ? '생성 중...' : '파트너 초대 링크 만들기'}
            </button>
          </div>
        )}
      </section>

      <SettingsSection title="케어 관리 메뉴">
        {MORE_MENU_ITEMS.filter((item) => item.href !== '#partner-invite').map((item) => (
          <SettingsRow key={item.href} href={item.href} icon={menuIcon(item.label)} label={item.label} />
        ))}
      </SettingsSection>

      <SettingsSection title="데이터 보관">
        <SettingsRow href="/privacy" icon="🛡" label="데이터 보관 정책" detail="2026.06.30" />
      </SettingsSection>

      <SettingsSection title="알림 설정" id="notifications">
        <SettingsRow icon="🔔" label="알림 상태" detail="15분 전 표시" onClick={() => undefined} />
      </SettingsSection>

      <SettingsSection title="계정">
        <SettingsRow href="/auth/reset" icon="↩" label="로그아웃" danger />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 13, fontWeight: 900, color: '#9B8E86', margin: '0 0 8px', padding: '0 4px' }}>{title}</h2>
      <div style={sectionStyle}>{children}</div>
    </section>
  );
}

function menuIcon(label: string) {
  if (label.includes('일정')) return '＋';
  if (label.includes('병원')) return '🏥';
  if (label.includes('알림')) return '🔔';
  if (label.includes('개인정보')) return '🛡';
  return '•';
}

function partnerDisplayName(link: PartnerLink) {
  return link.partner_profile?.display_name?.trim() || '파트너';
}

const sectionStyle = {
  overflow: 'hidden',
  background: '#fff',
  borderRadius: 20,
  border: '1px solid #F0EDE8',
  boxShadow: '0 8px 24px rgba(80, 50, 40, 0.05)',
} as const;

const sectionTitleStyle = { fontSize: 16, fontWeight: 900, color: '#2A1F1A', margin: '0 0 6px' } as const;
const sectionLeadStyle = { fontSize: 13, color: '#9B8E86', lineHeight: 1.5, margin: 0 } as const;

function pillButtonStyle(tone: 'primary' | 'muted') {
  return {
    background: tone === 'primary' ? '#C4614A' : '#F0EDE8',
    color: tone === 'primary' ? '#fff' : '#9B8E86',
    border: 'none',
    borderRadius: 999,
    padding: '9px 16px',
    minHeight: 38,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
}
