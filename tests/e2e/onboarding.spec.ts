import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function acceptPrivacyForOnboarding(context: BrowserContext) {
  await context.addCookies([{ name: 'fevio_privacy_gate_v1', value: 'accepted', domain: '127.0.0.1', path: '/', sameSite: 'Lax' }]);
}

async function goToPhotoCapture(page: Page) {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /내 케어/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
}

test('onboarding shell defaults to photo capture with text fallback', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: /소중한 시작을/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();

  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('heading', { name: '어떤 역할로 함께할까요?' })).toBeVisible();
  await expect(page.getByText('확인한 일정은 내 홈에, 필요한 도움만 파트너 화면에 나눠 보여드려요.')).toBeVisible();
  await expect(page.getByRole('button', { name: '이전 단계로 돌아가기' })).toBeVisible();
  await page.getByRole('button', { name: /내 케어/ }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('button', { name: '이전 단계로 돌아가기' })).toBeVisible();

  await expect(page.getByRole('heading', { name: '병원 안내문을 사진으로 남겨주세요' })).toBeVisible();
  await expect(page.getByText('처방지나 안내문을 찍어주시면 확인할 일정 후보로만 정리해요.')).toBeVisible();
  await expect(page.getByRole('button', { name: '안내문 찍기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '사진에서 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '건너뛰기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '이전 단계로 돌아가기' })).toBeVisible();
  await page.getByRole('button', { name: '이전 단계로 돌아가기' }).click();
  await expect(page.getByRole('heading', { name: '어떤 역할로 함께할까요?' })).toBeVisible();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' }).click();
  await expect(page.getByRole('heading', { name: '받은 병원 안내를 붙여넣어 주세요' })).toBeVisible();
});

test('partner role exits to invite guidance without saving sensitive data', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.goto('/onboarding');

  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: /파트너/ }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page.getByRole('heading', { name: '초대 링크에서 파트너 도움 화면을 열어요' })).toBeVisible();
  await expect(page.getByText('원문 안내와 민감한 메모는 파트너 화면에 보내지 않아요.')).toBeVisible();
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
      body: '<main><h1>오늘 실행</h1><article>수정한 고날에프 225 IU</article></main>',
    });
  });

  await goToPhotoCapture(page);

  await expect(page.locator('input[type="file"][accept="image/*"][capture="environment"]')).toHaveCount(1);
  await expect(page.locator('input[type="file"][accept="image/*"]:not([capture])')).toHaveCount(1);

  await page.locator('input[type="file"][accept="image/*"][capture="environment"]').setInputFiles({
    name: 'clinic-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake clinic photo'),
  });

  await expect(page.getByLabel('사진 처리 상태').getByText('사진 받음')).toBeVisible();
  await expect(page.getByLabel('사진 처리 상태').getByText('일정 후보 정리 중')).toBeVisible();
  await expect(page.getByLabel('사진 처리 상태').getByText('확인 단계 준비')).toBeVisible();
  await expect(page.getByRole('heading', { name: /반복 일정은/ })).toBeVisible();
  await expect(page.getByLabel('고날에프 요약')).toContainText('주사');
  await expect(page.getByLabel('고날에프 요약')).toContainText('150 IU');

  await page.getByLabel('제목').fill('수정한 고날에프');
  await page.getByLabel('시간').fill('2026-05-15T21:30');
  await page.getByLabel('용량').fill('225');
  await page.getByLabel('단위').fill('IU');
  await page.getByRole('button', { name: '일정 확인하기' }).click();

  await expect(page.getByRole('heading', { name: '공유 범위를 정할까요?' })).toBeVisible();
  await expect(page.getByText('수정한 고날에프 일정이 내 홈에 반영되도록 저장됐어요.')).toBeVisible();
  await page.getByRole('button', { name: /파트너 도움 화면도 준비할게요/ }).click();
  await expect(page.getByRole('heading', { name: '확인할 일정 후보를 만들었어요' })).toBeVisible();
  await expect(page.getByLabel('확인할 일정 요약')).toContainText('수정한 고날에프');
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('heading', { name: '오늘 실행' })).toBeVisible();
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

  await goToPhotoCapture(page);
  await page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' }).click();
  await expect(page.getByRole('heading', { name: '받은 병원 안내를 붙여넣어 주세요' })).toBeVisible();
  await page.getByLabel('받은 안내').fill('오늘 오전 10시 세트로타이드 0.25 mg');
  await expect(page.getByText(/\d+\/1000/)).toBeVisible();
  await page.getByRole('button', { name: '일정 후보 정리하기' }).click();

  await expect(page.getByRole('heading', { name: /반복 일정은/ })).toBeVisible();
  await expect(page.getByLabel('세트로타이드 요약')).toContainText('약 복용');
  await expect(page.getByLabel('세트로타이드 요약')).toContainText('0.25 mg');
});

