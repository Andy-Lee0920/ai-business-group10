import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';
import type { Receipt } from '../../src/types/slc.types';

const migration = readFileSync('supabase/migrations/202605150004_receipts.sql', 'utf8');
const apiRoute = readFileSync('app/api/receipts/route.ts', 'utf8');
const screenSource = readFileSync('src/features/records/records-screen.tsx', 'utf8');

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
  it('renders receipt input, receipt list, and running total on the records tab', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      receipts: [receipt(), receipt({ id: 'receipt-2', amount: -10000, category: '정부지원금', note: null })],
    }));

    expect(markup).toContain('영수증 입력');
    expect(markup).toContain('data-testid="receipt-form"');
    expect(markup).toContain('data-testid="receipt-list"');
    expect(markup).toContain('data-testid="receipt-total"');
    expect(markup).toContain('25,000원');
    expect(markup).toContain('정부지원금');
    expect(markup).toContain('var(--slc-surface)');
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
