import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;
type InsertCall = { table: string; rows: Array<Record<string, unknown>> };
type InvokeCall = { name: string; options: unknown };
type OffsetCandidateRow = {
  source_text?: unknown;
  source_offset_start?: unknown;
  source_offset_end?: unknown;
};

const state = vi.hoisted(() => ({
  user: null as User,
  candidates: [] as Array<Record<string, unknown>>,
  insertCalls: [] as InsertCall[],
  invokeCalls: [] as InvokeCall[],
}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    rpc: async () => ({ data: { couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-10T00:00:00.000Z' }, error: null }),
    functions: {
      invoke: async (name: string, options: unknown) => {
        state.invokeCalls.push({ name, options });
        return { data: { candidates: state.candidates }, error: null };
      },
    },
    from: (table: string) => ({
      insert: (rows: Array<Record<string, unknown>>) => ({
        select: () => {
          const normalizedRows = Array.isArray(rows) ? rows : [rows];
          state.insertCalls.push({ table, rows: normalizedRows });
          const data = normalizedRows.map((row, index) => ({ id: `${table}-${index + 1}`, ...row }));
          return {
            single: async () => ({ data: data[0] ?? null, error: null }),
            then: (resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) => resolve({ data, error: null }),
          };
        },
      }),
    }),
  }),
}));

