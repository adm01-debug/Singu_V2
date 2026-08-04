# ADR 003: Circuit Breaker for External Services

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** The system depends on external services (external Supabase DB, Bitrix24, n8n, ElevenLabs). When any service is down, repeated failed requests degrade the entire UX.

## Decision

Implement the Circuit Breaker pattern (`src/lib/circuitBreaker.ts`) with three states:

- **CLOSED:** Normal operation; failures increment counter.
- **OPEN:** After N consecutive failures, reject requests immediately for a cooldown period.
- **HALF_OPEN:** After cooldown, allow one probe request to test recovery.

Configuration: `failureThreshold=3`, `resetTimeoutMs=30000`.

## Consequences

- **Positive:** Fail-fast behavior prevents cascading failures; graceful degradation; automatic recovery.
- **Negative:** During OPEN state, legitimate requests are rejected.
- **Mitigation:** 30s cooldown is short enough for quick recovery; UI shows "service temporarily unavailable" toast.
