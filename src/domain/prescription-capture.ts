import type { CardType } from '../types/care-cards.types';

export type PrescriptionCaptureType = 'medication' | 'injection' | 'vaginal';
export type PrescriptionAdministeredBy = 'self' | 'partner' | 'clinic';

export type PrescriptionMedicationCardInput = {
  photoUrl: string;
  type: PrescriptionCaptureType;
  name: string;
  dose: string;
  doseConfirmed: boolean;
  time: string;
  administeredBy: PrescriptionAdministeredBy;
};

export type PrescriptionMedicationCardDraft = {
  card_type: Extract<CardType, 'medication' | 'injection'>;
  title: string;
  description: string;
  source_text: string;
  scheduled_at: string;
  prescription_photo_url: string;
  prescription_capture_status: 'photo_attached';
  administered_by: PrescriptionAdministeredBy;
  confirmation_required: false;
  partner_visible: boolean;
};

export function buildPrescriptionMedicationCard(input: PrescriptionMedicationCardInput): PrescriptionMedicationCardDraft {
  const normalized = normalizePrescriptionInput(input);
  const methodLabel = normalized.type === 'vaginal' ? '질정' : normalized.type === 'injection' ? '주사' : '약';
  const cardType = normalized.type === 'injection' ? 'injection' : 'medication';
  const title = `${methodLabel} · ${normalized.name} · ${normalized.dose} · ${normalized.time}`;

  return {
    card_type: cardType,
    title,
    description: normalized.dose,
    source_text: `${title}\n처방 사진: ${normalized.photoUrl}`,
    scheduled_at: scheduledAtForToday(normalized.time),
    prescription_photo_url: normalized.photoUrl,
    prescription_capture_status: 'photo_attached',
    administered_by: normalized.administeredBy,
    confirmation_required: false,
    partner_visible: normalized.administeredBy === 'partner' || cardType === 'injection',
  };
}

export function shouldAnalyzeManualPrescriptionFallback(input: {
  hasPhoto: boolean;
  candidateCount: number;
  manualText: string;
}) {
  return input.hasPhoto && input.candidateCount === 0 && input.manualText.trim().length > 0;
}

function normalizePrescriptionInput(input: PrescriptionMedicationCardInput): PrescriptionMedicationCardInput {
  const photoUrl = normalizeText(input.photoUrl);
  const name = normalizeText(input.name);
  const dose = normalizeText(input.dose);
  const time = normalizeText(input.time);

  if (!photoUrl) throw new Error('처방 사진 링크가 필요합니다.');
  if (!['medication', 'injection', 'vaginal'].includes(input.type)) throw new Error('약, 주사, 질정 중 하나를 선택해 주세요.');
  if (!name) throw new Error('약 이름은 사용자가 직접 확인해야 합니다.');
  if (!dose || input.doseConfirmed !== true) throw new Error('용량은 사용자가 직접 확인해야 합니다.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/u.test(time)) throw new Error('시간을 HH:MM 형식으로 적어 주세요.');
  if (!['self', 'partner', 'clinic'].includes(input.administeredBy)) throw new Error('투약 주체를 선택해 주세요.');

  return { ...input, photoUrl, name, dose, time };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function scheduledAtForToday(time: string) {
  const [hours = '00', minutes = '00'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}
