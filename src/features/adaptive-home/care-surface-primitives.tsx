import { CtaButton, classNames } from '../../components/ui';
import { getFevioIcon } from '../../design/icon-map';
import type { HomeActionCard, HomeContext } from '../../domain/home-composition';
import type { CardType } from '../../types/care-cards.types';
import styles from './care-surface-primitives.module.css';

export type { CareSurfacePhase } from '../../types/care-surface.types';
import type { CareSurfacePhase } from '../../types/care-surface.types';
export type CareMomentRingState = 'upcoming' | 'prepare' | 'due' | 'completed' | 'unknown';

const RING_VIEWBOX = 240;
const RING_CENTER = 120;
const RING_RADIUS = 94;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const phaseClass: Record<CareSurfacePhase, string> = {
  injection: styles.phaseInjection,
  clinic: styles.phaseClinic,
  waiting: styles.phaseWaiting,
  two_week_wait: styles.phaseWaiting,
  routine: styles.phaseRoutine,
};

export function CareSurfaceFrame({ phase, context, intensity = 0.5, appliedRules = [], children }: { phase: CareSurfacePhase; context?: HomeContext; intensity?: number; appliedRules?: readonly string[]; children: React.ReactNode }) {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  return (
    <main className="app-shell">
      <section
        className={classNames(styles.surfaceFrame, phaseClass[phase])}
        style={{ '--fevio-surface-intensity': clampedIntensity } as React.CSSProperties}
        data-testid="care-atmosphere-layer"
        data-phase={phase}
        data-intensity={clampedIntensity.toFixed(2)}
        data-applied-rules={appliedRules.join(',')}
        data-phase-care-day={context?.phaseCareDay}
        data-surface-care-day={context?.surfaceCareDay}
        data-override-reason={context?.overrideReason}
      >
        {children}
      </section>
    </main>
  );
}

export function MomentHero({
  phase,
  eyebrow,
  title,
  fact,
  actionLabel,
  actionHint,
  children,
}: {
  phase: CareSurfacePhase;
  eyebrow: string;
  title: string;
  fact: string;
  actionLabel: string;
  actionHint: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={styles.momentHero} data-testid="care-moment-hero" aria-labelledby="home-title">
      <DecorativeIcon className={styles.heroIcon} iconKey={`phase:${phase}`} testId="phase-hero-icon" />
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.heroTitle} id="home-title">{title}</h1>
      <p className={styles.heroFact}>{fact}</p>
      {children}
      <ActionStrip phase={phase} label={actionLabel} hint={actionHint} />
    </section>
  );
}

export function ActionStrip({ phase, label, hint }: { phase: CareSurfacePhase; label: string; hint: string }) {
  return (
    <div className={styles.actionStrip} aria-label="지금 할 수 있는 행동" data-phase={phase}>
      <CtaButton className={styles.stripButton} type="button">{label}</CtaButton>
      <span>{hint}</span>
    </div>
  );
}

