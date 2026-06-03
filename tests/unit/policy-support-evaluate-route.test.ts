import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { POST } from '../../app/api/policy-support/evaluate/route';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/policy-support/evaluate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/policy-support/evaluate', () => {
  it('evaluates policy support from structured seed data without persistence', async () => {
    const response = await POST(jsonRequest({
      sido: '서울특별시',
      sigungu: '강남구',
      treatment_type: 'ivf_fresh',
      treatment_start_date: '2026-06-10',
      evaluation_date: '2026-06-08',
      has_infertility_diagnosis: true,
      has_decision_notice: false,
      support_attempt_count: 0,
      drug_external_expected: true,
    }));
    const payload = await response.json() as {
      persisted: boolean;
      source: string;
      retrieval: {
        mode: string;
        evidence: Array<{ topic: string; sourceUrl: string; text: string }>;
      };
      policy: { health_center: string; sources: Array<{ url: string }> };
      result: {
        overallStatus: string;
        conditionChecks: Array<{ item: string; status: string; note: string }>;
        inquiryQuestions: string[];
      };
    };

    expect(response.status).toBe(200);
    expect(payload.persisted).toBe(false);
    expect(payload.source).toBe('policy_seed');
    expect(payload.retrieval.mode).toBe('static_rag');
    expect(payload.retrieval.evidence.length).toBeGreaterThan(0);
    expect(payload.retrieval.evidence.some((item) => item.topic === '지원결정통지서')).toBe(true);
    expect(payload.retrieval.evidence.every((item) => item.sourceUrl.startsWith('https://'))).toBe(true);
    expect(payload.policy.health_center).toBe('강남구보건소');
    expect(payload.policy.sources[0]?.url).toContain('gangnam.go.kr');
    expect(payload.result.overallStatus).toBe('action_required');
    expect(payload.result.conditionChecks).toContainEqual(expect.objectContaining({
      item: '지원결정통지서',
      status: 'action_required',
    }));
    expect(payload.result.inquiryQuestions).toContain(
      '2026-06-10 시작 예정인 체외수정 신선배아 시술 전에 지원결정통지서 발급이 가능한가요?',
    );
  });

  it('rejects requests without the minimum location and treatment context', async () => {
    const response = await POST(jsonRequest({
      sido: '서울특별시',
      sigungu: '강남구',
    }));
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe('시도, 시군구, 시술 유형을 확인해 주세요.');
  });

  it('does not return final eligibility claims', async () => {
    const response = await POST(jsonRequest({
      sido: '서울특별시',
      sigungu: '마포구',
      treatment_type: 'iui',
    }));
    const serialized = JSON.stringify(await response.json());

    expect(serialized).toContain('지원 대상 여부를 확정하지 않아요');
    expect(serialized).not.toContain('100% 받을 수 있습니다');
    expect(serialized).not.toContain('지원 대상입니다');
    expect(serialized).not.toContain('무조건 신청 가능합니다');
  });
});
