import { expect, test, type BrowserContext } from '@playwright/test';

async function acceptPrivacyForOnboarding(context: BrowserContext) {
  await context.addCookies([{ name: 'fevio_privacy_gate_v1', value: 'accepted', domain: '127.0.0.1', path: '/', sameSite: 'Lax' }]);
}

test('onboarding shell renders brand intro, patient experience sub-step, and add-method cards', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: '오늘 필요한 것만 보여드릴게요' })).toBeVisible();
  await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();

  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('heading', { name: '누구로 시작할까요?' })).toBeVisible();
  await page.getByRole('button', { name: /치료자 내 병원 안내/ }).click();
  await expect(page.getByRole('heading', { name: '치료 경험을 알려주세요' })).toBeVisible();
  await page.getByRole('button', { name: /처음/ }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page.getByRole('heading', { name: '어떻게 추가할까요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /사진으로 남기기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /문자로 붙여넣기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /직접 적기/ })).toBeVisible();
});

test('partner role exits to invite guidance without saving sensitive data', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /파트너 치료자가 보낸/ }).click();

  await expect(page.getByRole('heading', { name: '파트너는 초대 링크로 들어와 주세요' })).toBeVisible();
  await expect(page.getByText('파트너 계정 없이 링크 안내만 보여드리고 온보딩을 종료합니다.')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('textarea')).toHaveCount(0);
});


test('direct entry path previews and saves the remembered schedule before sharing', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/schedule/add', async (route) => {
    const body = route.request().postDataJSON() as { title: string; type: string; scheduledAt: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ item: { id: 'schedule-1', status: 'upcoming', source: 'manual', ...body } }),
    });
  });

  await page.goto('/onboarding');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /치료자 내 병원 안내/ }).click();
  await page.getByRole('button', { name: /처음/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: /직접 적기/ }).click();

  await expect(page.getByRole('heading', { name: '기억나는 일정만 적어주세요' })).toBeVisible();
  await page.getByLabel('일정 이름').fill('고날에프 주사');
  await page.getByLabel('시간').fill('21:00');
  await page.getByLabel('용량').fill('150');
  await page.getByLabel('단위').fill('IU');

  await expect(page.getByLabel('홈 미리보기')).toContainText('고날에프 주사');
  await expect(page.getByLabel('홈 미리보기')).toContainText('21:00');
  await page.getByRole('button', { name: '이 일정 기억하기' }).click();

  await expect(page.getByRole('heading', { name: '공유 설정은 다음 단계에서 준비됩니다' })).toBeVisible();
});
