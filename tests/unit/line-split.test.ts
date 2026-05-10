import { describe, expect, expectTypeOf, it } from 'vitest';
import { inferCardType, splitLines, type AssignedTo, type CardType } from '../../src/domain/line-split';

describe('splitLines', () => {
  it('separates newlines and numbered lists', () => {
    expect(splitLines('1. 오전 9시 주사\n2. 내일 병원 방문')).toEqual(['오전 9시 주사', '내일 병원 방문']);
  });

  it('trims blanks and removes empty lines', () => {
    expect(splitLines('  주사 준비  \n\n   약 복용   ')).toEqual(['주사 준비', '약 복용']);
  });

  it('returns one candidate for a single line', () => {
    expect(splitLines('다음 방문 일정 확인')).toHaveLength(1);
  });

  it('does not mutate the input string value', () => {
    const input = '주사\n약';
    splitLines(input);
    expect(input).toBe('주사\n약');
  });

  it('handles nullish and blank boundaries safely', () => {
    expect(splitLines(null)).toEqual([]);
    expect(splitLines(undefined)).toEqual([]);
    expect(splitLines('   ')).toEqual([]);
  });

  it('has a public return type of string array', () => {
    expectTypeOf(splitLines).returns.toEqualTypeOf<string[]>();
    expectTypeOf(splitLines).parameter(0).toEqualTypeOf<string | null | undefined>();
  });
});

describe('inferCardType', () => {
  it('uses deterministic keyword rules instead of LLM decisioning', () => {
    expect(inferCardType('오비드렐 주사 밤 10시', 'my_action')).toBe('injection');
    expect(inferCardType('프로기노바 약 복용', 'my_action')).toBe('medication');
    expect(inferCardType('내일 병원 초음파', 'my_action')).toBe('clinic_visit');
  });

  it('maps clinic confirmation assignment before keyword fallback', () => {
    expect(inferCardType('주사 용량 헷갈림', 'clinic_confirmation')).toBe('clinic_confirmation');
  });

  it('honors user-selected card type and only then suggested card type', () => {
    expect(inferCardType('일반 메모', 'my_action', 'record', 'injection')).toBe('record');
    expect(inferCardType('물 많이 마시기', 'my_action', null, 'partner_support')).toBe('partner_support');
  });

  it('returns general_action for unknown text', () => {
    expect(inferCardType('가볍게 걷기', 'my_action')).toBe('general_action');
  });

  it('has public literal-constrained types', () => {
    expectTypeOf(inferCardType).returns.toMatchTypeOf<CardType>();
    expectTypeOf(inferCardType).parameter(1).toMatchTypeOf<AssignedTo>();
  });
});
