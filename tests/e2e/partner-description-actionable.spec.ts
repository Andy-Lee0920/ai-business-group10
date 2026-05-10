import { expect, test } from '@playwright/test';

test('partner view shows confirmed action cue without raw memo leak', async ({ page }) => {
  await page.route('**/api/partner/e2e-token/cards', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            title: '고날에프 주사',
            scheduled_at: '2026-05-10T21:00:00.000+09:00',
            card_type: 'injection',
            description: '오늘 21시 고날에프 1회',
            display_state: 'current',
          },
        ],
      }),
    });
  });

  await page.goto('/partner/e2e-token');

  await expect(page.getByText('오늘 21시 고날에프 1회')).toBeVisible();
  await expect(page.getByText(/원문 메모|raw memo|visit_inputs|source_input_id/)).toHaveCount(0);
});
