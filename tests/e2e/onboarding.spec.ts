import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function acceptPrivacyForOnboarding(context: BrowserContext) {
  await context.addCookies([{ name: 'fevio_privacy_gate_v1', value: 'accepted', domain: '127.0.0.1', path: '/', sameSite: 'Lax' }]);
}

async function goToAddMethod(page: Page) {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /본인/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '추가하기' }).click();
}

test('onboarding shell renders premium brand intro, role cards, first-add prompt, and add-method cards', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: /소중한 시작을/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();

  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('heading', { name: '어떤 화면으로 시작할까요?' })).toBeVisible();
  await page.getByRole('button', { name: /본인/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('heading', { name: /병원 안내를/ })).toBeVisible();
  await page.getByRole('button', { name: '추가하기' }).click();

  await expect(page.getByRole('heading', { name: '어떻게 추가할까요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /사진으로 남기기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /문자로 붙여넣기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /직접 적기/ })).toBeVisible();
});

test('partner role exits to invite guidance without saving sensitive data', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /파트너/ }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page.getByRole('heading', { name: '파트너는 초대 링크로 들어와 주세요' })).toBeVisible();
  await expect(page.getByText('파트너 계정 없이 링크 안내만 보여드리고 온보딩을 종료합니다.')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('textarea')).toHaveCount(0);
});

test('photo processing uses native picker, shows progress, and sends edited candidate confirmation', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/photo-upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ path: 'patient-1/clinic-photo.jpg' }),
    });
  });
  await page.route('**/api/onboard/photo-analyze', async (route) => {
    const body = route.request().postDataJSON() as { imagePath: string };
    expect(body.imagePath).toBe('patient-1/clinic-photo.jpg');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'candidate-1',
            type: 'injection',
            title: '고날에프',
            scheduled_at: '2026-05-15T12:00:00.000Z',
            dose: '150',
            unit: 'IU',
          },
        ],
      }),
    });
  });
  await page.route('**/api/onboard/candidates/confirm', async (route) => {
    const body = route.request().postDataJSON() as {
      confirmedIds: string[];
      rejectedIds: string[];
      candidateEdits: Array<{ id: string; title: string; dose: string; unit: string }>;
    };
    expect(body.confirmedIds).toEqual(['candidate-1']);
    expect(body.rejectedIds).toEqual([]);
    expect(body.candidateEdits[0]).toMatchObject({ id: 'candidate-1', title: '수정한 고날에프', dose: '225', unit: 'IU' });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        savedCount: 1,
        items: [
          {
            id: 'schedule-1',
            patient_id: 'patient-1',
            type: 'injection',
            title: '수정한 고날에프',
            scheduled_at: '2026-05-15T12:30:00.000Z',
            dose: '225',
            unit: 'IU',
            status: 'upcoming',
            source: 'capture',
            created_at: '2026-05-15T00:00:00.000Z',
          },
        ],
      }),
    });
  });
  await page.route('**/api/onboarding/complete', async (route) => {
    const body = route.request().postDataJSON() as { partnerInvite: { intent: string } };
    expect(body.partnerInvite.intent).toBe('prepare_invite');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ redirectTo: '/home' }),
    });
  });
  await page.route('**/home', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<main><h1>오늘 일정</h1><article>수정한 고날에프 225 IU</article></main>',
    });
  });

  await goToAddMethod(page);
  await page.getByRole('button', { name: /사진으로 남기기/ }).click();

  await expect(page.locator('input[type="file"][accept="image/*"][capture="environment"]')).toHaveCount(1);
  await expect(page.locator('input[type="file"][accept="image/*"]:not([capture])')).toHaveCount(1);

  await page.locator('input[type="file"][accept="image/*"][capture="environment"]').setInputFiles({
    name: 'clinic-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake clinic photo'),
  });

  await expect(page.getByLabel('사진 처리 상태').getByText('업로드 완료')).toBeVisible();
  await expect(page.getByLabel('사진 처리 상태').getByText('내용 분석 중')).toBeVisible();
  await expect(page.getByLabel('사진 처리 상태').getByText('일정 후보 준비')).toBeVisible();
  await expect(page.getByRole('heading', { name: /저장 전,/ })).toBeVisible();
  await expect(page.getByLabel('고날에프 요약')).toContainText('주사');
  await expect(page.getByLabel('고날에프 요약')).toContainText('150 IU');

  await page.getByLabel('제목').fill('수정한 고날에프');
  await page.getByLabel('시간').fill('2026-05-15T21:30');
  await page.getByLabel('용량').fill('225');
  await page.getByLabel('단위').fill('IU');
  await page.getByRole('button', { name: '일정 확인하기' }).click();

  await expect(page.getByRole('heading', { name: '어떻게 시작할까요?' })).toBeVisible();
  await expect(page.getByText('수정한 고날에프 일정이 홈에 반영되도록 저장됐어요.')).toBeVisible();
  await page.getByRole('button', { name: /파트너와 함께 쓸게요/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('heading', { name: '일정 후보를 만들었어요' })).toBeVisible();
  await expect(page.getByLabel('일정 후보 요약')).toContainText('수정한 고날에프');
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('heading', { name: '오늘 일정' })).toBeVisible();
  await expect(page.getByText('수정한 고날에프 225 IU')).toBeVisible();
});

