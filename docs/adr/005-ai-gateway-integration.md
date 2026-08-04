# ADR 005: AI via Lovable Gateway (No User API Keys)

**Status:** Accepted  
**Date:** 2026-04-11  
**Context:** Multiple features need AI capabilities (DISC analysis, insight generation, writing assistant, social behavior analysis). Requiring users to provide their own API keys adds friction.

## Decision

Use the Lovable AI Gateway (`https://aigateway.lovable.dev`) for all AI features. This provides:

- Access to multiple models (Gemini, GPT) without user API keys
- Automatic key management and rotation
- Usage tracking and quota management

Edge functions call the gateway with the project's `LOVABLE_API_KEY` secret.

## Consequences

- **Positive:** Zero-config AI for users; consistent API interface; no key leakage risk.
- **Negative:** Depends on Lovable gateway availability; 402 errors when credits are exhausted.
- **Mitigation:** Graceful handling of 402 with user-friendly toasts and empty states; fallback messaging.
