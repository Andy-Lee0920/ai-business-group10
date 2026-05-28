import { expect, test } from '@playwright/test';
import type { CareActionCard } from '../../src/types/care-cards.types';
import type { TreatmentMilestone } from '../../src/types/treatment-timeline.types';

test('home reflects the confirmed TreatmentTimeline milestone as the care phase', async ({ page }) => {
  const today = isoDate(0);
  await page.context().addCookies([
    timelineCookie([
      makeMilestone({ milestone: 'stimulation_start', confirmedAt: today }),
    ]),
  ]);

  await page.goto('/home');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase-care-day', 'injection_day');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-surface-care-day', 'injection_day');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-override-reason', 'none');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-intensity', '0.50');
  await expect(page.getByTestId('compact-hero-greeting')).toContainText('주사 준비');
});

test('home surfaces a trigger shot card above the timeline phase and exposes override evidence', async ({ page }) => {
  const today = isoDate(0);
  await page.context().addCookies([
    timelineCookie([
      makeMilestone({ milestone: 'embryo_transfer', confirmedAt: isoDate(-3) }),
    ]),
    timelineCardsCookie([
      makeCard({
        id: 'trigger-override-card',
        cardType: 'injection',
        title: '22:00 오비드렐 트리거 확인',
        scheduledAt: `${today}T13:00:00.000Z`,
        careDate: today,
        description: '병원에서 확정한 트리거 주사 시간만 함께 확인해요.',
      }),
    ]),
  ]);

  await page.goto('/home');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase-care-day', 'waiting_day');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-surface-care-day', 'injection_day');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-override-reason', 'trigger_shot');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-intensity', '1.00');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-applied-rules', /trigger-shot-hero/);
  await expect(page.getByTestId('care-moment-ring')).toBeVisible();
  await expect(page.getByTestId('mission-card-pair')).toContainText('오비드렐 트리거 확인');
  await expect(page.getByText(/Dynamic Home|signalGrid|rev \d+/)).toHaveCount(0);
});



test('home suppresses the primary mission card when timeline has no confirmed cards', async ({ page }) => {
  const today = isoDate(0);
  await page.context().addCookies([
    timelineCookie([
      makeMilestone({ milestone: 'stimulation_start', confirmedAt: today }),
    ]),
    timelineCardsCookie([]),
  ]);

  await page.goto('/home');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-intensity', '0.15');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-applied-rules', /no-cards-suppress-primary/);
  await expect(page.getByTestId('compact-hero-greeting')).toContainText('오늘은 확인할 케어가 없어요. 쉬어도 좋은 날이에요.');
  await expect(page.getByTestId('mission-card-pair')).toHaveCount(0);
});

function timelineCookie(milestones: TreatmentMilestone[]) {
  return {
    name: 'fevio_treatment_milestones',
    value: encodeURIComponent(JSON.stringify(milestones)),
    domain: '127.0.0.1',
    path: '/',
  };
}

function timelineCardsCookie(cards: CareActionCard[]) {
  return {
    name: 'fevio_treatment_cards',
    value: encodeURIComponent(JSON.stringify(cards)),
    domain: '127.0.0.1',
    path: '/',
  };
}

function makeMilestone({ milestone, confirmedAt }: { milestone: TreatmentMilestone['milestone']; confirmedAt: string }): TreatmentMilestone {
  return {
    id: `milestone-${milestone}`,
    cycle_id: 'cycle-e2e',
    couple_id: 'couple-e2e',
    milestone,
    confirmed_at: confirmedAt,
    notes: null,
    created_at: `${confirmedAt}T00:00:00.000Z`,
  };
}

function makeCard({
  id,
  cardType,
  title,
  scheduledAt,
  careDate,
  description,
}: {
  id: string;
  cardType: CareActionCard['card_type'];
  title: string;
  scheduledAt: string;
  careDate: string;
  description: string;
}): CareActionCard {
  return {
    id,
    couple_id: 'couple-e2e',
    created_by: 'user-e2e',
    assignee_role: 'primary_user',
    card_type: cardType,
    title,
    description,
    source_text: title,
    scheduled_at: scheduledAt,
    care_date: careDate,
    status: 'confirmed',
    confirmation_required: true,
    user_marked_important: true,
    partner_visible: true,
    revision: 1,
  };
}

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
