'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';
import { ActionCard } from '../../components/action-card';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { ConfirmSheet } from '../../components/confirm-sheet';
import { InjectionCountdownArc } from '../../components/injection-countdown-arc';
import { PostClinicBanner } from '../../components/post-clinic-banner';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';
import type { ClinicUpdate, InjectionSite, ScheduleItem } from '../../types/slc.types';
import { ctaLabel } from '../../types/slc.types';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { resolveClinicFollowUpPrompt } from '../../domain/slc-clinic-followup';
import { getHomePendingItems, resolveHomeFocus, resolveHomeVisualAsset, type HomeFocus } from '../../domain/slc-home-focus';
import { formatKstDateLabel, formatKstTime, isInKstDay } from '../../domain/kst-date';
import { isInInjectionCountdownWindow, secondsUntilInjection } from '../adaptive-home/injection-timing';
import styles from './today-screen.module.css';

interface TodayScreenProps {
  initialItems: ScheduleItem[];
  userId: string;
  initialClinicUpdates?: ClinicUpdate[];
  firstScheduleSkipped?: boolean;
}

type DayOffset = 0 | 1 | 2;
type HeroStory =
  | { kind: 'countdown'; item: ScheduleItem; nextInjection: ScheduleItem | null; focus: HomeFocus }
  | { kind: 'overdue_backlog'; missedCount: number; todayCount: number; clinicCount: number }
  | { kind: 'today_pending'; item: ScheduleItem; focus: HomeFocus }
  | { kind: 'tomorrow'; item: ScheduleItem; focus: HomeFocus }
  | { kind: 'quiet'; focus: HomeFocus };

const DAY_LABELS = ['오늘', '내일', '모레'] as const;
const HOME_REMINDER_SETTING_KEY = 'fevio_home_reminder_enabled';