function request(body: unknown, init?: { url?: string; cookie?: string }) {
  const host = init?.url ? new URL(init.url).host : undefined;
  return new NextRequest(init?.url ?? 'http://localhost/api/onboard/text-analyze', {
    method: 'POST',
    headers: {
      ...(host ? { host } : {}),
      ...(init?.cookie ? { cookie: init.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function expectOffsetRoundTrip(rawText: unknown, row: OffsetCandidateRow) {
  expect(typeof rawText).toBe('string');
  expect(typeof row.source_text).toBe('string');
  expect(typeof row.source_offset_start).toBe('number');
  expect(typeof row.source_offset_end).toBe('number');
  if (
    typeof rawText === 'string'
    && typeof row.source_text === 'string'
    && typeof row.source_offset_start === 'number'
    && typeof row.source_offset_end === 'number'
  ) {
    expect(rawText.slice(row.source_offset_start, row.source_offset_end)).toBe(row.source_text);
  }
}

describe('/api/onboard/text-analyze', () => {
  beforeEach(() => {
    vi.useRealTimers();
    state.user = null;
    state.candidates = [];
    state.insertCalls = [];
    state.invokeCalls = [];
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../../app/api/onboard/text-analyze/route');
    const response = await POST(request({ rawText: '고날에프 21:00' }));
    expect(response.status).toBe(401);
  });

  it('allows presentation text extraction after privacy acceptance without persisting drafts', async () => {
    state.user = null;
    state.candidates = [{ type: 'injection', title: '고날에프', scheduled_at: '2026-05-15T12:00:00.000Z', dose: '150', unit: 'IU' }];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request(
      { rawText: '고날에프 150 IU 21:00' },
      {
        url: 'https://ai-business-group10.vercel.app/api/onboard/text-analyze',
        cookie: 'fevio_privacy_gate_v1=accepted',
      },
    ));
    const payload = await response.json() as { candidates: Array<{ id: string; title: string }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(1);
    expect(payload.candidates[0]).toMatchObject({ id: expect.stringMatching(/^presentation-/u), title: '고날에프' });
    expect(state.invokeCalls[0]).toMatchObject({
      name: 'schedule-extract',
      options: { body: { mode: 'text', rawText: '고날에프 150 IU 21:00', patientId: 'presentation' } },
    });
    expect(state.insertCalls).toHaveLength(0);
  });

  it('calls text mode extraction and inserts draft candidates with raw text and no image path', async () => {
    state.user = { id: 'patient-1' };
    state.candidates = [{ type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-15T12:00:00.000Z', dose: null, unit: null }];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: ' 내일 병원 방문 ' }));
    const payload = await response.json() as { candidates: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(1);
    expect(state.invokeCalls[0]).toMatchObject({
      name: 'schedule-extract',
      options: { body: { mode: 'text', rawText: '내일 병원 방문', patientId: 'patient-1' } },
    });
    expect(state.insertCalls.map((call) => call.table)).toEqual(['visit_inputs', 'action_split_drafts', 'split_candidates']);
    expect(state.insertCalls[2]).toMatchObject({
      table: 'split_candidates',
      rows: [expect.objectContaining({
        couple_id: 'couple-1',
        draft_id: 'action_split_drafts-1',
        visit_input_id: 'visit_inputs-1',
        source_text: '병원 방문',
        assigned_to: 'my_action',
        suggested_card_type: 'clinic_visit',
        confidence: 'needs_confirmation',
      })],
    });
    expectOffsetRoundTrip(state.insertCalls[0].rows[0].raw_text, state.insertCalls[2].rows[0]);
  });


  it('falls back to deterministic Korean injection extraction when LLM returns no candidates', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '오늘 밤 부터 고날에프 17시 한번 09시 한번 10일간 맞아야한대' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(2);
    expect(payload.candidates.map((candidate) => candidate.title)).toEqual(['고날에프', '고날에프']);
    expect(payload.candidates.map((candidate) => candidate.type)).toEqual(['injection', 'injection']);
    expect(payload.candidates.map((candidate) => candidate.scheduled_at)).toEqual([
      '2026-05-15T08:00:00.000Z',
      '2026-05-15T00:00:00.000Z',
    ]);
    expect(state.insertCalls[2]).toMatchObject({
      table: 'split_candidates',
      rows: [
        expect.objectContaining({ couple_id: 'couple-1', source_text: '고날에프', assigned_to: 'my_action', suggested_card_type: 'injection' }),
        expect.objectContaining({ couple_id: 'couple-1', source_text: '고날에프', assigned_to: 'my_action', suggested_card_type: 'injection' }),
      ],
    });
    vi.useRealTimers();
  });

  it('prefers deterministic Korean medication times over unsafe LLM guesses', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [
      { type: 'injection', title: '고날에프', scheduled_at: '2023-04-10T17:00:00.000Z', dose: '1', unit: null },
    ];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '오늘 밤 부터 고날에프 17시 한번 09시 한번 10일간 맞아야한대' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(2);
    expect(payload.candidates.map((candidate) => candidate.scheduled_at)).toEqual([
      '2026-05-15T08:00:00.000Z',
      '2026-05-15T00:00:00.000Z',
    ]);
    vi.useRealTimers();
  });

  it('expands duration and twice-daily frequency into six pending candidates when exact times are missing', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '오늘밤부터 고날에프 3일간 하루 두번' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null; dose: string | null; unit: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(6);
    expect(payload.candidates.every((candidate) => candidate.type === 'injection')).toBe(true);
    expect(payload.candidates.every((candidate) => candidate.title.startsWith('고날에프'))).toBe(true);
    expect(payload.candidates.every((candidate) => candidate.scheduled_at === null)).toBe(true);
    expect(payload.candidates.every((candidate) => candidate.dose === null && candidate.unit === null)).toBe(true);
    vi.useRealTimers();
  });

  it('extracts tomorrow night one-time Ovidrel as one scheduled candidate', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '내일부터 오비드렐 밤 10시에 1회' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toEqual([
      expect.objectContaining({
        title: '오비드렐',
        type: 'injection',
        scheduled_at: '2026-05-16T13:00:00.000Z',
      }),
    ]);
    vi.useRealTimers();
  });

  it('drops extracted text candidates that contain medical advice language before draft persistence', async () => {
    state.user = { id: 'patient-1' };
    state.candidates = [{ type: 'medication', title: '복용을 중단하세요', scheduled_at: null, dose: null, unit: null }];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '병원 안내 메모' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });

  it('expands explicit start date, dose, duration, and daily time into dated candidates', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '5월 28일부터 고날에프 150IU 3일간 매일 오전 9시' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null; dose: string | null; unit: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(3);
    expect(payload.candidates.map((candidate) => candidate.scheduled_at)).toEqual([
      '2026-05-28T00:00:00.000Z',
      '2026-05-29T00:00:00.000Z',
      '2026-05-30T00:00:00.000Z',
    ]);
    expect(payload.candidates.every((candidate) => candidate.title.startsWith('고날에프'))).toBe(true);
    expect(payload.candidates.every((candidate) => candidate.dose === '150' && candidate.unit === 'IU')).toBe(true);
    vi.useRealTimers();
  });

  it('extracts explicit times per clinic notice line without leaking missing-time wording across medications', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const rawText = [
      '페비오 여성의원 안내문',
      '오늘 밤부터 고날에프 150 IU를 3일간 하루 두 번 맞으세요.',
      '1회차와 2회차 시간은 본인이 정해서 기록해 주세요.',
      '메노푸어 75 IU는 2026년 5월 15일 오후 9시에 1회 주사하세요.',
      '세트로타이드 0.25 mg은 2026년 5월 16일부터 2일간 매일 오전 9시에 주사하세요.',
      '질정은 오늘부터 3일간 아침, 저녁으로 사용하세요.',
      '정확한 시간은 확인 후 입력해 주세요.',
      '오비드렐은 2026년 5월 18일 밤 10시에 1회 주사 예정입니다.',
      '최종 주사 여부는 병원 안내를 다시 확인해 주세요.',
      '다음 병원 방문은 2026년 5월 19일 오전 10시입니다.',
      '파트너에게는 오늘 일정과 완료 여부만 공유해 주세요.',
    ].join('\n');

    const response = await POST(request({ rawText }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null; dose: string | null; unit: string | null }> };

    expect(response.status).toBe(200);

    const gonalf = payload.candidates.filter((candidate) => candidate.title.startsWith('고날에프'));
    expect(gonalf).toHaveLength(6);
    expect(gonalf.every((candidate) => candidate.scheduled_at === null)).toBe(true);
    expect(gonalf.every((candidate) => candidate.dose === '150' && candidate.unit === 'IU')).toBe(true);

    expect(payload.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: '메노푸어',
        type: 'injection',
        scheduled_at: '2026-05-15T12:00:00.000Z',
        dose: '75',
        unit: 'IU',
      }),
      expect.objectContaining({
        title: '세트로타이드',
        type: 'injection',
        scheduled_at: '2026-05-16T00:00:00.000Z',
        dose: '0.25',
        unit: 'mg',
      }),
      expect.objectContaining({
        title: '세트로타이드',
        type: 'injection',
        scheduled_at: '2026-05-17T00:00:00.000Z',
        dose: '0.25',
        unit: 'mg',
      }),
      expect.objectContaining({
        title: '오비드렐',
        type: 'injection',
        scheduled_at: '2026-05-18T13:00:00.000Z',
      }),
      expect.objectContaining({
        title: '병원 방문',
        type: 'clinic',
        scheduled_at: '2026-05-19T01:00:00.000Z',
      }),
    ]));

    const vaginalTablets = payload.candidates.filter((candidate) => candidate.title.startsWith('질정'));
    expect(vaginalTablets).toHaveLength(6);
    expect(vaginalTablets.every((candidate) => candidate.type === 'medication')).toBe(true);
    expect(vaginalTablets.every((candidate) => candidate.scheduled_at === null)).toBe(true);

    expect(payload.candidates.some((candidate) => candidate.title === '주사')).toBe(false);
    const explicitTitles = ['메노푸어', '세트로타이드', '오비드렐', '병원 방문'];
    const explicitCandidates = payload.candidates.filter((candidate) => explicitTitles.includes(candidate.title));
    expect(explicitCandidates.every((candidate) => candidate.scheduled_at !== null)).toBe(true);
    vi.useRealTimers();
  });

  it('creates two daily vaginal tablet candidates with missing exact times for morning and evening wording', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '오늘부터 질정 하루 2번 아침 저녁' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null; dose: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(2);
    expect(payload.candidates.map((candidate) => candidate.type)).toEqual(['medication', 'medication']);
    expect(payload.candidates.map((candidate) => candidate.scheduled_at)).toEqual([null, null]);
    expect(payload.candidates.every((candidate) => candidate.dose === null)).toBe(true);
    vi.useRealTimers();
  });

  it('keeps a generic injection candidate when medication name, time, and dose are missing', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '3일간 주사' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null; dose: string | null; unit: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toEqual([
      expect.objectContaining({
        title: '주사',
        type: 'injection',
        scheduled_at: null,
        dose: null,
        unit: null,
      }),
    ]);
    vi.useRealTimers();
  });

  it('returns an empty candidate array without inserting when extraction finds nothing', async () => {
    state.user = { id: 'patient-1' };
    const { POST } = await import('../../app/api/onboard/text-analyze/route');
    const response = await POST(request({ rawText: '일정 없음' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });
});
