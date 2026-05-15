'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionCard } from '../../components/action-card';
import { ConfirmSheet } from '../../components/confirm-sheet';
import { InjectionCountdownArc } from '../../components/injection-countdown-arc';
import { PostClinicBanner } from '../../components/post-clinic-banner';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';
import type { ClinicUpdate, InjectionSite, ScheduleItem } from '../../types/slc.types';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { resolveClinicFollowUpPrompt } from '../../domain/slc-clinic-followup';
import { getHomePendingItems, resolveHomeFocus, resolveHomeVisualAsset, type HomeFocus } from '../../domain/slc-home-focus';
import { isInInjectionCountdownWindow, minutesUntilInjection } from '../adaptive-home/injection-timing';

interface TodayScreenProps {
  initialItems: ScheduleItem[];
  userId: string;
  initialClinicUpdates?: ClinicUpdate[];
  firstScheduleSkipped?: boolean;
}

type DayOffset = 0 | 1 | 2;

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
    const id = setInterval(() => setItems((prev) => [...prev]), 30_000);
    return () => clearInterval(id);
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => isOnDay(item.scheduled_at, selectedDay)),
    [items, selectedDay],
  );

  const focusItems = selectedDay === 0 ? items : visibleItems;
  const homeFocus = useMemo(() => resolveHomeFocus(focusItems), [focusItems]);
  const pending = useMemo(() => getHomePendingItems(focusItems), [focusItems]);
  const clinicFollowUpItem = useMemo(
    () => selectedDay === 0 ? resolveClinicFollowUpPrompt(visibleItems, initialClinicUpdates) : null,
    [selectedDay, visibleItems, initialClinicUpdates],
  );
  const completed = visibleItems.filter((item) => item.status === 'completed');
  const cardItems = clinicFollowUpItem ? pending.filter((item) => item.id !== clinicFollowUpItem.id) : pending;
  const mainItem = cardItems[0];
  const nextItem = cardItems[1];
  const nextInjection = useMemo(
    () => resolveNextInjection(homeFocus.primaryItem, items),
    [homeFocus.primaryItem, items],
  );
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
      <HeroZone focus={homeFocus} nextInjection={nextInjection} />
      <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clinicFollowUpItem && <ClinicUpdatePrompt item={clinicFollowUpItem} />}
        {pending.length === 0 && visibleItems.length === 0 ? <EmptyState selectedDay={selectedDay} firstScheduleSkipped={firstScheduleSkipped} /> : (
          <>
            {mainItem && <ActionCard item={mainItem} onCta={setActiveItem} showCountdown={selectedDay === 0} />}
            {nextItem && <NextItem item={nextItem} />}
            {completed.length > 0 && <CompletedList items={completed} />}
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

function HeroZone({ focus, nextInjection }: { focus: HomeFocus; nextInjection: ScheduleItem | null }) {
  const asset = resolveHomeVisualAsset(focus.kind);
  const inWindow = focus.primaryItem?.type === 'injection'
    && isInInjectionCountdownWindow(focus.primaryItem.scheduled_at);

  return (
    <section
      aria-label="오늘의 케어 상태"
      data-testid="home-hero-zone"
      data-focus-kind={focus.kind}
      style={{ position: 'relative', minHeight: 340, overflow: 'hidden', marginBottom: 16 }}
    >
      <SLCIllustration
        asset={asset}
        size="banner"
        priority
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          maxHeight: 'none',
          borderRadius: 0,
          objectFit: 'cover',
          opacity: 0.82,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, var(--slc-bg) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px 28px' }}>
        {inWindow
          ? <InjectionCountdownFocus item={focus.primaryItem!} nextInjection={nextInjection} />
          : <QuietHeroContent focus={focus} />}
      </div>
    </section>
  );
}

function QuietHeroContent({ focus }: { focus: HomeFocus }) {
  return (
    <div style={{ paddingTop: 60 }}>
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

function InjectionCountdownFocus({ item, nextInjection }: { item: ScheduleItem; nextInjection: ScheduleItem | null }) {
  const remaining = minutesUntilInjection(item.scheduled_at);
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
      <InjectionCountdownArc totalMinutes={60} remainingMinutes={remaining} />
      <div style={{ textAlign: 'center', marginTop: -42 }}>
        <p style={{ margin: '0 0 4px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 800 }}>남은 시간</p>
        <strong style={{ color: 'var(--slc-text)', fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {formatRemainingClock(remaining)}
        </strong>
      </div>
      <div style={{ width: '100%', display: 'grid', gap: 8, marginTop: 8 }}>
        <CountdownInfoRow label="주사 시간" value={formatScheduleTime(item.scheduled_at)} href={`/schedule/${item.id}/edit`} />
        <CountdownInfoRow label="약물명" value={formatScheduleTitle(item)} href={`/schedule/${item.id}/edit`} />
        <CountdownInfoRow
          label="다음 주사"
          value={nextInjection ? `${formatScheduleTime(nextInjection.scheduled_at)} ${formatScheduleTitle(nextInjection)}` : '미정'}
          href={nextInjection ? `/schedule/${nextInjection.id}/edit` : '/add'}
        />
      </div>
    </section>
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
    </Link>
  );
}

function Header() {
  const today = new Date();
  return (
    <header style={{ padding: '54px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', fontWeight: 600, margin: '0 0 4px' }}>
          {today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
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

function CompletedList({ items }: { items: ScheduleItem[] }) {
  return (
    <section aria-label="최근 완료">
      <p style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 800, padding: '4px 8px', margin: '0 0 6px' }}>최근 완료</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => <ScheduleFlowRow key={item.id} item={item} statusLabel="완료" />)}
      </div>
    </section>
  );
}

function ScheduleFlowRow({ item, statusLabel }: { item: ScheduleItem; statusLabel: '예정' | '완료' }) {
  const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <div data-card-emphasis="secondary" data-home-flow-row={item.type} style={{ minHeight: 62, display: 'grid', gridTemplateColumns: '54px 1fr auto auto', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 18, background: 'var(--slc-surface)', border: '1px solid var(--slc-border)' }}>
      <span style={{ color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 }}>{timeStr}</span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', color: 'var(--slc-text)', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatScheduleRowTitle(item)}</strong>
        <small style={{ display: 'block', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{scheduleTypeLabel(item.type)}</small>
      </span>
      <span style={{ padding: '5px 10px', borderRadius: 999, background: statusLabel === '완료' ? 'var(--slc-coral-light)' : 'var(--slc-border)', color: statusLabel === '완료' ? 'var(--slc-coral)' : 'var(--slc-muted)', fontSize: 11, fontWeight: 900 }}>{statusLabel}</span>
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
  return new Date(scheduledAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatRemainingClock(minutes: number) {
  const clamped = Math.max(0, minutes);
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function scheduleTypeLabel(type: ScheduleItem['type']) {
  if (type === 'clinic') return '병원 방문';
  if (type === 'medication') return '복용';
  return '주사';
}

function ClinicUpdatePrompt({ item }: { item: ScheduleItem }) {
  const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

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
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + offset);
  const value = new Date(iso);
  return value >= target && value < new Date(target.getTime() + 24 * 60 * 60_000);
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
