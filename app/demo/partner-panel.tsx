import type { PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';
import styles from './dual-panel-demo.module.css';

type PartnerGuidance = {
  label: string;
  title: string;
  summary: string;
  tone: string;
  helpfulActions: string[];
  avoidActions: string[];
};

const PARTNER_GUIDANCE: Record<PresentationCareParam, PartnerGuidance> = {
  injection: {
    label: 'Injection Day',
    title: '오늘은 확인자',
    summary: '주사 시간과 준비물을 같이 확인해서 환자가 혼자 기억하고 설명하지 않게 돕습니다.',
    tone: '정확하지만 불안하지 않게',
    helpfulActions: ['주사 30분 전 공간과 준비물을 같이 확인하기', '약 이름과 시간을 카드와 맞춰보기', '끝난 뒤 다음 알림을 같이 확인하기'],
    avoidActions: ['“어느 주사였지?”를 마지막 순간에 묻기', '실수할까 봐 불안하게 재촉하기'],
  },
  clinic: {
    label: 'Clinic Day',
    title: '오늘은 동행자',
    summary: '이동, 검사, 결과 확인을 같이 정리해서 병원 정보를 한 사람에게만 맡기지 않습니다.',
    tone: '체계적이고 실용적으로',
    helpfulActions: ['출발 시간과 준비물을 먼저 확인하기', '채혈·초음파 결과를 같이 듣고 적기', '다음 방문일과 약 변경을 함께 확인하기'],
    avoidActions: ['병원 설명을 환자 혼자 기억하게 두기', '결과 확인 직후 바로 판단하거나 조언하기'],
  },
  waiting: {
    label: 'Waiting Day',
    title: '오늘은 곁에 있는 사람',
    summary: '결과를 재촉하지 않고 조용히 곁에 있어 불안을 키우는 말을 줄입니다.',
    tone: '부드럽고 느리게',
    helpfulActions: ['결과를 계속 묻지 않기', '가벼운 식사나 산책처럼 부담 없는 선택지 제안하기', '다음 일정만 조용히 확인하기'],
    avoidActions: ['“괜찮을 거야”만 반복하기', '검색 결과나 성공 사례를 갑자기 보내기'],
  },
};

type PartnerPanelProps = {
  care: PresentationCareParam;
};

export function PartnerPanel({ care }: PartnerPanelProps) {
  const guidance = PARTNER_GUIDANCE[care];

  return (
    <section className={styles.partnerScreen} data-testid="demo-partner-panel" aria-labelledby="partner-role-heading">
      <p className={styles.partnerLabel}>{guidance.label}</p>
      <h3 id="partner-role-heading">{guidance.title}</h3>
      <p className={styles.partnerSummary}>{guidance.summary}</p>

      <div className={styles.toneBox}>
        <span>오늘의 말투</span>
        <strong>{guidance.tone}</strong>
      </div>

      <div className={styles.partnerListBlock}>
        <h4>지금 도움이 되는 행동</h4>
        <ul>
          {guidance.helpfulActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>

      <div className={styles.avoidBlock}>
        <h4>오늘은 피할 행동</h4>
        <ul>
          {guidance.avoidActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
