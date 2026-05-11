import type { CardType } from '../types/care-cards.types';
import { inferCardType } from './care-cards';
import { splitLines } from './line-split';

export type ProtocolDraftItem = {
  sourceText: string;
  suggestedCardType: CardType;
  scheduledAt: string | null;
  careDate: string | null;
  confidence: 'high' | 'needs_confirmation';
  uncertaintyReason: string | null;
  orderIndex: number;
};

export function createProtocolDraft(rawInstruction: string, baseDate = new Date()): ProtocolDraftItem[] {
  return splitLines(rawInstruction).map((sourceText, orderIndex) => {
    const suggestedCardType = inferCardType(sourceText, 'my_action');
    const scheduledAt = extractScheduledAt(sourceText, baseDate);
    const careDate = extractCareDate(sourceText, baseDate) ?? scheduledAt?.slice(0, 10) ?? null;
    const uncertaintyReason = getUncertaintyReason(sourceText, suggestedCardType, scheduledAt);
    return {
      sourceText,
      suggestedCardType,
      scheduledAt,
      careDate,
      confidence: uncertaintyReason ? 'needs_confirmation' : 'high',
      uncertaintyReason,
      orderIndex,
    };
  });
}

function getUncertaintyReason(sourceText: string, cardType: CardType, scheduledAt: string | null) {
  if (cardType === 'general_action') return '분류가 애매해요. 실행 카드로 넣기 전 확인이 필요해요.';
  if ((cardType === 'injection' || cardType === 'medication' || cardType === 'clinic_visit') && !scheduledAt && !/오늘|내일|모레|\d{1,2}[/-]\d{1,2}/u.test(sourceText)) {
    return '시간이나 날짜가 빠져 있어요. 확정 전 한 번 더 확인해 주세요.';
  }
  if ((cardType === 'injection' || cardType === 'medication') && !/[가-힣A-Za-z]{2,}/u.test(sourceText.replace(/주사|약|복용|질정/gu, ''))) {
    return '약 이름이 분명하지 않아요. 직접 확인해 주세요.';
  }
  return null;
}

function extractScheduledAt(sourceText: string, baseDate: Date) {
  const timeMatch = sourceText.match(/(?:오전\s*|오후\s*|밤\s*)?(\d{1,2})(?::(\d{2})|시\s*(?:(\d{1,2})분?)?)/u);
  if (!timeMatch) return null;
  const meridiem = sourceText.includes('오후') || sourceText.includes('밤') ? 'pm' : sourceText.includes('오전') ? 'am' : null;
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? timeMatch[3] ?? '0');
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  const date = dateFromText(sourceText, baseDate) ?? new Date(baseDate);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function extractCareDate(sourceText: string, baseDate: Date) {
  return dateFromText(sourceText, baseDate)?.toISOString().slice(0, 10) ?? null;
}

function dateFromText(sourceText: string, baseDate: Date) {
  const date = new Date(baseDate);
  if (sourceText.includes('내일')) {
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }
  if (sourceText.includes('모레')) {
    date.setUTCDate(date.getUTCDate() + 2);
    return date;
  }
  if (sourceText.includes('오늘')) return date;

  const match = sourceText.match(/(\d{1,2})[/-](\d{1,2})/u);
  if (!match) return null;
  date.setUTCMonth(Number(match[1]) - 1, Number(match[2]));
  return date;
}
