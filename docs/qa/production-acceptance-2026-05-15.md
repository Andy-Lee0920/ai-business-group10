# Production Acceptance Evidence — 2026-05-15

## Scope

- Target: https://project-oznp0.vercel.app
- Environment: production Vercel + production Supabase project.
- Method: isolated Supabase auth test users with cookie-backed sessions, production API/browser actions, and service-role readback for DB assertions.
- Cleanup: test auth users deleted after the run; related SLC rows cascade-delete.

## Important caveat

This run verifies a real Supabase authenticated production session, but it does **not** verify the Google OAuth consent screen itself. The #267 Google Login checkbox still requires a live Google OAuth user/session or manual tester.

## Results

| Scenario | Status | Evidence |
| --- | --- | --- |
| Supabase session auth | pass | Created isolated production Supabase patient/partner test users and cookie-backed sessions. |
| Patient onboarding + first schedule | pass | Created Menopur 150 IU schedule item 83519b90-954d-449c-8c76-41908d6d77ea at 2026-05-15T05:38:03.141Z. |
| Home Menopur visible | pass | Home text contains Menopur 150 IU; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/01-home-menopur-countdown.png. |
| Injection CTA/time card visible | pass | Home shows injection CTA with due/imminent time card copy. |
| Bottom sheet opens | pass | Injection site sheet opened; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/02-confirm-sheet-lower-right.png. |
| completion_records insert | pass | schedule_items.status=completed; completion_records.id=d522f304-2ac2-4f86-a503-3a37121e8552; injection_site=lower_right. |
| Home completed status | pass | Home after completion contains 완료; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/03-home-completed.png. |
| Records completion visible | pass | Records contains Menopur and 완료; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/04-records-completion.png. |
| Clinic Update new med + 2 days | pass | clinic_updates.id=585d64f2-f0aa-41dc-8892-3990e564af21; medication_days=2; clinic_update schedules=2; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/05-clinic-update-success.png. |
| Next visit prefill/edit path | pass | next_visit_at=2026-05-17T00:00:00+00:00. |
| Partner approval | pass | partner_links.status=approved. |
| Partner read-only view | pass | Partner view contains 읽기 전용 and Menopur; screenshot docs/qa/screenshots/2026-05-15-production-acceptance/06-partner-readonly.png. |

## Summary

- Passed: 12/12
- Production root and route deploy checks are tracked in #267 comments.
- Redacted IDs retained only as non-secret database evidence: patient=9906dbfb-ba1d-4a33-b5e2-5895d8b655a8, partner=99b5d1ee-cfef-4bbc-9d04-8731a29067ff, schedule=83519b90-954d-449c-8c76-41908d6d77ea, completion=d522f304-2ac2-4f86-a503-3a37121e8552, clinicUpdate=585d64f2-f0aa-41dc-8892-3990e564af21.
