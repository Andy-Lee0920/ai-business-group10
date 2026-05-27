import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { createCaptureStore, type ConfirmItem } from '../../../../src/lib/capture-confirm-store';
import type { CareActionCard } from '../../../../src/types/care-cards.types';

type QuickCaptureBody = {
  prescriptionPhotoUrl?: unknown;
  prescriptionPhotoUploadFailed?: unknown;
  firstMedicationTime?: unknown;
  nextVisitDate?: unknown;
};

const QUICK_CAPTURE_DONE_COOKIE = 'fevio_onboarding_quick_capture_done';
const QUICK_CAPTURE_FIRST_CARD_COOKIE = 'fevio_onboarding_first_card';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as QuickCaptureBody;
  const firstMedicationTime = normalizeTime(body.firstMedicationTime);
  const nextVisitDate = normalizeIsoDate(body.nextVisitDate);

  if (!firstMedicationTime || !nextVisitDate) {
    return NextResponse.json({ error: 'First medication time and next visit date are required.' }, { status: 400 });
  }

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const prescriptionPhoto = normalizePhoto(body);
  const capture = await store.createCapture(buildQuickCaptureText({ firstMedicationTime, nextVisitDate, prescriptionPhoto }));
  const items = buildQuickCaptureConfirmItems({ firstMedicationTime, nextVisitDate });
  const result = await store.confirm({ ...capture, items });
  const firstCard = toQuickCaptureCareCard(firstMedicationTime, store.coupleId, new Date());

  const response = NextResponse.json({
    redirectTo: '/home',
    createdCardCount: result.createdCardCount,
    quickCaptureDone: true,
    fullSetupHref: '/onboard/full-setup',
    prescriptionPhoto,
    reminder: { kind: 'tomorrow_setup', label: '나머지는 오늘 저녁에 정리해요' },
  }, { status: 201 });

  response.cookies.set(QUICK_CAPTURE_DONE_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  if (isPresentationRequest(request)) {
    response.cookies.set(QUICK_CAPTURE_FIRST_CARD_COOKIE, encodeURIComponent(JSON.stringify(firstCard)), { httpOnly: true, sameSite: 'lax', path: '/' });
  }

  return response;
}

function normalizePhoto(body: QuickCaptureBody) {
  if (body.prescriptionPhotoUploadFailed === true) return 'skipped';
  return typeof body.prescriptionPhotoUrl === 'string' && body.prescriptionPhotoUrl.trim() ? body.prescriptionPhotoUrl.trim() : 'none';
}

function buildQuickCaptureText({ firstMedicationTime, nextVisitDate, prescriptionPhoto }: { firstMedicationTime: string; nextVisitDate: string; prescriptionPhoto: string }) {
  const lines = ['빠른 기록', `첫 약/주사 시간: ${firstMedicationTime}`, `다음 병원 방문: ${nextVisitDate}`];
  if (prescriptionPhoto !== 'none') lines.push(`처방 사진: ${prescriptionPhoto}`);
  return lines.join('\n');
}

function buildQuickCaptureConfirmItems({ firstMedicationTime, nextVisitDate }: { firstMedicationTime: string; nextVisitDate: string }): ConfirmItem[] {
  return [
    {
      sourceText: `오늘 ${firstMedicationTime} 약/주사 확인`,
      assignedTo: 'my_action',
      orderIndex: 0,
      userSelectedCardType: 'medication',
      scheduledAt: scheduledAtToday(firstMedicationTime),
      description: '빠른 기록에서 저장한 첫 시간이에요. 약 이름과 용량은 자세히 정리에서 직접 확인해요.',
      userMarkedImportant: true,
    },
    {
      sourceText: `${nextVisitDate} 병원 방문 예정`,
      assignedTo: 'my_action',
      orderIndex: 1,
      userSelectedCardType: 'clinic_visit',
      careDate: nextVisitDate,
      description: '병원에서 안내받은 다음 방문일만 먼저 저장했어요.',
      userMarkedImportant: true,
    },
  ];
}

function toQuickCaptureCareCard(firstMedicationTime: string, coupleId: string, now: Date): CareActionCard {
  return {
    id: 'quick-capture-first-medication',
    couple_id: coupleId,
    created_by: 'quick_capture',
    assignee_role: 'primary_user',
    card_type: 'medication',
    title: `오늘 ${firstMedicationTime} 약/주사 확인`,
    description: '나머지는 오늘 저녁 자세히 정리에서 확인해요.',
    source_text: `오늘 ${firstMedicationTime} 약/주사 확인`,
    scheduled_at: scheduledAtToday(firstMedicationTime, now),
    care_date: null,
    status: 'confirmed',
    confirmation_required: false,
    user_marked_important: true,
    partner_visible: false,
    revision: 1,
  };
}

function scheduledAtToday(time: string, now = new Date()) {
  const [hour, minute] = time.split(':').map((part) => Number.parseInt(part, 10));
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function normalizeTime(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/u.test(trimmed) ? trimmed : null;
}

function normalizeIsoDate(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(trimmed)) return null;
  return Number.isNaN(Date.parse(`${trimmed}T00:00:00Z`)) ? null : trimmed;
}
