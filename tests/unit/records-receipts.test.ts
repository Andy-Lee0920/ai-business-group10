import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';
import type { Receipt } from '../../src/types/slc.types';

const migration = readFileSync('supabase/migrations/202605150004_receipts.sql', 'utf8');
const apiRoute = readFileSync('app/api/receipts/route.ts', 'utf8');
const screenSource = readFileSync('src/features/records/records-screen.tsx', 'utf8');
const recordsPage = readFileSync('app/(authed)/records/page.tsx', 'utf8');

const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: 'receipt-1',
  couple_id: 'couple-1',
  amount: 35000,
  category: '진료비',
  date: '2026-05-15',
  note: '초음파',
  created_at: '2026-05-15T08:00:00.000Z',
  ...overrides,
});

describe('Records receipts', () => {
  it('makes the records tab a finance-first surface with always-visible cost visualization and subsidies', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      receipts: [receipt(), receipt({ id: 'receipt-2', amount: -10000, category: '정부지원금', note: null })],
    }));

    expect(markup).toContain('시술비 기록');
    expect(markup).toContain('주사 시작일을 기다려요');
    expect(markup).toContain('비용 시각화');
    expect(markup).toContain('aria-label="사이클 누적 비용 차트"');
    expect(markup).toContain('25,000원');
    expect(markup).toContain('정부지원금 처리');
    expect(markup).toContain('지원금 처리');
    expect(markup).toContain('data-testid="financial-receipt-list"');
    expect(markup).toContain('정부지원금');
    expect(markup).toContain('data-testid="ambient-story-background"');
    expect(markup).not.toContain('data-testid="records-timeline"');
    expect(markup).not.toContain('data-testid="records-calm-card"');
    expect(markup).not.toContain('data-testid="receipt-form"');
    expect(markup).not.toContain('rgba(252, 238, 232, 0.9)');
  });

  it('still renders cost visualization and support guidance before the first receipt exists', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      receipts: [],
    }));

    expect(markup).toContain('0원');
    expect(markup).toContain('주사 시작일을 기다려요');
    expect(markup).toContain('비용 시각화');
    expect(markup).toContain('정부지원금 처리');
    expect(markup).toContain('아직 비용 기록이 없어요');
    expect(markup).toContain('첫 영수증을 추가하면 그래프와 정부지원금 반영 금액이 바로 채워져요.');
  });

  it('defines the receipt bottom sheet contract without the legacy inline panel', () => {
    expect(screenSource).toContain('const [sheetOpen, setSheetOpen] = useState(false)');
    expect(screenSource).toContain('role="dialog" aria-label="영수증 입력"');
    expect(screenSource).toContain('data-testid="receipt-form"');
    expect(screenSource).toContain('data-testid="receipt-total"');
    expect(screenSource).toContain('setSheetOpen(false)');
    expect(screenSource).not.toContain('function ReceiptPanel');
  });

  it('extends the records fetch window so finance context can coexist with a longer cycle', () => {
    expect(recordsPage).toContain('120 * 24 * 60 * 60 * 1000');
    expect(recordsPage).not.toContain('30 * 24 * 60 * 60 * 1000');
  });

  it('keeps receipts under couple-scoped RLS and inserts only after privacy acceptance', () => {
    expect(migration).toContain('create table if not exists public.receipts');
    expect(migration).toContain('couple_id uuid not null references public.couples(id)');
    expect(migration).toContain('public.current_user_couple_ids()');
    expect(migration).toContain('public.can_create_sensitive_rows(couple_id)');
    expect(migration).toContain('grant select, insert on public.receipts to authenticated');
  });

  it('routes receipt writes through the authenticated couple shell and keeps support amounts negative', () => {
    expect(apiRoute).toContain("from('receipts')");
    expect(apiRoute).toContain("rpc('init_couple_for_user')");
    expect(screenSource).toContain("category === '정부지원금'");
    expect(apiRoute).toContain('amount: input.amount');
  });
});
