'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionCard } from '../../components/action-card';
import { ConfirmSheet } from '../../components/confirm-sheet';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';
import type { ClinicUpdate, InjectionSite, PartnerLink, ScheduleItem } from '../../types/slc.types';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { resolveClinicFollowUpPrompt } from '../../domain/slc-clinic-followup';
import { getHomePendingItems, resolveHomeFocus, resolveHomeVisualAsset, type HomeFocus } from '../../domain/slc-home-focus';

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
    <div style={{ minHeight: '100dvh', padding: '0 0 112px', background: 'var(--slc-bg)' }}>
      <Header />
      {selectedDay === 0 && <AmbientBg focus={homeFocus} />}
      <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

function AmbientBg({ focus }: { focus: HomeFocus }) {
  const asset = resolveHomeVisualAsset(focus.kind);
  return (
    <div aria-hidden style={{ position: 'relative', height: 92, overflow: 'hidden', marginBottom: -8 }}>
      <SLCIllustration
        asset={asset}
        size="banner"
        priority
        style={{ height: '100%', width: '100%', maxHeight: 'none', borderRadius: 0, objectFit: 'cover', opacity: 0.78 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255, 251, 248, 0.16) 0%, var(--slc-bg) 96%)' }} />
    </div>
  );
}

function FocusHero({ focus }: { focus: HomeFocus }) {
  const warmFocus = focus.kind === 'missed' || focus.kind.startsWith('clinic');
  return (
    <section
      aria-label="홈 핵심 상태"
      data-testid="home-focus-hero"
      data-focus-kind={focus.kind}
      style={{
        padding: '18px 18px 20px',
        background: 'var(--slc-card)',
        borderRadius: 24,
        border: warmFocus ? '1.5px solid #F4D4C8' : '1.5px solid #EFE7E0',
        boxShadow: '0 8px 28px rgba(80, 50, 40, 0.065)',
      }}
    >
      <p style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: 999, background: warmFocus ? 'var(--slc-coral-light)' : '#F8F4F0', color: warmFocus ? 'var(--slc-coral)' : 'var(--slc-muted)', fontSize: 12, fontWeight: 900, lineHeight: 1, margin: '0 0 10px' }}>
        {focus.badgeLabel}
      </p>
      <h2 style={{ fontSize: 24, color: 'var(--slc-text)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.2, margin: '0 0 8px' }}>
        {focus.heading}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.45, margin: 0 }}>
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
        <button type="button" onClick={onApprove} style={{ minHeight: 44, padding: '10px 16px', background: 'var(--slc-coral)', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>승인하기</button>
        <button type="button" onClick={onReject} style={{ minHeight: 44, padding: '10px 16px', background: 'var(--slc-border)', color: 'var(--slc-muted)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>나중에</button>
      </div>
    </div>
  );
}

function Header() {
  const today = new Date();
  return (
    <header style={{ padding: '54px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: '#B5A89E', fontWeight: 600, margin: '0 0 4px' }}>
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

function EmptyState({ selectedDay }: { selectedDay: DayOffset }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <SLCIllustration asset={slcAssets.empty.cycle} size="empty" style={{ opacity: 0.86, marginBottom: 12 }} />
      <p style={{ color: 'var(--slc-text)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px' }}>{DAY_LABELS[selectedDay]}은 비어 있어요</p>
      <p style={{ color: '#B5A89E', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{SLC_SAFE_COPY.noSchedule}</p>
      <Link href="/add" style={emptyLinkStyle}>추가하기</Link>
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
      <span style={{ color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 }}>{timeStr}</span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', color: 'var(--slc-text)', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatScheduleRowTitle(item)}</strong>
        <small style={{ display: 'block', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{scheduleTypeLabel(item.type)}</small>
      </span>
      <span style={{ padding: '5px 10px', borderRadius: 999, background: statusLabel === '완료' ? 'var(--slc-coral-light)' : 'var(--slc-border)', color: statusLabel === '완료' ? 'var(--slc-coral)' : 'var(--slc-muted)', fontSize: 11, fontWeight: 900 }}>{statusLabel}</span>
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
    <div data-testid="clinic-follow-up-prompt" style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 12, alignItems: 'center', padding: '16px 18px', background: '#FFF8F5', borderRadius: 20, border: '1.5px solid #F4D4C8', overflow: 'hidden' }}>
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
