import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../../src/components/ui';
import { MilestoneInputForm } from './timeline-client';
import styles from '../onboarding.module.css';

export default async function OnboardingTimelinePage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="onboarding-timeline-shell">
      <Card aria-labelledby="timeline-title" className={`hero-card ${styles.onboardingCard}`}>
        <p className="eyebrow">Treatment timeline</p>
        <h1 className={styles.heroTitle} id="timeline-title">언제 어떤 일이 있었나요?</h1>
        <p className={`lead ${styles.heroLead}`}>초진 날짜 하나만 있어도 시작할 수 있어요. 채취·이식 날짜는 확정될 때 나중에 추가해요.</p>
        <Notice className={styles.infoBox} tone="sage">예상 일정은 홈 단계나 알림으로 확정하지 않아요. 사용자가 확인한 날짜만 저장합니다.</Notice>
        <MilestoneInputForm />
      </Card>
    </main>
  );
}