export function TodayScreen({
  initialItems,
  userId: _userId,
  initialClinicUpdates = [],
  firstScheduleSkipped = false,
}: TodayScreenProps) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [confirmPortal, setConfirmPortal] = useState<HTMLElement | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderPreferenceLoaded, setReminderPreferenceLoaded] = useState(false);
  const [sheetLiftActive, setSheetLiftActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfirmPortal(document.getElementById('fevio-confirm-portal'));
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HOME_REMINDER_SETTING_KEY);
      if (stored === 'off') setReminderEnabled(false);
      if (stored === 'on') setReminderEnabled(true);
    } catch {
      // localStorage access can fail in restricted browser modes.
    } finally {
      setReminderPreferenceLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!reminderPreferenceLoaded) return;
    try {
      window.localStorage.setItem(HOME_REMINDER_SETTING_KEY, reminderEnabled ? 'on' : 'off');
    } catch {
      // localStorage access can fail in restricted browser modes.
    }
  }, [reminderEnabled, reminderPreferenceLoaded]);

  useEffect(() => {
    const id = setInterval(() => setItems((prev) => [...prev]), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const frame = rootRef.current?.closest<HTMLElement>('.fevio-authed-main');
    const scrollEl: Element = frame ?? document.documentElement;
    const update = () => {
      const max = scrollEl.scrollHeight - scrollEl.clientHeight;
      setSheetLiftActive(max > 0 && scrollEl.scrollTop / max > 0.55);
    };
    update();
    const target: EventTarget = frame ?? window;
    target.addEventListener('scroll', update, { passive: true });
    return () => target.removeEventListener('scroll', update);
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => isOnDay(item.scheduled_at, selectedDay)),
    [items, selectedDay],
  );

  const homeFocus = useMemo(() => resolveHomeFocus(visibleItems), [visibleItems]);
  const heroStory = useMemo(
    () => resolveHeroStory(selectedDay === 0 ? items : visibleItems, homeFocus, selectedDay, initialClinicUpdates),
    [items, visibleItems, homeFocus, selectedDay, initialClinicUpdates],
  );
  const heroItemId = 'item' in heroStory ? heroStory.item.id : null;
  const pending = useMemo(() => getHomePendingItems(visibleItems), [visibleItems]);
  const clinicFollowUpItem = useMemo(
    () => selectedDay === 0 ? resolveClinicFollowUpPrompt(visibleItems, initialClinicUpdates) : null,
    [selectedDay, visibleItems, initialClinicUpdates],
  );
  const cardItems = pending.filter((item) => item.id !== clinicFollowUpItem?.id && item.id !== heroItemId);
  const mainItem = cardItems[0];
  const nextItem = cardItems[1];
  const hasSelectedDaySchedule = visibleItems.length > 0 || Boolean(clinicFollowUpItem);
  const postClinicBannerState = useMemo(() => resolvePostClinicBannerState(items), [items]);

  const handleComplete = useCallback(async (site?: InjectionSite) => {
    if (!activeItem) return;
    const completedId = activeItem.id;
    setActiveItem(null);
    setItems((prev) => prev.map((item) => item.id === completedId ? { ...item, status: 'completed' } : item));
    await fetch('/api/schedule/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleItemId: completedId, injectionSite: site }),
    });
  }, [activeItem]);

  return (
    <div ref={rootRef} style={{ position: 'relative', background: 'var(--slc-bg)', minHeight: '100dvh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '66dvh',
          zIndex: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header reminderEnabled={reminderEnabled} onToggleReminder={() => setReminderEnabled((value) => !value)} />
        <HeroZone story={heroStory} onCta={setActiveItem} />
      </div>

      <div
        className={styles.actionSheet}
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(250, 247, 242, 0.96)',
          backdropFilter: 'blur(24px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
          borderRadius: '28px 28px 0 0',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.88)',
          boxShadow: '0 -6px 32px rgba(75, 52, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.92)',
          marginTop: '-22px',
          padding: heroStory.kind === 'countdown' ? '20px 0 calc(112px + 48dvh)' : '20px 0 112px',
          minHeight: 'calc(34dvh + 22px)',
        }}
      >
        <div className={[
          heroStory.kind === 'countdown' ? styles.liftedSheetHeader : styles.sheetHeader,
          sheetLiftActive ? styles.liftedSheetHeaderActive : '',
        ].filter(Boolean).join(' ')}>
          {heroStory.kind === 'countdown' && <CountdownSheetLift item={heroStory.item} />}
          <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
        </div>
        <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clinicFollowUpItem && <ClinicUpdatePrompt item={clinicFollowUpItem} />}
          {!hasSelectedDaySchedule ? <EmptyState selectedDay={selectedDay} firstScheduleSkipped={firstScheduleSkipped} /> : (
            <>
              {mainItem && <ActionCard item={mainItem} onCta={setActiveItem} showCountdown={selectedDay === 0} />}
              {nextItem && <NextItem item={nextItem} />}
            </>
          )}
        </section>
      </div>

      <PostClinicBanner
        lastInjectionAt={postClinicBannerState.lastInjectionAt}
        hasNextSchedule={postClinicBannerState.hasNextSchedule}
      />
      {activeItem != null && confirmPortal != null
        ? createPortal(<ConfirmSheet item={activeItem} onComplete={handleComplete} onClose={() => setActiveItem(null)} />, confirmPortal)
        : null}
    </div>
  );
}

function resolvePostClinicBannerState(items: ScheduleItem[]) {
  const now = Date.now();
  const injections = items.filter((item) => item.type === 'injection');
  const pastInjections = injections
    .filter((item) => new Date(item.scheduled_at).getTime() < now)
    .sort((left, right) => new Date(right.scheduled_at).getTime() - new Date(left.scheduled_at).getTime());
  const hasNextSchedule = injections.some((item) => new Date(item.scheduled_at).getTime() > now);

  return {
    lastInjectionAt: pastInjections[0]?.scheduled_at ?? null,
    hasNextSchedule,
  };
}

