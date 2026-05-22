import { fallbackLine, isBriefSafe } from './guard';
import type { PartnerBriefInput, PartnerBriefResult } from './types';

const helpActionCatalog: Record<string, string> = {
  injection_day: '알람 시간과 준비 공간을 함께 확인해 주세요.',
  clinic_day: '방문 시간과 이동 준비를 함께 확인해 주세요.',
  waiting_day: '오늘 확인할 일정이 있는지만 조용히 함께 봐 주세요.',
  two_week_wait_day: '검사일과 병원 안내가 바뀌지 않았는지 함께 확인해 주세요.',
  result_protection_day: '다음 안내가 나올 때까지 필요한 일만 같이 정리해 주세요.',
  routine_day: '오늘 공유된 할 일을 한 번만 같이 확인해 주세요.',
  onboarding: '첫 안내문을 넣을 수 있게 옆에서 도와주세요.',
};

type PartnerDeps = {
  apiKey?: string;
  fetchBrief?: (input: PartnerBriefInput, apiKey: string) => Promise<string>;
};

export async function generatePartnerBrief(input: PartnerBriefInput, deps: PartnerDeps = {}): Promise<PartnerBriefResult> {
  const fallback = fallbackPartnerBrief(input.phaseCareDay);
  const apiKey = deps.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ...fallback, source: 'fallback' };

  try {
    const text = await (deps.fetchBrief ?? fetchOpenRouterPartnerBrief)(input, apiKey);
    if (!isBriefSafe(text)) return { ...fallback, source: 'rejected_fallback' };
    return parsePartnerBrief(text, fallback);
  } catch {
    return { ...fallback, source: 'fallback' };
  }
}

function fallbackPartnerBrief(phaseCareDay: string) {
  return {
    momentLine: '오늘 함께 확인할 일을 정리했어요.',
    helpAction: helpActionCatalog[phaseCareDay] ?? helpActionCatalog.routine_day,
  };
}

function parsePartnerBrief(text: string, fallback: Omit<PartnerBriefResult, 'source'>): PartnerBriefResult {
  const [momentLine, helpAction] = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return { momentLine: momentLine ?? fallback.momentLine, helpAction: helpAction ?? fallback.helpAction, source: 'llm' };
}

async function fetchOpenRouterPartnerBrief(input: PartnerBriefInput, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_BRIEF_MODEL ?? 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Return exactly two Korean lines: momentLine then helpAction. No medication facts, diagnosis, prognosis, dosage, or patient reflection.' },
        { role: 'user', content: JSON.stringify({ ...input, allowedActions: helpActionCatalog }) },
      ],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });
  if (!response.ok) throw new Error('partner_brief_llm_failed');
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content ?? fallbackLine([{ fact: helpActionCatalog.routine_day }]);
}
