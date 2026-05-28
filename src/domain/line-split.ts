import { inferCardType as inferCareCardType } from './care-cards';
import type { AssignedTo, CardType } from '../types/care-cards.types';

export type { AssignedTo, CardType };

export type SplitCandidate = {
  id: string;
  sourceText: string;
  sourceOffsetStart: number | null;
  sourceOffsetEnd: number | null;
  suggestedCardType: CardType | null;
  assignedTo: AssignedTo | null;
  confidence: 'high' | 'needs_confirmation';
  uncertaintyReason: string | null;
  orderIndex: number;
};

export type SplitLine = {
  text: string;
  offsetStart: number;
  offsetEnd: number;
};

export type NullableSourceOffset = {
  offsetStart: number | null;
  offsetEnd: number | null;
};

const MIN_FRAGMENT_LENGTH = 3;

const LIST_MARKER_PATTERN = /^\s*(?:[-*•]|\d+[.)]|[가-힣][.)])\s+/u;

function trimRange(input: string, offsetStart: number, offsetEnd: number): SplitLine | null {
  const value = input.slice(offsetStart, offsetEnd);
  const leadingLength = value.match(/^\s*/u)?.[0].length ?? 0;
  const trailingLength = value.match(/\s*$/u)?.[0].length ?? 0;
  const start = offsetStart + leadingLength;
  const end = offsetEnd - trailingLength;
  if (start >= end) return null;
  return { text: input.slice(start, end), offsetStart: start, offsetEnd: end };
}

function stripListMarker(input: string, part: SplitLine): SplitLine | null {
  const match = part.text.match(LIST_MARKER_PATTERN);
  const offsetStart = match ? part.offsetStart + match[0].length : part.offsetStart;
  return trimRange(input, offsetStart, part.offsetEnd);
}

function splitInputLines(input: string) {
  const lines: Array<{ offsetStart: number; offsetEnd: number }> = [];
  const newlinePattern = /\r?\n/gu;
  let offsetStart = 0;

  for (const match of input.matchAll(newlinePattern)) {
    const offsetEnd = match.index;
    lines.push({ offsetStart, offsetEnd });
    offsetStart = offsetEnd + match[0].length;
  }

  lines.push({ offsetStart, offsetEnd: input.length });
  return lines;
}

function splitSentences(input: string, part: SplitLine): SplitLine[] {
  const sentences: SplitLine[] = [];
  const separatorPattern = /(?<=[.!?。！？])\s+/gu;
  let offsetStart = part.offsetStart;

  for (const match of input.slice(part.offsetStart, part.offsetEnd).matchAll(separatorPattern)) {
    const offsetEnd = part.offsetStart + match.index;
    const sentence = trimRange(input, offsetStart, offsetEnd);
    if (sentence) sentences.push(sentence);
    offsetStart = offsetEnd + match[0].length;
  }

  const sentence = trimRange(input, offsetStart, part.offsetEnd);
  if (sentence) sentences.push(sentence);
  return sentences;
}

function mergeShortFragments(input: string, parts: SplitLine[]) {
  return parts.reduce<SplitLine[]>((merged, part) => {
    const previous = merged[merged.length - 1];
    const boundary = previous ? input.slice(previous.offsetEnd, part.offsetStart) : '';
    if (part.text.length < MIN_FRAGMENT_LENGTH && previous && !/[\r\n]/u.test(boundary)) {
      previous.offsetEnd = part.offsetEnd;
      previous.text = input.slice(previous.offsetStart, previous.offsetEnd);
      return merged;
    }

    merged.push(part);
    return merged;
  }, []);
}

export function splitLines(input: string | null | undefined): SplitLine[] {
  if (!input?.trim()) return [];

  const seen = new Set<string>();
  const rawParts = splitInputLines(input)
    .map((line) => trimRange(input, line.offsetStart, line.offsetEnd))
    .filter((line): line is SplitLine => line !== null)
    .map((line) => stripListMarker(input, line))
    .filter((line): line is SplitLine => line !== null)
    .flatMap((line) => splitSentences(input, line))
    .map((line) => stripListMarker(input, line))
    .filter((line): line is SplitLine => line !== null);

  return mergeShortFragments(input, rawParts).filter((part) => {
    const normalized = part.text.replace(/\s+/gu, ' ').trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function findSourceOffset(input: string, sourceText: string, searchStart = 0): NullableSourceOffset {
  const text = sourceText.trim();
  if (!text) return { offsetStart: null, offsetEnd: null };

  const offsetStart = input.indexOf(text, Math.max(0, searchStart));
  if (offsetStart === -1) return { offsetStart: null, offsetEnd: null };
  return { offsetStart, offsetEnd: offsetStart + text.length };
}

export function mapSourceOffsets(input: string, sourceTexts: readonly string[]): NullableSourceOffset[] {
  let searchStart = 0;
  return sourceTexts.map((sourceText) => {
    const offset = findSourceOffset(input, sourceText, searchStart);
    if (offset.offsetEnd !== null) {
      searchStart = offset.offsetEnd;
      return offset;
    }

    return findSourceOffset(input, sourceText);
  });
}

export function inferCardType(
  text: string | null | undefined,
  assignedTo: AssignedTo,
  userSelectedCardType?: CardType | null,
  suggestedCardType?: CardType | null,
): CardType {
  return inferCareCardType(text, assignedTo, userSelectedCardType, suggestedCardType);
}
