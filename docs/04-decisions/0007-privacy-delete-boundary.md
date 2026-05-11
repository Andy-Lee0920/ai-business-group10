# ADR 0007 — Privacy delete and partner disconnect boundary

## Status

Accepted — 2026-05-11

## Context

Fevio stores high-sensitivity fertility treatment data. Users must understand what can be stopped immediately, what requires a deletion request, and which parts need legal/privacy review before self-serve destructive automation is released.

## Decision

For the current P1 closure:

- Partner sharing can be disconnected immediately by revoking active read-only links in `/settings/sharing`.
- Revoked partner links must no longer return sensitive card data and must not leak raw token/user data.
- Full account/data deletion remains request-based for now through the privacy contact email; no automated destructive deletion job is shipped in this slice.
- The Privacy Gate must connect these ideas in user-facing copy: storage boundary, partner disconnect, deletion request, and medical boundary.

## Legal/privacy Red items

Before self-serve account deletion ships, Fevio needs explicit review of:

- retention windows for clinical notes, audit trails, and partner-share access logs;
- whether deletion should be soft-delete, anonymization, or hard-delete per table;
- export-before-delete obligations;
- support identity verification for deletion requests;
- media storage policy if uploads are added later.

## Test contract

- Privacy Gate copy includes deletion request contact and explains automatic deletion is v1.x.
- Privacy Gate links partner disconnect to `/settings/sharing`.
- Partner link revoke route rejects unauthorized revocation without leaking raw user/token data.
