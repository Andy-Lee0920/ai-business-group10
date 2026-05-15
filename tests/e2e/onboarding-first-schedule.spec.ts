import { expect, test } from '@playwright/test';

test('onboarding first schedule is saved only after user confirmation', async ({ context, page }) => {
  await context.addCookies([
    { name: 'fevio_privacy_gate_v1', value: 'accepted', domain: '127.0.0.1', path: '/', sameSite: 'Lax' },
  ]);

  const onboardingRequests: unknown[] = [];

  await page.route('**/api/clinic-guide/normalize', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        matched: { id: 'gonal-f', brand_name_ko: '고날에프', brand_name_en: 'Gonal-F', aliases: ['고날'], category: 'stimulation', route: 'subcutaneous_injection', default_unit: 'IU', default_cta: '주사하기', patient_label: '고날에프', time_criticality: 'high', is_slc_seed: true },
        source: 'aliases',
      }),
    });
  });

  await page.route('**/api/onboarding', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') onboardingRequests.push(request.postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, role: 'patient', redirectTo: '/home', firstScheduleItem: { id: 'schedule-1' } }),
    });
  });

  await page.goto('/onboarding');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /나는 기록자예요/ }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await page.getByLabel(/개인정보 수집·이용/).check();
  await page.getByLabel(/민감정보 처리/).check();
  await page.getByLabel(/의료 판단을 하지 않음/).check();
  await page.getByLabel(/AI\/입력 보조는 자동 저장하지 않음/).check();
  await page.getByRole('button', { name: '첫 일정 입력하기' }).click();

  await expect(page.getByRole('heading', { name: '처음 확인할 일정을 하나만 남겨주세요' })).toBeVisible();
  await expect.poll(() => onboardingRequests.length).toBe(0);

  await page.getByLabel('약품 검색').fill('고날');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByText(/입력 보조가 `고날에프`를 찾았어요/)).toBeVisible();
  await page.getByLabel('용량').fill('150');
  await page.getByLabel('단위').fill('IU');
  await page.getByRole('button', { name: '확인 단계로' }).click();

  await expect(page.getByRole('heading', { name: '이 일정으로 Home을 시작할게요' })).toBeVisible();
  await expect(page.getByText('source: onboarding_interview · requiresUserConfirmation: true')).toBeVisible();
  await expect.poll(() => onboardingRequests.length).toBe(0);

  await page.getByRole('button', { name: '확인하고 저장' }).click();
  await expect.poll(() => onboardingRequests.length).toBe(1);
  expect(onboardingRequests[0]).toMatchObject({
    role: 'patient',
    consentChecks: {
      privacy_boundary: true,
      sensitive_data: true,
      clinical_boundary: true,
      input_assist_boundary: true,
    },
    firstSchedule: {
      type: 'injection',
      title: '고날에프',
      source: 'onboarding_interview',
      medicationId: 'gonal-f',
      dose: '150',
      unit: 'IU',
      inputAssist: { source: 'aliases', requiresUserConfirmation: true },
    },
  });
});
