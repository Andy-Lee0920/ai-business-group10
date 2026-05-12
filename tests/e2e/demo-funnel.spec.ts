import { expect, test } from '@playwright/test';

test('demo turns a hospital memo into patient and partner care surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/demo');

  await expect(page.getByRole('heading', { name: '병원 안내가 두 개의 케어 화면으로 바뀝니다' })).toBeVisible();
  await expect(page.getByText(/Generative UI|Care State Engine|7단계 데모 시작하기/)).toHaveCount(0);

  await page.getByRole('button', { name: '병원 안내 넣어보기' }).click();
  await expect(page.getByTestId('demo-input-screen')).toBeVisible();
  await page.getByRole('button', { name: '약 봉투·메모 사진 예시로 채우기' }).click();
  await expect(page.getByLabel('병원 안내 메모')).toContainText('고날에프 225IU');
  await page.getByRole('button', { name: 'Fevio에 넣기' }).click();

  await expect(page.getByTestId('demo-parsing-screen')).toBeVisible();
  await expect(page.getByText('약·주사')).toBeVisible();
  await expect(page.getByText('고날에프 225IU', { exact: true })).toBeVisible();
  await expect(page.getByText('파트너 역할')).toBeVisible();

  await expect(page.getByTestId('demo-preview-stage')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('demo-device-frame')).toHaveCount(2);
  await expect(page.getByTestId('source-to-care-bridge')).toContainText('Fevio가 읽은 병원 안내');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('고날에프 225IU');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('주사 30분 전 준비물 확인');
  await expect(page.getByRole('heading', { name: '내 화면', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '파트너 화면', exact: true })).toBeVisible();
  await expect(page.getByText(/AI 분석 완료|stage detected|confidence 0\.83|LIVE SYNC|rev \d+/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: '다른 안내로 다시 보기' })).toBeVisible();
});
