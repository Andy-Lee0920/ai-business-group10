import { expect, test } from '@playwright/test';


test('presentation landing opens the dual-view demo without auth steps', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Google로 시작하기')).toHaveCount(0);
  await expect(page.getByText('Privacy Gate부터 보기')).toHaveCount(0);
});

test('presentation home defaults to the injection-day partner action story', async ({ page }) => {
  await page.goto('/home');

  const cards = page.getByTestId('home-action-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText(/고날에프|오비트렐/);
  await expect(page.getByRole('button', { name: '주사 준비 체크 시작' })).toBeVisible();
  await expect(page.getByText('오늘 파트너의 역할')).toBeVisible();
  await expect(page.getByText('오늘은 확인자')).toBeVisible();
});

test('presentation home switches between three treatment situations', async ({ page }) => {
  await page.goto('/home?care=injection');
  await expect(page.getByRole('button', { name: '주사 준비 체크 시작' })).toBeVisible();
  await expect(page.getByText('오늘은 확인자')).toBeVisible();

  await page.goto('/home?care=clinic');
  await expect(page.getByRole('button', { name: '방문 체크리스트 열기' })).toBeVisible();
  await expect(page.getByText('오늘은 동행자')).toBeVisible();

  await page.goto('/home?care=waiting');
  await expect(page.getByRole('button', { name: '차분한 체크인 시작' })).toBeVisible();
  await expect(page.getByText('오늘은 곁에 있는 사람')).toBeVisible();
});

test('presentation capture pre-fills the clinic memo sample', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/capture');

  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('고날에프');
  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('프로게스테론');
});

test('presentation /partner/demo renders a sanitized partner view', async ({ page }) => {
  await page.goto('/partner/demo');

  await expect(page.getByRole('heading', { name: '파트너 오늘 할 일' })).toBeVisible();
  await expect(page.getByText('오늘 21시 고날에프 1회')).toBeVisible();
  await expect(page.getByText(/raw_text|token|user_id|원문 메모/)).toHaveCount(0);
});


test('presentation /demo changes patient and partner views together', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByRole('heading', { name: '환자 화면' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '파트너 화면' })).toBeVisible();
  await expect(page.getByTestId('demo-patient-panel')).toContainText('주사 준비 체크 시작');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('오늘은 확인자');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('어느 주사였지?');

  await page.getByRole('button', { name: '병원 가는 날' }).click();
  await expect(page.getByTestId('demo-patient-panel')).toContainText('방문 체크리스트 열기');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('오늘은 동행자');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('병원 설명을 환자 혼자 기억하게 두기');

  await page.getByRole('button', { name: '기다리는 날' }).click();
  await expect(page.getByTestId('demo-patient-panel')).toContainText('차분한 체크인 시작');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('오늘은 곁에 있는 사람');
  await expect(page.getByTestId('demo-partner-panel')).toContainText('결과를 계속 묻지 않기');
});
