# ADR 001: Feature-Sliced Design Architecture

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** The codebase grew to 600+ files. A flat component structure made it hard to find related code and caused implicit coupling between unrelated features.

## Decision

Adopt a Feature-Sliced Design (FSD) approach where code is organized by domain:

```
src/
├── components/      # Shared UI primitives (buttons, cards, dialogs)
├── hooks/           # Shared React hooks
├── lib/             # Utilities, services, helpers
├── pages/           # Route-level page components
├── types/           # Shared TypeScript types
└── integrations/    # External service clients (Supabase)
```

Feature-specific components live under `components/<domain>/` (e.g., `components/contacts/`, `components/companies/`).

## Consequences

- **Positive:** Clear ownership per domain; easier onboarding; reduced merge conflicts.
- **Negative:** Some cross-domain components require careful placement decisions.
- **Mitigation:** Shared components stay in `components/ui/`; domain-specific ones in their domain folder.
