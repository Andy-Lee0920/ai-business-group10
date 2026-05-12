import { describe, expect, it } from 'vitest';
import { deriveClinicFocus } from '../../src/features/adaptive-home/clinic-focus-package';
import type { HomeActionCard } from '../../src/domain/home-composition';
import type { QuietChecklistItem } from '../../src/features/adaptive-home/care-surface-model';

function card(title: string, description: string | null = null): HomeActionCard {
  return {
    id: title,
    title,
    description,
    scheduledAt: null,
    cardType: 'clinic_visit',
    displaySafetyLevel: 'normal',
    accentClassName: 'home-card--calm',
    urgencyCopy: null,
  };
}

const checklist: QuietChecklistItem[] = [
  { id: 'condition', title: '복부 통증 변화', description: '어제보다 불편했어요', badge: '방문 준비' },
  { id: 'schedule', title: '다음 방문일 확인', description: '결과와 다음 일정 기록', badge: '방문 준비' },
  { id: 'medication', title: '프로게스테론 주사', description: '용량과 시간 확인', badge: '방문 준비' },
];

describe('ClinicFocusPackage', () => {
  it('pairs a dynamic schedule title with schedule-first modules', () => {
    const focus = deriveClinicFocus([card('목요일 오전 9시 다음 방문')], checklist);

    expect(focus.kind).toBe('schedule');
    expect(focus.title).toBe('다음 일정이 바뀌었는지 확인해요');
    expect(focus.primaryLabel).toBe('다음 안내');
    expect(focus.primaryCta).toBe('다음 안내 확인하기');
    expect(focus.checklistLabel).toBe('오늘 일정 확인 항목');
    expect(focus.stats(focus.items.length)).toContainEqual({ label: '다음 안내', value: '확인' });
    expect(focus.items[0]?.id).toBe('schedule');
  });

  it('pairs a medication title with medication-first modules', () => {
    const focus = deriveClinicFocus([card('프로게스테론 주사 시간 변경', '용량과 시간 확인')], checklist);

    expect(focus.kind).toBe('medication');
    expect(focus.title).toBe('바뀐 약과 주사를 먼저 말해요');
    expect(focus.primaryLabel).toBe('약·주사');
    expect(focus.primaryCta).toBe('약·주사 확인하기');
    expect(focus.checklistLabel).toBe('약·주사 확인 항목');
    expect(focus.items[0]?.id).toBe('medication');
  });

  it('pairs a condition title with condition-first modules', () => {
    const focus = deriveClinicFocus([card('복부 통증이 어제보다 심했음')], checklist);

    expect(focus.kind).toBe('condition');
    expect(focus.title).toBe('몸 상태 변화를 빠뜨리지 않아요');
    expect(focus.primaryLabel).toBe('몸 상태');
    expect(focus.primaryCta).toBe('몸 상태 확인하기');
    expect(focus.checklistLabel).toBe('몸 상태 변화 항목');
    expect(focus.items[0]?.id).toBe('condition');
  });
});