function resolveNextInjection(primaryItem: ScheduleItem | null, items: ScheduleItem[]) {
  if (!primaryItem) return null;
  const primaryTime = new Date(primaryItem.scheduled_at).getTime();
  return items
    .filter((item) => item.type === 'injection' && item.id !== primaryItem.id && new Date(item.scheduled_at).getTime() > primaryTime)
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime())[0] ?? null;
}

function HeroZone({
  story,
  onCta,
}: {
  story: HeroStory;
  onCta: (item: ScheduleItem) => void;
}) {
  const asset = story.kind === 'overdue_backlog'
    ? slcAssets.home.missedRecovery
    : resolveHomeVisualAsset(story.focus.kind);
  const intensity = story.kind === 'overdue_backlog' ? 'subtle' : 'hero';
  const focusKind = story.kind === 'overdue_backlog' ? 'overdue_backlog' : story.focus.kind;

  return (
    <AmbientStoryBackground
      ariaLabel="오늘의 케어 상태"
      asset={asset}
      as="section"
      intensity={intensity}
      priority
      style={{
        flex: 1,
        minHeight: 0,
      }}
      contentStyle={{
        height: '100%',
      }}
    >
      <div data-testid="home-hero-zone" data-focus-kind={focusKind} style={{ height: '100%' }}>
        <div style={{ height: '100%', padding: '8px 20px 22px' }}>
          {story.kind === 'countdown' && <InjectionCountdownFocus item={story.item} nextInjection={story.nextInjection} onCta={onCta} />}
          {story.kind === 'overdue_backlog' && <OverdueBacklogHero missedCount={story.missedCount} todayCount={story.todayCount} clinicCount={story.clinicCount} />}
          {story.kind === 'today_pending' && <CompactHeroCard focus={story.focus} item={story.item} onCta={onCta} />}
          {story.kind === 'tomorrow' && <CompactHeroCard focus={story.focus} item={story.item} onCta={onCta} eyebrow="내일 일정" />}
          {story.kind === 'quiet' && <QuietHeroContent focus={story.focus} />}
        </div>
      </div>
    </AmbientStoryBackground>
  );
}

function resolveHeroStory(items: ScheduleItem[], focus: HomeFocus, selectedDay: DayOffset, initialClinicUpdates: ClinicUpdate[]): HeroStory {
  const pending = items
    .filter((item) => item.status !== 'completed')
    .slice()
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
  const countdown = selectedDay === 0
    ? pending.find((item) => item.type === 'injection' && isOnDay(item.scheduled_at, 0) && isInInjectionCountdownWindow(item.scheduled_at))
    : null;
  if (countdown) {
    return {
      kind: 'countdown',
      item: countdown,
      nextInjection: resolveNextInjection(countdown, items),
      focus: { ...focus, kind: 'medication_due', primaryItem: countdown },
    };
  }

  if (selectedDay === 0) {
    const missedItems = pending.filter(
      (item) => item.status === 'missed' || (
        isOnDay(item.scheduled_at, 0) &&
        new Date(item.scheduled_at).getTime() < Date.now() &&
        item.status !== 'completed'
      ),
    );
    if (missedItems.length > 0) {
      const todayCount = items.filter((item) => isOnDay(item.scheduled_at, 0) && item.status !== 'completed').length;
      return { kind: 'overdue_backlog', missedCount: missedItems.length, todayCount, clinicCount: initialClinicUpdates.length };
    }
  }

  const selectedFocusItem = focus.primaryItem && isOnDay(focus.primaryItem.scheduled_at, selectedDay)
    ? focus.primaryItem
    : null;
  const selectedPending = selectedFocusItem ?? pending.find((item) => isOnDay(item.scheduled_at, selectedDay));
  if (selectedPending) {
    const selectedFocus = selectedFocusItem ? focus : resolveHomeFocus([selectedPending]);
    return { kind: 'today_pending', item: selectedPending, focus: { ...selectedFocus, primaryItem: selectedPending } };
  }

  const hasCompletedToday = items.some((item) => item.status === 'completed' && isOnDay(item.scheduled_at, 0));
  const tomorrowPending = pending.find((item) => isOnDay(item.scheduled_at, 1));
  if (selectedDay === 0 && hasCompletedToday && tomorrowPending) {
    return {
      kind: 'tomorrow',
      item: tomorrowPending,
      focus: buildTomorrowFocus(tomorrowPending),
    };
  }

  return { kind: 'quiet', focus };
}

