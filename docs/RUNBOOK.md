# SINGU CRM — Runbook Operacional

> **Documento único e autoritativo** para deploy, rollback, monitoramento e resposta a incidentes em produção.
>
> **Versão**: v2.2.0 — _Rodada R: observabilidade ativa do error budget (sparkline 30d, retenção 60d, alertas automáticos 50/75/100%)._

## 📜 Changelog

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| **v2.2.0** | 2026-04-20 | @lovable-sre | Painel `/admin/error-budget` ganha sparkline de uptime diário (30d) com linha de SLO; retenção automática de snapshots >60d via cron semanal `system-health-snapshots-cleanup`; alertas automáticos `error_budget_50/75/100` em `system_alerts` (idempotentes 24h, exibidos no painel) |
| v2.1.0 | 2026-04-20 | @lovable-sre | Painel `/admin/error-budget` operacional; placeholders datados; template de postmortem com guard-rails + exemplo preenchido (`postmortem-example.md`); snapshots persistidos em `system_health_snapshots` via cron 5min |
| v2.0.0 | 2026-04-20 | @lovable-sre | Quick Reference Card, Error Budget Policy, Matriz RACI, Capacity Planning, Game Days, Backup Verification, Dependency Map, On-Call Handoff, link para `postmortem-template.md` e `dr-drills/` |
| v1.0.0 | 2026-04-13 | @lovable-docs | Merge `RUNBOOK.md` + `runbook.md`; health check `system-health` v2; inventário de 90+ funções; 12 cenários de troubleshooting; kill switches |

## 🆘 Quick Reference Card (1 página)

> **Para uso sob pressão durante incidente.** Mais detalhes nas seções abaixo.

```
┌─ HEALTH ────────────────────────────────────────────────────┐
│ curl https://dialogue-diamond.lovable.app/functions/v1/...  │
│   .../system-health                                          │
│ UI admin: header → SystemHealthWidget                        │
│ Pública:  /status                                            │
└──────────────────────────────────────────────────────────────┘

┌─ ROLLBACK ───────────────────────────────────────────────────┐
│ Frontend:      Lovable → Histórico → Reverter (<2min)        │
│ Edge function: Reverter código + redeploy automático (<5min) │
│ DB migration:  forward-only (criar migration que desfaz)     │
└──────────────────────────────────────────────────────────────┘

┌─ KILL SWITCHES (sem deploy) ─────────────────────────────────┐
│ UPDATE connection_configs SET is_active=false                │
│   WHERE provider IN ('lux','evolution','firecrawl',          │
│                      'enrichlayer');                         │
│ Voice AI: invalidar ELEVENLABS_API_KEY em Cloud→Secrets      │
└──────────────────────────────────────────────────────────────┘

┌─ SEVERIDADE (resumo) ────────────────────────────────────────┐
│ P1: health unhealthy >5min OU >50% sem login OU dado perdido │
│ P2: módulo core >5% erro OU latência P95 >2× SLO por 15min   │
│ P3: módulo secundário degradado <20% usuários                │
│ P4: bug visual sem impacto                                   │
└──────────────────────────────────────────────────────────────┘

┌─ ESCALATION ─────────────────────────────────────────────────┐
│ 1) Plantonista (imediato P0/P1)                              │
│ 2) Tech Lead (após 15min)                                    │
│ 3) CTO (após 1h ou se PII exposta)                           │
│ 4) Suporte Lovable (infra externa)                           │
│ Detalhes: DISASTER_RECOVERY.md §Cadeia de escalation         │
└──────────────────────────────────────────────────────────────┘
```

## 📚 Documentos relacionados

- [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) — Plano de recuperação de desastre, on-call, RTO/RPO
- [`LOAD_TESTING.md`](./LOAD_TESTING.md) — Testes de carga k6, baselines de capacidade
- [`SECURITY.md`](./SECURITY.md) — Políticas, RLS, hardening
- [`EDGE_FUNCTIONS_API.md`](./EDGE_FUNCTIONS_API.md) — Contratos de cada função
- [`postmortem-template.md`](./postmortem-template.md) — Template blameless de post-mortem
- [`dr-drills/README.md`](./dr-drills/README.md) — Calendário de game days e protocolo de restore mensal
- [`adr/`](./adr/) — 18 Architecture Decision Records

## 📋 Índice

