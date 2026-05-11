import { expect, test } from '@playwright/test';

test('home opens as a cinematic Care OS surface instead of a generic card list', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/home?care=injection');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByRole('heading', { name: '오늘은 시간을 함께 지키는 날' })).toBeVisible();
  await expect(page.getByTestId('care-moment-ring')).toBeVisible();
  await expect(page.getByTestId('operational-glass-sheet')).toBeVisible();
  await expect(page.getByTestId('partner-presence-pulse')).toBeVisible();
  await expect(page.getByText('확정된 카드')).toHaveCount(0);
  await expect(page.getByText('Low-energy input')).toHaveCount(0);
  await expect(page.getByText('Dynamic Home')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘의 실행 카드' })).toHaveCount(0);
  await expect(page.getByText('임박')).toHaveCount(0);
});