function buildTomorrowFocus(item: ScheduleItem): HomeFocus {
  const isClinic = item.type === 'clinic';
  return {
    kind: isClinic ? 'clinic_tomorrow' : 'medication_upcoming',
    badgeLabel: '내일',
    heading: '내일 준비되셨나요',
    description: `${formatScheduleTime(item.scheduled_at)} · ${isClinic ? '방문 시간만 미리 확인해요.' : '준비해두세요.'}`,
    primaryItem: item,
  };
}

function QuietHeroContent({ focus, paddingTop = 60 }: { focus: HomeFocus; paddingTop?: number }) {
  if (focus.kind === 'empty') {
    return (
      <div style={{ paddingTop }}>
        <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--slc-text)', lineHeight: 1.2, margin: '0 0 8px' }}>
          지금은 확인할 일정이 없어요
        </p>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.45, margin: '0 0 20px' }}>
          병원 안내가 바뀌었다면<br />일정을 업데이트해 주세요.
        </p>
        <Link href="/add" style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 999, background: 'var(--slc-coral-gradient)', color: '#fff', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
          일정 추가
        </Link>
      </div>
    );
  }
  return (
    <div style={{ paddingTop }}>
      <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--slc-text)', lineHeight: 1.2, margin: '0 0 8px' }}>
        {focus.heading}
      </p>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.45, margin: 0 }}>
        {focus.description}
      </p>
    </div>
  );
}

function OverdueBacklogHero({ missedCount, todayCount, clinicCount }: { missedCount: number; todayCount: number; clinicCount: number }) {
  return (
    <div style={{ height: '100%', display: 'grid', alignContent: 'center', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 6px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 900 }}>돌아오셨군요</p>
        <h2 style={{ margin: '0 0 8px', color: 'var(--slc-text)', fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.2 }}>
          지난 일정이 조금 쌓였어요
        </h2>
        <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.55 }}>
          괜찮아요. 중요한 일정부터 빠르게 정리하고<br />오늘부터 다시 이어가면 돼요.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {([['미기록', missedCount], ['오늘 일정', todayCount], ['병원 안내', clinicCount]] as const).map(([label, count]) => (
          <div key={label} style={{ borderRadius: 16, background: 'rgba(255,252,250,0.72)', border: '1px solid var(--slc-border)', padding: '10px 12px', display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--slc-muted)', fontWeight: 800 }}>{label}</span>
            <strong style={{ fontSize: 20, color: 'var(--slc-text)', fontWeight: 900, letterSpacing: '-0.04em' }}>{count}건</strong>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Link href="/records" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 999, background: 'var(--slc-text)', color: 'var(--slc-bg)', fontSize: 14, fontWeight: 900, textDecoration: 'none', width: 'fit-content' }}>
          3분만에 정리하기
        </Link>
        <Link href="/add" style={{ fontSize: 13, color: 'var(--slc-muted)', fontWeight: 700, textDecoration: 'none' }}>
          오늘부터 다시 시작 ›
        </Link>
      </div>
    </div>
  );
}

function CompactHeroCard({
  focus,
  item,
  onCta,
  eyebrow = '오늘 할 일',
}: {
  focus: HomeFocus;
  item: ScheduleItem;
  onCta: (item: ScheduleItem) => void;
  eyebrow?: string;
}) {
  return (
    <div data-testid="home-hero-compact-card" style={{ display: 'grid', gap: 16, paddingTop: 42 }}>
      <div>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>{eyebrow}</p>
        <QuietHeroContent focus={focus} paddingTop={0} />
      </div>
      <ActionCard item={item} onCta={onCta} compact showCountdown={false} />
    </div>
  );
}

