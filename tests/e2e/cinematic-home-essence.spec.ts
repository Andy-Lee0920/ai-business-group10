import { expect, test } from '@playwright/test';

test('home opens as a cinematic Care OS surface instead of a generic card list', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/home');

  await expect(page.getByRole('heading', { name: /오늘의 케어 운영/ })).toBeVisible();
  await expect(page.getByText('병원 밖에서 흩어지는 일정·약·감정')).toBeVisible();
  await expect(page.getByText('파트너에게는 지금 맡을 역할만')).toBeVisible();
  await expect(page.getByRole('heading', { name: '파트너에게는 “도와줘”가 아니라 역할로 번역돼요' })).toBeVisible();
  await expect(page.getByText('확정된 카드')).toHaveCount(0);
  await expect(page.getByText('Low-energy input')).toHaveCount(0);
});
