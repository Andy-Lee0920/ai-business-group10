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

  it('renders type-first clinic focus copy before medication detail on /home', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'med-now', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T09:05:00.000Z' }),
      item({ id: 'clinic-soon', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:45:00.000Z' }),
    ]);

    expect(markup).toContain('data-focus-kind="clinic_soon"');
    expect(markup).toContain('data-testid="home-hero-zone"');
    expect(markup).toContain('오늘 병원 가는 날');
    expect(markup).toContain('방문 시간만 먼저 볼게요');
    expect(markup.indexOf('오늘 병원 가는 날')).toBeLessThan(markup.indexOf('듀파스톤'));
  });

  it('uses the home header action for reminder settings instead of duplicating schedule add', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'later-medication', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T11:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="home-reminder-toggle"');
    expect(markup).toContain('data-reminder-state="on"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('lucide-bell');
    expect(markup).toContain('width:44px;height:44px');
    expect(markup).toContain('box-shadow:0 12px 28px rgba(196, 97, 74, 0.16)');
    expect(markup).not.toContain('알림 켬');
    expect(markup).not.toContain('알림 끔');
    expect(markup).not.toContain('aria-label="일정 추가"');
  });

  it('renders the storyline hero as a full-bleed zone before day tabs and cards', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'injection-now', type: 'injection', title: 'Menopur', dose: '150', unit: 'IU', scheduled_at: '2026-05-14T09:10:00.000Z' }),
      item({ id: 'injection-next', type: 'injection', title: 'Cetrotide', dose: '0.25', unit: 'mg', scheduled_at: '2026-05-14T19:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="home-hero-zone"');
    expect(markup).toContain('position:sticky');
    expect(markup).toContain('height:66dvh');
    expect(markup).toContain('display:flex');
    expect(markup).toContain('flex-direction:column');
    expect(markup).toContain('margin-top:-22px');
    expect(markup).toContain('min-height:calc(34dvh + 22px)');
    expect(markup).toContain('height:100%');
    expect(markup).toContain('object-fit:cover');
    expect(markup).toContain('opacity:0.22');
    expect(markup).toContain('linear-gradient(180deg, rgba(250,247,242,0.94) 0%, rgba(250,247,242,0.78) 44%, var(--slc-bg) 100%)');
    expect(markup).toContain('home-injection-bg-v2.png');
    expect(markup).not.toContain('data-testid="home-focus-hero"');
    expect(markup.indexOf('data-testid="home-hero-zone"')).toBeLessThan(markup.indexOf('aria-label="일정 날짜"'));
  });



  it('promotes the current injection through the hero CTA and keeps it out of the list', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'injection-now', type: 'injection', title: 'Menopur', dose: '150', unit: 'IU', scheduled_at: '2026-05-14T09:10:00.000Z' }),
      item({ id: 'injection-next', type: 'injection', title: 'Cetrotide', dose: '0.25', unit: 'mg', scheduled_at: '2026-05-14T19:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="injection-countdown-hero"');
    expect(markup).toContain('천천히 준비하면 돼요');
    expect(markup).toContain('align-content:center');
    expect(markup).toContain('background:transparent');
    expect(markup).toContain('box-shadow:none');
    expect(markup).toContain('width:100%;min-height:52px');
    expect(markup).toContain('Menopur 150 IU');
    expect(markup).toContain('다음 주사');
    expect(markup).toContain('Cetrotide 0.25 mg');
    expect(markup).not.toContain('data-card-emphasis="primary"');
  });


  it('shows a first schedule saved from onboarding on /home', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'onboarding-first', type: 'injection', title: '고날에프 주사', source: 'onboarding_interview', scheduled_at: '2026-05-14T09:10:00.000Z' }),
    ]);

    expect(markup).toContain('고날에프 주사');
    expect(markup).toContain('주사');
  });

  it('renders the one-hour injection countdown arc on /home', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'injection-countdown', type: 'injection', title: '고날에프 주사', scheduled_at: '2026-05-14T09:45:00.000Z' }),
      item({ id: 'next-injection', type: 'injection', title: '오비드렐', scheduled_at: '2026-05-14T21:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="injection-countdown-hero"');
    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).toContain('data-testid="countdown-sheet-lift"');
    expect(markup).toContain('data-testid="countdown-sheet-mini-arc"');
    expect(markup).toContain('상단 메뉴와 함께 올라오는 주사 카운트다운');
    expect(markup).toContain('주사 준비');
    expect(markup).toContain('남은 시간');
    expect(markup).toContain('45:00');
    expect(markup).toContain('다음 주사');
    expect(markup).toContain('data-testid="countdown-info-block"');
    expect(markup).toContain('min-height:52px');
    expect(markup).toContain('background:var(--slc-coral-gradient)');
  });

  it('uses a compact hero card for an incomplete schedule outside the countdown window', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'later-medication', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T11:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="home-hero-compact-card"');
    expect(markup).toContain('오늘 할 일');
    expect(markup).toContain('듀파스톤');
    expect(markup.match(/data-card-emphasis=/g)).toHaveLength(1);
  });

  it('keeps missed cards calm without AI-slop left accent borders or duplicating the hero item in the list', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'late-injection', type: 'injection', title: '확인 필요 주사', status: 'missed', scheduled_at: '2026-05-13T23:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-focus-kind="overdue_backlog"');
    expect(markup).not.toMatch(/border-left|borderLeft/u);
    expect(markup).toContain('확인이 필요한 주사가 있어요');
    expect(markup).toContain('08:00 예정된 주사 기록이 아직 완료되지 않았어요.');
    expect(markup).toContain('완료로 기록');
    expect(markup).toContain('시간 수정');
  });

  it('shows tomorrow card after today is completed and removes recent-completed home section', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'done-today', type: 'injection', title: '오늘 완료 주사', status: 'completed', scheduled_at: '2026-05-14T09:00:00.000Z' }),
      item({ id: 'tomorrow-clinic', type: 'clinic', title: '내일 병원', scheduled_at: '2026-05-15T09:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-testid="home-hero-compact-card"');
    expect(markup).toContain('내일 일정');
    expect(markup).toContain('내일 병원');
    expect(markup).not.toContain('최근 완료');
    expect(markup).not.toContain('aria-label="최근 완료"');
  });

  it('uses tomorrow medication copy for injection or medication fallback after today is completed', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'done-today', type: 'injection', title: '오늘 완료 주사', status: 'completed', scheduled_at: '2026-05-14T09:00:00.000Z' }),
      item({ id: 'tomorrow-injection', type: 'injection', title: '내일 고날에프', scheduled_at: '2026-05-15T09:00:00.000Z' }),
    ]);

    expect(markup).toContain('내일 준비되셨나요');
    expect(markup).toContain('내일 고날에프');
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
    expect(markup).toContain('home-waiting-bg.png');
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

  it('renders safe empty-home copy without a partner banner', () => {
    const markup = renderToStaticMarkup(React.createElement(TodayScreen, {
      initialItems: [],
      initialClinicUpdates: [],
      userId: 'patient-1',
    }));

    expect(markup).toContain('오늘은 예정된 일정이 없어요');
    expect(markup).toContain('아직 사이클 기록이 없습니다');
    expect(markup).toContain('새 일정이 생기면 여기에서 바로 보여드릴게요');
    expect(markup).not.toContain('data-testid="pending-partner-request-card"');
    expect(markup).not.toContain('승인하기');
  });

  it('shows the first-schedule medication empty illustration after the user skips onboarding schedule', () => {
    const markup = renderToStaticMarkup(React.createElement(TodayScreen, {
      initialItems: [],
      initialClinicUpdates: [],
      userId: 'patient-1',
      firstScheduleSkipped: true,
    }));

    expect(markup).toContain('등록된 약 일정이 없습니다');
    expect(markup).not.toContain('아직 사이클 기록이 없습니다');
    expect(markup).toContain('새 일정이 생기면 여기에서 바로 보여드릴게요');
  });

  it('hides the cycle empty illustration when today has schedule data', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'scheduled-item', type: 'injection', title: '고날에프 주사', scheduled_at: '2026-05-14T09:10:00.000Z' }),
    ]);

    expect(markup).not.toContain('아직 사이클 기록이 없습니다');
    expect(markup).toContain('고날에프 주사');
  });
});

function render(initialItems: ScheduleItem[], initialClinicUpdates: ClinicUpdate[] = []) {
  return renderToStaticMarkup(React.createElement(TodayScreen, {
    initialItems,
    initialClinicUpdates,
    userId: 'patient-1',
  }));
}
