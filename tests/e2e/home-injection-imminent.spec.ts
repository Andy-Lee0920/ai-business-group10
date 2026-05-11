import { expect, test } from '@playwright/test';

test('imminent injection appears above other confirmed cards with urgency copy', async ({ page }) => {
  await page.goto('/home');

  const cards = page.getByTestId('home-action-card');
  await expect(cards.first()).toContainText('고날에프');
  await expect(cards.first()).toContainText(/30분 전|먼저 확인|지금 함께 확인/);
  await expect(page.getByTestId('home-action-card').filter({ hasText: '프로게스테론' })).toHaveCount(1);
});
