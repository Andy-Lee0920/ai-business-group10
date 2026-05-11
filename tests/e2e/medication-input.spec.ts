import { expect, test } from '@playwright/test';

test('low-energy medication input creates one explicit-dose card and can mark it completed', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/medication');

  await expect(page.getByRole('heading', { name: '약·주사 챙김을 짧게 남겨요' })).toBeVisible();
  await expect(page.getByText('환자')).toHaveCount(0);

  await page.getByRole('button', { name: '주사' }).click();
  await page.getByLabel('이름').fill('오비드렐');
  await page.getByLabel('용량').fill('250mcg');
  await page.getByRole('button', { name: '용량을 내가 확인했어요' }).click();
  await page.getByLabel('시간').fill('22:00');
  await page.getByRole('group', { name: '반복 선택' }).getByRole('button', { name: '매일' }).click();
  await page.getByRole('button', { name: '꼭 챙겨야 해요' }).click();
  await page.getByRole('button', { name: '카드 만들기' }).click();

  const card = page.getByTestId('medication-card');
  await expect(card).toContainText('오비드렐');
  await expect(card).toContainText('250mcg');
  await expect(card).toContainText('22:00');
  await expect(card).toContainText('매일');
  await expect(card.getByText('확정')).toBeVisible();

  await card.getByRole('button', { name: '완료로 표시' }).click();
  await expect(card.getByText('완료')).toBeVisible();
});
