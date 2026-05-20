# SLC namespace migration audit

Generated: 2026-05-20

ADR 0018 keeps existing SLC identifiers compatible while new MVP records/community/journal code imports from `src/types/mvp.types.ts`.

## Remaining compatibility imports

```text
src/domain/clinic-guide-interview.ts:1:import type { ClinicUpdate } from '../types/slc.types';
src/domain/slc-home-focus.ts:2:import type { ScheduleItem, ScheduleStatus } from '../types/slc.types';
src/domain/care-action-home-projection.ts:2:import type { ScheduleItem, ScheduleStatus, ScheduleType } from '../types/slc.types';
src/lib/seed-helpers.ts:1:import type { ScheduleItem } from '../types/slc.types';
src/domain/slc-clinic-followup.ts:1:import type { ClinicUpdate, ScheduleItem } from '../types/slc.types';
src/domain/slc-manual-add.ts:1:import type { Medication, ScheduleType } from '../types/slc.types';
src/domain/slc-clinic-update.ts:1:import type { ScheduleType } from '../types/slc.types';
src/domain/clinic-guide-medication-normalizer.ts:1:import type { Medication } from '../types/slc.types';
src/features/onboarding/onboarding-flow.ts:1:import type { Medication, ScheduleType } from '../../types/slc.types';
src/components/action-card.tsx:4:import type { ScheduleItem } from '../types/slc.types';
src/components/action-card.tsx:5:import { ctaLabel, completedLabel } from '../types/slc.types';
src/domain/slc-records.ts:1:import type { ClinicUpdate, CompletionRecord, InjectionSite, ScheduleItem, ScheduleType } from '../types/slc.types';
src/features/onboarding/onboarding-screen.tsx:21:import type { Medication } from '../../types/slc.types';
src/features/presentation/presentation-calendar-demo.tsx:2:import type { ScheduleItem } from '../../types/slc.types';
src/features/presentation/presentation-testbed.tsx:2:import type { ClinicUpdate, CompletionRecord, PartnerLink, ScheduleItem } from '../../types/slc.types';
app/(authed)/clinic-update/page.tsx:5:import type { ScheduleItem } from '../../../src/types/slc.types';
src/components/confirm-sheet.tsx:3:import type { ScheduleItem, InjectionSite } from '../types/slc.types';
src/lib/slc-fallback.ts:1:import type { Medication, ScheduleItem } from '../types/slc.types';
app/api/onboarding/route.ts:7:import type { ScheduleType } from '../../../src/types/slc.types';
src/features/clinic-update/clinic-update-form.tsx:5:import type { ClinicUpdate, Medication, ScheduleItem, ScheduleType } from '../../types/slc.types';
app/(authed)/add/page.tsx:6:import type { ScheduleItem } from '../../../src/types/slc.types';
src/features/add/manual-add-form.tsx:6:import type { ScheduleType, Medication } from '../../types/slc.types';
tests/unit/schedule-status.test.ts:2:import { computeStatus } from '../../src/types/slc.types';
app/(authed)/calendar/page.tsx:7:import type { ScheduleItem } from '../../../src/types/slc.types';
app/(authed)/settings/page.tsx:8:import type { PartnerLink } from '../../../src/types/slc.types';
app/(authed)/home/page.tsx:10:import type { ClinicUpdate, ScheduleItem } from '../../../src/types/slc.types';
app/(authed)/schedule/[id]/edit/page.tsx:4:import type { ScheduleItem } from '../../../../../src/types/slc.types';
tests/unit/slc-records-screen.test.ts:6:import type { CompletionRecord, ScheduleItem } from '../../src/types/slc.types';
src/features/partner/partner-view.tsx:1:import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/slc.types';
src/features/partner/partner-view.tsx:2:import { completedLabel } from '../../types/slc.types';
tests/unit/slc-home-focus.test.ts:2:import type { ScheduleItem } from '../../src/types/slc.types';
src/features/more/more-screen.tsx:3:import type { PartnerLink } from '../../types/slc.types';
app/api/schedule/[id]/route.ts:4:import type { ScheduleItem, ScheduleType } from '../../../../src/types/slc.types';
app/api/schedule/route.ts:3:import type { ScheduleItem } from '../../../src/types/slc.types';
tests/unit/slc-home-screen.test.ts:5:import type { ClinicUpdate, ScheduleItem } from '../../src/types/slc.types';
app/api/schedule/add/route.ts:5:import type { ScheduleType } from '../../../../src/types/slc.types';
app/api/schedule/complete/route.ts:4:import type { InjectionSite } from '../../../../src/types/slc.types';
src/features/today/today-screen.tsx:13:import type { ClinicUpdate, InjectionSite, ScheduleItem } from '../../types/slc.types';
src/features/today/today-screen.tsx:14:import { ctaLabel } from '../../types/slc.types';
app/api/onboard/text-analyze/route.ts:8:import type { ScheduleType } from '../../../../src/types/slc.types';
app/api/clinic-guide/interview/route.ts:6:import type { ClinicUpdate } from '../../../../src/types/slc.types';
tests/unit/mvp-type-namespace-contract.test.ts:18:    const shim = readFileSync('src/types/slc.types.ts', 'utf8');
src/features/calendar/calendar-screen.tsx:6:import type { ScheduleItem } from '../../types/slc.types';
app/api/onboard/photo-analyze/route.ts:9:import type { ScheduleType } from '../../../../src/types/slc.types';
src/features/schedule/schedule-edit-form.tsx:5:import type { ScheduleItem, ScheduleType } from '../../types/slc.types';
app/api/onboard/candidates/confirm/route.ts:5:import type { ScheduleItem, ScheduleType } from '../../../../../src/types/slc.types';
tests/unit/slc-records-view-model.test.ts:3:import type { ClinicUpdate, CompletionRecord, ScheduleItem } from '../../src/types/slc.types';
tests/unit/slc-confirm-sheet-render.test.ts:5:import type { ScheduleItem } from '../../src/types/slc.types';
tests/unit/slc-clinic-followup.test.ts:2:import type { ClinicUpdate, ScheduleItem } from '../../src/types/slc.types';
tests/unit/calendar-screen.test.ts:5:import type { ScheduleItem } from '../../src/types/slc.types';
tests/unit/clinic-guide-contract.test.ts:11:import type { ClinicUpdate, Medication } from '../../src/types/slc.types';
src/types/clinic-guide.types.ts:1:import type { ClinicUpdate, Medication } from './slc.types';
```