test('candidate review summarizes repeated schedules before item-level edits', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/text-analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: Array.from({ length: 6 }, (_, index) => ({
          id: `repeat-${index + 1}`,
          type: 'injection',
          title: '고날에프',
          scheduled_at: `2026-05-${15 + Math.floor(index / 2)}T${index % 2 === 0 ? '09' : '21'}:00:00.000Z`,
          dose: '150',
          unit: 'IU',
        })),
      }),
    });
  });

  await goToPhotoCapture(page);
  await page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' }).click();
  await page.getByLabel('받은 안내').fill('오늘밤부터 고날에프 3일간 하루 두번 150IU');
  await page.getByRole('button', { name: '일정 후보 정리하기' }).click();

  await expect(page.getByRole('heading', { name: /반복 일정은/ })).toBeVisible();
  await expect(page.getByLabel('일정 후보 요약')).toContainText('저장 예정');
  await expect(page.getByLabel('일정 후보 요약')).toContainText('6개');
  await expect(page.getByLabel('반복 일정 묶음')).toContainText('주사 · 6회');
  await expect(page.getByLabel('반복 일정 묶음')).toContainText('고날에프');
  await expect(page.getByLabel('수정할 후보 선택').getByRole('button')).toHaveCount(6);
  await expect(page.getByText('필요한 일정만 수정')).toBeVisible();
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

  await goToPhotoCapture(page);
  await page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' }).click();
  await page.getByLabel('받은 안내').fill('오늘 컨디션 잘 보세요');
  await page.getByRole('button', { name: '일정 후보 정리하기' }).click();

  await expect(page.getByText('확인할 일정을 찾지 못했어요')).toBeVisible();
  await page.getByRole('button', { name: '확인한 일정 직접 적기' }).click();
  await expect(page.getByRole('heading', { name: '확인한 일정만 직접 적어주세요' })).toBeVisible();
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

  await goToPhotoCapture(page);
  await page.locator('input[type="file"][accept="image/*"][capture="environment"]').setInputFiles({
    name: 'empty-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('no schedule'),
  });

  await expect(page.getByText('사진에서 확인할 일정을 찾지 못했어요')).toBeVisible();
  await expect(page.getByRole('button', { name: '사진 다시 남기기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '확인한 일정만 직접 적어주세요' })).toBeVisible();
});

test('direct entry path previews and saves the remembered schedule before sharing', async ({ context, page }) => {
  await acceptPrivacyForOnboarding(context);
  await page.route('**/api/onboard/text-analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    });
  });
  await page.route('**/api/schedule/add', async (route) => {
    const body = route.request().postDataJSON() as { title: string; type: string; scheduledAt: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ item: { id: 'schedule-1', status: 'upcoming', source: 'manual', scheduled_at: body.scheduledAt, ...body } }),
    });
  });

  await goToPhotoCapture(page);
  await page.getByRole('button', { name: '받은 안내를 문자로 붙여넣기' }).click();
  await page.getByLabel('받은 안내').fill('오늘 직접 확인한 일정');
  await page.getByRole('button', { name: '일정 후보 정리하기' }).click();
  await page.getByRole('button', { name: '확인한 일정 직접 적기' }).click();

  await expect(page.getByRole('heading', { name: '확인한 일정만 직접 적어주세요' })).toBeVisible();
  await page.getByLabel('일정 이름').fill('고날에프 주사');
  await page.getByLabel('시간').fill('21:00');
  await page.getByLabel('용량').fill('150');
  await page.getByLabel('단위').fill('IU');

  await expect(page.getByLabel('내 홈 미리보기')).toContainText('고날에프 주사');
  await expect(page.getByLabel('내 홈 미리보기')).toContainText('21:00');
  await page.getByRole('button', { name: '확인한 일정으로 저장' }).click();

  await expect(page.getByRole('heading', { name: '공유 범위를 정할까요?' })).toBeVisible();
  await expect(page.getByText('고날에프 주사 일정이 내 홈에 반영되도록 저장됐어요.')).toBeVisible();
  await page.getByRole('button', { name: /내 홈만 먼저 볼게요/ }).click();
  await expect(page.getByRole('heading', { name: '확인할 일정 후보를 만들었어요' })).toBeVisible();
});
