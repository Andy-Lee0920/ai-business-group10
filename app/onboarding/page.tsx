import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { OnboardingClient } from './onboarding-client';
import styles from './onboarding.module.css';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className={`app-shell ${styles.onboardingShell}`}>
      <Card aria-labelledby="onboarding-title" className={`hero-card ${styles.onboardingCard}`}>
        <p className="eyebrow">Fevio Care OS</p>
        <h1 className={styles.heroTitle} id="onboarding-title">처음 설정을 같이 해요</h1>
        <p className={`lead ${styles.heroLead}`}>처음부터 많이 묻지 않을게요. 오늘 덜 버거운 도움 하나를 고르면, 그 흐름에 맞춰 홈을 조용히 만들어 둡니다.</p>
        <Notice className={styles.infoBox} tone="sage">파트너 초대는 선택 사항이라 언제든 건너뛸 수 있어요.</Notice>
        <OnboardingClient />
      </Card>
    </main>
  );
}
