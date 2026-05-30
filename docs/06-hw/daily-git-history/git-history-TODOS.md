# Git History Follow-up TODOs

This file tracks open verification and follow-up items surfaced by the daily git history digest.
Add items here when a digest identifies a risk, a "Not-tested" gap, or a recommended next action.
Close items by checking the box and noting the resolution date and evidence.

---

## Open

### [2026-05-30] Remote migrations from 2026-05-29 batch not confirmed applied

Source: digest `2026-05-30.md` — three migrations landed with `Not-tested: Remote migration application`.

- [ ] Apply `supabase/migrations/202605290002_split_candidates_source_offset.sql` to remote Supabase and post deploy ID.
- [ ] Apply `supabase/migrations/reminder_dispatches_card_time_channel_unique.sql` to remote Supabase and post deploy ID.
- [ ] Apply `supabase/migrations/202605270001_community_post_photos.sql` to remote Supabase and post deploy ID.

Resolution evidence required: Supabase migration history screenshot or `supabase db remote` output showing all three migrations present.

---

### [2026-05-30] pg_cron installation on remote Supabase not verified

Source: digest `2026-05-30.md` — idempotent reminder dispatch requires `pg_cron`.

- [ ] Confirm `pg_cron` extension is enabled in the remote Supabase project (`supabase extensions list` or dashboard → Extensions).
- [ ] Confirm `CRON_SECRET` environment variable is set in Supabase Edge Function secrets.

---

### [2026-05-30] iOS Safari push CTA physical-device smoke

Source: digest `2026-05-30.md` — `PushPermissionCta` iOS install-aware copy not tested on real hardware.

- [ ] Open `project-oznp0.vercel.app` in Safari on a real iOS device.
- [ ] Verify the install-first banner appears before the push permission prompt.
- [ ] Verify push permission is not requested automatically on page load.

---

### [2026-05-30] Survey page smoke after Firebase removal

Source: digest `2026-05-30.md` — `app/survey/page.tsx` significantly rewritten; Firebase storage removed.

- [ ] Open `/survey` on `project-oznp0.vercel.app` as an authenticated user.
- [ ] Complete the survey flow end-to-end and confirm results are saved without error.

---

## Closed

_(none yet)_
