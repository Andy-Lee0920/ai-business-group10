import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DESCRIPTION_FORBIDDEN_CATEGORIES,
  detectForbiddenPhrases,
  validateDescription,
} from '../../src/utils/description-guard';
import type { DescriptionValidationResult, ForbiddenPhraseHit } from '../../src/types/description-guard.types';

describe('description content guard', () => {
  it('"고날에프 1회, 21시"는 위반 없음', () => {
    expect(validateDescription('고날에프 1회, 21시')).toEqual({ ok: true, warnings: [] });
  });

  it('"용량을 올리세요"는 dosage_change로 검출', () => {
    const hits = detectForbiddenPhrases('용량을 올리세요');
    expect(hits[0]).toMatchObject({ category: 'dosage_change', matched: '용량을 올리세요', offset: 0 });
  });

  it('진단/병명 추론 표현 검출', () => {
    expect(detectForbiddenPhrases('PCOS 증상이 의심되니')[0].category).toBe('diagnosis');
  });

  it('성공률 단정 표현 검출', () => {
    expect(detectForbiddenPhrases('이번엔 성공 가능성이 높아요')[0].category).toBe('success_rate');
  });

  it('치료 전략 변경 표현 검출', () => {
    expect(detectForbiddenPhrases('오늘은 병원에 가지 않아도 됩니다')[0].category).toBe('treatment_strategy');
  });

  it('복수 카테고리 경고를 위치 순서대로 반환', () => {
    const hits = detectForbiddenPhrases('용량 증량 후 성공률이 높습니다');
    expect(hits.map((hit) => hit.category)).toEqual(['dosage_change', 'success_rate']);
    expect(hits[0].offset).toBeLessThan(hits[1].offset);
  });

  it('순수 함수 — 동일 입력 동일 출력', () => {
    const a = detectForbiddenPhrases('용량 증량');
    const b = detectForbiddenPhrases('용량 증량');
    expect(a).toEqual(b);
  });

  it('반환된 경고를 변경해도 다음 호출 결과를 오염시키지 않는다', () => {
    const first = detectForbiddenPhrases('용량 증량');
    first[0].matched = 'mutated';
    expect(detectForbiddenPhrases('용량 증량')[0].matched).toBe('용량 증량');
  });

  it('null/undefined/empty 안전 처리', () => {
    expect(validateDescription('').ok).toBe(true);
    expect(detectForbiddenPhrases('')).toEqual([]);
    expect(validateDescription(null).ok).toBe(true);
    expect(detectForbiddenPhrases(undefined)).toEqual([]);
  });

  it('카테고리 리터럴 유니온을 exhaustive로 유지', () => {
    expect(DESCRIPTION_FORBIDDEN_CATEGORIES).toEqual(['dosage_change', 'diagnosis', 'success_rate', 'treatment_strategy']);
  });

  it('expectTypeOf — return shape', () => {
    expectTypeOf(validateDescription).returns.toMatchTypeOf<DescriptionValidationResult>();
    expectTypeOf(detectForbiddenPhrases).returns.toMatchTypeOf<ForbiddenPhraseHit[]>();
  });

  it('expectTypeOf — category literal union', () => {
    expectTypeOf<ForbiddenPhraseHit['category']>().toEqualTypeOf<(typeof DESCRIPTION_FORBIDDEN_CATEGORIES)[number]>();
  });
});
