import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodayScreen } from '../../src/features/today/today-screen';
import type { ClinicUpdate, ScheduleItem } from '../../src/types/slc.types';

const item = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'injection',
  title: '고날에프',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-14T09:00:00.000Z',
  status: 'upcoming',
  source: 'manual',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const update = (overrides: Partial<ClinicUpdate>): ClinicUpdate => ({
  id: 'update-1',
  patient_id: 'patient-1',
  same_medication: true,
  added_medication_ids: [],
  medication_days: null,
  next_visit_at: null,
  trigger_plan: null,
  memo: null,
  created_at: '2026-05-14T10:05:00.000Z',
  ...overrides,
});

describe('SLC home screen vertical slices', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a medication-first full-bleed care-state hero instead of an embryo story surface', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'med-now', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T09:05:00.000Z' }),
      item({ id: 'clinic-soon', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:45:00.000Z' }),
    ]);

    expect(markup).toContain('data-hero-surface="execution"');
    expect(markup).toContain('data-home-experience="care-state-hero"');
    expect(markup).toContain('data-testid="home-full-bleed-hero"');
    expect(markup).toContain('data-testid="home-hero-zone"');
    expect(markup).toContain('data-focus-kind="medication_due"');
    expect(markup).toContain('data-testid="home-operation-screen"');
    expect(markup).toContain('position:sticky');
    expect(markup).toContain('height:90dvh');
    expect(markup).toContain('확인할 항목은 아래에 접어뒀어요');
    expect(markup).toContain('오늘 필요한 실행만 먼저 보고');
    expect(markup).toContain('data-testid="home-care-ops-promise"');
    expect(markup).toContain('오늘 실행 기준');
    expect(markup).toContain('원문 확인 후 저장');
    expect(markup).toContain('파트너 역할만');
    expect(markup).toContain('오늘 확인할 항목');
    expect(markup.indexOf('듀파스톤')).toBeLessThan(markup.indexOf('차병원 방문'));
    expect(markup).not.toContain('오늘의 배아');
  });

  it('uses the home header action for reminder settings instead of duplicating schedule add', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'later-medication', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T11:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="home-reminder-toggle"');
    expect(markup).toContain('data-reminder-state="off"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('lucide-bell-off');
    expect(markup).toContain('width:44px;height:44px');
    expect(markup).not.toContain('알림 켬');
    expect(markup).not.toContain('알림 끔');
    expect(markup.indexOf('data-testid="home-reminder-toggle"')).toBeLessThan(markup.indexOf('aria-label="일정 추가"'));
  });

  it('promotes the current injection through the full-bleed hero CTA and keeps reference images available', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'ovidrel', type: 'injection', title: '오비드렐', dose: '250', unit: 'mcg', scheduled_at: '2026-05-14T09:10:00.000Z' }),
      item({ id: 'injection-next', type: 'injection', title: 'Cetrotide', dose: '0.25', unit: 'mg', scheduled_at: '2026-05-14T19:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="injection-countdown-hero"');
    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).not.toContain('data-testid="countdown-sheet-lift"');
    expect(markup).toContain('오비드렐 250 mcg');
    expect(markup).toContain('주사하기');
    expect(markup).not.toContain('시간 변경');
    expect(markup).toContain('남은 시간');
  });

  it('keeps missed cards operational without blame copy', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'late-injection', type: 'injection', title: '확인 필요 주사', status: 'missed', scheduled_at: '2026-05-13T23:00:00.000Z' }),
    ]);

    expect(markup).toContain('확인이 필요한 일정이 있어요');
    expect(markup).toContain('완료로 기록');
    expect(markup).toContain('확인 필요');
    expect(markup).not.toContain('미기록');
    expect(markup).not.toContain('잘 하고 있어요');
  });

  it('uses KST day boundaries for the today tab even when the runtime timezone is UTC-like', () => {
    vi.setSystemTime(new Date('2026-05-14T15:30:00.000Z')); // 2026-05-15 00:30 KST

    const markup = render([
      item({ id: 'kst-today', type: 'injection', title: 'KST 오늘 주사', scheduled_at: '2026-05-14T16:00:00.000Z' }),
      item({ id: 'kst-yesterday', type: 'injection', title: 'KST 어제 주사', scheduled_at: '2026-05-14T14:30:00.000Z' }),
    ]);

    expect(markup).toContain('KST 오늘 주사');
    expect(markup).not.toContain('KST 어제 주사');
  });

  it('does not render post-clinic prompt after a relevant clinic update exists', () => {
    vi.setSystemTime(new Date('2026-05-14T10:30:00.000Z'));

    const markup = render(
      [item({ id: 'clinic-1', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:00:00.000Z' })],
      [update({ created_at: '2026-05-14T10:05:00.000Z' })],
    );

    expect(markup).not.toContain('병원 다녀오셨나요?');
    expect(markup).not.toContain('업데이트하기');
  });

  it('renders the clinic update prompt banner without changing follow-up visibility', () => {
    vi.setSystemTime(new Date('2026-05-14T10:05:00.000Z'));

    const markup = render([
      item({ id: 'clinic-1', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="clinic-follow-up-prompt"');
    expect(markup).toContain('implantation_wait.png');
    expect(markup).toContain('alt=""');
    expect(markup).toContain('바뀐 게 있나요?');
    expect(markup).toContain('href="/clinic-update"');
  });

  it('renders a post-clinic banner after a past injection without a next injection schedule', () => {
    vi.setSystemTime(new Date('2026-05-14T10:30:00.000Z'));

    const markup = render([
      item({ id: 'past-injection', type: 'injection', title: '고날에프 주사', scheduled_at: '2026-05-14T09:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="post-clinic-banner"');
    expect(markup).toContain('병원 다녀오셨나요? 기록해두면 다음 주사 알림이 정확해져요');
  });

  it('hides the post-clinic banner when a future injection schedule exists', () => {
    vi.setSystemTime(new Date('2026-05-14T10:30:00.000Z'));

    const markup = render([
      item({ id: 'past-injection', type: 'injection', title: '고날에프 주사', scheduled_at: '2026-05-14T09:00:00.000Z' }),
      item({ id: 'future-injection', type: 'injection', title: '오비드렐', scheduled_at: '2026-05-14T21:00:00.000Z' }),
    ]);

    expect(markup).not.toContain('data-testid="post-clinic-banner"');
  });

  it('renders safe empty-home copy with clear add paths', () => {
    const markup = renderToStaticMarkup(React.createElement(TodayScreen, {
      initialItems: [],
      initialClinicUpdates: [],
      userId: 'patient-1',
    }));

    expect(markup).toContain('오늘은 예정된 일정이 없어요');
    expect(markup).toContain('새 일정이 생기면 여기에서 바로 보여드릴게요');
    expect(markup).toContain('병원 안내 넣기');
    expect(markup).toContain('직접 추가');
    expect(markup).not.toContain('data-testid="pending-partner-request-card"');
    expect(markup).not.toContain('승인하기');
  });

  it('shows clinic note, recent record, and partner sync sections as secondary home context', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'done-today', type: 'injection', title: '오늘 완료 주사', status: 'completed', scheduled_at: '2026-05-14T08:00:00.000Z' }),
      item({ id: 'clinic-visit', type: 'clinic', title: '난포 확인 방문', scheduled_at: '2026-05-14T10:30:00.000Z' }),
    ]);

    expect(markup).toContain('최근 완료 기록');
    expect(markup).toContain('병원 안내 기준');
    expect(markup).toContain('공유 상태');
    expect(markup).toContain('함께 챙길 역할만 공유해요');
    expect(markup).toContain('원문 없이 준비, 동행, 확인처럼 실행에 필요한 역할만 보냅니다.');
    expect(markup).toContain('병원 원문, 검사 결과, 감정 기록은 자동 공유하지 않아요.');
  });
});

function render(initialItems: ScheduleItem[], initialClinicUpdates: ClinicUpdate[] = []) {
  return renderToStaticMarkup(React.createElement(TodayScreen, {
    initialItems,
    initialClinicUpdates,
    userId: 'patient-1',
  }));
}
