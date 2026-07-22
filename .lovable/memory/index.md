# Project Memory

## Core
Português obrigatório em respostas, documentação e UI.
Max 400 linhas por arquivo. Sem `any`. TanStack Query exclusivo. Sem `useEffect` para fetch.
Dark/Light theme com tokens HSL semânticos. Nunca usar cores diretas em componentes.
Lovable Cloud (Supabase) com RLS em todas as tabelas. RBAC via `user_roles` + `has_role()`.
Edge functions usam `Deno.serve()` + scopedCorsHeaders. Nunca raw SQL via RPC.
Não implementar módulos de Produtos nem Propostas (escopo proibido).
Excelência sustentada: 70/70 melhorias atômicas (Rodadas A-N). Gate a11y no CI.

## Memories
- [Rodada 21/10 — Blindagem Profunda](mem://migration/completion-21-10) — 8 hardenings: sequence overflow, deadlock rate, temp files, bgwriter, amcheck btree, fillfactor HOT, archive health, subscription lag.
- [Rodada 20/10 — Blindagem Absoluta](mem://migration/completion-20-10) — 8 hardenings: MultiXact/datfrozenxid wraparound, AccessExclusive locks, wal_level logical, timeline split-brain, autovacuum saturation, hot_standby_feedback, extension minor parity.
- [Rodada 19/10 — Governança & Resiliência Extrema](mem://migration/completion-19-10) — 8 hardenings: toast compression, idle-in-tx guard, PUBLIC privileges audit, PITR window verifier, logical-vs-physical drift, pg_cron failover guard, search_path reset audit, connection pool canary.
- [Rodada 16/10 — Governanca Profunda](mem://migration/completion-16-10) — 8 hardenings: replication slots orfaos, security definer search_path, NOT VALID constraints, long-running tx, tabelas sem PK, FDW credenciais, pg_stat_statements config, log retention + orquestrador full-audit.sh.
- [Rodada 15/10 — Hardening Sustentado](mem://migration/completion-15-10) — 8 hardenings: replication lag, grants parity, logical publication, invalid indexes no CI, autovacuum audit, bloat monitor, planner stats, query plan regression.
- [Rodada 14/10 — Hardening Contínuo](mem://migration/completion-14-10) — 8 hardenings: FK integrity, trigger parity wrapper, MV refresh audit, sequence gap, storage public guard, cron TZ, CORS scoped no CI, backup encryption verifier.
- [Rodada 13/10 — Excelência Sustentada](mem://migration/completion-13-10) — 8 hardenings: restore drill, CDC order-guard, RLS coverage no CI, JWT rotation dual-key, WAL archive health, k6 pool saturation, extension parity, tz/locale drift.
- [Rodada N — IA & Self-Healing](mem://features/ux-rodada-n-ia-self-healing) — 70/70: ai-suggest-mapping, anomaly detector diário, self-healing por schema drift (human-in-the-loop), ask-crm com tabelas de integrações, ADR-017.
- [Rodada M — Federação & DX](mem://features/ux-rodada-m-federacao-dx) — 65/65: schema discovery via information_schema, templates de webhook (Bitrix/n8n/Stripe/GitHub), snippets cURL/JS/Python/n8n, MCP v1.2.0 com 5 novas tools, ADR-016.
- [Rodada L — Governança Conexões](mem://features/ux-rodada-l-governanca-compliance) — 60/60: auditoria com mascaramento, HMAC SHA-256 + anti-replay, quotas mensais (429), dry-run/replay, ADR-015.
- [Rodada K — Observabilidade Conexões](mem://features/ux-rodada-k-observabilidade-integracoes) — 55/55: DLQ + retry exponencial, sparkline P50/95/99, alertas em smart_notifications, SLO 99.5%, ADR-014.
- [Connections Module](mem://features/connections-module) — /admin/conexoes: integrações Supabase/Bitrix24/n8n/MCP Claude + webhooks entrantes com tester, logs e MCP server JSON-RPC.
- [Rodada I — Polimento Final](mem://features/ux-rodada-i-polimento-profundo) — 45/45: testes axe, registry de atalhos, Gallery v2, health-aggregate, ADR-012.
- [Rodada H — Acessibilidade WCAG AA](mem://features/ux-rodada-h-accessibility) — 40/40: SkipNav, RouteAnnouncer, useAccessibleToast, foco visível.
- [Standards — Accessibility WCAG AA](mem://standards/accessibility-wcag-aa) — Auditoria documentada de superfícies críticas.
- [System Health Check](mem://features/system-health-check) — Edge function `system-health` + widget admin + `/status` público.
- [Error Budget Dashboard](mem://features/error-budget-dashboard) — `/admin/error-budget` com SLO 99.5%, sparkline 30d, alertas auto 50/75/100% (`system_alerts`), retenção 60d, RUNBOOK v2.2.0.
- [Migration Completion 10/10](mem://migration/completion-10-10) — Freeze, DNS propagation, parity (sequences/RLS/triggers), post-cutover watch, synthetic checks, full-restore, DR strategy, postmortem template
- [Migration Completion 11/10](mem://migration/completion-11-10) — CDC RPO=0, dual-write bake, verify SHA-256, LGPD manifest, brief executivo
- [Migration Completion 12/10](mem://migration/completion-12-10) — CDC lag watch, dual-write diverge, schema freeze guard, secrets scan, large-object storage, sequence heal, DNS multi-region, chaos drill
- [User preferences](mem://~user) — Execução autônoma e sequencial de melhorias.
