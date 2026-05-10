import { inferCardType as inferCareCardType } from './care-cards';
import type { AssignedTo, CardType } from '../types/care-cards.types';

export type { AssignedTo, CardType };

export type SplitCandidate = {
  id: string;
  sourceText: string;
  suggestedCardType: CardType | null;
  assignedTo: AssignedTo | null;
  confidence: 'high' | 'needs_confirmation';
  uncertaintyReason: string | null;
  orderIndex: number;
};

const MIN_FRAGMENT_LENGTH = 3;

function stripListMarker(value: string) {
  return value.replace(/^\s*(?:[-*•]|\d+[.)]|[가-힣][.)])\s+/, '').trim();
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?。！？])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mergeShortFragments(parts: string[]) {
  return parts.reduce<string[]>((merged, part) => {
    if (part.length < MIN_FRAGMENT_LENGTH && merged.length > 0) {
      const previous = merged[merged.length - 1];
      merged[merged.length - 1] = `${previous} ${part}`.trim();
      return merged;
    }

    merged.push(part);
    return merged;
  }, []);
}

export function splitLines(input: string | null | undefined): string[] {
  if (!input?.trim()) return [];

  const seen = new Set<string>();
  const rawParts = input
    .split(/\r?\n/u)
    .flatMap((line) => splitSentences(stripListMarker(line)))
    .map(stripListMarker)
    .filter(Boolean);

  return mergeShortFragments(rawParts).filter((part) => {
    const normalized = part.replace(/\s+/gu, ' ').trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
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
