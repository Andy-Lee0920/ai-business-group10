import { describe, expect, expectTypeOf, it } from 'vitest';
import { inferCardType, splitLines, type AssignedTo, type CardType, type SplitLine } from '../../src/domain/line-split';

function expectRoundTrip(rawText: string, parts: readonly SplitLine[]) {
  for (const part of parts) {
    expect(rawText.slice(part.offsetStart, part.offsetEnd)).toBe(part.text);
  }
}

describe('splitLines', () => {
  it('separates newlines and numbered lists', () => {
    const rawText = '1. 오전 9시 주사\n2. 내일 병원 방문';
    const parts = splitLines(rawText);

    expect(parts.map((part) => part.text)).toEqual(['오전 9시 주사', '내일 병원 방문']);
    expectRoundTrip(rawText, parts);
  });

  it('trims blanks and removes empty lines', () => {
    const rawText = '  주사 준비  \n\n   약 복용   ';
    const parts = splitLines(rawText);

    expect(parts.map((part) => part.text)).toEqual(['주사 준비', '약 복용']);
    expectRoundTrip(rawText, parts);
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

  it('preserves offsets across long sentences, duplicates, and emoji plus Hangul text', () => {
    const fixtures = [
      '오늘 밤 10시 오비드렐 주사',
      '병원 안내가 길어요. 내일 오전 9시 채혈하고 오후 2시 결과 확인',
      '주사 준비\n주사 준비',
      '💉 오늘 밤 주사\n내일 병원 방문',
      '가. 질정 복용\n나. 병원에 확인',
    ];

    for (const rawText of fixtures) {
      const parts = splitLines(rawText);
      expect(parts.length).toBeGreaterThan(0);
      expectRoundTrip(rawText, parts);
    }
  });

  it('has a public return type of offset-bearing line fragments', () => {
    expectTypeOf(splitLines).returns.toEqualTypeOf<SplitLine[]>();
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
