# ADR 004: Authentication & Authorization Strategy

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** The CRM handles sensitive customer data. Need robust auth with minimal friction.

## Decision

- **Authentication:** Supabase Auth with email/password + Google OAuth. MFA enabled. Password HIBP check enabled.
- **Authorization:** RBAC via `user_roles` table with `has_role()` SECURITY DEFINER function. RLS on all tables scoped by `user_id = auth.uid()`.
- **Edge Functions:** JWT validated in-code via `getClaims()` / `withAuth()`. Cron jobs use `requireCronSecret()`. Webhooks use `requireWebhookSecret()`.
- **Frontend:** Route guards via `RequireAuth` and `RequireAdmin` components. Token refresh handled transparently.

## Consequences

- **Positive:** Defense in depth; no client-side role checks; BOLA prevention via RLS.
- **Negative:** Requires careful policy maintenance as tables grow.
- **Mitigation:** Security scans in CI; periodic RLS audits.
