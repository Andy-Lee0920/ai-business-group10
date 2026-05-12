import { expect, test, type Page } from '@playwright/test';

async function acceptPrivacyForOnboarding(page: Page) {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
}

const forbiddenCopy = [
  '괜찮아요',
  '걱정하지 마세요',
  'care state',
  'Generative UI',
  'IVF 단계',
  '오늘 들은 것',
  '정확한 IVF 단계를 선택하세요',
  '오늘의 케어를 한 장면씩 시작해요',
  '처음부터 많이 묻지 않을게요',
  '어디쯤에 있으세요?',
  '자동 인식 완료',
];

test('onboarding creates a first home through the 4-step hospital-guidance flow with partner invite prepared', async ({ page }) => {
  await acceptPrivacyForOnboarding(page);
  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: '현재 치료 상황을 확인할게요' })).toBeVisible();
  await expect(page.getByText('병원에서 안내받은 약, 방문, 결과 일정을 기준으로 시작합니다.')).toBeVisible();
  await expect(page.getByLabel(/처음 설정 1\/4/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: '나이·키·몸무게' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '주의할 몸 상태' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '지금 가까운 흐름' })).toHaveCount(0);

  for (const copy of forbiddenCopy) await expect(page.getByText(copy, { exact: false })).toHaveCount(0);

  await page.getByRole('button', { name: '처음이에요' }).click();
  await expect(page.getByLabel(/처음 설정 2\/4/u)).toBeVisible();
  await expect(page.locator('#care-item-title')).toHaveText('현재 치료 상황을 확인할게요');
  await expect(page.getByRole('button', { name: /사진으로 추가/u })).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole('button', { name: '사진으로 추가' }).click();
  await expect(page.locator('input[type="file"]')).toBeAttached();

  await page.getByRole('button', { name: '약·주사 안내' }).click();
  await page.getByRole('textbox', { name: '직접 입력' }).fill('밤에 주사');
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page.getByLabel(/처음 설정 3\/4/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: '이 내용을 함께 볼 사람을 정할게요' })).toBeVisible();
  await page.getByRole('button', { name: '파트너와 함께 쓸게요' }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page.getByLabel(/처음 설정 4\/4/u)).toBeVisible();
  await expect(page.getByTestId('generated-home-preview')).toBeVisible();
  await expect(page.getByTestId('inferred-stage-label')).toContainText('2/7 배란 유도');
  await expect(page.getByRole('region', { name: '내 화면 미리보기' })).toContainText('밤에 주사');
  await expect(page.getByRole('region', { name: '파트너 화면 미리보기' })).toContainText('약 이름 확인');
  await page.getByRole('button', { name: '단계 수정' }).click();
  await page.getByRole('button', { name: '피검' }).click();
  await expect(page.getByTestId('inferred-stage-label')).toContainText('7/7 임신 확인');
  await page.getByRole('button', { name: '단계 수정' }).click();
  await page.getByRole('button', { name: '주사' }).click();
  await expect(page.getByTestId('inferred-stage-label')).toContainText('2/7 배란 유도');

  await page.getByRole('button', { name: '첫 화면 만들기' }).click();
  await expect(page.getByRole('heading', { name: '첫 화면을 만들고 있어요' })).toBeVisible();
  await expect(page.getByText('파트너 화면 준비')).toBeVisible();
  await expect(page).toHaveURL(/\/home$/u, { timeout: 5000 });
  await expect(page.getByTestId('mission-card-pair')).toContainText('밤에 주사');
  await expect(page.getByTestId('partner-invite-card')).toContainText('파트너와 함께 볼 준비가 됐어요');
  await page.getByRole('button', { name: '초대 링크 공유' }).click();
  await expect(page.getByTestId('partner-invite-card')).toContainText('초대 링크');
  await page.getByRole('button', { name: '나중에' }).click();
  await expect(page.getByTestId('partner-invite-card')).toHaveCount(0);
});

test('onboarding can finish without baseline profile and primary solo hides partner invite surface', async ({ page }) => {
  await acceptPrivacyForOnboarding(page);
  await page.goto('/onboarding');

  await page.getByRole('button', { name: '해본 적 있어요' }).click();
  await page.getByRole('button', { name: '병원 방문' }).click();
  await page.getByRole('textbox', { name: '직접 입력' }).fill('오전 방문');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '나 혼자 시작할게요' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('region', { name: '파트너 화면 미리보기' })).toHaveCount(0);
  await page.getByRole('button', { name: '첫 화면 만들기' }).click();
  await expect(page.getByText('파트너 화면 준비')).toHaveCount(0);
  await expect(page).toHaveURL(/\/home$/u, { timeout: 5000 });
  await expect(page.getByTestId('mission-card-pair')).toContainText('오전 방문');
  await expect(page.getByTestId('partner-invite-card')).toHaveCount(0);
  await expect(page.getByTestId('partner-connect-bar')).toHaveCount(0);
});
test('onboarding user-corrected stage controls the first home surface', async ({ page }) => {
  await acceptPrivacyForOnboarding(page);
  await page.goto('/onboarding');

  await page.getByRole('button', { name: '처음이에요' }).click();
  await page.getByRole('button', { name: '약·주사 안내' }).click();
  await page.getByRole('textbox', { name: '직접 입력' }).fill('밤에 주사');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '나 혼자 시작할게요' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByTestId('inferred-stage-label')).toContainText('2/7 배란 유도');

  await page.getByRole('button', { name: '단계 수정' }).click();
  await page.getByRole('button', { name: '피검' }).click();
  await expect(page.getByTestId('inferred-stage-label')).toContainText('7/7 임신 확인');

  await page.getByRole('button', { name: '첫 화면 만들기' }).click();
  await expect(page).toHaveURL(/\/home$/u, { timeout: 5000 });
  await expect(page.getByTestId('result-review-gate')).toBeVisible();
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'waiting');
  await expect(page.getByText('오늘은 보호 모드')).toBeVisible();
  await expect(page.getByTestId('partner-invite-card')).toHaveCount(0);
});