export function OperationalGlassSheet({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.glassSheet} data-testid="operational-glass-sheet" aria-labelledby="operational-glass-title">
      <div className={styles.sheetHeader}>
        <span className={styles.sheetLabel}><DecorativeIcon className={styles.sheetIcon} iconKey="component:operationalGlassSheetHeader" testId="sheet-layers-icon" />케어 흐름</span>
        <h2 id="operational-glass-title">{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function QuietChecklist({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; title: string; description?: string | null; badge?: string; cardType?: CardType; completed?: boolean }>;
}) {
  return (
    <section className={styles.quietChecklist} aria-label={label}>
      {items.map((item, index) => (
        <article className={styles.checkItem} data-testid="home-action-card" key={item.id}>
          <span className={styles.checkMark} aria-hidden="true">
            <DecorativeIcon
              className={styles.checkStateIcon}
              iconKey={item.completed ? 'component:quietChecklistChecked' : 'component:quietChecklistUnchecked'}
              testId="quiet-checklist-state-icon"
            />
          </span>
          <div>
            <div className={styles.checkMeta}>
              {item.cardType ? <DecorativeIcon className={styles.cardTypeIcon} iconKey={`card:${item.cardType}`} testId="care-card-type-icon" /> : null}
              {item.badge ? <small>{item.badge}</small> : null}
            </div>
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export function PartnerPresencePulse({
  title,
  description,
  state = 'shared',
}: {
  title: string;
  description: string;
  state?: 'shared' | 'seen' | 'unknown';
}) {
  const statusCopy = state === 'seen' ? '함께 확인 중' : state === 'unknown' ? '공유 준비됨' : '파트너에게 공유됨';
  return (
    <section className={styles.partnerPulse} data-testid="partner-presence-pulse" aria-label="파트너 공유 상태">
      <span className={styles.pulseOrb} aria-hidden="true"><DecorativeIcon className={styles.pulseIcon} iconKey="component:partnerPresencePulse" testId="partner-radio-icon" /></span>
      <div>
        <small>{statusCopy}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

export function CareMomentRing({ card, generatedAt }: { card: HomeActionCard | null; generatedAt: string }) {
  const model = getRingModel(card, generatedAt);
  const offset = getStrokeOffset(model.progress);

  return (
    <div className={styles.ringWrap} data-state={model.state}>
      <svg
        aria-label={model.ariaLabel}
        className={styles.ringSvg}
        data-testid="care-moment-ring"
        role="img"
        viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
      >
        <defs>
          <linearGradient id="care-moment-ring-gradient" x1="24" y1="24" x2="216" y2="216" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD1BD" />
            <stop offset="52%" stopColor="#FF8E72" />
            <stop offset="100%" stopColor="#B9AED6" />
          </linearGradient>
        </defs>
        <circle className={styles.ringTrack} cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS} />
        <circle
          className={styles.ringArc}
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.ringCenter} aria-hidden="true">
        <span>{model.timeLabel}</span>
        <strong>{model.titleLabel}</strong>
        <p>{model.helper}</p>
      </div>
    </div>
  );
}

// ── Compact layout components (consulting-doc structure) ────────────

export type IvfStageStep = 'stimulation' | 'monitoring' | 'retrieval_culture' | 'transfer_wait' | 'result_protection';

const IVF_STAGE_STEPS = [
  { key: 'stimulation' as IvfStageStep, label: '자극', fullLabel: '난포 자극', href: '/home?care=injection_day' },
  { key: 'monitoring' as IvfStageStep, label: '확인', fullLabel: '초음파·채혈', href: '/home?care=clinic_day' },
  { key: 'retrieval_culture' as IvfStageStep, label: '채취', fullLabel: '채취·배양', href: '/home?care=waiting_day' },
  { key: 'transfer_wait' as IvfStageStep, label: '이식', fullLabel: '이식 후 대기', href: '/home?care=two_week_wait_day' },
  { key: 'result_protection' as IvfStageStep, label: '결과', fullLabel: '결과 보호', href: '/home?care=result_protection_day' },
] as const;

const PHASE_TO_IVF_STAGE: Record<CareSurfacePhase, IvfStageStep> = {
  injection: 'stimulation',
  clinic: 'monitoring',
  waiting: 'retrieval_culture',
  two_week_wait: 'transfer_wait',
  routine: 'stimulation',
};

export function CarePhaseStrip({ activePhase, activeStep }: { activePhase: CareSurfacePhase; activeStep?: IvfStageStep }) {
  const currentStep = activeStep ?? PHASE_TO_IVF_STAGE[activePhase];
  const currentIndex = IVF_STAGE_STEPS.findIndex((step) => step.key === currentStep);
  const current = IVF_STAGE_STEPS[currentIndex] ?? IVF_STAGE_STEPS[0];

  return (
    <nav className={styles.phaseStrip} aria-label="IVF 5단계 진행">
      <div className={styles.phaseStripHeader}>
        <span>IVF 5단계</span>
        <strong>{currentIndex + 1}/5 · {current.fullLabel}</strong>
      </div>
      <ol className={styles.phaseTrack}>
        {IVF_STAGE_STEPS.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isDone = index < currentIndex;
          return (
            <li className={styles.phaseStep} data-complete={isDone ? 'true' : undefined} key={step.key}>
              <a
                href={step.href}
                className={styles.phaseTab}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${index + 1}단계 ${step.fullLabel}`}
              >
                <span className={styles.phaseDot}>{index + 1}</span>
                <span>{step.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const PHASE_GREETING: Record<CareSurfacePhase, { title: string; context: string }> = {
  injection: { title: '주사 준비', context: '오늘은 시간을 함께 지키는 날이에요.' },
  clinic: { title: '병원 방문', context: '준비한 것들을 챙겨 가는 날이에요.' },
  waiting: { title: '기다리는 날', context: '오늘은 조용히 살피는 날이에요.' },
  two_week_wait: { title: '이식 후 기다림', context: '오늘은 기록하고 판단은 미뤄두는 날이에요.' },
  routine: { title: '오늘 케어', context: '확정된 일정과 기록만 차분히 확인해요.' },
};

export function CompactHeroGreeting({ phase, momentCopy, title }: { phase: CareSurfacePhase; momentCopy?: string; title?: string }) {
  const copy = PHASE_GREETING[phase];
  return (
    <div className={styles.compactGreeting} data-testid="compact-hero-greeting">
      <h1 className={styles.compactGreetingTitle}>{title ?? copy.title}</h1>
      <p className={styles.compactGreetingContext}>{momentCopy ?? copy.context}</p>
    </div>
  );
}

export type MissionCardData = {
  label?: string;
  title: string;
  time: string;
  cta?: string;
};

export function MissionCardPair({
  primary,
  secondary,
}: {
  primary: MissionCardData | null;
  secondary: MissionCardData | null;
}) {
  if (!primary) return null;
  return (
    <div className={styles.missionRow} data-testid="mission-card-pair">
      <div className={styles.missionCardPrimary}>
        <span className={styles.missionCardLabel}>{primary.label ?? '오늘의 미션'}</span>
        <h2 className={styles.missionCardTitle}>{primary.title}</h2>
        <span className={styles.missionCardTime}>{primary.time}</span>
        {primary.cta ? (
          <button className={styles.missionCardCta} type="button">
            <span>{primary.cta}</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
      {secondary ? (
        <div className={styles.missionCardSecondary}>
          <span className={styles.missionCardLabel}>{secondary.label ?? '다음 단계'}</span>
          <h3 className={styles.missionCardTitle}>{secondary.title}</h3>
          <span className={styles.missionCardTime}>{secondary.time}</span>
        </div>
      ) : null}
    </div>
  );
}

export type QuickStat = {
  label: string;
  value: string;
};

export function QuickStatRow({ stats }: { stats: readonly QuickStat[] }) {
  return (
    <div className={styles.statRow} data-testid="quick-stat-row" aria-label="오늘 요약">
      {stats.map((stat) => (
        <div key={stat.label} className={styles.statCell}>
          <span className={styles.statLabel}>{stat.label}</span>
          <span className={styles.statValue}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

export function PartnerConnectBar({ description, connected = false }: { description: string; connected?: boolean }) {
  return (
    <div className={styles.partnerBar} data-testid="partner-connect-bar" aria-label="파트너 공유 상태">
      <span className={styles.partnerBarIconWrap} aria-hidden="true">
        <DecorativeIcon className={styles.pulseIcon} iconKey="component:partnerPresencePulse" testId="partner-bar-icon" />
      </span>
      <div className={styles.partnerBarContent}>
        <p className={styles.partnerBarTitle}>{connected ? '파트너 계정 연결됨' : '파트너 공유 준비'}</p>
        <p className={styles.partnerBarSub}>{description}</p>
      </div>
      <span className={styles.partnerBarChevron} aria-hidden="true">›</span>
    </div>
  );
}

function getStrokeOffset(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  return RING_CIRCUMFERENCE * (1 - clamped);
}

function getRingModel(card: HomeActionCard | null, generatedAt: string): {
  progress: number;
  state: CareMomentRingState;
  timeLabel: string;
  titleLabel: string;
  helper: string;
  ariaLabel: string;
} {
  if (!card) {
    return {
      progress: 0.12,
      state: 'unknown',
      timeLabel: '--:--',
      titleLabel: '확인할 시간',
      helper: '확정된 시간이 들어오면 여기에 보여요',
      ariaLabel: '아직 확정된 주사 시간이 없어요',
    };
  }

  const timeLabel = extractTimeLabel(card);
  const titleLabel = cleanTitle(card.title);
  const minutesUntil = card.scheduledAt ? (new Date(card.scheduledAt).getTime() - new Date(generatedAt).getTime()) / 60_000 : null;
  const state: CareMomentRingState = minutesUntil === null ? 'unknown' : minutesUntil <= 5 && minutesUntil >= -30 ? 'due' : minutesUntil <= 30 ? 'prepare' : 'upcoming';
  const progress = state === 'due' ? 0.94 : state === 'prepare' ? 0.78 : state === 'upcoming' ? 0.42 : 0.16;
  const helper = state === 'due' ? '지금 함께 확인할 시간이에요' : state === 'prepare' ? '30분 전에 준비를 시작해요' : '준비할 시간을 조용히 남겨둘게요';

  return {
    progress,
    state,
    timeLabel,
    titleLabel,
    helper,
    ariaLabel: `오늘 ${timeLabel} ${titleLabel} 준비 시간`,
  };
}

function extractTimeLabel(card: HomeActionCard) {
  const titleTime = card.title.match(/\b\d{1,2}:\d{2}\b/u)?.[0];
  if (titleTime) return titleTime;
  if (!card.scheduledAt) return '--:--';
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(new Date(card.scheduledAt));
}

function cleanTitle(title: string) {
  return title.replace(/^\d{1,2}:\d{2}\s*/u, '').replace(/—.*$/u, '').trim();
}

function DecorativeIcon({ iconKey, className, testId }: { iconKey: Parameters<typeof getFevioIcon>[0]; className: string; testId?: string }) {
  const spec = getFevioIcon(iconKey);
  const Icon = spec.icon;
  return <Icon aria-hidden="true" className={classNames(className, styles[`iconTone_${spec.tone}`])} data-testid={testId} focusable="false" size={spec.size} strokeWidth={2.2} />;
}
