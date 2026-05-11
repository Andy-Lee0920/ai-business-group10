import { expect, test } from '@playwright/test';

test('onboarding is one shared path where partner invite can be skipped and first injection reaches home state', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: '처음 설정을 같이 해요' })).toBeVisible();
  await expect(page.getByText('환자 앱')).toHaveCount(0);
  await expect(page.getByText('파트너 앱')).toHaveCount(0);

  await page.getByRole('button', { name: '주사/채취 준비 중' }).click();
  await page.getByRole('button', { name: '내가 주로 기록해요' }).click();
  await page.getByRole('button', { name: '주사', exact: true }).click();
  await page.getByRole('textbox', { name: '첫 실행 항목' }).fill('오늘 밤 9시 주사 확인');
  await page.getByRole('button', { name: '지금은 건너뛰기' }).click();
  await page.getByRole('button', { name: '홈 만들기' }).click();

  await expect(page).toHaveURL(/\/home$/u);
  await expect(page.getByRole('heading', { name: '주사 시간부터 함께 확인해요' })).toBeVisible();
  await expect(page.getByText('오늘은 주사 시간이 먼저 보여요.')).toBeVisible();
  await expect(page.getByText('오늘 밤 9시 주사 확인')).toBeVisible();
});
