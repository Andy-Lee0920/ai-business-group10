import Anthropic from '@anthropic-ai/sdk';
import type { PolicyEvidence } from './policy-support-rag';
import type { PolicyInquiryDraft, PolicySupportResult } from './policy-support';

export type PolicyInquiryPolishSource =
  | 'deterministic'
  | 'llm'
  | 'rejected_fallback'
  | 'fallback';

export type PolicyInquiryPolishResult = {
  draft: PolicyInquiryDraft;
  source: PolicyInquiryPolishSource;
  rejected: boolean;
};

type PolishPolicyInquiryInput = {
  draft: PolicyInquiryDraft;
  result: PolicySupportResult;
  evidence: readonly PolicyEvidence[];
};

type PolishPolicyInquiryDependencies = {
  apiKey?: string;
  fetchPolishedDraft?: (
    input: PolishPolicyInquiryInput,
    apiKey: string,
  ) => Promise<PolicyInquiryDraft>;
};

const FORBIDDEN_PATTERNS = [
  /100%\s*받을 수 있습니다/u,
  /지원 대상입니다/u,
  /무조건\s*신청\s*가능/u,
  /반드시\s*지원/u,
  /보건소에?\s*확인하지 않아도/u,
  /최종\s*확정/u,
];

const SENSITIVE_PATTERNS = [
  /주민등록번호/u,
  /상세\s*진단명/u,
  /배우자\s*개인정보/u,
  /병원명/u,
  /검사\s*수치/u,
  /증빙\s*이미지/u,
];

export async function polishPolicyInquiryDraft(
  input: PolishPolicyInquiryInput,
  deps: PolishPolicyInquiryDependencies = {},
): Promise<PolicyInquiryPolishResult> {
  // ANTHROPIC_API_KEY 우선, 없으면 OPENROUTER_API_KEY
  const anthropicKey = deps.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!anthropicKey && !openRouterKey) {
    return { draft: input.draft, source: 'deterministic', rejected: false };
  }

  try {
    const fetchDraft =
      deps.fetchPolishedDraft ??
      (anthropicKey
        ? (i: PolishPolicyInquiryInput) => fetchClaudePolicyDraft(i, anthropicKey)
        : (i: PolishPolicyInquiryInput) => fetchOpenRouterPolicyDraft(i, openRouterKey!));

    const draft = await fetchDraft(input, anthropicKey ?? openRouterKey!);

    if (!isPolicyInquiryDraftSafe(draft)) {
      return { draft: input.draft, source: 'rejected_fallback', rejected: true };
    }

    return { draft, source: 'llm', rejected: false };
  } catch {
    return { draft: input.draft, source: 'fallback', rejected: false };
  }
}

export function isPolicyInquiryDraftSafe(draft: PolicyInquiryDraft): boolean {
  const text = serializeDraft(draft);

  return ![...FORBIDDEN_PATTERNS, ...SENSITIVE_PATTERNS].some((pattern) =>
    pattern.test(text),
  );
}

async function fetchClaudePolicyDraft(
  input: PolishPolicyInquiryInput,
  apiKey: string,
): Promise<PolicyInquiryDraft> {
  const client = new Anthropic({ apiKey });

  const evidenceSummary = input.evidence
    .map((e) => `[${e.topic}] ${e.text} (출처: ${e.sourceLabel}, ${e.lastVerifiedAt})`)
    .join('\n');

  const attentionChecks = input.result.conditionChecks
    .filter((c) => c.status !== 'confirmed')
    .map((c) => `- ${c.item}: ${c.note}`)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    temperature: 0.2,
    system: `당신은 난임부부 시술비 지원 행정 문의 이메일을 다듬는 보조자입니다.
아래 규칙을 반드시 준수하세요:
- 지원 가능 여부를 확정하지 말 것 ("지원 대상입니다", "100% 받을 수 있습니다" 등 금지)
- 주민등록번호, 상세 진단명, 배우자 개인정보, 병원명, 검사 수치, 증빙 이미지 언급 금지
- 보건소 최종 확인이 필요하다는 표현을 반드시 유지할 것
- 제공된 결정론적 초안과 근거 텍스트만 사용할 것
- 응답은 반드시 JSON만 출력: {"subject": "string", "bodyLines": ["string"]}`,
    messages: [
      {
        role: 'user',
        content: `결정론적 초안:\n수신: ${input.draft.recipient}\n제목: ${input.draft.subject}\n본문:\n${input.draft.bodyLines.join('\n')}

확인이 필요한 조건:\n${attentionChecks || '없음'}

검색된 정책 근거:\n${evidenceSummary || '없음'}

위 초안을 근거 텍스트를 참고해 더 구체적으로 다듬어 주세요. JSON만 출력하세요.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('claude_unexpected_content_type');

  return parseDraftPayload(content.text, input.draft);
}

async function fetchOpenRouterPolicyDraft(
  input: PolishPolicyInquiryInput,
  apiKey: string,
): Promise<PolicyInquiryDraft> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_POLICY_MODEL ?? 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content:
            'You polish a Korean public-health-center inquiry email for IVF policy support. Use only provided deterministic facts and evidence. Do not decide eligibility, guarantee support, infer medical facts, mention hospital names, personal IDs, diagnosis details, test values, or attached evidence images. Keep public-health-center final confirmation explicit.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            deterministicDraft: input.draft,
            status: input.result.overallStatus,
            checks: input.result.conditionChecks,
            evidence: input.evidence.map((item) => ({
              topic: item.topic,
              sourceLabel: item.sourceLabel,
              lastVerifiedAt: item.lastVerifiedAt,
              text: item.text,
            })),
            outputShape: {
              recipient: input.draft.recipient,
              subject: 'string',
              bodyLines: ['string'],
            },
          }),
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  if (!response.ok) throw new Error('policy_inquiry_polish_failed');

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseDraftPayload(payload.choices?.[0]?.message?.content, input.draft);
}

function parseDraftPayload(
  content: string | undefined,
  fallback: PolicyInquiryDraft,
): PolicyInquiryDraft {
  if (!content) throw new Error('empty_policy_inquiry_polish');

  const parsed = JSON.parse(content) as Partial<PolicyInquiryDraft>;
  const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : '';
  const bodyLines = Array.isArray(parsed.bodyLines)
    ? parsed.bodyLines
        .filter((line): line is string => typeof line === 'string')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  if (!subject || bodyLines.length === 0) {
    throw new Error('malformed_policy_inquiry_polish');
  }

  return {
    recipient: fallback.recipient,
    subject: subject.slice(0, 120),
    bodyLines: bodyLines.slice(0, 12),
  };
}

function serializeDraft(draft: PolicyInquiryDraft): string {
  return [draft.recipient, draft.subject, ...draft.bodyLines].join('\n');
}