function InjectionCountdownFocus({ item, nextInjection, onCta }: { item: ScheduleItem; nextInjection: ScheduleItem | null; onCta: (item: ScheduleItem) => void }) {
  const remaining = secondsUntilInjection(item.scheduled_at);
  const isDueNow = remaining <= 0;

  return (
    <section
      aria-label="주사 카운트다운"
      data-testid="injection-countdown-hero"
      style={{ height: '100%', padding: '0 0 2px' }}
    >
      <div style={countdownHeroCardStyle}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>{isDueNow ? '확인 필요' : '주사 준비'}</p>
          <strong style={{ color: 'var(--slc-text)', fontSize: 21, lineHeight: 1.18, letterSpacing: '-0.04em' }}>
            {isDueNow ? '예정 시간이 지났어요' : '천천히 준비하면 돼요'}
          </strong>
        </div>
        {isDueNow ? (
          <div style={dueNowPanelStyle}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>!</span>
            <span>완료 여부를 확인해 주세요.</span>
          </div>
        ) : (
          <>
            <InjectionCountdownArc totalSeconds={3600} remainingSeconds={remaining} size={196} />
            <div style={{ textAlign: 'center', marginTop: -36 }}>
              <p style={{ margin: '0 0 4px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>남은 시간</p>
              <strong suppressHydrationWarning style={{ color: 'var(--slc-text)', fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {formatRemainingClock(remaining)}
              </strong>
            </div>
          </>
        )}
        <CountdownInfoBlock item={item} nextInjection={nextInjection} />
        <button type="button" onClick={() => onCta(item)} style={heroCtaStyle}>{ctaLabel(item.type)}</button>
      </div>
    </section>
  );
}

function CountdownSheetLift({ item }: { item: ScheduleItem }) {
  const remaining = secondsUntilInjection(item.scheduled_at);
  return (
    <div
      aria-label="상단 메뉴와 함께 올라오는 주사 카운트다운"
      className={styles.countdownSheetLift}
      data-testid="countdown-sheet-lift"
    >
      <div className={styles.countdownSheetArc} data-testid="countdown-sheet-mini-arc">
        <InjectionCountdownArc totalSeconds={3600} remainingSeconds={remaining} size={108} />
      </div>
      <strong suppressHydrationWarning className={styles.countdownSheetTime}>
        {formatRemainingClock(remaining)}
      </strong>
    </div>
  );
}

function CountdownInfoBlock({ item, nextInjection }: { item: ScheduleItem; nextInjection: ScheduleItem | null }) {
  return (
    <div
      data-testid="countdown-info-block"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        background: 'var(--slc-surface)',
        border: '1px solid var(--slc-border)',
        overflow: 'hidden',
        marginTop: 2,
      }}
    >
      <CountdownInfoRow label="주사 시간" value={formatScheduleTime(item.scheduled_at)} href={`/schedule/${item.id}/edit`} />
      <CountdownInfoRow label="약물명" value={formatScheduleTitle(item)} href={`/schedule/${item.id}/edit`} />
      <CountdownInfoRow
        label="다음 주사"
        value={nextInjection ? `${formatScheduleTime(nextInjection.scheduled_at)} ${formatScheduleTitle(nextInjection)}` : '미정'}
        href={nextInjection ? `/schedule/${nextInjection.id}/edit` : '/add'}
      />
    </div>
  );
}

function CountdownInfoRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        minHeight: 48,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '82px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        color: 'var(--slc-text)',
        borderBottom: label === '다음 주사' ? 'none' : '1px solid var(--slc-border)',
        textDecoration: 'none',
      }}
    >
      <span style={{ color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>{label}</span>
      <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 900 }}>
        {value}
      </strong>
      <span aria-hidden="true" style={{ color: 'var(--slc-coral)', fontSize: 22, lineHeight: 1 }}>›</span>
    </Link>
  );
}

const countdownHeroCardStyle = {
  display: 'grid',
  justifyItems: 'center',
  alignContent: 'center',
  gap: 8,
  height: '100%',
  padding: '0 0 56px',
  borderRadius: 0,
  background: 'transparent',
  border: 'none',
  boxShadow: 'none',
  backdropFilter: 'none',
} as const;

