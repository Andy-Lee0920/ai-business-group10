import { expect, test } from '@playwright/test';

test('home opens as a cinematic Care OS surface instead of a generic card list', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/home?care=injection');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByTestId('compact-hero-greeting')).toContainText('주사 준비');
  await expect(page.getByRole('navigation', { name: '케어 단계 전환' })).toBeVisible();
  await expect(page.getByTestId('mission-card-pair')).toBeVisible();
  await expect(page.getByTestId('quick-stat-row')).toContainText('주사 시간');
  await expect(page.getByTestId('partner-connect-bar')).toBeVisible();
  await expect(page.getByText('확정된 카드')).toHaveCount(0);
  await expect(page.getByText('Low-energy input')).toHaveCount(0);
  await expect(page.getByText('Dynamic Home')).toHaveCount(0);
  await expect(page.getByTestId('care-moment-ring')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘의 실행 카드' })).toHaveCount(0);
  await expect(page.getByText('임박')).toHaveCount(0);
});
