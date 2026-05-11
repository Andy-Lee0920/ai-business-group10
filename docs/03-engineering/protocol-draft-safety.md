# Protocol Draft safety contract

Status: P1 closure evidence for `#51` and `#96`.

## Boundary

Protocol Input turns pasted hospital instructions into **draft-only** items. A draft may suggest a card type, date, or time, but it is not an active home card until the user goes through the confirmation screen.

## Confirm-only rules

- Draft creation may write `visit_inputs` and `action_split_drafts` only.
- Draft creation must not call `confirm_capture`.
- Draft items keep `assignedTo` empty until the user chooses a role in Split Review.
- Missing time, missing medicine name, or unclear wording receives `needs_confirmation` and a restrained Korean explanation.
- User-edited draft text is passed to Split Review; the original pasted instruction remains stored as the raw input.
- `assigned_to`, `card_type`, importance, partner visibility, and scheduled metadata become active only in the explicit confirm payload.

## OpenRouter / AI relation

`#28` remains optional BYOK expansion. If AI is added later, it can only fill suggested draft fields and must keep the same manual fallback and confirm-only boundary. AI must not decide dosage, treatment strategy, final assignee, or safety priority.

## Non-goals

- No treatment recommendation.
- No dosage inference.
- No automatic calendar/home card creation.
- No partner sharing before explicit confirmation.
