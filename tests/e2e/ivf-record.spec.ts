import { expect, test } from '@playwright/test';

test('IVF record input stays private by default and shares only safe context when selected', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/ivf-record');

  await expect(page.getByRole('heading', { name: '시술 기록을 부담 없이 남겨요' })).toBeVisible();
  await expect(page.getByText('환자')).toHaveCount(0);

  await page.getByRole('button', { name: '배아 배양' }).click();
  await page.getByLabel('날짜').fill('2026-05-14');
  await page.getByLabel('확인한 기록').fill('4BC 배아 리포트 확인');
  await page.getByLabel('나만 보는 메모').fill('등급 때문에 마음이 흔들림');
  await page.getByRole('button', { name: 'IVF 기록 저장' }).click();

  const card = page.getByTestId('ivf-record-card');
  await expect(card).toContainText('비공개');
  await expect(card).toContainText('IVF 기록 · 배아 배양');
  await expect(card).not.toContainText('4BC');
  await expect(card).not.toContainText('등급 때문에');

  await page.getByRole('button', { name: '파트너에게 안전한 단계 요약만 공유할래요' }).click();
  await page.getByRole('button', { name: 'IVF 기록 저장' }).click();

  await expect(card).toContainText('공유됨');
  await expect(card).toContainText('공유된 IVF 기록');
  await expect(card).toContainText('결과를 단정하지 말고');
  await expect(card).not.toContainText('4BC');
});
