# Fevio benchmark acceptance criteria

## PR must include

- URL-based Green condition evidence.
- Screenshot or Playwright smoke for each affected phase.
- Proof that implementation preserves hierarchy, not pixels.
- Test that banned engineering terms are absent.
- Test that phase layouts do not share identical top component order when the issue touches adaptive layout.

## Required URL checks

### Injection patient

URL: `/home?care=injection`

Expected:

- First fold shows Ring/time-dominant hero.
- `21:00` or equivalent time is the largest text/object.
- One primary CTA.
- No dense grid above fold.
- No partner pulse above the dominant ring/time object.

### Clinic patient

URL: `/home?care=clinic`

Expected:

- First fold shows a clinical briefing document.
- Questions count, last-7-days care summary, and partner attendance are visible or clearly represented.
- CTA is `진료 브리핑 열기` or equivalent.
- No injection-style dominant countdown.

### Waiting patient

URL: `/home?care=waiting`

Expected:

- First fold shows quiet/space-dominant layout.
- One central reassurance sentence and next required date/fact.
- No dense grid, progress dashboard, or multiple CTAs above fold.

### Demo dual-view

URL: `/demo`

Expected:

- Patient view and partner view have different role surfaces.
- Scenario changes alter both patient and partner content.
- Partner view translates state into action, not raw mirror.

### Partner view

URL: `/partner/demo` or `/partner/[token]`

Expected:

- Partner sees role, actions, and avoid prompt before raw details.
- No `rev`, `sync_revision`, raw token, raw user id, raw memo, or emotion score.

## Fail conditions

Fail immediately if:

- same top 5 component test ids appear in the same order for injection, clinic, and waiting;
- only color/copy/icon changes;
- first fold contains dense cards;
- partner screen mirrors raw patient data;
- medical copy implies app-created dosage/diagnosis/missed-shot judgment;
- no deployed URL demonstrates the expected role/action/result.
