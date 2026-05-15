import { InjectionCountdownArc } from '../../components/injection-countdown-arc';
import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  MissionCardPair,
  QuickStatRow,
} from './care-surface-primitives';
import { countPartnerActionSignals, findPrimaryCareCard, toMissionCardData } from './care-surface-model';
import { isInInjectionCountdownWindow, minutesUntilInjection } from './injection-timing';
import type { AdaptiveStateHomeBaseProps } from './types';
import type { HomeActionCard } from '../../domain/home-composition';

const KNOWN_DRUGS = ['고날에프', '프리날', '루프론', '세트로타이드', '오비드렐', '유트로게스탄', 'HMG', '퓨리곤'];

export function InjectionDayHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const primary = findPrimaryCareCard(context.cards, '고날에프');
  const secondary = context.cards.find((c) => c !== primary) ?? null;
  const sharedCount = countPartnerActionSignals(context.cards);

  const primaryMission = primary
    ? { ...toMissionCardData(primary), cta: '준비 체크리스트 보기' }
    : null;
  const secondaryMission = secondary ? toMissionCardData(secondary) : null;

  const primaryTime = primary ? toMissionCardData(primary).time : '--:--';
  const drugName = primary ? extractDrug(primary.title) : '확인 필요';
  const inWindow = isInInjectionCountdownWindow(primary?.scheduledAt ?? null);
  const remaining = primary?.scheduledAt ? minutesUntilInjection(primary.scheduledAt) : 0;
  const nextInjection = context.cards.find((card) => card !== primary && card.cardType === 'injection') ?? null;

  const stats = [
    { label: '주사 시간', value: primaryTime },
    { label: '약 종류', value: drugName },
    { label: '케어 단계', value: '주사' },
    { label: '파트너', value: context.partnerConnected === true ? '연결됨' : sharedCount > 0 ? `${sharedCount}개 공유` : '준비 중' },
  ] as const;

  const showPrimaryCard = composition?.slots.primary_card !== null;
  const showStats = composition?.slots.stats_row !== null;

  return (
    <CareSurfaceFrame phase="injection" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="injection" />
      {inWindow
        ? <InjectionCountdownHero primary={primary} nextInjection={nextInjection} remainingMinutes={remaining} />
        : <CompactHeroGreeting phase="injection" momentCopy={composition?.momentCopy} />}
      {showPrimaryCard ? <MissionCardPair primary={primaryMission} secondary={secondaryMission} /> : null}
      {showStats ? <QuickStatRow stats={stats} /> : null}
      <HomeUtilityLauncher fullSetupPending={context.onboardingQuickCaptureDone === true} />
    </CareSurfaceFrame>
  );
}

function extractDrug(title: string): string {
  return KNOWN_DRUGS.find((d) => title.includes(d))
    ?? title.replace(/^\d{1,2}:\d{2}\s*/u, '').split(' ')[0]
    ?? '확인 필요';
}

function InjectionCountdownHero({
  primary,
  nextInjection,
  remainingMinutes,
}: {
  primary: HomeActionCard | null;
  nextInjection: HomeActionCard | null;
  remainingMinutes: number;
}) {
  return (
    <section
      aria-label="주사 카운트다운"
      data-testid="injection-countdown-hero"
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 10,
        padding: '8px 0 4px',
      }}
    >
      <InjectionCountdownArc totalMinutes={60} remainingMinutes={remainingMinutes} />
      <div style={{ textAlign: 'center', marginTop: -42 }}>
        <p style={{ margin: '0 0 4px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>남은 시간</p>
        <strong style={{ color: 'var(--slc-text)', fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {formatRemainingClock(remainingMinutes)}
        </strong>
      </div>
      <div style={{ width: '100%', display: 'grid', gap: 8, marginTop: 10 }}>
        <CountdownInfoRow label="주사 시간" value={primary?.scheduledAt ? formatCardTime(primary.scheduledAt) : '확인 필요'} />
        <CountdownInfoRow label="약물명" value={primary ? extractDrug(primary.title) : '확인 필요'} />
        <CountdownInfoRow
          label="다음 주사"
          value={nextInjection ? `${formatCardTime(nextInjection.scheduledAt)} ${extractDrug(nextInjection.title)}` : '미정'}
        />
      </div>
    </section>
  );
}

function CountdownInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <a
      href="/add"
      style={{
        minHeight: 48,
        display: 'grid',
        gridTemplateColumns: '82px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 16,
        background: 'var(--slc-surface)',
        border: '1px solid var(--slc-border)',
        color: 'var(--slc-text)',
      }}
    >
      <span style={{ color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>{label}</span>
      <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 900 }}>
        {value}
      </strong>
      <span aria-hidden="true" style={{ color: 'var(--slc-coral)', fontSize: 22, lineHeight: 1 }}>›</span>
    </a>
  );
}

function formatRemainingClock(minutes: number) {
  const clamped = Math.max(0, minutes);
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatCardTime(scheduledAt: string | null) {
  if (!scheduledAt) return '확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(new Date(scheduledAt));
}
