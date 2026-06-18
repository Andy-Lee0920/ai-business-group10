# State-driven home mockups — 4 situation screens

## Purpose

This document defines the four PNG mockup situations requested for the Fevio demo/share-out: **the user's home screen changes according to the confirmed care situation**.

Important scope note:

- These are **mockup requirements and screen descriptions**, not a claim that every state is fully implemented in production today.
- The mockups must use the same visual language and design assets already present in the current Vercel app (`https://project-oznp0.vercel.app/`) and this repository.
- Do not introduce a separate visual style, third-party illustration pack, or new brand system for these PNGs.

## Design asset requirement

Use the current Fevio/SLC design system and assets already shipped in the app:

- Global visual tone: warm cream background, soft rounded surfaces, coral/sage/purple/yellow accents, mobile-first card layout.
- Existing style sources:
  - `app/fevio-ui.css`
  - `app/globals.css`
  - `src/features/today/today-screen.module.css`
  - `src/features/adaptive-home/care-surface-primitives.module.css`
- Existing asset registry:
  - `src/design/slc-assets.ts`
- Existing relevant assets:
  - `/assets/home/superovulation_induction.png`
  - `/assets/home/collection_of_eggs.png`
  - `/assets/home/implantation_wait.png`
  - `/assets/home/pregnancy_wait.png`
  - `/assets/slc/home-missed-recovery.png`
  - `/assets/slc/partner-readonly-visual.png`

The visual output should feel like the current deployed Fevio app, not like a new deck style.

## Product framing

Fevio should not present itself as a medical recommendation engine. The state-driven home should communicate:

> Fevio organizes the hospital-confirmed IVF care context into today's actions, partner support, and emotional protection.

Allowed:

- Reorder or emphasize confirmed care actions.
- Change visual intensity according to urgency.
- Translate the same care state into patient-facing and partner-facing language.
- Hide or soften sensitive information by default.

Not allowed:

- Recommend medication, dosage, or treatment decisions.
- Infer prognosis or embryo/result quality.
- Expose raw clinic text or medication details to a partner without consent.
- Invent UI states that cannot be connected back to a confirmed care context.

## Situation 1 — Trigger shot / critical time gate

### Scenario

A confirmed trigger injection exists for today, for example an Ovidrel trigger shot at 22:00.

### Why the screen changes

A trigger shot is a time-critical action. Even if the user's broader IVF phase is ovarian stimulation, the home surface should temporarily become a critical-time screen.

### Mockup direction

- Surface type: high-intensity care moment.
- Visual tone: warm coral / focused / urgent but not alarming.
- Hero component direction: `CareMomentRing` or equivalent critical-time hero.
- Primary message: `22:00 함께 지켜요` or similar.
- Primary card: trigger injection card with confirmed time.
- Secondary card: preparation checklist such as alarm, storage, partner reminder.
- Partner translation: show support action first. Medication name/dose should be hidden unless the patient has explicitly allowed detailed sharing.

### Suggested copy

Patient:

- `지금 가장 중요한 순간이에요. 시간을 함께 지켜요.`
- `오비드렐 주사 · 오늘 22:00`
- `병원 지시 기준으로 확인한 시간입니다.`

Partner:

- Default: `오늘 중요한 주사 시간이 있어요. 22:00 전에 함께 확인해 주세요.`
- Detailed sharing enabled: `오비드렐 주사 시간이 22:00로 등록되어 있어요.`

### Implementation reference

Existing rule context already points in this direction:

- `config/care-surface-rules.json`
  - `trigger-shot-hero`
  - condition: `overrideReason === "trigger_shot"`
  - component: `CareMomentRing`
  - intensity: `1.0`

## Situation 2 — Clinic visit day

### Scenario

The user has a confirmed clinic visit today, for example follicle monitoring, blood test, egg retrieval-related visit, or transfer preparation visit.

### Why the screen changes

A clinic day is less about medication execution and more about preparation, questions, logistics, and post-visit updates.

### Mockup direction

- Surface type: clinic preparation surface.
- Visual tone: soft yellow / calm readiness.
- Hero image: use existing clinic/home asset, preferably `slcAssets.home.clinicWide` (`/assets/home/collection_of_eggs.png`) or another current clinic asset.
- Primary card: visit time and preparation checklist.
- Secondary card: questions to ask / notes to capture after the visit.
- Partner translation: logistics help such as accompanying, pickup, waiting, or reminder. Do not expose raw clinic notes.

### Suggested copy

Patient:

- `오늘은 병원 방문 준비를 먼저 보여드릴게요.`
- `난포 확인 방문 · 오늘 09:30`
- `궁금한 점과 변경된 안내를 방문 후 업데이트로 남겨요.`

Partner:

- `오늘 병원 방문이 있어요. 동행/픽업/대기 같은 도움을 확인해 주세요.`

