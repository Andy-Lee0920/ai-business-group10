import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildReminderPushPayload, getReminderPushWindows } from '../../src/domain/reminder-dispatch';
import { getHomePendingItems, getSchedulePresentation, resolveHomeFocus } from '../../src/domain/slc-home-focus';
import { resolveMedicationReferenceAsset } from '../../src/domain/medication-reference-assets';
import type { ScheduleItem } from '../../src/types/slc.types';

const NOW = new Date('2026-05-14T09:00:00.000Z');

const item = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'injection',
  title: '고날에프',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-14T10:00:00.000Z',
  status: 'upcoming',
  source: 'capture',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

describe('SLC persona heuristics', () => {
  it('keeps ten real-use personas aligned with clinic-entry, due-time, push, and medication-image expectations', () => {
    const clinicForm = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');
    const personaEvidence = [
      {
        persona: '진료 후 안내문 사진만 가진 사용자',
        assert: () => {
          expect(clinicForm).toContain('진료 내용을 남겨주세요');
          expect(clinicForm).toContain('안내문 사진으로 남기기');
        },
      },
      {
        persona: '문자 안내를 받은 사용자',
        assert: () => {
          expect(clinicForm).toContain('문자로 받은 안내 붙여넣기');
          expect(clinicForm).toContain('확인한 일정 저장');
        },
      },
      {
        persona: '사진과 문자가 없어 직접 적는 사용자',
        assert: () => {
          expect(clinicForm).toContain('진료 내용 직접 남기기');
          expect(clinicForm).toContain('질문으로 정리하기');
        },
      },
      {
        persona: '주사 시간이 10분 남은 사용자',
        assert: () => {
          const due = item({ id: 'due-ovidrel', title: '오비드렐', scheduled_at: '2026-05-14T09:10:00.000Z' });
          expect(resolveHomeFocus([due], NOW)).toMatchObject({ kind: 'medication_due', badgeLabel: '지금', heading: '확인할 시간이 가까워졌어요' });
          expect(getSchedulePresentation(due, NOW)).toMatchObject({ badgeLabel: '지금', badgeTone: 'coral' });
        },
      },
      {
        persona: '주사와 병원 방문이 모두 가까운 사용자',
        assert: () => {
          const items = [
            item({ id: 'due-injection', title: '오비트렐', scheduled_at: '2026-05-14T09:05:00.000Z' }),
            item({ id: 'clinic-soon', type: 'clinic', title: '초음파 내원', scheduled_at: '2026-05-14T09:45:00.000Z' }),
          ];
          expect(resolveHomeFocus(items, NOW)).toMatchObject({ kind: 'medication_due', primaryItem: { id: 'due-injection' } });
          expect(getHomePendingItems(items, NOW).map((candidate) => candidate.id)).toEqual(['due-injection', 'clinic-soon']);
        },
      },
      {
        persona: '오늘 복용약이 있지만 아직 여유가 있는 사용자',
        assert: () => {
          const nextMedication = item({ id: 'next-medication', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T11:00:00.000Z' });
          expect(resolveHomeFocus([nextMedication], NOW)).toMatchObject({ kind: 'medication_upcoming', heading: '다음 일정이 준비되어 있어요' });
          expect(getSchedulePresentation(nextMedication, NOW)).toMatchObject({ badgeLabel: '다음', badgeTone: 'default' });
        },
      },
      {
        persona: '한 시간이 안 남은 방문을 앞둔 사용자',
        assert: () => {
          const clinic = item({ id: 'clinic', type: 'clinic', title: '채혈 방문', scheduled_at: '2026-05-14T09:40:00.000Z' });
          expect(resolveHomeFocus([clinic], NOW)).toMatchObject({ kind: 'clinic_soon', badgeLabel: '병원', heading: '오늘 병원 가는 날' });
        },
      },
      {
        persona: '내일 병원 방문을 확인해야 하는 사용자',
        assert: () => {
          const tomorrow = item({ id: 'clinic-tomorrow', type: 'clinic', title: '내일 병원', scheduled_at: '2026-05-15T09:00:00.000Z' });
          expect(resolveHomeFocus([tomorrow], NOW)).toMatchObject({ kind: 'clinic_tomorrow', heading: '내일 병원 준비를 확인해요' });
        },
      },
      {
        persona: '약 이름을 다르게 적은 사용자',
        assert: () => {
          expect(resolveMedicationReferenceAsset({ medicationId: null, title: '오비트렐 250 주사' })).toMatchObject({ assetPath: '/assets/medications/ovidrel.svg' });
          expect(resolveMedicationReferenceAsset({ medicationId: 'cetro', title: null })).toMatchObject({ assetPath: '/assets/medications/cetrotide.svg' });
        },
      },
      {
        persona: '푸시 알림으로 시간만 확인하는 사용자',
        assert: () => {
          expect(getReminderPushWindows(NOW).map((window) => window.channel)).toEqual(['web_push_t60', 'web_push_t15']);
          expect(buildReminderPushPayload({
            candidate: {
              cardId: 'card-1',
              title: '오비트렐 · 250mcg · 22:00',
              cardType: 'injection',
              scheduledAt: '2026-05-14T13:00:00.000Z',
              recipientEmail: 'patient@example.com',
            },
            appUrl: 'https://project-oznp0.vercel.app',
          })).toMatchObject({ url: '/home', tag: 'fevio-reminder-card-1' });
        },
      },
    ];

    expect(personaEvidence).toHaveLength(10);
    for (const evidence of personaEvidence) evidence.assert();
  });
});
