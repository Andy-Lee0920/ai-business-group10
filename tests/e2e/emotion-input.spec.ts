import { expect, test } from '@playwright/test';

test('emotion input is private by default and only shares a safe partner signal when selected', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/emotion');

  await expect(page.getByRole('heading', { name: '감정 부담을 조용히 남겨요' })).toBeVisible();
  await expect(page.getByText('환자')).toHaveCount(0);

  await page.getByRole('button', { name: '불안해요' }).click();
  await page.getByLabel('부담 정도').fill('5');
  await page.getByLabel('나만 보는 메모').fill('실패할까봐 너무 무서워');
  await page.getByRole('button', { name: '감정 기록 저장' }).click();

  const privateCard = page.getByTestId('emotion-card');
  await expect(privateCard).toContainText('비공개');
  await expect(privateCard).toContainText('감정 기록 · 불안해요');
  await expect(privateCard).toContainText('원문 메모는 파트너 화면에 보내지 않아요');
  await expect(privateCard).not.toContainText('실패할까봐');

  await page.getByRole('button', { name: '파트너에게 조용한 도움 신호만 공유할래요' }).click();
  await page.getByRole('button', { name: '감정 기록 저장' }).click();

  await expect(privateCard).toContainText('공유됨');
  await expect(privateCard).toContainText('공유된 감정 신호');
  await expect(privateCard).toContainText('해결책보다 조용한 도움');
  await expect(privateCard).not.toContainText('실패할까봐');
});
