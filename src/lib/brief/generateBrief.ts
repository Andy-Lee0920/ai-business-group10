import { fallbackLine, isBriefSafe } from './guard';
import type { BriefInput, BriefResult } from './types';

type BriefDependencies = {
  apiKey?: string;
  fetchBrief?: (input: BriefInput, apiKey: string) => Promise<string>;
};

export async function generateDailyBrief(input: BriefInput, deps: BriefDependencies = {}): Promise<BriefResult> {
  const fallback = fallbackLine(input.facts);
  const apiKey = deps.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { line: fallback, source: 'fallback', rejected: false };

  try {
    const line = await (deps.fetchBrief ?? fetchOpenRouterBrief)(input, apiKey);
    if (!isBriefSafe(line)) return { line: fallback, source: 'rejected_fallback', rejected: true };
    return { line: line.trim(), source: 'llm', rejected: false };
  } catch {
    return { line: fallback, source: 'fallback', rejected: false };
  }
}

async function fetchOpenRouterBrief(input: BriefInput, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_BRIEF_MODEL ?? 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Write one calm Korean IVF care brief. Use only provided facts. No diagnosis, dosage advice, prognosis, or medical inference.' },
        { role: 'user', content: JSON.stringify(input) },
      ],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });
  if (!response.ok) throw new Error('brief_llm_failed');
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content ?? '';
}
