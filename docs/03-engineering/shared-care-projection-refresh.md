# Shared care projection refresh contract

Fevio v1.0 shared care remains one-way: a card confirmed by the primary user can be projected to a partner view, but the partner view cannot write back.

## Payload boundary

Partner projection may expose only the existing whitelist:

- `title`
- `scheduled_at`
- `card_type`
- `description`
- `display_state`

Raw clinic memo text, `source_input_id`, user ids, token hashes, and private fields must not be serialized.

## Refresh strategy

The partner view uses a live read/polling boundary through `/api/partner/[token]/cards`.

- A refresh should re-read the same care-card dataset through `get_partner_action_view`.
- `display_state` is the testable revision marker for v1.0: `current`, `completed`, `revoked`, or `superseded`.
- A completed card must appear as `completed` without adding a partner write endpoint.
- Realtime can replace polling later only if it keeps the same whitelist and one-way write boundary.

## Product copy contract

The product home must say that only user-confirmed cards are shared. It must not imply that raw hospital notes or private fields are visible to the partner.
