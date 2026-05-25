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
        <h1 className={styles.heroTitle} id="timeline-title">확인한 날짜를 먼저 남길까요?</h1>
        <p className={`lead ${styles.heroLead}`}>초진 날짜 하나만 있어도 시작할 수 있어요. 채취·이식 날짜는 확정된 뒤에 남겨요.</p>
        <Notice className={styles.infoBox} tone="sage">예상 일정은 홈 단계나 알림으로 쓰지 않아요. 확인한 날짜만 저장해요.</Notice>
        <MilestoneInputForm />
      </Card>
    </main>
  );
}
