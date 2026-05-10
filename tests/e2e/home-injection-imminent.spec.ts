import { expect, test } from '@playwright/test';

test('imminent injection appears above other confirmed cards with urgency copy', async ({ page }) => {
  await page.goto('/home');

  const cards = page.getByTestId('home-action-card');
  await expect(cards.first()).toContainText('고날에프');
  await expect(cards.first()).toContainText(/지금 ±30분|시간 다 됐어요/);
  await expect(cards.nth(1)).toContainText('프로게스테론');
});
