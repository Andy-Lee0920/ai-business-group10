import { Badge, Card, CtaButton, Notice } from '../../components/ui';
import { HomeUtilityLauncher } from './home-utility-launcher';
import type { AdaptiveStateHomeBaseProps } from './types';
import styles from './clinic-day-home.module.css';

const DEFAULT_VISIT_STEPS = [
  {
    id: 'clinic-visit-arrival',
    title: '방문 시간 확인',
    description: '예약 시간 10분 전 도착을 목표로 이동 시간을 먼저 확인해요.',
  },
  {
    id: 'clinic-visit-documents',
    title: '준비물 챙기기',
    description: '신분증, 진료카드, 최근 복용한 약 이름을 함께 확인해요.',
  },
  {
    id: 'clinic-visit-questions',
    title: '진료실 질문 정리',
    description: '채혈·초음파 결과와 다음 일정에서 꼭 물어볼 내용을 메모해요.',
  },
];

const PARTNER_ACTIONS = [
  '이동 경로와 주차 시간을 미리 확인해요.',
  '접수와 대기 순서를 함께 챙겨요.',
  '진료 후 안내받은 다음 일정을 바로 적어둬요.',
];

export function ClinicDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const checklistItems = context.cards.length > 0 ? context.cards : DEFAULT_VISIT_STEPS;

  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className={styles.clinicHomeCard}>
        <p className="eyebrow">오늘 병원 방문</p>
        <h1 id="home-title">방문 전 체크리스트</h1>
        <p className="lead">{context.primaryMessage}</p>

        <section className={styles.checklistSection} aria-labelledby="clinic-checklist-title">
          <div className={styles.sectionHeader}>
            <Badge tone="coral">방문 준비</Badge>
            <h2 id="clinic-checklist-title">병원 방문 체크리스트</h2>
          </div>
          <div className={styles.checklistCards} aria-label="병원 방문 체크리스트 항목">
            {checklistItems.map((item, index) => (
              <article className={styles.checklistCard} data-testid="home-action-card" key={item.id}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  {'urgencyCopy' in item && item.urgencyCopy ? (
                    <p className={styles.urgency}>{item.urgencyCopy}</p>
                  ) : null}
                  {item.description ? <p>{item.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
          <CtaButton className={styles.primaryAction} type="button">
            방문 체크리스트 열기
          </CtaButton>
        </section>

        <section className={styles.partnerBlock} aria-labelledby="partner-role-title">
          <p className={styles.blockKicker}>오늘은 동행자</p>
          <h2 id="partner-role-title">오늘 파트너의 역할</h2>
          <ul>
            {PARTNER_ACTIONS.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        <Notice className={styles.notificationBlock} tone="sage" aria-labelledby="notification-tone-title">
          <p className={styles.blockKicker}>알림 문구</p>
          <h2 id="notification-tone-title">실용적으로 짧게 알려드려요</h2>
          <p>오전 9시 병원 방문이에요. 채혈과 초음파 확인 예정입니다.</p>
          <p>준비물과 이동 시간을 함께 확인하면 대기 중에 덜 급해져요.</p>
        </Notice>
        <HomeUtilityLauncher />
      </Card>
    </main>
  );
}
