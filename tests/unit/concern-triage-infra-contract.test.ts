import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('concern triage storage and UI contract', () => {
  it('creates tag-only concern signals and confirm-only clinic questions with couple-scoped RLS', () => {
    const migration = readFileSync('supabase/migrations/202605300001_concern_triage_care_agent.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.concern_signals');
    expect(migration).toContain('create table if not exists public.clinic_questions');
    expect(migration).toContain("check (status in ('open', 'asked', 'resolved'))");
    expect(migration).toContain('related_card_id uuid references public.care_action_cards(id) on delete set null');
    expect(migration).toContain('alter table public.concern_signals enable row level security');
    expect(migration).toContain('alter table public.clinic_questions enable row level security');
    expect(migration).toContain('couple_id in (select public.current_user_couple_ids())');
    expect(migration).toContain("role = 'primary'");
    expect(migration).toContain('public.can_create_sensitive_rows(couple_id)');
    expect(migration).not.toMatch(/raw_text|source_text|utterance|llm_response|answer_text|answered/iu);
  });

  it('stores reminder strength as user preference, not medical urgency', () => {
    const migration = readFileSync('supabase/migrations/202605300001_concern_triage_care_agent.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.card_reminder_preferences');
    expect(migration).toContain("reminder_strength text not null check (reminder_strength in ('strong', 'quiet'))");
    expect(migration).toContain('unique (couple_id, card_id, user_id)');
    expect(migration).not.toMatch(/display_safety_level|medical_urgency|urgency_level/iu);
  });

  it('keeps user-facing copy on the Care Agent frame and out of problem naming', () => {
    const bottomNav = readFileSync('src/components/bottom-nav.tsx', 'utf8');
    const careAgent = readFileSync('app/(authed)/care-agent/page.tsx', 'utf8');
    const launcher = readFileSync('src/features/adaptive-home/home-utility-launcher.tsx', 'utf8');

    expect(bottomNav).toContain("href: '/care-agent'");
    expect(bottomNav).toContain('케어 에이전트 열기');
    expect(careAgent).toContain('케어 에이전트');
    expect(careAgent).toContain('무엇을 확인할까요?');
    expect(careAgent).toContain('저장 전 직접 확인해요');
    expect(careAgent).toContain('href="/add"');
    expect(careAgent).toContain('주사·복약 남기기');
    expect(careAgent).toContain('href="/clinic-update"');
    expect(careAgent).toContain('병원 방문 남기기');
    expect(launcher).not.toContain('href="/emotion"');
    expect(`${bottomNav}\n${careAgent}`).not.toMatch(/챗봇|감정 상담|걱정 정리|concern|triage/u);
  });
});
