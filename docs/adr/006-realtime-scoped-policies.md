# ADR 006: Scoped Realtime Channel Policies

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** The original Realtime policy (`USING: true`) allowed any authenticated user to subscribe to any channel, potentially receiving data changes from other users.

## Decision

Replace the blanket `USING: true` policy on `realtime.messages` with a scoped policy:

```sql
USING (realtime.topic() LIKE '%' || auth.uid()::text || '%')
```

This ensures users can only subscribe to channels that contain their own user ID in the topic name.

## Consequences

- **Positive:** Eliminates cross-user data leakage via Realtime; defense in depth alongside table-level RLS.
- **Negative:** Channel naming must include user ID; broadcast/presence channels need careful topic design.
- **Mitigation:** All current Realtime usage is `postgres_changes` which inherits table RLS; this policy adds an extra layer.
