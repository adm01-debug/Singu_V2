# ADR 002: External Database Proxy via Edge Functions

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** The system needs to read/write data from an external Supabase database (legacy CRM data with 220+ tables). Direct browser-to-external-DB connections would expose service-role keys to the client.

## Decision

Create a single Edge Function (`external-data`) that acts as an authenticated proxy:

1. Client authenticates via JWT to the local Supabase
2. Edge function validates JWT, then uses service-role key to query external DB
3. Allowlist of tables prevents arbitrary table access
4. Pagination, search, and filters are handled server-side

## Consequences

- **Positive:** Service-role key never leaves the server; table allowlist enforces access control; centralized query logging.
- **Negative:** Adds latency (~50-100ms) per request; single point of failure for external data.
- **Mitigation:** Circuit breaker pattern (ADR 003), retry with backoff, 15s statement timeout.
