import { expect, test } from '@playwright/test';

const rawText = '오늘 밤 10시 오비드렐 주사\n남편이 주사 준비 도와주기\n내일 오전 병원 방문';
const mandatorySource = '오늘 밤 10시 오비드렐 주사';
const partnerSource = '남편이 주사 준비 도와주기';

const splitReviewFixture = {
  visitInputId: 'visit-fixture',
  draftId: 'split-review-fixture',
  rawText,
  candidates: [
    {
      sourceText: mandatorySource,
      sourceOffsetStart: rawText.indexOf(mandatorySource),
      sourceOffsetEnd: rawText.indexOf(mandatorySource) + mandatorySource.length,
      assignedTo: 'my_action',
      suggestedCardType: 'injection',
      orderIndex: 0,
      scheduledAt: '2026-05-29T22:00:00.000Z',
      careDate: '2026-05-29',
      description: null,
      userMarkedImportant: true,
      partnerVisible: false,
    },
    {
      sourceText: partnerSource,
      sourceOffsetStart: null,
      sourceOffsetEnd: null,
      assignedTo: 'partner_action',
      suggestedCardType: 'injection',
      orderIndex: 1,
      scheduledAt: null,
      careDate: null,
      description: null,
      userMarkedImportant: false,
      partnerVisible: true,
    },
  ],
};

async function seedSplitReview(page: import('@playwright/test').Page) {
  await page.addInitScript((review) => {
    window.sessionStorage.setItem('fevio.splitReview', JSON.stringify(review));
  }, splitReviewFixture);
}

test('desktop split-review shows raw text and candidate cards side-by-side with source highlights', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await seedSplitReview(page);

  await page.goto('/split-review?draftId=split-review-fixture');

  await expect(page.getByTestId('split-review-raw-text')).toBeVisible();
  await expect(page.getByTestId('split-review-candidate-list')).toBeVisible();
  await expect(page.getByTestId('source-highlight-0')).toContainText(mandatorySource);
  await expect(page.getByTestId('source-highlight-1')).toContainText(partnerSource);
  await expect(page.getByLabel('근사 원문 위치')).toBeVisible();

  const rawBox = await page.getByTestId('split-review-raw-text').boundingBox();
  const cardBox = await page.getByTestId('split-review-candidate-0').boundingBox();
  expect(rawBox?.y).toBeLessThan(720);
  expect(cardBox?.y).toBeLessThan(720);

  await page.screenshot({ path: 'test-results/split-review-desktop-side-by-side.png', fullPage: true });
});

test('mobile split-review forces mandatory quotes inline and keeps optional quotes behind the sheet', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await seedSplitReview(page);

  await page.goto('/split-review?draftId=split-review-fixture');

  const mandatoryQuote = page.getByTestId('mandatory-inline-quote-0');
  await expect(mandatoryQuote).toBeVisible();
  await expect(mandatoryQuote).toContainText(mandatorySource);
  await expect(page.getByTestId('split-review-candidate-0').getByRole('button', { name: '원문 보기' })).toHaveCount(0);
  await expect(page.getByTestId('split-review-raw-text')).toBeHidden();

  const quoteBox = await mandatoryQuote.boundingBox();
  expect(quoteBox).not.toBeNull();
  expect((quoteBox?.y ?? 721) + (quoteBox?.height ?? 0)).toBeLessThanOrEqual(720);
  await page.screenshot({ path: 'test-results/split-review-mobile-mandatory-inline.png', fullPage: true });

  const partnerCard = page.getByTestId('split-review-candidate-1');
  await expect(partnerCard.getByRole('button', { name: '원문 보기' })).toBeVisible();
  await expect(partnerCard.getByText(partnerSource)).toHaveCount(0);

  await partnerCard.getByRole('button', { name: '원문 보기' }).click();
  await expect(page.getByRole('dialog', { name: '원문 보기' })).toContainText(partnerSource);

  await page.screenshot({ path: 'test-results/split-review-mobile-quote-sheet.png', fullPage: true });
});
