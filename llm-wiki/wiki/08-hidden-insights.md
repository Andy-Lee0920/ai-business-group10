# 08 Hidden Insights

These are non-obvious constraints that often get lost when agents focus only on visible UI.

## 1. The Problem Is Information Translation, Not Scheduling

Users are not simply asking for a calendar. They are trying to translate messy clinic instructions into safe, shared home actions under stress.

The app should reduce:

- missed or misunderstood medication/injection timing
- partner information asymmetry
- emotional load from one person carrying the whole operation
- fear that private care data is being handled casually

## 2. The Primary User Wants Help, Not Loss of Control

Automation is useful only when the user still owns final confirmation. The product should feel like a careful assistant, not a medical authority.

## 3. Partner View Is Not a Mirrored Patient View

The partner does not need raw clinical detail. They need a clear action surface:

- what is my role today?
- what can I help with?
- what should I avoid?

This is a projection problem, not a copy/paste sharing problem.

## 4. Dynamic Home Is a Function, Not a Template Gallery

Avoid splitting implementation by UI variant names before the data contract is stable. Home surfaces should derive from persisted care state and confirmed cards.

Preferred framing:

```text
input contract -> domain transformation -> renderer projection -> URL-action-result acceptance
```

## 5. Demo Mode Should Inject Data, Not Branch Logic

Demo and product paths should use the same domain functions. Demo mode may provide fixture data, but core parsing, care-day computation, and projections should not branch on `isDemoMode`.

## 6. First Login Is Not Routine Day

If the user has never captured instructions, the home should guide onboarding. Showing a routine dashboard before the first care state exists weakens the core product loop.

## 7. Done Requires a Visible User Outcome

Passing tests is necessary but not sufficient for product behavior. UI issues need URL-action-result acceptance evidence: a role, a URL, an action, and an expected visible result.

