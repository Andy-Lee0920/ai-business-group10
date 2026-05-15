import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ClinicGuideMedicationNormalizeRequest,
  ClinicGuideMedicationNormalizeResponse,
  ClinicGuideEdgeRequest,
  ClinicGuideRequest,
  ClinicGuideResponse,
  ClinicGuideStep,
} from '../../src/types/clinic-guide.types';
import type { ClinicUpdate, Medication } from '../../src/types/slc.types';

describe('ClinicGuide shared type contract', () => {
  it('exposes the guided clinic update steps as a closed union', () => {
    const steps = [
      'same_medication',
      'add_medication',
      'medication_days',
      'next_visit',
      'trigger_plan',
      'memo',
    ] as const satisfies readonly ClinicGuideStep[];

    expect(steps).toHaveLength(6);
    expectTypeOf<ClinicGuideStep>().toEqualTypeOf<(typeof steps)[number]>();
  });

  it('shares request/response shapes between the form and Edge Function with confirmation locked on', () => {
    expectTypeOf<ClinicGuideRequest>().toMatchTypeOf<{
      patientId: string;
      step: ClinicGuideStep;
      context: Partial<ClinicUpdate>;
      userInput: string;
    }>();
    expectTypeOf<ClinicGuideResponse>().toMatchTypeOf<{
      nextStep: ClinicGuideStep | null;
      question: string;
      chips?: string[];
      draft: Partial<ClinicUpdate>;
      warnings?: string[];
      fallbackReason?: string;
      requiresUserConfirmation: true;
    }>();
    expectTypeOf<ClinicGuideResponse['requiresUserConfirmation']>().toEqualTypeOf<true>();
  });

  it('shares the medication normalization proxy contract without exposing secret inputs', () => {
    expectTypeOf<ClinicGuideMedicationNormalizeRequest>().toMatchTypeOf<{
      mode?: 'normalizeMedication';
      userInput: string;
      patientId: string;
    }>();
    expectTypeOf<ClinicGuideEdgeRequest>().toMatchTypeOf<ClinicGuideMedicationNormalizeRequest | (ClinicGuideRequest & { mode: 'interview' })>();
    expectTypeOf<ClinicGuideMedicationNormalizeResponse>().toMatchTypeOf<{
      matched: Medication | null;
      source: 'aliases' | 'llm' | 'none';
    }>();
  });
});
