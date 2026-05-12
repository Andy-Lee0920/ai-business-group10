import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { assertSensitiveWriteAllowed } from '../../../../src/domain/auth-privacy';
import { computeCareDayV2 } from '../../../../src/domain/treatment-timeline';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../../src/lib/couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import type { TreatmentCycle, TreatmentMilestone, TreatmentMilestoneKind } from '../../../../src/types/treatment-timeline.types';

type Body = {
  startedAt?: unknown;
  milestone?: unknown;
  confirmedAt?: unknown;
  notes?: unknown;
};
type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectChain<T> = { select(columns: string): SelectChain<T>; single(): Promise<SingleResult<T>> };
type QueryBuilder = { insert<T>(value: Record<string, unknown>): SelectChain<T> };
type TreatmentSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> };
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'treatment_cycles' | 'treatment_milestones'): QueryBuilder;
};
type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type CycleRow = Pick<TreatmentCycle, 'id' | 'couple_id' | 'cycle_number' | 'protocol' | 'started_at' | 'created_at'>;
type MilestoneRow = Pick<TreatmentMilestone, 'id' | 'cycle_id' | 'couple_id' | 'milestone' | 'confirmed_at' | 'notes' | 'created_at'>;

const DEMO_COOKIE = 'fevio_privacy_accepted=1';
const TIMELINE_MILESTONES_COOKIE = 'fevio_treatment_milestones';
const MILESTONE_LABELS: Record<TreatmentMilestoneKind, string> = {
  initial_visit: '초진',
  stimulation_start: '자극 시작',
  trigger_shot: '트리거 주사',
  egg_retrieval: '난자 채취',
  embryo_transfer: '배아 이식',
  result_day: '결과 확인',
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const input = normalizeInput(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  if (isPresentationRequest(request) && hasDemoPrivacyCookie(request.headers.get('cookie'))) {
    const milestone = demoMilestone(input.milestone, input.confirmedAt, input.notes);
    const response = NextResponse.json({
      persisted: false,
      cycleId: 'demo-treatment-cycle',
      milestoneId: milestone.id,
      careSurface: computeCareDayV2([milestone], [], todayIso()),
      redirectTo: '/home',
    });
    response.cookies.set(TIMELINE_MILESTONES_COOKIE, encodeURIComponent(JSON.stringify([milestone])), {
      httpOnly: true,
      maxAge: 60 * 60,
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }

  const supabase = (await createCookieBackedSupabaseClient()) as unknown as TreatmentSupabaseClient;
  const user = await getAuthenticatedUser(supabase);
  const bootstrap = await bootstrapSensitiveContext(supabase, user);
  try {
    assertSensitiveWriteAllowed({ privacyGateAcceptedAt: bootstrap.privacy_gate_accepted_at });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Privacy Gate must be accepted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const cycle = await supabase
    .from('treatment_cycles')
    .insert<CycleRow>({
      couple_id: bootstrap.couple_id,
      cycle_number: 1,
      protocol: null,
      started_at: input.startedAt,
    })
    .select('id,couple_id,cycle_number,protocol,started_at,created_at')
    .single();
  if (cycle.error || !cycle.data) throw new Error(cycle.error?.message ?? 'treatment_cycles insert failed');

  const milestone = await supabase
    .from('treatment_milestones')
    .insert<MilestoneRow>({
      cycle_id: cycle.data.id,
      couple_id: bootstrap.couple_id,
      milestone: input.milestone,
      confirmed_at: input.confirmedAt,
      notes: input.notes,
    })
    .select('id,cycle_id,couple_id,milestone,confirmed_at,notes,created_at')
    .single();
  if (milestone.error || !milestone.data) throw new Error(milestone.error?.message ?? 'treatment_milestones insert failed');

  return NextResponse.json({
    persisted: true,
    cycleId: cycle.data.id,
    milestoneId: milestone.data.id,
    milestoneLabel: MILESTONE_LABELS[input.milestone],
    careSurface: computeCareDayV2([milestone.data], [], todayIso()),
    redirectTo: '/home',
  });
}

function normalizeInput(body: Body): { startedAt: string; milestone: TreatmentMilestoneKind; confirmedAt: string; notes: string | null } | { error: string } {
  const startedAt = normalizeDate(body.startedAt) || normalizeDate(body.confirmedAt);
  const milestone = normalizeMilestone(body.milestone);
  const confirmedAt = normalizeDate(body.confirmedAt) || startedAt;
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 200) : null;

  if (!startedAt) return { error: '초진 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.' };
  if (!confirmedAt) return { error: '마일스톤 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.' };
  return { startedAt, milestone, confirmedAt, notes };
}

function normalizeDate(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/u.test(trimmed) ? trimmed : '';
}

function normalizeMilestone(value: unknown): TreatmentMilestoneKind {
  if (
    value === 'initial_visit' ||
    value === 'stimulation_start' ||
    value === 'trigger_shot' ||
    value === 'egg_retrieval' ||
    value === 'embryo_transfer' ||
    value === 'result_day'
  ) return value;
  return 'stimulation_start';
}

function hasDemoPrivacyCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function demoMilestone(milestone: TreatmentMilestoneKind, confirmedAt: string, notes: string | null): TreatmentMilestone {
  return {
    id: 'demo-treatment-milestone',
    cycle_id: 'demo-treatment-cycle',
    couple_id: 'demo-couple',
    milestone,
    confirmed_at: confirmedAt,
    notes,
    created_at: new Date().toISOString(),
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function getAuthenticatedUser(supabase: TreatmentSupabaseClient) {
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error(userResult.error?.message ?? 'Authentication required.');
  return userResult.data.user;
}

async function bootstrapSensitiveContext(supabase: TreatmentSupabaseClient, user: { id: string; email?: string | null }) {
  const bootstrap = await supabase.rpc<BootstrapRow>('init_couple_for_user');
  if (!bootstrap.error) {
    const row = firstRow(bootstrap.data);
    if (!row) throw new Error('Couple shell missing.');
    return row;
  }

  if (!isInitCoupleAmbiguityError(bootstrap.error)) throw new Error(bootstrap.error.message);
  const shell = await bootstrapCoupleForUserWithServiceRole(user);
  return { couple_id: shell.couple_id, privacy_gate_accepted_at: shell.privacy_gate_accepted_at };
}

function firstRow<T>(value: T[] | T | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
