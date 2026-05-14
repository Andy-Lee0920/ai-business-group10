'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionCard } from '../../components/action-card';
import { ConfirmSheet } from '../../components/confirm-sheet';
import type { InjectionSite, ScheduleItem } from '../../types/slc.types';
import { computeStatus } from '../../types/slc.types';

interface TodayScreenProps {
  initialItems: ScheduleItem[];
  userId: string;
}

type DayOffset = 0 | 1 | 2;

const DAY_LABELS = ['오늘', '내일', '모레'] as const;

export function TodayScreen({ initialItems, userId: _userId }: TodayScreenProps) {
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

  const pending = visibleItems.filter((item) => item.status !== 'completed' && computeStatus(item.scheduled_at) !== 'completed');
  const completed = visibleItems.filter((item) => item.status === 'completed');
  const mainItem = pending[0];
  const nextItem = pending[1];

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
    <div style={{ minHeight: '100dvh', padding: '0 0 16px', background: 'var(--slc-bg)' }}>
      <Header />
      <DayTabs selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleItems.length === 0 ? <EmptyState selectedDay={selectedDay} /> : (
          <>
            {mainItem && <ActionCard item={mainItem} onCta={setActiveItem} showCountdown={selectedDay === 0} />}
            {nextItem && <NextItem item={nextItem} onCta={setActiveItem} />}
            {completed.map((item) => <ActionCard key={item.id} item={item} onCta={() => undefined} compact />)}
          </>
        )}
      </section>
      <ClinicUpdatePrompt />
      {activeItem && <ConfirmSheet item={activeItem} onComplete={handleComplete} onClose={() => setActiveItem(null)} />}
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
      <p style={{ color: '#B5A89E', fontSize: 15 }}>{DAY_LABELS[selectedDay]} 등록된 일정이 없어요</p>
      <Link href="/add" style={emptyLinkStyle}>일정 추가</Link>
    </div>
  );
}

function NextItem({ item, onCta }: { item: ScheduleItem; onCta: (item: ScheduleItem) => void }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: '#C4A898', fontWeight: 700, padding: '4px 8px', margin: '0 0 8px' }}>다음 일정</p>
      <ActionCard item={item} onCta={onCta} compact />
    </div>
  );
}

function ClinicUpdatePrompt() {
  return (
    <div style={{ margin: '20px 16px 0', padding: '16px 20px', background: '#FFF8F5', borderRadius: 18, border: '1.5px solid #F4D4C8' }}>
      <p style={{ fontSize: 13, color: 'var(--slc-muted)', margin: '0 0 8px' }}>병원 다녀오셨나요?</p>
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
  width: 40, height: 40, borderRadius: '50%', background: 'var(--slc-coral-light)', border: '1.5px solid #F4D4C8',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slc-coral)', fontSize: 22,
  textDecoration: 'none', fontWeight: 500,
} as const;

const emptyLinkStyle = {
  display: 'inline-block', marginTop: 16, padding: '12px 24px', background: 'var(--slc-coral)', color: '#fff',
  borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 800,
} as const;

function tabStyle(active: boolean) {
  return {
    padding: '8px 16px', borderRadius: 999, background: active ? 'var(--slc-coral)' : 'var(--slc-border)',
    color: active ? '#fff' : 'var(--slc-muted)', border: 'none', fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  } as const;
}