test('text paste analyzes pasted clinic text into reusable candidate review', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/text-analyze', async (route) => {
    const body = route.request().postDataJSON() as { rawText: string };
    expect(body.rawText).toContain('세트로타이드');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'candidate-text-1',
            type: 'medication',
            title: '세트로타이드',
            scheduled_at: '2026-05-15T10:00:00.000Z',
            dose: '0.25',
            unit: 'mg',
          },
        ],
      }),
    });
  });

  await goToAddMethod(page);
  await page.getByRole('button', { name: /문자로 붙여넣기/ }).click();
  await expect(page.getByRole('heading', { name: '병원 안내를 붙여넣어 주세요' })).toBeVisible();
  await page.getByLabel('병원 안내문').fill('오늘 오전 10시 세트로타이드 0.25 mg');
  await expect(page.getByText(/\d+\/1000/)).toBeVisible();
  await page.getByRole('button', { name: '분석하기' }).click();

  await expect(page.getByRole('heading', { name: /저장 전,/ })).toBeVisible();
  await expect(page.getByLabel('세트로타이드 요약')).toContainText('약 복용');
  await expect(page.getByLabel('세트로타이드 요약')).toContainText('0.25 mg');
});

test('text paste offers direct entry fallback when no schedule candidates are found', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/text-analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    });
  });

  await goToAddMethod(page);
  await page.getByRole('button', { name: /문자로 붙여넣기/ }).click();
  await page.getByLabel('병원 안내문').fill('오늘 컨디션 잘 보세요');
  await page.getByRole('button', { name: '분석하기' }).click();

  await expect(page.getByText('일정을 찾지 못했어요')).toBeVisible();
  await page.getByRole('button', { name: '직접 입력으로 바꾸기' }).click();
  await expect(page.getByRole('heading', { name: '기억나는 일정만 적어주세요' })).toBeVisible();
});

test('photo processing falls back to direct entry when no candidates are extracted', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/photo-upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ path: 'patient-1/empty-photo.jpg' }),
    });
  });
  await page.route('**/api/onboard/photo-analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    });
  });

  await goToAddMethod(page);
  await page.getByRole('button', { name: /사진으로 남기기/ }).click();
  await page.locator('input[type="file"][accept="image/*"][capture="environment"]').setInputFiles({
    name: 'empty-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('no schedule'),
  });

  await expect(page.getByText('사진에서 일정을 찾지 못했어요')).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 찍기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '기억나는 일정만 적어주세요' })).toBeVisible();
});

test('direct entry path previews and saves the remembered schedule before sharing', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/schedule/add', async (route) => {
    const body = route.request().postDataJSON() as { title: string; type: string; scheduledAt: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ item: { id: 'schedule-1', status: 'upcoming', source: 'manual', scheduled_at: body.scheduledAt, ...body } }),
    });
  });

  await goToAddMethod(page);
  await page.getByRole('button', { name: /직접 적기/ }).click();

  await expect(page.getByRole('heading', { name: '기억나는 일정만 적어주세요' })).toBeVisible();
  await page.getByLabel('일정 이름').fill('고날에프 주사');
  await page.getByLabel('시간').fill('21:00');
  await page.getByLabel('용량').fill('150');
  await page.getByLabel('단위').fill('IU');

  await expect(page.getByLabel('홈 미리보기')).toContainText('고날에프 주사');
  await expect(page.getByLabel('홈 미리보기')).toContainText('21:00');
  await page.getByRole('button', { name: '이 일정 기억하기' }).click();

  await expect(page.getByRole('heading', { name: '어떻게 시작할까요?' })).toBeVisible();
  await expect(page.getByText('고날에프 주사 일정이 홈에 반영되도록 저장됐어요.')).toBeVisible();
});
