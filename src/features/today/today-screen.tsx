'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionCard } from '../../components/action-card';
import { ConfirmSheet } from '../../components/confirm-sheet';
import type { ClinicUpdate, InjectionSite, PartnerLink, ScheduleItem } from '../../types/slc.types';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { resolveClinicFollowUpPrompt } from '../../domain/slc-clinic-followup';
import { getHomePendingItems, resolveHomeFocus, type HomeFocus } from '../../domain/slc-home-focus';

interface TodayScreenProps {
  initialItems: ScheduleItem[];
  userId: string;
  pendingPartnerRequest?: PartnerLink | null;
  initialClinicUpdates?: ClinicUpdate[];
}

type DayOffset = 0 | 1 | 2;

const DAY_LABELS = ['오늘', '내일', '모레'] as const;

export function TodayScreen({
  initialItems,
  userId: _userId,
  pendingPartnerRequest: initialPendingPartnerRequest = null,
  initialClinicUpdates = [],
}: TodayScreenProps) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);
  const [pendingPartnerRequest, setPendingPartnerRequest] = useState<PartnerLink | null>(initialPendingPartnerRequest);

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

  const handlePartnerRequest = useCallback(async (action: 'approve' | 'reject') => {
    if (!pendingPartnerRequest) return;
    const linkId = pendingPartnerRequest.id;
    setPendingPartnerRequest(null);
    const response = await fetch('/api/partner/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId, action }),
    });
    if (!response.ok) setPendingPartnerRequest(pendingPartnerRequest);
  }, [pendingPartnerRequest]);

  return (
    <div style={{ minHeight: '100dvh', padding: '0 0 16px', background: 'var(--slc-bg)' }}>
      <Header />
      <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pendingPartnerRequest && (
          <PartnerRequestCard
            request={pendingPartnerRequest}
            onApprove={() => handlePartnerRequest('approve')}
            onReject={() => handlePartnerRequest('reject')}
          />
        )}
        {clinicFollowUpItem && <ClinicUpdatePrompt item={clinicFollowUpItem} />}
        <FocusHero focus={homeFocus} />
        {pending.length === 0 && visibleItems.length === 0 ? <EmptyState selectedDay={selectedDay} /> : (
          <>
            {mainItem && <ActionCard item={mainItem} onCta={setActiveItem} showCountdown={selectedDay === 0} />}
            {nextItem && <NextItem item={nextItem} />}
            {completed.length > 0 && <CompletedList items={completed} />}
          </>
        )}
      </section>
      {activeItem && <ConfirmSheet item={activeItem} onComplete={handleComplete} onClose={() => setActiveItem(null)} />}
    </div>
  );
}

function FocusHero({ focus }: { focus: HomeFocus }) {
  return (
    <section
      aria-label="홈 핵심 상태"
      data-testid="home-focus-hero"
      data-focus-kind={focus.kind}
      style={{
        padding: '18px 20px',
        background: focus.kind.startsWith('clinic') ? '#FFF8F5' : '#FFFFFF',
        borderRadius: 24,
        border: focus.kind.startsWith('clinic') ? '1.5px solid #F4D4C8' : '1.5px solid #EFE7E0',
        boxShadow: '0 4px 24px rgba(80, 50, 40, 0.07)',
      }}
    >
      <p style={{ fontSize: 12, color: focus.kind.startsWith('clinic') ? 'var(--slc-coral)' : 'var(--slc-muted)', fontWeight: 900, margin: '0 0 8px' }}>
        {focus.badgeLabel}
      </p>
      <h2 style={{ fontSize: 21, color: 'var(--slc-text)', fontWeight: 900, lineHeight: 1.25, margin: '0 0 8px' }}>
        {focus.heading}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.5, margin: 0 }}>
        {focus.description}
      </p>
    </section>
  );
}