const dueNowPanelStyle = {
  width: '100%',
  minHeight: 112,
  display: 'grid',
  placeItems: 'center',
  gap: 8,
  borderRadius: 24,
  background: 'linear-gradient(180deg, #FFF7F3 0%, #FFFDFC 100%)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-coral)',
  fontSize: 14,
  fontWeight: 900,
} as const;

const heroCtaStyle = {
  width: '100%',
  minHeight: 52,
  border: 'none',
  borderRadius: 999,
  background: 'var(--slc-coral-gradient)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 900,
  fontFamily: 'inherit',
  cursor: 'pointer',
  marginTop: 2,
} as const;

function Header({ reminderEnabled, onToggleReminder }: { reminderEnabled: boolean; onToggleReminder: () => void }) {
  const today = new Date();
  const ReminderIcon = reminderEnabled ? Bell : BellOff;
  return (
    <header style={{ padding: '54px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', fontWeight: 600, margin: '0 0 4px' }}>
          {formatKstDateLabel(today)}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--slc-text)', margin: 0 }}>오늘</h1>
      </div>
      <button
        type="button"
        aria-pressed={reminderEnabled}
        aria-label={reminderEnabled ? '홈 알림 끄기' : '홈 알림 켜기'}
        data-reminder-state={reminderEnabled ? 'on' : 'off'}
        data-testid="home-reminder-toggle"
        onClick={onToggleReminder}
        style={reminderToggleStyle(reminderEnabled)}
      >
        <ReminderIcon aria-hidden="true" size={20} strokeWidth={2.35} />
        <span aria-hidden="true" style={reminderToggleDotStyle(reminderEnabled)} />
      </button>
    </header>
  );
}

function DayTabs({ selectedDay, onSelect }: { selectedDay: DayOffset; onSelect: (day: DayOffset) => void }) {
  return (
    <nav aria-label="일정 날짜" style={{ display: 'flex', gap: 8, padding: '0 24px 16px' }}>
      {DAY_LABELS.map((label, index) => (
        <button key={label} type="button" onClick={() => onSelect(index as DayOffset)} style={tabStyle(selectedDay === index)}>{label}</button>
      ))}
    </nav>
  );
}

function EmptyState({ selectedDay, firstScheduleSkipped }: { selectedDay: DayOffset; firstScheduleSkipped: boolean }) {
  const asset = firstScheduleSkipped ? slcAssets.empty.medication : slcAssets.empty.cycle;
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <SLCIllustration asset={asset} size="empty" style={{ opacity: 0.86, marginBottom: 12 }} />
      <p style={{ color: 'var(--slc-text)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px' }}>{DAY_LABELS[selectedDay]}은 비어 있어요</p>
      <p style={{ color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{SLC_SAFE_COPY.noSchedule}</p>
      <Link href="/add" style={emptyLinkStyle}>추가하기</Link>
    </div>
  );
}

function NextItem({ item }: { item: ScheduleItem }) {
  return (
    <section aria-label="다음 일정">
      <p style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 800, padding: '4px 8px', margin: '0 0 6px' }}>다음</p>
      <ScheduleFlowRow item={item} statusLabel="예정" />
    </section>
  );
}

