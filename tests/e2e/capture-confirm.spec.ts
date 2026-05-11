import { expect, test } from '@playwright/test';

test('privacy unaccepted /capture redirects to /privacy', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/capture');

  await expect(page).toHaveURL(/\/privacy$/u);
  await expect(page.getByRole('heading', { name: '민감정보와 의료 경계 동의' })).toBeVisible();
});

test('memo capture flows through split review, confirm, and home', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/capture');

  await expect(page).toHaveURL(/\/capture$/u);
  await expect(page.getByRole('button', { name: '사진으로 안내문 촬영' })).toBeVisible();
  await expect(page.getByLabel('병원 안내문 사진 촬영')).toHaveAttribute('accept', 'image/*');
  await page.getByLabel('병원에서 들은 내용').fill('1. 오늘 밤 10시 오비드렐 주사\n2. 남편이 주사 준비 도와주기');
  await page.getByRole('button', { name: '케어 흐름으로 나누기' }).click();

  await expect(page).toHaveURL(/\/split-review\?draftId=/u);
  await expect(page.getByText('오늘 밤 10시 오비드렐 주사')).toBeVisible();
  await page.getByRole('group', { name: '1번 항목 분류' }).getByRole('button', { name: '내 할 일' }).click();
  await page.getByRole('group', { name: '2번 항목 분류' }).getByRole('button', { name: '파트너에게 공유' }).click();
  await page.getByRole('button', { name: '확정하기' }).click();

  await expect(page).toHaveURL(/\/\?capture=confirmed$/u);
  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/u })).toBeVisible();
});
