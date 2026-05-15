import { PresentationTestbedNav, buildPresentationHomeScenarios } from '../presentation/presentation-testbed';
import { TodayScreen } from './today-screen';

export function PresentationHomeDemo() {
  const scenarios = buildPresentationHomeScenarios(new Date());

  return (
    <div
      data-testid="presentation-home-demo"
      style={{
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1180px, 100vw)',
        minHeight: '100dvh',
        padding: '34px 18px 92px',
        background:
          'radial-gradient(circle at 14% 4%, rgba(255, 230, 218, 0.96), transparent 34%), linear-gradient(180deg, #FFFDFC 0%, #FAF4EF 100%)',
      }}
    >
      <header style={{ maxWidth: 1040, margin: '0 auto 24px', display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, color: 'var(--slc-coral)', fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em' }}>
          Fevio scenario testbed
        </p>
        <h1 style={{ margin: 0, color: 'var(--slc-text)', fontSize: 34, lineHeight: 1.12, letterSpacing: '-0.06em' }}>
          로그인 없이 주요 화면을 확인해요
        </h1>
        <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 15, lineHeight: 1.55, letterSpacing: '-0.03em', maxWidth: 720 }}>
          실제 사용자 데이터나 Google 인증 없이, 병원 안내가 일정 카드로 바뀐 뒤 Home · Calendar · Records · More가 어떻게 달라지는지 확인합니다.
        </p>
        <PresentationTestbedNav current="home" />
      </header>

      <section
        aria-label="Fevio home demo scenarios"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {scenarios.map((scenario) => (
          <article
            key={scenario.id}
            data-testid={`presentation-home-scenario-${scenario.id}`}
            style={{
              borderRadius: 32,
              border: '1px solid rgba(210, 198, 187, 0.64)',
              background: 'rgba(255, 255, 255, 0.74)',
              boxShadow: '0 24px 70px rgba(105, 81, 68, 0.12)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 18px 14px' }}>
              <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#FFF4EF', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>
                {scenario.label}
              </span>
              <h2 style={{ margin: '10px 0 4px', color: 'var(--slc-text)', fontSize: 21, lineHeight: 1.18, letterSpacing: '-0.05em' }}>
                {scenario.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.45, letterSpacing: '-0.03em' }}>
                {scenario.description}
              </p>
            </div>
            <div style={{ padding: '0 12px 14px' }}>
              <div
                style={{
                  height: 720,
                  overflow: 'hidden',
                  borderRadius: 30,
                  border: '1px solid #EFE7E0',
                  background: 'var(--slc-bg)',
                }}
              >
                <TodayScreen
                  initialItems={scenario.items}
                  userId={`presentation-${scenario.id}`}
                  initialClinicUpdates={[]}
                  firstScheduleSkipped={scenario.firstScheduleSkipped}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