function ScheduleFlowRow({ item, statusLabel }: { item: ScheduleItem; statusLabel: '예정' | '완료' }) {
  const timeStr = formatScheduleTime(item.scheduled_at);
  return (
    <div data-card-emphasis="secondary" data-home-flow-row={item.type} style={{ minHeight: 62, display: 'grid', gridTemplateColumns: '54px 1fr auto auto', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 18, background: 'var(--slc-surface)', border: '1px solid var(--slc-border)' }}>
      <span style={{ color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 }}>{timeStr}</span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', color: 'var(--slc-text)', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatScheduleRowTitle(item)}</strong>
        <small style={{ display: 'block', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{scheduleTypeLabel(item.type)}</small>
      </span>
      <span style={{ padding: '5px 10px', borderRadius: 999, background: statusLabel === '완료' ? '#EEF5EF' : 'var(--slc-border)', color: statusLabel === '완료' ? 'var(--slc-success)' : 'var(--slc-muted)', fontSize: 11, fontWeight: 900 }}>{statusLabel}</span>
      <Link href={`/schedule/${item.id}/edit`} aria-label={`${formatScheduleRowTitle(item)} 수정`} style={{ color: 'var(--slc-coral)', fontSize: 22, lineHeight: 1, fontWeight: 900, textDecoration: 'none' }}>›</Link>
    </div>
  );
}

function formatScheduleRowTitle(item: ScheduleItem) {
  const suffix = item.dose && item.unit ? `${item.dose} ${item.unit}` : '';
  if (!suffix || item.title.includes(suffix)) return item.title;
  return `${item.title} ${suffix}`;
}

function formatScheduleTitle(item: ScheduleItem) {
  return formatScheduleRowTitle(item).replace(/^\d{1,2}:\d{2}\s*/u, '').trim();
}

function formatScheduleTime(scheduledAt: string) {
  return formatKstTime(scheduledAt);
}

function formatRemainingClock(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function scheduleTypeLabel(type: ScheduleItem['type']) {
  if (type === 'clinic') return '병원 방문';
  if (type === 'medication') return '복용';
  return '주사';
}

function ClinicUpdatePrompt({ item }: { item: ScheduleItem }) {
  const timeStr = formatScheduleTime(item.scheduled_at);

  return (
    <div data-testid="clinic-follow-up-prompt" style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 12, alignItems: 'center', padding: '16px 18px', background: 'var(--slc-surface)', borderRadius: 20, border: '1.5px solid var(--slc-border)', overflow: 'hidden' }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 800, margin: '0 0 6px' }}>{timeStr} 병원</p>
        <p style={{ fontSize: 18, color: 'var(--slc-text)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px' }}>바뀐 게 있나요?</p>
        <Link href="/clinic-update" style={{ fontSize: 14, color: 'var(--slc-coral)', fontWeight: 900, textDecoration: 'none' }}>업데이트</Link>
      </div>
      <SLCIllustration asset={slcAssets.home.waiting} size="banner" style={{ width: 92, height: 68, maxHeight: 68, justifySelf: 'end', opacity: 0.9 }} />
    </div>
  );
}

function isOnDay(iso: string, offset: DayOffset) {
  return isInKstDay(iso, offset);
}

function reminderToggleStyle(enabled: boolean) {
  return {
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: 999,
    background: enabled ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--slc-coral-light))' : 'rgba(255, 255, 255, 0.74)',
    border: enabled ? '1px solid rgba(196, 97, 74, 0.28)' : '1px solid var(--slc-border)',
    boxShadow: enabled ? '0 12px 28px rgba(196, 97, 74, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)' : '0 10px 24px rgba(42, 31, 26, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.86)',
    display: 'inline-grid',
    placeItems: 'center',
    color: enabled ? 'var(--slc-coral)' : 'var(--slc-muted)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    position: 'relative',
    backdropFilter: 'blur(14px)',
  } as const;
}

function reminderToggleDotStyle(enabled: boolean) {
  return {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: enabled ? 'var(--slc-coral)' : 'var(--slc-muted)',
    border: '1.5px solid #fff',
    boxShadow: enabled ? '0 0 0 3px rgba(196, 97, 74, 0.12)' : 'none',
  } as const;
}

const emptyLinkStyle = {
  display: 'inline-block', marginTop: 16, padding: '12px 24px', background: 'var(--slc-coral-gradient)', color: 'var(--slc-bg)',
  borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 800,
} as const;

function tabStyle(active: boolean) {
  return {
    minHeight: 44, padding: '10px 16px', borderRadius: 999, background: active ? 'var(--slc-coral)' : 'var(--slc-border)',
    color: active ? 'var(--slc-bg)' : 'var(--slc-muted)', border: 'none', fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  } as const;
}