### Implementation reference

Existing routes/components that should remain visually aligned:

- `/home?care=clinic`
- `src/features/adaptive-home/clinic-day-home.tsx`
- `CareSurfaceFrame phase="clinic"`

## Situation 3 — Two-week wait / result waiting quiet mode

### Scenario

The user is in the two-week wait or result waiting period after transfer, with ongoing medication or vaginal medication but no new clinical result yet.

### Why the screen changes

This period is emotionally sensitive. The home screen should reduce interpretation pressure and keep only confirmed actions visible.

### Mockup direction

- Surface type: quiet / emotional protection surface.
- Visual tone: lavender/purple or muted warm neutral.
- Hero image: use existing waiting asset, such as `slcAssets.home.waiting` (`/assets/home/implantation_wait.png`).
- Primary card: today's confirmed medication/vaginal medication schedule.
- Secondary card: emotional-protection copy that discourages over-interpretation.
- Partner translation: supportive check-in, not result guessing.

### Suggested copy

Patient:

- `오늘은 조용히 살피는 날이에요.`
- `아침/저녁 복약만 차분히 확인해요.`
- `증상 해석은 줄이고, 병원 지시만 기준으로 볼게요.`

Partner:

- `오늘은 결과를 추측하기보다 편안하게 체크인해 주세요.`

### Implementation reference

Existing rule/context direction:

- `config/care-surface-rules.json`
  - `waiting-day-quiet`
  - condition: `careDay === "waiting_day" && cardCount > 0`
  - component: `CompactHeroGreeting`
  - intensity: `0.2`
- Existing components:
  - `src/features/adaptive-home/two-week-wait-home.tsx`
  - `src/features/adaptive-home/result-protection-home.tsx`

## Situation 4 — No confirmed care card / rest day

### Scenario

The user has no confirmed action card for today.

### Why the screen changes

An empty list can feel like a broken or unfinished product. Fevio should treat this as a valid low-intensity care state: no action required today.

### Mockup direction

- Surface type: rest / empty-care surface.
- Visual tone: sage or warm neutral.
- Hero image: use existing empty/waiting asset such as `slcAssets.home.empty` (`/assets/home/pregnancy_wait.png`) or current empty-state assets.
- Primary card: no confirmed care today.
- Secondary card: add new hospital instruction / check next schedule.
- Partner translation: no sensitive information to share; show quiet support state only.

### Suggested copy

Patient:

- `오늘은 확인할 케어가 없어요. 쉬어도 좋은 날이에요.`
- `새 병원 안내가 오면 사진이나 텍스트로 추가해 주세요.`

Partner:

- `오늘은 특별히 도울 일정이 없어요. 가볍게 안부만 전해도 좋아요.`

### Implementation reference

Existing rule context already points in this direction:

- `config/care-surface-rules.json`
  - `no-cards-suppress-primary`
  - condition: `cardCount === 0`
  - primary card suppressed
  - intensity: `0.15`

## Shared patient/partner privacy rule

All four mockups should show that patient and partner screens may come from the same care state but are translated differently.

Patient surface:

- May show confirmed action title, time, and patient-approved detail.
- May show medication name/dose if the patient entered or confirmed it.

Partner surface:

- Default scope: support action and timing.
- Detailed medication name/dose only if partner visibility is explicitly enabled.
- Never show raw clinic text, private notes, medical predictions, or unconfirmed extraction drafts.

Recommended visibility ladder:

1. Status only: `오늘 중요한 일정이 있어요.`
2. Category: `오늘 주사 일정이 있어요.`
3. Detail: `오비드렐 주사 · 22:00`
4. Full shared care context: only after explicit consent.

## PNG deliverable guidance

Create a single PNG contact sheet or four separate mobile PNGs showing:

1. Trigger shot / critical time gate
2. Clinic visit day
3. Two-week wait / result waiting quiet mode
4. No confirmed care card / rest day

Each mockup should include a small caption or label identifying:

- care situation
- why the surface changed
- patient-facing focus
- partner-facing translation

Recommended filename pattern:

- `fevio-state-home-01-trigger-shot.png`
- `fevio-state-home-02-clinic-visit.png`
- `fevio-state-home-03-waiting-quiet.png`
- `fevio-state-home-04-rest-day.png`
- Optional contact sheet: `fevio-state-home-mockups-contact.png`

## Acceptance criteria

- [ ] The PR contains one clear spec for the four state-driven home mockups.
- [ ] The spec explicitly says the PNG mockups use the same design language and assets as the current Vercel app.
- [ ] The four situations are described with scenario, rationale, patient-facing UI, partner-facing translation, and privacy boundary.
- [ ] The spec avoids claiming unimplemented behavior is already live.
- [ ] The spec does not introduce medication recommendation or dosage inference.
- [ ] The spec references existing rules/components/assets where available.
