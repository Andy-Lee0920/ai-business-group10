import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function SettingsPrivacyPage() {
  return (
    <main style={{ minHeight: '100dvh', padding: '54px 20px 112px', background: 'var(--slc-bg)', color: 'var(--slc-text)' }}>
      <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--slc-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 800, marginBottom: 26 }}>
        <span aria-hidden="true">←</span>
        관리로 돌아가기
      </Link>

      <header style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: 'var(--slc-coral)', margin: '0 0 8px' }}>데이터 보안</p>
        <h1 style={{ fontSize: 30, lineHeight: 1.18, letterSpacing: '-0.05em', margin: 0 }}>저장 범위와 삭제 기준</h1>
        <p style={{ margin: '12px 0 0', color: 'var(--slc-muted)', lineHeight: 1.6, fontSize: 15, wordBreak: 'keep-all' }}>
          Fevio는 병원 안내를 직접 확인한 일정으로 바꾸기 위해 필요한 정보만 저장합니다.
        </p>
      </header>

      <section style={cardStyle}>
        <PolicyRow icon="🧑" title="계정과 역할" body="로그인 상태, 본인/파트너 역할, 파트너 연결 상태를 저장합니다." />
        <PolicyRow icon="📋" title="확인한 일정" body="사용자가 저장 전 확인한 일정, 약명, 시간, 완료 여부만 실행 화면에 사용합니다." />
        <PolicyRow icon="🔒" title="파트너 공유" body="파트너에게는 오늘 일정과 완료 상태 중심의 읽기 전용 화면만 보여줍니다." />
        <PolicyRow icon="🧹" title="모든 정보 지우기" body="관리 화면에서 일정, 기록, 파트너 공유, 온보딩 정보를 지우고 다시 온보딩할 수 있습니다." isLast />
      </section>

      <section style={{ ...cardStyle, marginTop: 16, padding: 18 }}>
        <p style={{ margin: 0, color: 'var(--slc-muted)', lineHeight: 1.62, fontSize: 14, wordBreak: 'keep-all' }}>
          Fevio는 의료 판단을 하지 않고 병원 안내를 기록·확인하는 도구입니다. 개인정보 확인 화면은 첫 진입 경계이고, 로그인 후 데이터 보안 내용은 이 관리 화면 안에서 확인합니다.
        </p>
      </section>
    </main>
  );
}

function PolicyRow({ icon, title, body, isLast = false }: { icon: string; title: string; body: string; isLast?: boolean }) {
  return (
    <article style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 14, padding: isLast ? '16px 0 0' : '16px 0', borderBottom: isLast ? 'none' : '1px solid var(--slc-border)' }}>
      <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#FFF4EF' }}>{icon}</span>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--slc-text)' }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 14, lineHeight: 1.55, wordBreak: 'keep-all' }}>{body}</p>
      </div>
    </article>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--slc-border)',
  borderRadius: 22,
  padding: '2px 18px 18px',
  boxShadow: '0 8px 24px rgba(80, 50, 40, 0.05)',
} as const;