function PartnerRequestCard({ request, onApprove, onReject }: { request: PartnerLink; onApprove: () => void; onReject: () => void }) {
  const displayName = request.partner_profile?.display_name?.trim() || '파트너';

  return (
    <div data-testid="pending-partner-request-card" style={{ padding: '16px 20px', background: '#FFF8F5', borderRadius: 18, border: '1.5px solid #F4D4C8' }}>
      <p style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 800, margin: '0 0 6px' }}>파트너 연결 요청</p>
      <p style={{ fontSize: 16, color: 'var(--slc-text)', fontWeight: 900, margin: '0 0 6px' }}>파트너 연결 요청이 있어요</p>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>{displayName} 님이 일정 읽기 권한을 요청했어요.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onApprove} style={{ minHeight: 44, padding: '10px 16px', background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>승인하기</button>
        <button type="button" onClick={onReject} style={{ minHeight: 44, padding: '10px 16px', background: '#F0EDE8', color: '#9B8E86', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>나중에</button>
      </div>
    </div>
  );
}

function Header() {
  const today = new Date();
  return (
    <header style={{ padding: '60px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: '#B5A89E', fontWeight: 600, margin: '0 0 4px' }}>
          {today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--slc-text)', margin: 0 }}>오늘 일정</h1>
      </div>
      <Link href="/add" aria-label="일정 추가" style={addButtonStyle}>+</Link>
    </header>
  );
}

function DayTabs({ selectedDay, onSelect }: { selectedDay: DayOffset; onSelect: (day: DayOffset) => void }) {
  return (
    <nav aria-label="일정 날짜" style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
      {DAY_LABELS.map((label, index) => (
        <button key={label} type="button" onClick={() => onSelect(index as DayOffset)} style={tabStyle(selectedDay === index)}>{label}</button>
      ))}
    </nav>
  );
}

function EmptyState({ selectedDay }: { selectedDay: DayOffset }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ color: '#B5A89E', fontSize: 15 }}>{DAY_LABELS[selectedDay]} {SLC_SAFE_COPY.noSchedule}</p>
      <Link href="/add" style={emptyLinkStyle}>일정 추가</Link>
    </div>
  );
}

function NextItem({ item }: { item: ScheduleItem }) {
  return (
    <section aria-label="다음 일정">
      <p style={{ fontSize: 12, color: '#C4A898', fontWeight: 800, padding: '4px 8px', margin: '0 0 6px' }}>다음</p>
      <ScheduleFlowRow item={item} statusLabel="예정" />
    </section>
  );
}

function CompletedList({ items }: { items: ScheduleItem[] }) {
  return (
    <section aria-label="최근 완료">
      <p style={{ fontSize: 12, color: '#C4A898', fontWeight: 800, padding: '4px 8px', margin: '0 0 6px' }}>최근 완료</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => <ScheduleFlowRow key={item.id} item={item} statusLabel="완료" />)}
      </div>
    </section>
  );
}

function ScheduleFlowRow({ item, statusLabel }: { item: ScheduleItem; statusLabel: '예정' | '완료' }) {
  const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <div data-card-emphasis="secondary" data-home-flow-row={item.type} style={{ minHeight: 62, display: 'grid', gridTemplateColumns: '54px 1fr auto', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: '#FFFBF8', border: '1px solid rgba(240, 237, 232, 0.95)' }}>
      <span style={{ color: '#2A1F1A', fontSize: 14, fontWeight: 900 }}>{timeStr}</span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', color: '#2A1F1A', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatScheduleRowTitle(item)}</strong>
        <small style={{ display: 'block', color: '#9B8E86', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{scheduleTypeLabel(item.type)}</small>
      </span>
      <span style={{ padding: '5px 10px', borderRadius: 999, background: statusLabel === '완료' ? '#FFF0EB' : '#F0EDE8', color: statusLabel === '완료' ? '#C4614A' : '#9B8E86', fontSize: 11, fontWeight: 900 }}>{statusLabel}</span>
    </div>
  );
}

function formatScheduleRowTitle(item: ScheduleItem) {
  const suffix = item.dose && item.unit ? `${item.dose} ${item.unit}` : '';
  if (!suffix || item.title.includes(suffix)) return item.title;
  return `${item.title} ${suffix}`;
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
    <div data-testid="clinic-follow-up-prompt" style={{ padding: '16px 20px', background: '#FFF8F5', borderRadius: 18, border: '1.5px solid #F4D4C8' }}>
      <p style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 700, margin: '0 0 6px' }}>오늘 {timeStr} 병원 일정</p>
      <p style={{ fontSize: 16, color: 'var(--slc-text)', fontWeight: 900, margin: '0 0 6px' }}>병원 다녀오셨나요?</p>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>바뀐 내용만 간단히 반영해요.</p>
      <Link href="/clinic-update" style={{ fontSize: 14, color: 'var(--slc-coral)', fontWeight: 800, textDecoration: 'none' }}>업데이트하기 →</Link>
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
  width: 44, height: 44, borderRadius: '50%', background: 'var(--slc-coral-light)', border: '1.5px solid #F4D4C8',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slc-coral)', fontSize: 22,
  textDecoration: 'none', fontWeight: 500,
} as const;

const emptyLinkStyle = {
  display: 'inline-block', marginTop: 16, padding: '12px 24px', background: 'var(--slc-coral)', color: '#fff',
  borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 800,
} as const;

function tabStyle(active: boolean) {
  return {
    minHeight: 44, padding: '10px 16px', borderRadius: 999, background: active ? 'var(--slc-coral)' : 'var(--slc-border)',
    color: active ? '#fff' : 'var(--slc-muted)', border: 'none', fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  } as const;
}
