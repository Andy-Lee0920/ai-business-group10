import { expect, test } from '@playwright/test';

test('mobile visitor sees the Fevio SLC shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('병원 메모를 오늘의 실행 카드로 바꾸는 웹앱')).toBeVisible();
  await expect(page.getByRole('link', { name: '병원 메모 입력 준비' })).toHaveAttribute('href', '/capture');
});
