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
        <h1 className={styles.heroTitle} id="onboarding-title">오늘 필요한 것만 먼저 정리해요</h1>
        <p className={`lead ${styles.heroLead}`}>병원에서 들은 내용을 편한 만큼만 남겨요.</p>
        <Notice className={styles.infoBox} tone="sage">확정 전에는 할 일로 표시되지 않아요.</Notice>
        <OnboardingClient />
      </Card>
    </main>
  );
}
