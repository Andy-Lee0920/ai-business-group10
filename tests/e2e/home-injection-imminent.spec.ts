import { expect, test } from '@playwright/test';

test('imminent injection appears above other confirmed cards with urgency copy', async ({ page }) => {
  await page.goto('/home');

  const mission = page.getByTestId('mission-card-pair');
  await expect(mission).toContainText('고날에프');
  await expect(mission).toContainText(/준비 체크리스트 보기|오늘의 미션/);
  await expect(page.getByTestId('quick-stat-row')).toContainText('고날에프');
  await expect(page.getByTestId('mission-card-pair')).toContainText('오비드렐');
});
