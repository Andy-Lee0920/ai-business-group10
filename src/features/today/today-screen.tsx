'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

interface TodayScreenProps {
  initialItems: ScheduleItem[];
  userId: string;
  initialClinicUpdates?: ClinicUpdate[];
  firstScheduleSkipped?: boolean;
}

type DayOffset = 0 | 1 | 2;
type HeroStory =
  | { kind: 'countdown'; item: ScheduleItem; nextInjection: ScheduleItem | null; focus: HomeFocus }
  | { kind: 'today_pending'; item: ScheduleItem; focus: HomeFocus }
  | { kind: 'tomorrow'; item: ScheduleItem; focus: HomeFocus }
  | { kind: 'quiet'; focus: HomeFocus };

const DAY_LABELS = ['오늘', '내일', '모레'] as const;

export function TodayScreen({
  initialItems,
  userId: _userId,
  initialClinicUpdates = [],
  firstScheduleSkipped = false,
}: TodayScreenProps) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);

  useEffect(() => {
    const id = setInterval(() => setItems((prev) => [...prev]), 1_000);
    return () => clearInterval(id);
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => isOnDay(item.scheduled_at, selectedDay)),
    [items, selectedDay],
  );

  const homeFocus = useMemo(() => resolveHomeFocus(visibleItems), [visibleItems]);
  const heroStory = useMemo(
    () => resolveHeroStory(selectedDay === 0 ? items : visibleItems, homeFocus, selectedDay),
    [items, visibleItems, homeFocus, selectedDay],
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
    <div style={{ minHeight: '100dvh', padding: '0 0 112px', background: 'var(--slc-bg)' }}>
      <Header />
      <HeroZone story={heroStory} onCta={setActiveItem} />
      <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clinicFollowUpItem && <ClinicUpdatePrompt item={clinicFollowUpItem} />}
        {!hasSelectedDaySchedule ? <EmptyState selectedDay={selectedDay} firstScheduleSkipped={firstScheduleSkipped} /> : (
          <>
            {mainItem && <ActionCard item={mainItem} onCta={setActiveItem} showCountdown={selectedDay === 0} />}
            {nextItem && <NextItem item={nextItem} />}
          </>
        )}
      </section>
      <PostClinicBanner
        lastInjectionAt={postClinicBannerState.lastInjectionAt}
        hasNextSchedule={postClinicBannerState.hasNextSchedule}
      />
      {activeItem && <ConfirmSheet item={activeItem} onComplete={handleComplete} onClose={() => setActiveItem(null)} />}
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
  const asset = resolveHomeVisualAsset(story.focus.kind);

  return (
    <AmbientStoryBackground
      ariaLabel="오늘의 케어 상태"
      asset={asset}
      as="section"
      intensity="hero"
      priority
      style={{
        marginBottom: 16,
        borderLeft: story.focus.kind === 'missed' ? '3px solid var(--slc-coral)' : undefined,
      }}
    >
      <div data-testid="home-hero-zone" data-focus-kind={story.focus.kind} style={{ minHeight: 340 }}>
        <div style={{ padding: '24px 20px 28px' }}>
          {story.kind === 'countdown' && <InjectionCountdownFocus item={story.item} nextInjection={story.nextInjection} onCta={onCta} />}
          {story.kind === 'today_pending' && <CompactHeroCard focus={story.focus} item={story.item} onCta={onCta} />}
          {story.kind === 'tomorrow' && <CompactHeroCard focus={story.focus} item={story.item} onCta={onCta} eyebrow="내일 일정" />}
          {story.kind === 'quiet' && <QuietHeroContent focus={story.focus} />}
        </div>
      </div>
    </AmbientStoryBackground>
  );
}

function resolveHeroStory(items: ScheduleItem[], focus: HomeFocus, selectedDay: DayOffset): HeroStory {
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
    heading: isClinic ? '내일 병원이에요' : '내일 투약이에요',
    description: `${formatScheduleTime(item.scheduled_at)} · ${isClinic ? '방문 시간만 미리 확인해요.' : '준비해두세요.'}`,
    primaryItem: item,
  };
}

function QuietHeroContent({ focus, paddingTop = 60 }: { focus: HomeFocus; paddingTop?: number }) {
  return (
    <div style={{ paddingTop }}>
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'var(--slc-text)',
          lineHeight: 1.2,
          margin: '0 0 8px',
        }}
      >
        {focus.heading}
      </p>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.45, margin: 0 }}>
        {focus.description}
      </p>
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
  return (
    <section
      aria-label="주사 카운트다운"
      data-testid="injection-countdown-hero"
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 10,
        paddingTop: 8,
      }}
    >
      <InjectionCountdownArc totalSeconds={3600} remainingSeconds={remaining} />
      <div style={{ textAlign: 'center', marginTop: -42 }}>
        <p style={{ margin: '0 0 4px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>남은 시간</p>
        <strong style={{ color: 'var(--slc-text)', fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {formatRemainingClock(remaining)}
        </strong>
      </div>
      <CountdownInfoBlock item={item} nextInjection={nextInjection} />
      <button type="button" onClick={() => onCta(item)} style={heroCtaStyle}>{ctaLabel(item.type)}</button>
    </section>
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
        marginTop: 8,
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

const heroCtaStyle = {
  width: '100%',
  minHeight: 52,
  border: 'none',
  borderRadius: 999,
  background: 'var(--slc-coral)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 900,
  fontFamily: 'inherit',
  cursor: 'pointer',
  marginTop: 2,
} as const;

function Header() {
  const today = new Date();
  return (
    <header style={{ padding: '54px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', fontWeight: 600, margin: '0 0 4px' }}>
          {formatKstDateLabel(today)}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--slc-text)', margin: 0 }}>오늘</h1>
      </div>
      <Link href="/add" aria-label="일정 추가" style={addButtonStyle}>+</Link>
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
      <Link href={`/schedule/${item.id}/edit`} aria-label={`${formatScheduleRowTitle(item)} 수정`} style={{ color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>수정</Link>
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
      <SLCIllustration asset={slcAssets.clinic.updateBanner} size="banner" style={{ width: 92, height: 68, maxHeight: 68, justifySelf: 'end', opacity: 0.9 }} />
    </div>
  );
}

function isOnDay(iso: string, offset: DayOffset) {
  return isInKstDay(iso, offset);
}

const addButtonStyle = {
  width: 44, height: 44, borderRadius: '50%', background: 'var(--slc-coral-light)', border: '1.5px solid var(--slc-border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slc-coral)', fontSize: 22,
  textDecoration: 'none', fontWeight: 500,
} as const;

const emptyLinkStyle = {
  display: 'inline-block', marginTop: 16, padding: '12px 24px', background: 'var(--slc-coral)', color: 'var(--slc-bg)',
  borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 800,
} as const;

function tabStyle(active: boolean) {
  return {
    minHeight: 44, padding: '10px 16px', borderRadius: 999, background: active ? 'var(--slc-coral)' : 'var(--slc-border)',
    color: active ? 'var(--slc-bg)' : 'var(--slc-muted)', border: 'none', fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  } as const;
}
