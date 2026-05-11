import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { OnboardingClient } from './onboarding-client';
import styles from './onboarding.module.css';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="onboarding-interview-shell">
      <Card aria-labelledby="onboarding-title" className={`hero-card ${styles.onboardingCard}`} data-testid="onboarding-interview-surface">
        <p className="eyebrow">Fevio interview</p>
        <h1 className={styles.heroTitle} id="onboarding-title">오늘의 케어를 한 장면씩 시작해요</h1>
        <p className={`lead ${styles.heroLead}`}>주사, 병원 방문, 기다림 중 지금 가장 가까운 장면을 따라 첫 홈의 분위기와 파트너 역할이 이어집니다.</p>
        <Notice className={styles.infoBox} tone="sage">파트너와 함께 쓰면 역할을 나눌 수 있고, 오늘은 내 홈부터 시작할 수도 있어요.</Notice>
        <OnboardingClient />
      </Card>
    </main>
  );
}
