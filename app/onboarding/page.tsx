import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { Card, Notice } from '../../src/components/ui';
import { OnboardingClient } from './onboarding-client';
import styles from './onboarding.module.css';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="onboarding-interview-shell">
      <Card aria-labelledby="onboarding-title" className={`hero-card ${styles.onboardingCard}`} data-testid="onboarding-interview-surface">
        <div className={styles.brandAnchor} aria-label="Fevio 브랜드">
          <img alt="Fevio" src="/logo.svg" />
          <Leaf aria-hidden="true" size={20} strokeWidth={2.2} />
        </div>
        <p className="eyebrow">Fevio interview</p>
        <h1 className={styles.heroTitle} id="onboarding-title">현재 치료 상황을 확인할게요</h1>
        <p className={`lead ${styles.heroLead}`}>병원에서 안내받은 약, 방문, 결과 일정을 기준으로 시작합니다.</p>
        <Notice className={styles.infoBox} tone="sage">안내받은 내용을 남기면 첫 화면으로 정리합니다. 나중에 수정할 수 있습니다.</Notice>
        <OnboardingClient />
      </Card>
    </main>
  );
}