1. [Deploy](#-deploy)
2. [Rollback](#-rollback)
3. [Health Check](#-health-check)
4. [Edge Functions — Inventário](#-edge-functions--inventário)
5. [Banco de Dados](#-banco-de-dados)
6. [Monitoramento, Tracing & SLOs](#-monitoramento-tracing--slos)
7. [Error Budget Policy](#-error-budget-policy)
8. [Severidades de Incidente](#-severidades-de-incidente)
9. [Matriz RACI de Incidentes](#-matriz-raci-de-incidentes)
10. [Resposta a Incidentes](#-resposta-a-incidentes)
11. [Playbook de Comunicação](#-playbook-de-comunicação)
12. [Troubleshooting (12 cenários)](#-troubleshooting)
13. [Feature Flags & Kill Switches](#-feature-flags--kill-switches)
14. [Segurança & Rotação de Secrets](#-segurança--rotação-de-secrets)
15. [Capacity Planning](#-capacity-planning)
16. [Dependency Map & Blast Radius](#-dependency-map--blast-radius)
17. [Chaos Engineering & Game Days](#-chaos-engineering--game-days)
18. [Backup Verification](#-backup-verification)
19. [On-Call Handoff Checklist](#-on-call-handoff-checklist)

---

## 🚀 Deploy

### Frontend (Lovable)
- Commits na branch `main` disparam deploy automático.
- Preview builds por branch/PR em `id-preview--*.lovable.app`.
- Produção: `https://dialogue-diamond.lovable.app`.

### Edge Functions
- Deploy automático ao alterar `supabase/functions/`.
- Verificação pós-deploy: chamar `/functions/v1/system-health`.

### Migrations
1. Criar migration via ferramenta `supabase--migration`.
2. Aguardar aprovação do usuário.
3. Executada automaticamente após aprovação.
4. Tipos atualizados em `src/integrations/supabase/types.ts` (auto-gerado).

### Checklist anti-regressão de Edge Functions

1. **Imports** — usar `npm:pacote@versao`. **Proibido** `https://esm.sh/...` (esm.sh ocasionalmente retorna 502 e quebra boot).
2. **Lock file** — se deploy falhar com `Module not found`, apagar `supabase/functions/deno.lock` e redeployar.
3. **Tracing** — usar `tracedLogger(req, "<fn-name>")` e emitir `log.info("request_received", {...})` no início do handler.
4. **Smoke test** — `supabase--curl_edge_functions` com payload mínimo: HTTP 200, header `x-trace-id`, log `request_received`.
5. **Rollback** — reverter via histórico Lovable e redeployar (stateless).
6. **Lint guard** — `node scripts/check-edge-imports.mjs` (exit 1 se importar `esm.sh`).

---

## ⏪ Rollback

| Camada | Procedimento | Tempo |
|---|---|---|
| Frontend | Histórico de versões do Lovable | < 2 min |
| Edge Functions | Reverter código + redeploy | < 5 min |
| Banco de Dados | **Forward-only** — criar nova migration que desfaz | Variável |

> ⚠️ Migrations destrutivas exigem backup lógico prévio (`pg_dump`).

---

## 🏥 Health Check

### Endpoint
```
GET/POST /functions/v1/system-health
```
Público (sem JWT). Retorna `200 OK` se `healthy`/`degraded`, `503` se `unhealthy`.

### Componentes verificados (5)

| Componente | Origem | Significado |
|---|---|---|
| `database_local` | Supabase local (`profiles`) | DB principal do app |
| `database_external` | Supabase externo (`companies`) | Banco corporativo |
| `whatsapp` | Evolution API `/instance/fetchInstances` | Sync WhatsApp |
| `email_pipeline` | `email_logs` (último registro) | Pipeline Gmail/Pub/Sub |
| `voice_ai` | ElevenLabs `/v1/models` | STT/TTS |

### Status semântico

- `up` — funcionando normalmente
- `degraded` — responde mas com latência alta ou último evento >1h
- `down` — falha de conectividade
- `not_configured` — secrets ausentes (não é incidente)

### Overall

- `healthy` — todos `up` ou `not_configured`
- `degraded` — algum `degraded`
- `unhealthy` — algum `down` (HTTP 503)

UI: widget `SystemHealthWidget` (admin header) + página pública `/status`.

---

## ⚡ Edge Functions — Inventário

**Total: 90+ funções.** Agrupadas por categoria com auth guard.

### A — Autenticadas via JWT (`withAuth`)
Funções chamadas pelo frontend autenticado.

| Grupo | Exemplos | Rate limit |
|---|---|---|
| **Dados externos** | `external-data` | 100/min/IP |
| **AI consultiva** | `ask-crm`, `ai-writing-assistant`, `ai-email-refine`, `conversational-search`, `semantic-search` | 20/min/IP |
| **AI análise** | `disc-analyzer`, `rfm-analyzer`, `lead-scorer`, `forecast-analyzer`, `win-loss-analyzer`, `detect-churn-risk`, `meeting-summary`, `email-thread-summary`, `playbook-generator`, `next-best-action`, `suggest-next-action`, `generate-insights`, `generate-offer-suggestions` | 10/min/IP |
| **Enriquecimento** | `enrich-contacts`, `email-verifier`, `email-finder`, `phone-validator`, `firecrawl-scrape`, `enrichlayer-linkedin`, `social-profile-scraper` | 30/min/IP |
| **ABM/Intent** | `abm-account-scorer`, `abm-whitespace-analyzer`, `intent-aggregator`, `intent-tracker`, `mql-evaluator` | 30/min/IP |
| **Connections** | `connection-tester`, `connection-introspect`, `connection-anomaly-detector`, `ai-suggest-mapping` | 30/min/IP |
| **Voice** | `voice-agent`, `voice-to-text`, `elevenlabs-tts`, `elevenlabs-scribe-token`, `voice-ai-health` | 30/min/IP |
| **Deal Rooms** | `deal-room-share`, `deal-room-health`, `deal-room-buyer-view` | 30/min/IP |
| **Forecast/RevOps** | `forecast-narrative`, `attribution-calculator`, `demand-forecast`, `revops-snapshot-builder` | 20/min/IP |
| **Outros** | `audit-analytics`, `territory-optimization`, `lead-routing`, `visual-search`, `conversation-analyzer`, `social-behavior-analyzer`, `social-events-detector`, `bulk-revalidate` | 20-30/min/IP |

### B — Crons (`requireCronSecret`)
Disparados via cron interno; exigem header `x-cron-secret`.

`client-notifications`, `check-notifications`, `weekly-digest`, `check-health-alerts`, `template-success-notifications`, `forecast-snapshot-cron`, `lead-score-cron`, `lead-score-threshold-runner`, `nurturing-runner`, `sequence-processor`, `cs-health-recalc`, `conversation-coaching-digest`, `validation-queue-worker`, `process-webhook-dlq`.

### C — Públicas (sem JWT)
`system-health`, `health`, `health-aggregate`, `intent-pixel-snippet`, `form-submit-handler`, `sequence-track`, `submit-signature`, `get-signature`, `validate-access`, `detect-new-device`.

### D — Service-to-Service (`withAuthOrServiceRole`)
`smart-reminders`, `send-push-notification`, `send-sms-campaign`, `smart-notify`.

### E — Webhooks (segredo de integração)
`evolution-webhook`, `bitrix24-webhook`, `lux-webhook`, `lux-trigger`, `incoming-webhook`, `evolution-api`.

### F — Especiais
`mcp-server` (Model Context Protocol), `win-loss-record-deal`.

### Limites operacionais
- Timeout padrão: 60s (150s para AI).
- Payload máx: 6 MB.
- Rate limit: in-memory por IP (`_shared/rate-limit.ts`), reseta em cold start.

---

## 🗄️ Banco de Dados

| Banco | Uso | Tabelas |
|---|---|---|
| **Supabase Local** | App data (contatos, deals, AI) | ~200 |
| **Supabase Externo** | Legado/corporativo (companies, cooperativas) | ~220 |

- Pooling: PgBouncer automático (60 diretas / 200 pooler).
- Queries lentas: `query_telemetry` + badge global frontend (>3s).
- Optimistic locking: coluna `version` em `contacts`/`companies`; conflito → HTTP 409 `CONCURRENT_EDIT`.

---

## 📊 Monitoramento, Tracing & SLOs

### Web Vitals (frontend)
`useWebVitals.ts` em produção. Metas: LCP < 2.0s, INP < 200ms, CLS < 0.1.

### Circuit Breaker
`src/lib/circuitBreaker.ts` — CLOSED → OPEN → HALF_OPEN. Protege banco externo e APIs terceiras.

### Tracing distribuído

Toda resposta das funções críticas (`external-data`, `ask-crm`, `ai-suggest-mapping`, `connection-anomaly-detector`, `incoming-webhook`) inclui header `x-trace-id` (UUID v4).

```bash
# Capturar traceId
curl -i -X POST "$SUPABASE_URL/functions/v1/external-data" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT" \
  -d '{"action":"select","table":"contacts","limit":1}' | grep -i x-trace-id

# Buscar logs correlacionados
supabase functions logs external-data --search "traceId=<uuid>"
```

Mensagens-chave: `request_received`, `concurrent_edit_detected`, `upstream_gateway_error`, `uncaught error`.

### SLOs

| Métrica | Alvo | Fonte |
|---|---|---|
| Disponibilidade `external-data` | ≥ 99.5% (200, inclui `fallback:true`) | Supabase logs |
| Latência `select` P95 | < 2.0s | `query_telemetry` |
| Latência `update_with_version` P95 | < 3.0s | `query_telemetry` |
| Taxa de conflito 409 | < 5%/min | logs `concurrent_edit_detected` |
| Taxa de erro 5xx | < 1%/min | logs `level=error` |
| `system-health` overall | `healthy` ≥ 99% do tempo | endpoint público |

### Comandos SQL de diagnóstico

```sql
-- Top 10 queries mais lentas (24h)
SELECT operation, table_name, duration_ms, occurred_at
FROM query_telemetry
WHERE occurred_at > now() - interval '24 hours'
ORDER BY duration_ms DESC LIMIT 10;

-- Conflitos 409 por hora
SELECT date_trunc('hour', occurred_at) AS hour, COUNT(*) AS conflicts
FROM query_telemetry
WHERE error_code = '409' AND occurred_at > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- Alertas ativos
SELECT type, priority, COUNT(*) FROM alerts
WHERE dismissed = false GROUP BY 1,2;
```

---

## 🚨 Severidades de Incidente

| Nível | Gatilho objetivo | SLA Resposta | SLA Resolução |
|---|---|---|---|
| **P1 — Crítico** | `system-health` `unhealthy` por >5 min **OU** >50% usuários sem login **OU** perda de dados confirmada | 15 min | 4 h |
| **P2 — Alto** | Módulo core (Contatos/Empresas/Pipeline) com >5% taxa de erro **OU** latência P95 >2× SLO por 15 min | 1 h | 24 h |
| **P3 — Médio** | Módulo secundário degradado afetando <20% usuários **OU** componente `degraded` no health por >1 h | 4 h | 5 dias úteis |
| **P4 — Baixo** | Bug visual/copy sem impacto funcional | Próximo sprint | Backlog |

---

## 🚨 Resposta a Incidentes

1. **Identificar** — `system-health`, console browser, `supabase functions logs`, `traceId`.
2. **Comunicar** — usar templates do [Playbook de Comunicação](#-playbook-de-comunicação).
3. **Isolar** — circuit breaker / kill switch (ver [Feature Flags](#-feature-flags--kill-switches)).
4. **Corrigir** — hotfix ou rollback.
5. **Validar** — `system-health` verde por 30 min + teste manual.
6. **Post-mortem** — em até 48 h: causa raiz, impacto (usuários, duração), ações preventivas. Registrar em `docs/postmortems/AAAA-MM-DD.md`.

On-call rotation: ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md#on-call-rotation).

---

## 📣 Playbook de Comunicação

### Canais oficiais
- Status page pública: `https://dialogue-diamond.lovable.app/status`
- Email transacional para usuários ativos (via pipeline Gmail)
- Notificações in-app via `smart-notify`

### Templates (PT-BR)

**Incidente em curso (≤15 min após detecção)**
```
[SINGU] Estamos investigando uma degradação em {módulo}.
Início: {HH:MM BRT}. Impacto: {descrição em 1 frase}.
Próxima atualização em 30 min. Status: dialogue-diamond.lovable.app/status
```

**Resolução**
```
[SINGU] Incidente resolvido às {HH:MM BRT}.
Duração total: {Xh Ymin}. Causa: {1 frase}.
Post-mortem público em até 48h.
```

**Post-mortem (48 h)**
```
Resumo público: o que aconteceu, por quê, impacto medido,
ações preventivas com owners e prazos.
Link: docs/postmortems/{AAAA-MM-DD}.md
```

---

## 🔧 Troubleshooting

### 1. Edição concorrente — HTTP 409 `CONCURRENT_EDIT`
Optimistic locking detectou versão obsoleta. Frontend mostra toast destrutivo com **Recarregar** que invalida a query. Pico anormal (>5%/min) → checar `automation_logs` para job paralelo. Logs: `concurrent_edit_detected`.

### 2. Upstream gateway 502/503/504 (Cloudflare no banco externo)
`external-data` detecta HTML de erro e retorna `{fallback:true, data:[], count:0}` com HTTP 200. UI permanece interativa. Logs: `upstream_gateway_error`. Se 100% das responses ficarem `fallback:true` → comunicar usuários.

### 3. Rate limit — HTTP 429
Limites em `_shared/rate-limit.ts` por IP. Ajustar `max`/`windowMs` na função e redeployar se usuário legítimo for afetado.

### 4. Empresa demora para carregar
Verificar `LISTING_SELECT` (não `SELECT *`), `INITIAL_FAST_LOAD = 100`, `countMethod: 'planned'`, latência via `system-health`.

### 5. Edge Function 401
Token JWT expirado → `refreshAuthToken()`. Função usa `withAuth` (não auth manual).

### 6. Edge Function CORS error
Origem deve estar em `*.lovable.app`. Confirmar `scopedCorsHeaders(req)`. OPTIONS deve incluir headers CORS.

### 7. Dados duplicados no banco externo
Constraints UNIQUE, `onConflict` correto em upserts, idempotência de webhooks (`evolution`, `bitrix24`).

### 8. Slow query >3s
Badge global aparece (`useSlowQueryIndicator`). Confirmar índices e checar `query_telemetry`.

### 9. Schema drift externo
`schema-drift-observability` loga divergências e mostra em `/admin/schema-drift`. Resiliência: hooks retornam `data: null` graciosamente.

### 10. Drift de mapping de campos
Conferir `FIELD_MAPPING.md` e UI `/admin/field-mapping`. `ai-suggest-mapping` pode propor correções.

### 11. ElevenLabs 401 (Voice AI down)
`ELEVENLABS_API_KEY` revogada/expirada. Health: `voice_ai: down`. Rotacionar secret em Lovable Cloud → Secrets.

### 12. Evolution API instance offline
Health: `whatsapp: degraded/down`. Reconectar instância em `/admin/conexoes/whatsapp`. Fallback: usuários veem aviso no módulo de Conversas.

---

## 🎚️ Feature Flags & Kill Switches

Para desabilitar módulos sem deploy, alterar `connection_configs.is_active = false`:

```sql
-- Desabilitar Lux Intelligence
UPDATE connection_configs SET is_active = false WHERE provider = 'lux';

-- Desabilitar WhatsApp sync
UPDATE connection_configs SET is_active = false WHERE provider = 'evolution';

-- Desabilitar Voice AI (UI esconde módulo se ELEVENLABS_API_KEY ausente)
-- Remover/invalidar secret em Lovable Cloud → Secrets

-- Desabilitar enriquecimento Firecrawl/EnrichLayer
UPDATE connection_configs SET is_active = false WHERE provider IN ('firecrawl','enrichlayer');
```

Frontend lê `useConnectionConfigs()` e oculta CTAs de módulos inativos. Hooks chamam `external-data` com fallback gracioso.

---

## 🔐 Segurança & Rotação de Secrets

### Inventário de secrets

| Secret | Owner | Frequência | Procedimento |
|---|---|---|---|
| `LOVABLE_API_KEY` | Lovable AI Gateway | Auto-rotacionado | — |
| `GEMINI_API_KEY` (legado) | Google AI Studio | Anual | Console Google → regenerar |
| `CRON_SECRET` | Plataforma | Trimestral | Atualizar em Cloud + cron jobs |
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` | Evolution API | Quando comprometido | Regenerar na Evolution |
| `ELEVENLABS_API_KEY` | ElevenLabs | Anual | Dashboard ElevenLabs |
| `EXTERNAL_SUPABASE_URL` / `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | DBA externo | Quando comprometido | Regenerar projeto externo |
| `FIRECRAWL_API_KEY` | Firecrawl | Anual | Dashboard Firecrawl |
| `ENRICHLAYER_API_KEY` | EnrichLayer | Anual | Dashboard EnrichLayer |
| `BITRIX24_WEBHOOK_SECRET` | Bitrix24 | Quando comprometido | Bitrix Inbound Webhooks |
| `LUX_WEBHOOK_SECRET` | n8n Lux | Quando comprometido | n8n credentials |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` | Plataforma | A cada 2 anos | Regenerar par e atualizar service worker |

UI de auditoria: `/admin/secrets-management` (hashes SHA-256, sem expor valor).

### Checklist trimestral de segurança

| Item | Owner | Última execução |
|---|---|---|
| `npm audit` zero high/critical | Eng Lead | _registrar data_ |
| RLS em todas as tabelas novas | DBA | _registrar data_ |
| Auth guards em edge functions | Eng Lead | _registrar data_ |
| Remoção de secrets não usados | Plataforma | _registrar data_ |
| Headers de segurança em `index.html` (CSP) | Eng Frontend | _registrar data_ |
| Linter Supabase sem CRITICAL/HIGH | DBA | _registrar data_ |

Registrar evidências em `docs/security-audits/AAAA-Q{1-4}.md`.

---

## 💰 Error Budget Policy

### Cálculo

SLO de disponibilidade = **99.5%** → **3.6h de downtime permitido por mês** (43.2 min/semana).

| Período | Budget total | 50% consumido | 100% consumido |
|---|---|---|---|
| Mensal | 3h 36min | 1h 48min | 3h 36min |
| Semanal | 50min | 25min | 50min |
| Diário | 7min 12s | 3min 36s | 7min 12s |

### Política de Freeze

| Consumo do budget mensal | Política |
|---|---|
| < 50% | Operação normal — deploys diários liberados |
| 50% – 80% | **Alerta amarelo** — apenas deploys de baixo risco (UI, copy, hotfixes); revisão obrigatória por 2 engenheiros |
| 80% – 100% | **Freeze de feature** — somente correções P1/P2 e hotfixes de segurança |
| > 100% (estourado) | **Freeze total** — postmortem obrigatório; bloqueio até reset mensal; revisão de SLO se padrão se repetir 2 meses seguidos |

### Tracking

- Fonte primária: histórico de `system-health` (cron `check-health-alerts` agrega minutos `unhealthy`/`degraded`).
- Dashboard: [`/admin/error-budget`](/admin/error-budget) — 4 cards (SLO target, uptime 30d, budget consumido, status freeze). Atualizado a cada 5 min via snapshot de `system-health`. Cores: 🟢 <50% consumido • 🟡 50–100% (atenção) • 🔴 ≥100% (freeze ativo, deploys bloqueados).
- Query semanal:

```sql
-- Minutos não-healthy nos últimos 30 dias (agregação manual via logs)
SELECT
  date_trunc('day', occurred_at) AS dia,
  SUM(CASE WHEN status = 'unhealthy' THEN duration_minutes ELSE 0 END) AS unhealthy_min,
  SUM(CASE WHEN status = 'degraded' THEN duration_minutes ELSE 0 END) AS degraded_min
FROM health_check_history
WHERE occurred_at > now() - interval '30 days'
GROUP BY 1 ORDER BY 1 DESC;
```

> Conta apenas `unhealthy` para o budget; `degraded` é warning track.

### Alertas automáticos de Error Budget

A edge function `error-budget` insere registros idempotentes em `public.system_alerts` (RLS admin-only) sempre que o consumo cruza um threshold. Janela de deduplicação: **24h por nível**.

| Threshold | Severidade | `alert_type` | Ação esperada |
|---|---|---|---|
| ≥ 50% | `warning` | `error_budget_50` | Reduzir mudanças não-críticas; revisar incidentes do mês |
| ≥ 75% | `high` | `error_budget_75` | Revisão por 2 engenheiros em todo deploy; preparar freeze |
| ≥ 100% | `critical` | `error_budget_100` | **Freeze ativo**; postmortem obrigatório por incidente |

Os alertas ativos (não-reconhecidos) aparecem no topo de `/admin/error-budget`. Reconhecimento: `UPDATE system_alerts SET acknowledged_at=now(), acknowledged_by=auth.uid() WHERE id=...` (apenas admin).

### Retenção e cleanup

- Snapshots: cron `system-health-snapshot-5min` (a cada 5min) → tabela `system_health_snapshots`
- Cleanup: cron `system-health-snapshots-cleanup` (domingos 03:00 UTC) chama `public.cleanup_old_health_snapshots()` que apaga snapshots >60 dias e alertas reconhecidos >90 dias.
- Sparkline 30d: visualização contínua no painel mesmo em dias sem amostra (preenchidos como 100%).

---

## 👥 Matriz RACI de Incidentes

Papéis e responsabilidades durante incidentes P1/P2. Uma pessoa pode acumular papéis em incidentes pequenos, mas IC é sempre uma única pessoa.

| Atividade | Incident Commander | Comms Lead | Scribe | SME (Subject Matter Expert) |
|---|---|---|---|---|
| Declarar severidade e abrir war room | **R/A** | I | I | C |
| Investigar causa raiz | A | I | I | **R** |
| Decidir mitigação (rollback, kill switch, hotfix) | **R/A** | I | I | C |
| Comunicar status interno e externo | A | **R** | C | I |
| Manter timeline minuto-a-minuto | A | I | **R** | C |
| Validar resolução (health verde 30min) | **R/A** | I | I | C |
| Escrever post-mortem em ≤48h | A | C | C | **R** |

**Legenda**: R=Responsible (executa), A=Accountable (responde), C=Consulted, I=Informed.

### Definição dos papéis

- **Incident Commander (IC)** — coordena tudo, toma decisões finais; foco em "o que fazer agora", não "como consertar".
- **Comms Lead** — escreve mensagens para status page, e-mail e canais internos; protege IC de interrupções de stakeholders.
- **Scribe** — registra timeline em tempo real (hora, evento, decisão); fonte primária para o post-mortem.
- **SME** — engenheiro com expertise no módulo afetado; executa investigação técnica e mitigação.

> Em horário comercial, o plantonista assume IC por padrão. Em P1 noturno, o primeiro a responder vira IC até passar o bastão.

---

## 📈 Capacity Planning

Sinais para escalar antes que vire incidente.

| Sinal | Threshold | Ação |
|---|---|---|
| `interactions` rows | > 5M | Particionar por mês (`PARTITION BY RANGE (created_at)`) |
| `audit_log` rows | > 10M | Arquivar registros >1 ano em cold storage (parquet) |
| Edge function invocações sustentadas | > 100/min por 1h | Revisar rate limit, considerar cache no cliente |
| Tokens Lovable AI consumidos | > R$ 200/dia | Ativar cache em `ask-crm`/`ai-writing-assistant` (TTL 1h) |
| Pool de conexões DB | > 80% sustentado por 15min | Investigar long-running queries, aumentar `pool_size` ou refatorar |
| Latência P95 `external-data` | > 1.5s por 30min | Verificar índices no banco externo, ajustar `LISTING_SELECT` |
| Storage usage | > 80% da quota | Limpar avatares órfãos, comprimir mídias antigas |
| Cold start rate | > 15% das invocações | Considerar warm-up cron a cada 5min nas funções críticas |
| Taxa de 409 `CONCURRENT_EDIT` | > 5%/min sustentado | Investigar job que escreve em paralelo; revisar UX de edição |
| Realtime subscriptions ativas | > 500 simultâneas | Avaliar throttling/sharding por canal |

Revisão mensal pelo Tech Lead; thresholds reavaliados a cada 6 meses.

---

## 🌐 Dependency Map & Blast Radius

### Diagrama de cascata

```
Lovable AI Gateway (LOVABLE_API_KEY) DOWN
  ├─ ai-writing-assistant      ❌ (sem fallback)
  ├─ ai-email-refine           ❌ (sem fallback)
  ├─ ask-crm                   ❌ (sem fallback)
  ├─ conversational-search     ❌ (sem fallback)
  ├─ semantic-search           ⚠️  degradado → fallback trigram local
  ├─ meeting-summary           ❌ (sem fallback)
  ├─ disc-analyzer             ❌ (sem fallback)
  ├─ lead-scorer               ⚠️  degradado → fallback heurístico client-side
  ├─ next-best-action          ❌ (sem fallback)
  └─ ai-suggest-mapping        ❌ (sem fallback; UI mostra erro)

Banco Externo (EXTERNAL_SUPABASE_*) DOWN
  ├─ external-data             ⚠️  retorna {fallback:true, data:[]} HTTP 200
  ├─ Empresas (UI)             ⚠️  lista vazia + banner informativo
  ├─ Contatos (UI)             ⚠️  lista vazia + banner informativo
  ├─ Pipeline (deals)          ⚠️  cards vazios
  ├─ system-health             ⚠️  database_external: down
  └─ email_pipeline (depende)  ⚠️  email_pipeline: degraded

Evolution API (WhatsApp) DOWN
  ├─ evolution-webhook         ❌ (sem mensagens entrantes)
  ├─ Conversas (UI)            ⚠️  banner "WhatsApp indisponível"
  ├─ sequence-processor        ⚠️  steps WhatsApp pulados, retry 1h
  └─ system-health             ⚠️  whatsapp: down

ElevenLabs DOWN
  ├─ voice-agent               ❌
  ├─ voice-to-text             ❌
  ├─ elevenlabs-tts            ❌
  └─ Voice AI (UI)             ⚠️  módulo escondido se health=down

Pipeline Email (Pub/Sub Gmail) DOWN
  ├─ incoming-webhook          ❌ (sem novos emails sincronizados)
  ├─ email_logs                ⚠️  sem novos registros → email_pipeline: degraded após 1h
  ├─ Interações (email)        ⚠️  histórico estagnado
  └─ email-thread-summary      ✅ (opera sobre dados já sincronizados)
```

### Tabela de impacto cruzado

| Falha | Módulos OK | Módulos degradados | Módulos OFF |
|---|---|---|---|
| Lovable AI Gateway | Contatos, Empresas, Pipeline, Tarefas | Semantic search, Lead scoring | Ask CRM, todas funções IA |
| Banco externo | Auth, Tarefas locais, Notificações | — | Empresas, Contatos, Pipeline (cards vazios) |
| Evolution API | Email, Voice, IA | Sequências (steps WhatsApp pulam) | WhatsApp inbox |
| ElevenLabs | Tudo exceto voz | — | Voice AI module (escondido) |
| Pipeline Email | Tudo exceto sincronização nova | Histórico de email estagnado | Captura de novos emails |

> **Regra de design**: nenhuma falha isolada de integração externa deve derrubar Auth, Contatos locais, Tarefas ou Notificações. Se isso acontecer = bug arquitetural.

---

## 🎲 Chaos Engineering & Game Days

Ver índice completo e calendário em [`dr-drills/README.md`](./dr-drills/README.md).

### Resumo do calendário

| Trimestre | Cenário | Duração |
|---|---|---|
| Q1 | Matar `external-data` em horário comercial | 1h |
| Q2 | Revogar `EVOLUTION_API_KEY` | 45min |
| Q3 | Simular schema drift externo | 1h |
| Q4 | Load test 2× pico via k6 | 2h |

### Princípios

1. **Anunciar com 48h de antecedência** — todos os engenheiros + comms team.
2. **Janela definida** — abortar se incidente real concorrente.
3. **Hipótese antes** — escrever o que esperamos que aconteça (predição vs. realidade revela gaps).
4. **Action items obrigatórios** — todo drill gera ≥1 melhoria; resolver em ≤30 dias.
5. **Drill não é teste de pessoas** — blameless igual incidente real.

---

## 💾 Backup Verification

Ver protocolo completo em [`dr-drills/README.md`](./dr-drills/README.md#-protocolo-de-verificação-de-backup-mensal).

**Resumo**:
- **Frequência**: mensal (1ª terça, 10h-12h BRT).
- **Owner**: @dba.
- **Procedimento**: restaurar PITR de 24h em projeto staging, rodar `system-health`, validar contagem de 5 tabelas críticas, validar RLS, destruir staging.
- **Evidência**: `docs/dr-drills/AAAA-MM-restore.md`.
- **Critério de sucesso**: restore em <30min, contagens com diff <5% vs. mês anterior, RLS intacta.

> Backup que não é testado **não é backup** — é wishful thinking.

---

## 🤝 On-Call Handoff Checklist

Plantonista que sai preenche e envia ao plantonista que entra (canal `#oncall-handoff` ou e-mail).

### Template

```
# Handoff — De @saída para @entrada
Período coberto: AAAA-MM-DD HH:MM → AAAA-MM-DD HH:MM BRT
Próximo handoff: AAAA-MM-DD HH:MM BRT

## 1. Incidentes em aberto
- [ ] Nenhum   /   [ ] Listar: ID, severidade, status, próximo passo

## 2. Deploys agendados nas próximas 24h
- [ ] Nenhum   /   [ ] Listar: módulo, hora, owner

## 3. Alertas em snooze / suprimidos
- [ ] Nenhum   /   [ ] Listar: alerta, motivo, expira em

## 4. Secrets em rotação esta semana
- [ ] Nenhum   /   [ ] Listar: secret, owner, deadline

## 5. Drills agendados (game day / restore)
- [ ] Nenhum   /   [ ] Data, cenário, owner

## 6. Mudanças de schema pendentes (banco externo)
- [ ] Nenhuma   /   [ ] Listar: tabela, mudança, ETA, impacto previsto

## 7. Rate limits ajustados recentemente
- [ ] Nenhum   /   [ ] Função, valor antigo → novo, motivo

## 8. Feature flags / kill switches ativados
- [ ] Nenhum   /   [ ] Provider, desde quando, motivo, plano de reativação

## 9. Links rápidos
- system-health: https://dialogue-diamond.lovable.app/functions/v1/system-health
- Status page:   https://dialogue-diamond.lovable.app/status
- Logs:          Lovable Cloud → Edge Functions → Logs
- Error logs UI: /admin/error-logs
- Schema drift:  /admin/schema-drift

## 10. Cadeia de escalation (validar telefones atualizados)
- Tech Lead: @nome — tel
- CTO:       @nome — tel
- Suporte Lovable: status.lovable.dev
```

> **Regra**: handoff não enviado = plantonista que sai ainda é responsável até confirmação explícita do entrante.
