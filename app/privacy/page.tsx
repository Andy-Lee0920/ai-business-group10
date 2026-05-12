import Link from 'next/link';
import { getPrivacyContactEmail } from '../../src/config';
import { Badge, Card, Notice } from '../../src/components/ui';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const privacyContactEmail = getPrivacyContactEmail();

  return (
    <main className={`app-shell ${styles.privacyShell}`}>
      <Card aria-labelledby="privacy-title" className={styles.privacyCard} data-testid="privacy-gate-card">
        <header className={styles.privacyHeader}>
          <p className={styles.privacyEyebrow}>Privacy Gate</p>
          <h1 className={styles.privacyTitle} id="privacy-title">시작 전에 세 가지만 확인해요</h1>
          <p className={styles.privacyLead}>병원 메모를 저장하기 전에, 무엇이 저장되고 어디까지 공유되는지만 짧게 확인합니다.</p>
        </header>

        <ul className={styles.consentList} data-testid="privacy-consent-list" aria-label="Privacy Gate 핵심 확인 항목">
          <li>
            <Badge tone="sage">정보</Badge>
            <span>
              <strong>병원 메모와 치료 일정</strong>
              <p>동의 후에만 저장하고, 내 케어 화면을 만드는 데 사용합니다.</p>
            </span>
          </li>
          <li>
            <Badge tone="lavender">공유</Badge>
            <span>
              <strong>파트너에게 보이는 범위</strong>
              <p>사용자가 고른 카드만 역할과 행동으로 바꿔 보여줍니다.</p>
            </span>
          </li>
          <li>
            <Badge tone="coral">경계</Badge>
            <span>
              <strong>의료 판단은 병원 기준</strong>
              <p>Fevio는 진단, 용량 추천, 치료 판단을 대신하지 않습니다.</p>
            </span>
          </li>
        </ul>

        <details className={styles.detailPanel}>
          <summary>보관·삭제·공유 세부 안내</summary>
          <div className={styles.detailBody}>
            <Notice tone="sage">
              삭제 요청은 {privacyContactEmail}로 보내주시면 접수 후 처리합니다. 자동 삭제는 v1.x 예정입니다.
              파트너 연결 해제는 <Link href="/settings/sharing">공유 링크 설정</Link>에서 먼저 할 수 있어요.
            </Notice>
            <Notice tone="coral">동의 전에는 병원 메모, 할 일 카드, 파트너 공유 링크를 만들 수 없습니다.</Notice>
          </div>
        </details>

        <form action="/api/privacy/accept" className={`cta-row ${styles.privacyActions}`} method="post">
          <button className="fevio-button fevio-button--primary" type="submit">
            동의하고 시작
          </button>
          <Link className="secondary-cta" href="/">
            동의하지 않고 돌아가기
          </Link>
        </form>
      </Card>
    </main>
  );
}
