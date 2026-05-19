import { expect, test } from '@playwright/test';

test('prescription capture turns one photo into confirmable canonical care card candidates', async ({ page }) => {
  const calls: string[] = [];
  await page.route('**/api/onboard/photo-upload', async (route) => {
    calls.push('/api/onboard/photo-upload');
    await route.fulfill({ json: { path: 'presentation/test-photo.jpg' } });
  });
  await page.route('**/api/onboard/photo-analyze', async (route) => {
    calls.push('/api/onboard/photo-analyze');
    await route.fulfill({ json: { candidates: [{ id: 'candidate-1', type: 'injection', title: '오비드렐 주사', scheduled_at: '2026-05-19T21:00:00.000Z', dose: '250', unit: 'mcg' }] } });
  });
  await page.route('**/api/onboard/candidates/confirm', async (route) => {
    calls.push('/api/onboard/candidates/confirm');
    expect(route.request().postDataJSON()).toMatchObject({
      confirmedIds: ['candidate-1'],
      candidateEdits: [expect.objectContaining({ id: 'candidate-1', type: 'injection', title: '오비드렐 주사', assignedTo: 'partner_action', scheduled_at: '2026-05-19T13:00:00.000Z' })],
    });
    await route.fulfill({ json: { savedCount: 1, items: [{ title: '오비드렐 주사' }] } });
  });

  await page.goto('/onboard/prescription-capture');
  await page.getByLabel('병원 안내문 사진').setInputFiles({ name: 'clinic-note.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image') });
  await page.getByRole('button', { name: '카드 후보 만들기' }).click();

  await expect(page.getByLabel('카드 후보 확인')).toBeVisible();
  await expect(page.locator('input[value="오비드렐 주사"]')).toBeVisible();
  await page.getByLabel('담당').selectOption('partner_action');
  await page.getByLabel('후보 시간').fill('2026-05-19T22:00');
  await page.getByRole('button', { name: '확인 후 저장' }).click();

  await expect(page.getByText('저장됐어요. 1개 카드가 준비됐습니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/home');
  expect(calls).toEqual(['/api/onboard/photo-upload', '/api/onboard/photo-analyze', '/api/onboard/candidates/confirm']);
});
