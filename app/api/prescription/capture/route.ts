import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import {
  buildPrescriptionMedicationCard,
  type PrescriptionAdministeredBy,
  type PrescriptionCaptureType,
} from '../../../../src/domain/prescription-capture';
import {
  createSensitiveCareActionCard,
  isMissingSupabasePublicConfigError,
  isPrivacyGateRequiredError,
  type SensitiveCareWriteSupabaseClient,
} from '../../../../src/lib/sensitive-care-write';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

type PrescriptionCaptureBody = {
  photoUrl?: unknown;
  type?: unknown;
  name?: unknown;
  dose?: unknown;
  doseConfirmed?: unknown;
  time?: unknown;
  administeredBy?: unknown;
};
const DEMO_COOKIE = 'fevio_privacy_accepted=1';

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => ({}))) as PrescriptionCaptureBody;
  let draft: ReturnType<typeof buildPrescriptionMedicationCard>;

  try {
    draft = buildPrescriptionMedicationCard({
      photoUrl: String(body.photoUrl ?? ''),
      type: body.type as PrescriptionCaptureType,
      name: String(body.name ?? ''),
      dose: String(body.dose ?? ''),
      doseConfirmed: body.doseConfirmed === true,
      time: String(body.time ?? ''),
      administeredBy: body.administeredBy as PrescriptionAdministeredBy,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Invalid prescription capture.',
      },
      { status: 400 },
    );
  }

  if (isPresentationRequest(request) && isDemoRequest(request)) {
    return NextResponse.json(
      {
        cardId: `demo-prescription-${Date.now()}`,
        status: 'confirmed',
        persisted: false,
        createdCardCount: 1,
        title: draft.title,
      },
      { status: 201 },
    );
  }

  try {
    const supabase =
      (await createCookieBackedSupabaseClient()) as unknown as SensitiveCareWriteSupabaseClient;
    const card = await createSensitiveCareActionCard(supabase, {
      sourceText: draft.source_text,
      card: {
        assignee_role: 'primary_user',
        status: 'confirmed',
        user_marked_important: draft.card_type === 'injection',
        ...draft,
      },
    });

    return NextResponse.json(
      {
        cardId: card.cardId,
        status: card.status,
        persisted: true,
        createdCardCount: 1,
        title: draft.title,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isMissingSupabasePublicConfigError(error) && isDemoRequest(request)) {
      return NextResponse.json(
        {
          cardId: `demo-prescription-${Date.now()}`,
          status: 'confirmed',
          persisted: false,
          createdCardCount: 1,
          title: draft.title,
        },
        { status: 201 },
      );
    }
    if (isPrivacyGateRequiredError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}

function isDemoRequest(request: NextRequest) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .some((part) => part.trim() === DEMO_COOKIE) ?? false
  );
}
