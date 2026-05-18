'use client';
import { useState, type ReactNode } from 'react';
import type { PartnerLink } from '../../types/slc.types';
import { MORE_MENU_ITEMS } from './more-menu';
import { createFevioBrowserAuthClient } from '../../lib/browser-auth-client';
import { SettingsRow } from '../../components/ui';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';

interface Props {
  userId: string;
  existingLink: PartnerLink | null;
  pendingRequests: PartnerLink[];
}

export function MoreScreen({ userId: _userId, existingLink, pendingRequests }: Props) {
  const [inviteCode, setInviteCode] = useState<string | null>(existingLink?.invite_code ?? null);
  const [generating, setGenerating] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    setLinkError(null);
    try {
      const res = await fetch('/api/partner/invite', { method: 'POST' });
      const data = await res.json() as { inviteCode?: string; error?: string };
      if (!res.ok || !data.inviteCode) {
        setLinkError(data.error ?? '링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setInviteCode(data.inviteCode);
    } catch {
      setLinkError('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setGenerating(false);
    }
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

  const resetAllInformation = async () => {
    const confirmed = window.confirm('일정, 기록, 파트너 공유, 온보딩 정보를 삭제하고 처음부터 다시 시작할까요? 로그인과 개인정보 보호 확인은 유지됩니다.');
    if (!confirmed) return;

    setResetting(true);
    try {
      const authorization = await getResetAuthorizationHeader();
      const res = await fetch('/api/account/reset', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: authorization ? { Authorization: authorization } : undefined,
      });
      const data = await res.json().catch(() => ({})) as { redirectTo?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error === 'unauthorized'
          ? '로그인 확인이 필요해요. 다시 로그인한 뒤 정보 지우기를 눌러주세요.'
          : data.error ?? '정보를 지우지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      window.location.assign(data.redirectTo ?? '/onboarding');
    } finally {
      setResetting(false);
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/auth/reset', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({})) as { redirectTo?: string };
      window.location.assign(data.redirectTo ?? '/auth/sign-in');
    } catch {
      window.location.assign('/auth/sign-in');
    }
  };

  return (
    <AmbientStoryBackground asset={slcAssets.partner.syncOverview} intensity="subtle" style={{ minHeight: '100dvh', padding: 'var(--fevio-page-top) var(--fevio-page-gutter) var(--fevio-page-bottom)' }}>
      <header style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: 'var(--slc-coral)', margin: '0 0 6px' }}>공유와 설정 관리</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--slc-text)', margin: 0, letterSpacing: '-0.03em' }}>관리</h1>
      </header>

      <section id="partner-invite" style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 12, alignItems: 'center', padding: '18px 18px 12px' }}>
          <div>
            <h2 style={sectionTitleStyle}>파트너 공유</h2>
            <p style={sectionLeadStyle}>파트너는 오늘 일정과 완료 상태만 읽기 전용으로 봅니다.</p>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div style={{ margin: '0 14px 12px', background: '#FFF8F5', borderRadius: 16, padding: '14px 16px', border: '1px solid #F4D4C8' }}>
            <PartnerCardHeader title="파트너 연결 요청이 있어요" />
            {pendingRequests.map((req) => (
              <div key={req.id} style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--slc-text)', fontWeight: 800 }}>{partnerDisplayName(req)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => sendPartnerAction(req.id, 'approve')} style={pillButtonStyle('primary')}>승인하기</button>
                  <button onClick={() => sendPartnerAction(req.id, 'reject')} style={pillButtonStyle('muted')}>나중에</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {existingLink?.status === 'approved' && (
          <div style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid var(--slc-border)' }}>
            <PartnerCardHeader title="연결된 파트너" muted />
            <p style={{ fontSize: 15, color: 'var(--slc-text)', fontWeight: 900, margin: '0 0 12px' }}>{partnerDisplayName(existingLink)}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="/home" style={{ ...pillButtonStyle('primary'), display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>확인</a>
              <button onClick={() => sendPartnerAction(existingLink.id, 'revoke')} style={pillButtonStyle('muted')}>연결 해제</button>
            </div>
          </div>
        )}

        {inviteCode ? (
          <div style={{ margin: '0 14px 14px', background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid var(--slc-border)' }}>
            <PartnerCardHeader title="초대 코드 · 읽기 전용 연결" muted />
            <p style={{ fontSize: 12, color: 'var(--slc-coral)', fontFamily: 'monospace', margin: '0 0 12px', wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`}
            </p>
            <button onClick={copyLink} style={pillButtonStyle('primary')}>{copied ? '복사됨 ✓' : '링크 복사'}</button>
          </div>
        ) : (
          <div style={{ padding: '0 14px 14px' }}>
            <button onClick={generateLink} disabled={generating} style={{ ...pillButtonStyle('primary'), width: '100%', minHeight: 46, opacity: generating ? 0.7 : 1 }}>
              {generating ? '생성 중...' : '파트너 초대 링크 만들기'}
            </button>
            {linkError ? <p style={{ margin: '8px 0 0', fontSize: 13, color: '#C44F4F' }}>{linkError}</p> : null}
          </div>
        )}
      </section>

      <SettingsSection title="케어 관리 메뉴">
        {MORE_MENU_ITEMS.filter((item) => item.href !== '#partner-invite').map((item) => (
          <SettingsRow key={item.href} href={item.href} icon={menuIcon(item.label)} label={item.label} />
        ))}
      </SettingsSection>

      <SettingsSection title="데이터 보관">
        <SettingsRow href="/settings/privacy" icon="🛡" label="데이터 보관 정책" detail="2026.06.30" />
      </SettingsSection>

      <SettingsSection title="알림 설정" id="notifications">
        <SettingsRow icon="🔔" label="알림 상태" detail="15분 전 표시" onClick={() => undefined} />
      </SettingsSection>

      <SettingsSection title="계정">
        <SettingsRow
          icon="🧹"
          label="모든 정보 지우기"
          detail={resetting ? '지우는 중' : '온보딩 다시'}
          danger
          disabled={resetting}
          onClick={resetAllInformation}
        />
        <SettingsRow
          icon="↩"
          label="로그아웃"
          detail={loggingOut ? '나가는 중' : undefined}
          danger
          disabled={loggingOut}
          onClick={signOut}
        />
      </SettingsSection>
    </AmbientStoryBackground>
  );
}

async function getResetAuthorizationHeader() {
  try {
    const client = createFevioBrowserAuthClient();
    const { data } = await client.auth.getSession();
    return data.session?.access_token ? `Bearer ${data.session.access_token}` : null;
  } catch {
    return null;
  }
}

function PartnerCardHeader({ title, muted = false }: { title: string; muted?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 10, alignItems: 'center', marginBottom: 12 }}>
      <p style={{ fontSize: muted ? 13 : 14, color: muted ? 'var(--slc-muted)' : 'var(--slc-coral)', fontWeight: 900, margin: 0 }}>{title}</p>
    </div>
  );
}

function SettingsSection({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 13, fontWeight: 900, color: 'var(--slc-muted)', margin: '0 0 8px', padding: '0 4px' }}>{title}</h2>
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
  background: 'rgba(255, 255, 255, 0.88)',
  borderRadius: 20,
  border: '1px solid var(--slc-border)',
  boxShadow: '0 8px 24px rgba(80, 50, 40, 0.05)',
  backdropFilter: 'blur(14px)',
} as const;

const sectionTitleStyle = { fontSize: 16, fontWeight: 900, color: 'var(--slc-text)', margin: '0 0 6px' } as const;
const sectionLeadStyle = { fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.5, margin: 0 } as const;

function pillButtonStyle(tone: 'primary' | 'muted') {
  return {
    background: tone === 'primary' ? 'var(--slc-coral)' : 'var(--slc-border)',
    color: tone === 'primary' ? '#fff' : 'var(--slc-muted)',
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
