import Link from 'next/link';
import { Card, Notice } from '../../../src/components/ui';
import styles from '../../onboarding/onboarding.module.css';

export default function FullSetupPage() {
  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="full-setup-page">
      <Card className={`hero-card ${styles.onboardingCard}`}>
        <Link href="/home" className={styles.escapeLink} aria-label="홈으로 돌아가기">
          <span aria-hidden="true">‹</span> 홈으로
        </Link>
        <p className="eyebrow">Full Setup</p>
        <h1 className={styles.heroTitle}>준비됐을 때 처방과 일정을 자세히 정리해요</h1>
        <p className={`lead ${styles.heroLead}`}>Quick Capture에서 남긴 시간과 방문일을 바탕으로 약 이름, 용량, 처방 사진을 사용자가 직접 확인합니다.</p>
        <Notice tone="sage">Fevio는 약물명이나 용량을 추측하지 않아요. 확정된 내용만 카드로 바꿉니다.</Notice>
        <Link href="/medication" className="primary-action">약·주사 직접 입력하기</Link>
      </Card>
    </main>
  );
}
