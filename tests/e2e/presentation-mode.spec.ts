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


test('presentation /demo behaves like utility panels, not text placeholders', async ({ page }) => {
  await page.goto('/demo');

  const patient = page.getByTestId('demo-patient-panel');
  const partner = page.getByTestId('demo-partner-panel');

  await expect(page.getByRole('heading', { name: '내 화면', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '파트너 화면', exact: true })).toBeVisible();
  await expect(page.getByText('지금은 어떤 날에 가까우세요?')).toBeVisible();
  await expect(page.getByRole('group', { name: '지금은 어떤 날에 가까우세요?' }).getByRole('button', { name: '주사 준비' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('오늘 화면을 이렇게 맞췄어요.')).toBeVisible();
  await expect(page.getByText('문제는 부주의가 아니라 전달 구조입니다')).toBeVisible();
  await expect(page.getByText('병원에서 들은 말이 집에서 다시 설명되는 동안 빠집니다.')).toBeVisible();
  await expect(page.getByText('선택 한 번으로 내 화면과 파트너 행동이 같이 바뀝니다.')).toBeVisible();
  await expect(patient).toContainText('주사 준비 체크');
  await expect(patient).toContainText('일정 변경');
  await expect(patient).toContainText('중요 알림');
  await expect(patient).toContainText('완료 체크');
  await expect(patient).toContainText('부부 연결');
  await expect(partner).toContainText('확인자');
  await expect(partner).toContainText('공간 준비');

  await page.getByRole('button', { name: '펜 용량 확인' }).click();
  await expect(page.getByRole('button', { name: /펜 용량 확인/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '약 이름·시간 대조' }).click();
  await expect(page.getByRole('button', { name: /약 이름·시간 대조/ })).toHaveAttribute('aria-pressed', 'true');

  await patient.getByRole('button', { name: '오늘 항목 완료' }).click();
  await expect(partner).toContainText('완료됨');
  await partner.getByRole('button', { name: '확인 완료', exact: true }).click();
  await expect(patient).toContainText('파트너가 확인했어요');

  await page.getByRole('group', { name: '지금은 어떤 날에 가까우세요?' }).getByRole('button', { name: '병원 다녀오기' }).click();
  await expect(page.getByRole('group', { name: '지금은 어떤 날에 가까우세요?' }).getByRole('button', { name: '병원 다녀오기' })).toHaveAttribute('aria-pressed', 'true');
  await expect(patient).toContainText('방문 체크리스트');
  await expect(patient).toContainText('09:00');
  await expect(partner).toContainText('동행자');
  await expect(partner).toContainText('이동 시간 확인');

  await page.getByRole('group', { name: '지금은 어떤 날에 가까우세요?' }).getByRole('button', { name: '기다리는 중' }).click();
  await expect(page.getByRole('group', { name: '지금은 어떤 날에 가까우세요?' }).getByRole('button', { name: '기다리는 중' })).toHaveAttribute('aria-pressed', 'true');
  await expect(patient).toContainText('차분한 체크인');
  await expect(patient).toContainText('조용 모드');
  await expect(partner).toContainText('곁에 있는 사람');
  await expect(partner).toContainText('결과 묻지 않기');
});
