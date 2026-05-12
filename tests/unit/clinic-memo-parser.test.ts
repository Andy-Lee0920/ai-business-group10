import { describe, expect, it } from 'vitest';
import { parseClinicMemo } from '../../src/domain/clinic-memo-parser';

describe('parseClinicMemo', () => {
  it('extracts injection medication, time, clinic visit, and partner role from a hospital memo', () => {
    const result = parseClinicMemo('고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인');

    expect(result.inferredStage).toBe('ovarian_stimulation');
    expect(result.confidence).toBe('high');
    expect(result.extractedTokens).toEqual(expect.arrayContaining([
      { label: '약·주사', value: '고날에프 225IU' },
      { label: '시간', value: '오늘 밤 9시' },
      { label: '병원 방문', value: '내일 오전 9시 초음파 확인' },
      { label: '파트너 역할', value: '주사 30분 전 준비물 확인' },
    ]));
    expect(result.partnerRoleHints).toContain('주사 30분 전 준비물 확인');
    expect(result.fallbackReason).toBeNull();
  });

  it.each([
    ['채취 전날 금식하고 오전 8시 도착', 'egg_retrieval'],
    ['Day 3 배아 등급과 동결 여부 결과 전화', 'embryo_culture'],
    ['이식 후 프로게스테론 질정 계속', 'embryo_transfer'],
    ['피검 hCG 결과 전화 대기', 'pregnancy_test'],
    ['내일 오전 9시 초음파 채혈 방문', 'baseline_testing'],
  ] as const)('maps memo "%s" to %s', (memo, expectedStage) => {
    expect(parseClinicMemo(memo).inferredStage).toBe(expectedStage);
  });

  it('returns a medium-confidence clinic briefing when only broad clinic language is present', () => {
    const result = parseClinicMemo('다음 방문 때 안내 다시 확인');

    expect(result.inferredStage).toBe('baseline_testing');
    expect(result.confidence).toBe('medium');
    expect(result.fallbackReason).toBe('병원 방문 안내를 기준으로 케어 메모를 만들었어요.');
  });

  it('returns a low-confidence fallback without exposing internal analysis words', () => {
    const result = parseClinicMemo('메모를 나중에 다시 보기');

    expect(result.inferredStage).toBe('baseline_testing');
    expect(result.confidence).toBe('low');
    expect(result.fallbackReason).toBe('안내받은 내용을 먼저 케어 메모로 정리했어요.');
    expect(JSON.stringify(result)).not.toMatch(/AI 분석|파싱 성공|stage detected|confidence 0\.83/u);
  });
});
