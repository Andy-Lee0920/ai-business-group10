import { expect, test } from '@playwright/test';

test('onboarding is one shared path where partner invite can be skipped and first injection reaches home state', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: '오늘 필요한 것만 먼저 정리해요' })).toBeVisible();
  await expect(page.getByTestId('onboarding-interview-surface')).toBeVisible();
  await expect(page.getByText('병원에서 들은 내용을 편한 만큼만 남겨요.')).toBeVisible();
  await expect(page.getByText('확정 전에는 할 일로 표시되지 않아요.')).toBeVisible();
  await expect(page.getByText('오늘의 케어를 한 장면씩 시작해요')).toHaveCount(0);
  await expect(page.getByText('첫 홈의 분위기')).toHaveCount(0);
  await expect(page.getByText('파트너 역할이 이어집니다')).toHaveCount(0);
  await expect(page.getByText('환자 앱')).toHaveCount(0);
  await expect(page.getByText('파트너 앱')).toHaveCount(0);
  await expect(page.getByLabel(/처음 설정 1\/7/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘의 기록은 어떤 호흡이 편할까요?' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '시술은 처음인가요?' })).toBeVisible();
  await expect(page.getByText('처음이면 더 천천히 보여드려요.')).toBeVisible();
  await expect(page.getByText('Fevio가 당신을 분류하려는 게 아니에요.')).toHaveCount(0);
  await expect(page.getByText('처음부터 많이 묻지 않을게요')).toHaveCount(0);
  await expect(page.getByText('어디쯤에 있으세요?')).toHaveCount(0);
  await expect(page.getByText('정답을 고르는 화면')).toHaveCount(0);

  const layoutMetrics = await page.evaluate(() => {
    const card = document.querySelector('main.app-shell > section.hero-card') as HTMLElement | null;
    const infoBox = Array.from(document.querySelectorAll('.fevio-notice')).find((element) =>
      element.textContent?.includes('확정 전에는 할 일로 표시되지 않아요'),
    ) as HTMLElement | undefined;
    const badge = Array.from(document.querySelectorAll('.fevio-status-badge')).find((element) =>
      element.textContent?.includes('시술 경험'),
    ) as HTMLElement | undefined;
    const title = document.querySelector('#experience-title') as HTMLElement | null;
    const lead = document.querySelector('#experience-title + p') as HTMLElement | null;
    const optionGroup = document.querySelector('[aria-label="시술 경험 선택"]') as HTMLElement | null;
    const firstOption = optionGroup?.querySelector('button') as HTMLElement | null;
    const firstOptionTitle = firstOption?.querySelector('span') as HTMLElement | null;
    const firstOptionHelper = firstOption?.querySelector('small') as HTMLElement | null;

    const styleOf = (element: HTMLElement | null | undefined) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        color: style.color,
        display: style.display,
        flexDirection: style.flexDirection,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        gap: style.gap,
        lineHeight: style.lineHeight,
        marginBottom: style.marginBottom,
        minHeight: style.minHeight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        paddingTop: style.paddingTop,
        rowGap: style.rowGap,
      };
    };

    return {
      card: styleOf(card),
      infoBox: styleOf(infoBox),
      badge: styleOf(badge),
      title: styleOf(title),
      lead: styleOf(lead),
      optionGroup: styleOf(optionGroup),
      firstOption: styleOf(firstOption),
      firstOptionTitle: styleOf(firstOptionTitle),
      firstOptionHelper: styleOf(firstOptionHelper),
    };
  });

  expect(layoutMetrics.card).toMatchObject({ display: 'flex', flexDirection: 'column', paddingLeft: '24px', paddingRight: '24px' });
  expect(Number.parseFloat(layoutMetrics.card?.rowGap ?? '0')).toBeLessThanOrEqual(24);
  expect(layoutMetrics.infoBox).toMatchObject({ backgroundColor: 'rgb(240, 249, 255)', borderRadius: '12px', color: 'rgb(55, 65, 81)', paddingTop: '16px', paddingRight: '20px', paddingBottom: '16px', paddingLeft: '20px' });
  expect(layoutMetrics.badge).toMatchObject({ fontSize: '12px', paddingTop: '4px', paddingRight: '12px', paddingBottom: '4px', paddingLeft: '12px' });
  expect(Number(layoutMetrics.badge?.fontWeight)).toBeGreaterThanOrEqual(700);
  expect(layoutMetrics.title).toMatchObject({ fontSize: '24px', fontWeight: '800', lineHeight: '31.2px', marginBottom: '8px' });
  expect(layoutMetrics.lead).toMatchObject({ color: 'rgb(107, 114, 128)', fontSize: '14px' });
  expect(layoutMetrics.optionGroup).toMatchObject({ display: 'flex', flexDirection: 'column', rowGap: '16px' });
  expect(layoutMetrics.firstOption).toMatchObject({ borderColor: 'rgb(229, 231, 235)', borderRadius: '16px', minHeight: '72px', paddingTop: '20px', paddingRight: '20px', paddingBottom: '20px', paddingLeft: '20px' });
  expect(layoutMetrics.firstOptionTitle).toMatchObject({ fontSize: '16px', marginBottom: '4px' });
  expect(Number(layoutMetrics.firstOptionTitle?.fontWeight)).toBeGreaterThanOrEqual(700);
  expect(layoutMetrics.firstOptionHelper).toMatchObject({ color: 'rgb(156, 163, 175)', fontSize: '13px' });

  await page.getByRole('button', { name: '처음이에요' }).click();
  await expect(page.getByLabel(/처음 설정 2\/7/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: '나이·키·몸무게' })).toBeVisible();
  await page.getByRole('spinbutton', { name: '나이' }).fill('36');
  await page.getByRole('spinbutton', { name: '신장' }).fill('164');
  await page.getByRole('spinbutton', { name: '체중' }).fill('58');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByLabel(/처음 설정 3\/7/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: '주의할 몸 상태' })).toBeVisible();
  await page.getByRole('textbox', { name: '병력 또는 주의사항' }).fill('갑상선 약 복용 중');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByLabel(/처음 설정 4\/7/u)).toBeVisible();
  await page.getByRole('button', { name: '주사/채취 준비 중' }).click();
  await expect(page.getByLabel(/처음 설정 5\/7/u)).toBeVisible();
  await page.getByRole('group', { name: '첫 항목 종류 선택' }).getByRole('button', { name: /주사/u }).click();
  await page.getByRole('textbox', { name: '첫 케어 항목' }).fill('오늘 밤 9시 주사 확인');
  await page.getByRole('button', { name: '다음 질문' }).click();
  await expect(page.getByLabel(/처음 설정 6\/7/u)).toBeVisible();
  await page.getByRole('button', { name: '지금은 건너뛰기' }).click();
  await page.getByRole('button', { name: '마지막 확인' }).click();
  await expect(page.getByLabel(/처음 설정 7\/7/u)).toBeVisible();
  await expect(page.getByText('처음이에요')).toBeVisible();
  await expect(page.getByText('36세 · 164cm · 58kg')).toBeVisible();
  await expect(page.getByText('갑상선 약 복용 중')).toBeVisible();
  await expect(page.getByText('주사 · 오늘 밤 9시 주사 확인')).toBeVisible();
  await page.getByRole('button', { name: '홈 만들기' }).click();

  await expect(page).toHaveURL(/\/home$/u);
  await expect(page.getByTestId('compact-hero-greeting')).toContainText('주사 준비');
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByRole('heading', { name: '오늘 밤 9시 주사 확인' })).toBeVisible();
});
