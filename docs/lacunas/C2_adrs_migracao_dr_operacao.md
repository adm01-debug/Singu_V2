# C2 — ADRs, Migração, DR, Hardening e Operação: o que foi planejado e não está executado

> **Repositório:** `/home/user/Singu_V2` · **HEAD:** `e616c20` (2026-10-11) · **Auditoria:** 2026-10-11 · nenhum arquivo do repo foi alterado.
> **Escopo:** `docs/adr/*` (001–022 + README), `docs/MIGRATION_*`, `docs/HARDENING_*`, `docs/DISASTER_RECOVERY.md`, `docs/dr/*`, `docs/dr-drills/*`, `docs/CHAOS_DRILL.md`, `docs/LOAD_TESTING.md`, `docs/RUNBOOK.md`, `docs/runbooks/db-guards.md`, `docs/HOTFIX_PROCEDURE.md`, `docs/SECURITY.md`, `docs/SIGNING_KEY_ROTATION.md`, `docs/perf/*`, `docs/GRAPHIFY.md`, `docs/postmortem-*`, e o que eles referenciam em `scripts/` e `monitoring/`.

## Método e verificações em runtime

Toda linha abaixo foi conferida no código da HEAD (`arquivo:linha`). Além da leitura estática, fiz estas verificações **reais e somente leitura** em 2026-10-11:

| Verificação | Como | Resultado |
|---|---|---|
| Execuções de CI | `gh run list` / `gh run view` (API GitHub) | `CI` verde em `main` desde 2026-10-08; `monitoring-lint` **falhou em 10/10 execuções** (última 2026-08-04); cron `RLS exposure guard` verde em 2026-10-05 |
| Domínio publicado do frontend | Vercel API (`list_projects`, `list_project_domains`) + bundle | Projeto `singu-v2`, único domínio `singu-v2.vercel.app`; o bundle aponta para `pgxfvjmuubtbowutlide.supabase.co` |
| CORS das 108 edge functions no projeto canônico | `OPTIONS` com `Origin: https://singu-v2.vercel.app` | **106/108 respondem `access-control-allow-origin: https://dialogue-diamond.lovable.app`**; 2 respondem `*` |
| Edge functions publicadas | `OPTIONS` nas 108 (controle: função inexistente → 404) | 108/108 publicadas (200) |
| Auth do projeto canônico | `GET /auth/v1/settings` (chave publishable do bundle) | `"google": false`, `"disable_signup": false`, `"email": true` |
| Chave de assinatura JWT | `GET /auth/v1/.well-known/jwks.json` | 1 chave ES256 |
| `tsc` do CI | `tsc --noEmit --listFilesOnly -p tsconfig.json` | **0 arquivos** (com `tsconfig.app.json`: 1.718 arquivos de `src/`) |

Não tive acesso SQL ao banco canônico (`pgxfvjmuubtbowutlide`). Tudo que depende do estado físico do banco, dos secrets ou de painéis externos está marcado **NÃO VERIFICADO**.

**Legenda:** ❌ NÃO INICIADO · 🟨 PARCIAL · 📜 SCRIPT ÓRFÃO (existe, mas nada executa) · 🔌 DESCONECTADO · ⬛ MORTO · 📄 DOC FALSO/DESATUALIZADO · ✅ OK (aparece só na contagem).

Classificação das rodadas de hardening: **(a)** script ou guard escrito e nunca executado em CI ou cron; **(b)** executado de verdade; **(c)** só documentado.

---

## docs/adr/README.md (índice)

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-IDX-1 | Índice de ADRs como fonte de verdade das decisões | docs/adr/README.md:7-14 | 📄 | O índice lista 6 ADRs (001–006); existem 23 arquivos. Há dois ADR-010 (`010-excellence-sustained-rodada-g.md`, `010-zod-validation-strategy.md`) e três ADRs com prefixo diferente (`ADR-020..022`). `docs/RUNBOOK.md:65` fala em "18 ADRs". `ADR-019` tem data 2026-10-26 (019:3), posterior à HEAD | Atualizar o índice para 001–022, renumerar o ADR-010 duplicado, padronizar os nomes e corrigir a data do 019 | Decisões 007–022 ficam invisíveis em onboarding e auditoria | P |

## ADR-001 — Feature-Sliced Design

**OK verificados: 1.** A organização por domínio em `src/components/<domínio>/` existe (≈90 pastas de domínio).

## ADR-002 — Proxy de banco externo (`external-data`)

**OK verificados: 3.** Allowlist de tabelas (`supabase/functions/external-data/index.ts:108,240`), statement timeout de 15 s (`:169`) e JWT obrigatório. O efeito colateral do CORS está em ADR-007-1.

## ADR-003 — Circuit Breaker

**OK verificados: 2.** A classe tem os 3 estados (`src/lib/circuitBreaker.ts:16-80`). O breaker `external-db` usa 3 falhas / 30 s (`src/lib/externalData.ts:55-58`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-003-1 | Circuit breaker para **todos** os serviços externos (DB externo, Bitrix24, n8n, ElevenLabs) | docs/adr/003-circuit-breaker-pattern.md:5,9 | 🟨 | Há **1 instância** em todo o repo: `getCircuitBreaker('external-db')` em `src/lib/externalData.ts:55`. Nenhum `new CircuitBreaker`/`getCircuitBreaker` em outros arquivos de `src/`. Nenhum breaker em `supabase/functions/` (bitrix24-webhook, evolution-*, elevenlabs-*, lux-* fazem `fetch` direto) | Envolver em breaker as chamadas a Bitrix24, n8n/Lux, Evolution e ElevenLabs, no front (hooks) e nas edge functions (`_shared`) | Quando um terceiro cai, as requisições repetidas degradam a UX e consomem cota | M |

## ADR-004 — Autenticação e autorização

**OK verificados: 4.** `RequireAdmin` e `MFAGuard` estão montados (`src/app/AppRoutes.tsx:33,41`). `requireCronSecret` em 23 functions e `requireWebhookSecret` em 4. RLS coberta em CI (`.github/workflows/ci.yml:126,135`). Cron semanal de exposição RLS (`.github/workflows/rls-exposure-guard.yml:20`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-004-1 | Login com Google OAuth | docs/adr/004-auth-strategy.md:9 | 🔌 | O botão usa o broker do Lovable Cloud: `lovable.auth.signInWithOAuth("google")` em `src/pages/Auth.tsx:198`, via `src/integrations/lovable/index.ts:3-5,15`. O projeto canônico responde `"google": false` em `/auth/v1/settings` (runtime 2026-10-11) | Habilitar o provider Google no projeto `pgxfvjmuubtbowutlide` e trocar para `supabase.auth.signInWithOAuth` | "Entrar com Google" não funciona contra o backend atual | P |
| ADR-004-2 | Proteção de senha vazada (HIBP) "habilitada" | docs/adr/004-auth-strategy.md:9 | 🟨 NÃO VERIFICADO | Os checkboxes continuam abertos em `docs/HARDENING_FINAL_10_10.md:107` e `docs/HARDENING_PHASE2_20260410.md:39`. `supabase/config.toml:1` só contém `project_id` (nenhuma configuração de auth versionada) | Confirmar no painel do canônico e versionar `[auth]` no `config.toml` | Senhas vazadas aceitas no login de um CRM com PII | P |
| ADR-004-3 | Dados sensíveis protegidos por RLS ("BOLA prevention") | docs/adr/004-auth-strategy.md:5,16 | 🟨 | `"disable_signup": false` no canônico (runtime): qualquer pessoa cria conta. O baseline mostra que um usuário logado sem role vê `suppliers` 754, `carriers` 114, `role_permissions` 63, `permissions` 29, `users_public` 26, `salespeople` 12 (`scripts/rls-matrix/rls-baseline.json`, `_meta.alvo_fase_3`: "suppliers/carriers seguem pendentes") | Desligar o signup público (ou exigir convite/aprovação) e concluir a Fase 3 de RLS em suppliers/carriers/permissions | Cadastro anônimo dá leitura da base de fornecedores, transportadoras e da matriz de permissões | P–M |
| ADR-004-4 | Banner de cadastro de MFA | — (parte do MFA, ADR-004:9) | ⬛ | `src/components/security/MFAEnrollmentBanner.tsx:17` não é importado em lugar nenhum | Montar no layout ou remover | Baixa adesão a MFA | P |

## ADR-005 — Gateway de IA (Lovable)

**OK verificados: 1.** 33 functions chamam `ai.gateway.lovable.dev`.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-005-1 | Tratamento gracioso de 402 (créditos esgotados) | docs/adr/005-ai-gateway-integration.md:21 | 🟨 | 25 de 33 chamadores tratam 402. Sem tratamento: `semantic-search`, `voice-ai-health`, `next-best-action`, `voice-to-text`, `conversation-coaching-digest`, `deal-room-health`, `connection-anomaly-detector`, `smart-reminders` (grep `402` nas pastas) | Padronizar via `_shared/fetch-utils.ts` com mensagem amigável | Erro genérico quando os créditos acabam | P |
| ADR-005-2 | Métricas de uso e cota do gateway | docs/adr/005-ai-gateway-integration.md:13 | ⬛ | `supabase/functions/_shared/aiGatewayLogger.ts:20,44` (`logAiGatewayCall`/`withAiGatewayMetrics`) tem **0 importadores** em 108 functions. A telemetria real fica em `_shared/fetch-utils.ts:70-132`. `src/components/admin/AiGatewayHealthCard.tsx:102` manda usar a função morta | Remover o módulo morto ou unificar com o `fetch-utils` e corrigir a instrução do card | Instrução errada para quem instrumentar uma nova function de IA | P |
| ADR-005-3 | Gateway Lovable como provedor após sair do Lovable Cloud | docs/adr/005-ai-gateway-integration.md:9,15 | 📄 NÃO VERIFICADO | A URL do ADR (`aigateway.lovable.dev`) difere da real (`ai.gateway.lovable.dev`). O backend agora é um projeto Supabase em org Vercel (`supabase/.temp/linked-project.json:1`); a existência de `LOVABLE_API_KEY` no canônico não foi verificada | Confirmar o secret e atualizar o ADR para o cenário pós-migração | Toda a IA cai se a chave não existir no canônico | P |

## ADR-006 — Políticas de canal Realtime

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-006-1 | Policy `realtime.topic() LIKE '%'||uid||'%'` com canais contendo o uid | docs/adr/006-realtime-scoped-policies.md:11-15 | 📄 | A policy foi trocada para prefixo `uid || ':%'` (`supabase/migrations/20260412231633_...sql:30-40`). Os canais usam o uid no **sufixo**: `cadence-updates:${user.id}` (`src/components/crm/CadenceRulesConfig.tsx:153`), `smart-notif:${user.id}` (`src/hooks/useSmartNotifications.ts:81`), `realtime-notifications:${user.id}` (`src/hooks/useRealtimeNotifications.ts:201`); `contact-detail-${contactId}` não tem uid (`src/hooks/useContactDetail.ts:111`). Como tudo é `postgres_changes`, a policy está inerte hoje | Atualizar o ADR e padronizar o nome dos canais como `${uid}:<nome>` antes de usar broadcast/presence privado | Armadilha: o primeiro canal privado será negado silenciosamente | P |

## ADR-007 — CORS escopado

**OK verificados: 2.** `scopedCorsHeaders`/`handleCorsAndMethod` em 106/108 functions. Guard `check-edge-cors.mjs` roda no CI (`.github/workflows/ci.yml:32`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-007-1 | Allowlist de origens mantida para "produção, preview" | docs/adr/007-scoped-cors.md:9,13,19 | 🔌 **(verificado em runtime)** | A allowlist só aceita `dialogue-diamond.lovable.app`, `id-preview--…lovable.app`, `*.lovable.app`, `*.lovableproject.com` e `localhost`; para qualquer outra origem devolve `ALLOWED_ORIGINS[0]` (`supabase/functions/_shared/auth.ts:70-93`). O frontend publicado está na Vercel (`singu-v2.vercel.app`, Vercel API) e aponta para `pgxfvjmuubtbowutlide`. Preflight com essa origem: **106/108 functions devolvem `access-control-allow-origin: https://dialogue-diamond.lovable.app`** | Incluir `https://singu-v2.vercel.app` e os domínios futuros, de preferência por env (`ALLOWED_ORIGINS`), e fazer redeploy das 108 | No frontend da Vercel o navegador bloqueia toda chamada a edge function: external-data, IA, /status, conexões, voz, DLQ | P |
| ADR-007-2 | Exceções a wildcard só com ADR | scripts/edge-cors-allowlist.txt:1-5 | 🟨 | Duas functions respondem `*` em runtime; só `connection-tester` está na allowlist. `clear-must-reset-flag` e `evolution-bitrix-connector` não usam `scopedCorsHeaders` | Registrar as exceções ou migrá-las para o CORS escopado | Exceções sem justificativa formal | P |

## ADR-008 — Logger estruturado

**OK verificados: 2.** `src/lib/logger.ts` suprime o console em produção e persiste erros em `error_logs`. `setRequestId` é chamado em `src/components/layout/AppLayout.tsx:116`.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-008-1 | "Zero `console.log` direto; ESLint + teste de arquitetura validam" | docs/adr/008-structured-logger.md:18,24 | 🟨 | `eslint.config.js` não tem regra `no-console` (grep vazio). O teste é tolerante: `expect(violations.length).toBeLessThan(50)` (`src/__tests__/architecture-compliance.test.ts:117-135`). Há 5 `console.*` em código de produção: `src/hooks/useIntelTelemetry.ts:49`, `src/lib/providerGuard.ts:74-79`, `src/lib/fileValidation.ts:31` | `no-console: error` (exceto `logger.ts`) e assert `=== 0` | Vazamento de dados no console de produção não é bloqueado | P |
| ADR-008-2 | `logger.structured()` para JSON legível por máquina | docs/adr/008-structured-logger.md:16 | ⬛ | Definido em `src/lib/logger.ts:90`, com **0 chamadas** em `src/` | Usar em eventos de negócio ou remover | Sem trilha estruturada no frontend | P |
| ADR-008-3 | Correlação por `requestId`/trace entre front e edge | docs/adr/008-structured-logger.md:15,23; docs/RUNBOOK.md:112,233 | 🟨 | `tracedLogger` em **15/108** functions (`supabase/functions/_shared/tracing.ts:14`); 91/108 usam `console.*` direto. `withTraceResponseHeader` (`tracing.ts:27`) só em 4 functions (check-health-alerts, ai-assistant, abm-whitespace-analyzer, check-notifications); as 5 "críticas" do RUNBOOK (external-data, ask-crm, ai-suggest-mapping, connection-anomaly-detector, incoming-webhook) **não devolvem `x-trace-id`** (external-data só gera o id: `index.ts:271-272`) | Middleware `_shared` que gere o trace, injete o header e logue em JSON, aplicado às 108 | Diagnóstico de incidente sem correlação | M |

## ADR-009 — Rate limiting em camadas

**OK verificados: 2.** No frontend, 5 tentativas / 15 min com bloqueio progressivo (`src/lib/rateLimiter.ts:12-19`, usado em `src/pages/Auth.tsx:15`). No backend, `_shared/rate-limit.ts` está em 83/108 functions.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-009-1 | Rate limit em todas as functions expostas | docs/adr/009-rate-limiting-strategy.md:18-21 | 🟨 | 25 functions sem limiter; 20 delas são cron-gated. Não-cron sem limite: `send-sms-campaign` (custo por SMS), `clear-must-reset-flag`, `generate-behavioral-profile`, `retry-behavioral-profile`, `evolution-bitrix-connector` (+ `dual-write-proxy`, um webhook) | Adicionar o limiter nas 5 functions de usuário/webhook | Abuso de custo (SMS/IA) sem teto | P |
| ADR-009-2 | Limites citados (insights 10/min, external-data 60/min) e "sliding window" | docs/adr/009-rate-limiting-strategy.md:19-20 | 📄 | `supabase/functions/generate-insights/index.ts:7` usa `max: 30`; `external-data/index.ts:18` usa `max: 100`. A implementação é janela fixa (`_shared/rate-limit.ts:66-80`), não deslizante | Atualizar o ADR e o RUNBOOK com os valores reais | Tuning e resposta a incidente partem de números errados | P |

## ADR-010 (Rodada G) — Excelência sustentada

**OK verificados: 4.** Undo com snapshot (`src/pages/Contatos.tsx:149`, `src/pages/Empresas.tsx:47`); `meeting-summary` com 10/min + requestId (`supabase/functions/meeting-summary/index.ts:8,16`); `useWebVitals` montado (`src/app/AppRoutes.tsx:50`); `docs/ARCHITECTURE.md` existe.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-010G-1 | Painel `/admin/error-logs` com filtro de fonte "Performance" | docs/adr/010-excellence-sustained-rodada-g.md:24-27 | 🟨 | Os vitals são enviados com `source: 'web-vitals'` (`src/hooks/useWebVitals.ts:4,18`), mas `src/pages/admin/ErrorLogs.tsx:28-31` só filtra por severidade e texto | Filtro por `context.source` | Regressões de performance perdidas no meio de erros JS | P |
| ADR-010G-2 | CI roda typecheck | docs/adr/010-excellence-sustained-rodada-g.md:28-29 | 🔌 **(verificado)** | `.github/workflows/ci.yml:70` roda `npx tsc --noEmit` sobre o `tsconfig.json` raiz, que tem `"files": []` + references (`tsconfig.json:2`). `tsc --listFilesOnly -p tsconfig.json` lista **0 arquivos**; com `-p tsconfig.app.json` seriam 1.718 | Trocar por `tsc -p tsconfig.app.json --noEmit` (ou `tsc -b`) | Erros de tipo entram em `main` sem gate; "typecheck verde" é falso | P |

## ADR-010 — Validação Zod em dupla camada

**OK verificados: 1.** Frontend usa `src/lib/validationSchemas.ts`.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-010Z-1 | Edge functions validam payload com Zod e devolvem `fieldErrors` | docs/adr/010-zod-validation-strategy.md:14 | 🟨 | 39/108 importam zod; 73/108 têm algum validador (zod ou `_shared/validate.ts`). Os 35 sem validação incluem webhooks públicos: `bitrix24-webhook`, `evolution-webhook`, `lux-webhook`, `form-submit-handler`, `sequence-track`, `intent-pixel-snippet` | Schemas nos webhooks e endpoints públicos | Payload malformado de terceiro gera erro 500 ou dado inválido | M |

## ADR-011 — Rodada H (a11y/DX)

**OK verificados: 5.** Component Gallery (`src/app/AppRoutes.tsx:173`), SkipNav/RouteAnnouncer (`src/app/AppProviders.tsx:14-15,64`), atalhos (`src/components/layout/AppLayout.tsx:18,106`), agregador `system-health`, `CHANGELOG.md` e `.lovable/memory/standards/accessibility-wcag-aa.md`.

## ADR-012 — Rodada I

**OK verificados: 3.** Gate a11y com vitest-axe (`src/test/a11y/critical-components.test.tsx`, coberto pelo include do vitest). Shortcut registry com 20 usos. Gallery v2 com as abas `external` e `bulk` (`src/pages/admin/ComponentGallery.tsx:51-52`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-012-1 | SemVer estrito + tag `v2.1.0` + releases | docs/adr/012-rodada-i-polimento-final.md:32-37 | ❌ | `gh api .../tags` e `.../releases` voltam **vazios**; `package.json:4` diz `"version": "0.0.0"`; a última versão do `CHANGELOG.md` é 2.7.4 (`:31`, 2026-04-20) e tudo depois está em `[Unreleased]` (`:8`) | Criar tags e releases por deploy e versionar o `package.json` | Rollback e postmortem sem versão de referência | P |

## ADR-013 — Hardening do módulo de Conexões

**OK verificados: 3.** Rate limit em incoming-webhook e mcp-server (`supabase/functions/mcp-server/index.ts:12`). Trigger de criptografia (`supabase/migrations/20260420120250_...sql`). Revoke de `encrypt/decrypt_connection_config` (`20260723103825_...sql:58-59`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-013-1 | Chave de criptografia vinda de GUC/Vault em produção | docs/adr/013-connections-module-hardening.md:30-31 | 🟨 NÃO VERIFICADO | O fallback usa uma chave **pública e determinística** `digest('singu-connection-default-key-v1')` (`supabase/migrations/20260420120250_...sql:29-31`). Nenhuma migration, script ou config define `app.connection_encryption_key` nem lê o Vault (grep) | Gravar a chave no Vault, ler via `vault.decrypted_secrets`, remover o fallback e recriptografar | Tokens Bitrix, n8n e service_role possivelmente cifrados com uma chave que está no repositório | P |
| ADR-013-2 | `health-aggregate` v3.1 com bloco `connections` | docs/adr/013-connections-module-hardening.md:33-35 | 🔌 | Implementado (`supabase/functions/health-aggregate/index.ts:132-165,180`), mas sem **nenhum consumidor** no repo. A UI usa `system-health` (`src/components/admin/SystemHealthWidget.tsx:67`, `src/pages/StatusPage.tsx:49`) | Consumir no widget e no /status, ou fundir com `system-health` | A degradação de integrações não aparece em painel nenhum | P |
| ADR-013-3 | Rota `/admin/conexoes/logs` com logs unificados | docs/adr/013-connections-module-hardening.md:37-41 | 🔌 | A página existe (`src/pages/AdminConexoesLogs.tsx`), mas **não tem rota** (`src/app/AppRoutes.tsx:169` só registra `/admin/conexoes`; o catch-all em `:181` vai para NotFound) e não está em `lazyPages`. O link em `src/pages/AdminConexoes.tsx:44` leva a 404 | Registrar a rota lazy | Logs, DLQ e anomalias ficam inacessíveis para o admin | P |

## ADR-014 — Observabilidade de Conexões (DLQ, métricas, alertas)

**OK verificados: 3.** Gravação na DLQ (`supabase/functions/incoming-webhook/index.ts:332`). `get_connection_metrics` com grant (`supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql:5`). Triggers de alerta (`20260420121651_...sql:110,143`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-014-1 | Cron `process-webhook-dlq-every-5min` reprocessa a DLQ com backoff | docs/adr/014-connections-observability.md:12-13 | ❌ | Nenhum `cron.schedule` com esse nome nas 447 migrations. A function exige `x-cron-secret` (`supabase/functions/process-webhook-dlq/index.ts:27`). Os botões "reprocessar" (`src/hooks/useWebhookDlq.ts:44,59`) invocam **sem** o header e recebem 401 | Agendar via pg_cron com `x-cron-secret` (Vault) e aceitar JWT de admin no reprocesso manual | Webhooks que falham ficam presos na DLQ e o dado da integração se perde | P |
| ADR-014-2 | Aba DLQ e verificação em `/admin/conexoes/logs` | docs/adr/014-connections-observability.md:42 | 🔌 | `WebhookDlqPanel` só é usado dentro de `AdminConexoesLogs` (página sem rota, ver ADR-013-3) | Corrigir a rota | O operador não vê a fila | P |
| ADR-014-3 | SLO 99,5% de sucesso em webhooks | docs/adr/014-connections-observability.md:26-28 | 🟨 | `success_rate` só é calculado sob demanda no card; não há alerta nem registro histórico de violação do SLO | Job que avalie o SLO em 7 dias e grave em `system_alerts` | SLO declarado sem cobrança | P |

## ADR-015 — Governança (auditoria, HMAC, quotas)

**OK verificados: 4.** Trigger `audit_connection_changes` (`supabase/migrations/20260420122559_...sql`). HMAC com janela anti-replay (`supabase/functions/incoming-webhook/index.ts:188`). Quota (`:270`). Dry-run (`:112,326`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-015-1 | Retenção: `audit_log` 12 meses, `connection_quotas` 24 meses | docs/adr/015-connections-governance.md:29-32 | 🟨 | `data_retention_policies` cobre `incoming_webhook_logs` (90 dias), mas **não** `audit_log` nem `connection_quotas` (`supabase/migrations/20260723112943_...sql:39-66`) | Incluir as duas tabelas (no `audit_log`, via drop de partição) | Crescimento sem limite e não conformidade com a política declarada | P |
| ADR-015-2 | Purge de retenção efetivo (cron diário) | docs/adr/015-connections-governance.md:30 | 🟨 NÃO VERIFICADO em runtime | `apply_retention_policies()` insere em `audit_log(table_name, operation, record_id, changed_by, new_data, changed_at)` (`...20260723112943_...sql:102-104`). No schema versionado, `audit_log` não tem `operation`/`changed_by`/`changed_at` e exige `entity_type`/`entity_id`/`action` NOT NULL (`20260711152812_...sql:8-18`; `20261005230000_...sql:15-17` só adiciona `table_name`/`record_id`). O INSERT falha dentro do `EXCEPTION` (`...:107-110`) e **reverte o DELETE**: nada é purgado | Corrigir o INSERT para as colunas reais, testar contra o canônico e checar `last_deleted_count` | Dados pessoais retidos além do prazo (LGPD) | P |

## ADR-016 — Federação e DX

**OK verificados: 4.** `connection-introspect` a 10/min (`supabase/functions/connection-introspect/index.ts:14`). `WEBHOOK_TEMPLATES` (`src/components/admin/conexoes/webhookTemplates.ts`). `WebhookSnippetsSheet`. MCP 1.2.0 com log em `mcp_tool_calls` (`supabase/functions/mcp-server/index.ts:191,214`).

## ADR-017 — IA nas Conexões e self-healing

**OK verificados: 3.** `ai-suggest-mapping` com fallback determinístico (`supabase/functions/ai-suggest-mapping/index.ts:109-127`). Tabela `connection_anomalies` (`20260420131635_...sql`). `ask-crm` estendido (`supabase/functions/ask-crm/index.ts:15-29`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-017-1 | Self-healing por schema drift: erro de coluna no webhook dispara `ai-suggest-mapping` e cria `smart_notification` `mapping_drift` | docs/adr/017-connections-ai-self-healing.md:13 | ❌ | `incoming-webhook/index.ts` não chama `ai-suggest-mapping`; grep `mapping_drift` em `src/` e `supabase/` não encontra nada | Implementar o disparo em background no catch de erro de coluna, mais a notificação | Drift de origem só é percebido depois que os erros se acumulam | M |
| ADR-017-2 | `connection-anomaly-detector` em cron diário | docs/adr/017-connections-ai-self-healing.md:12 | 🔌 | A function aceita `x-cron-secret` (`supabase/functions/connection-anomaly-detector/index.ts:47-52`), mas **não há cron**. O único disparo é manual (`src/hooks/useConnectionAnomalies.ts:73`), via `AnomaliesWidget`, que só aparece na página sem rota | Agendar no pg_cron e expor o widget | Anomalias nunca detectadas de forma proativa | P |

## ADR-018 — Strict mode, feature flags, optimistic locking

**OK verificados: 4.** Tabela `feature_flags` + RLS (`supabase/migrations/20260420163323_...sql:30-63`). Página `/admin/feature-flags` (`src/app/AppRoutes.tsx:175`). Coluna `version` + trigger (`20260420163323_...sql:2-27`). 409 tratado em contatos (`src/hooks/useContacts.ts:253-256,337`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-018-1 | Strict mode em fases: Fase 2 `strictNullChecks`, Fase 3 `noImplicitAny` | docs/adr/018-hardening-strict-mode-feature-flags-optimistic-locking.md:17-21 | 🟨 | `tsconfig.app.json:17-19`: `strict:false`, `noImplicitAny:false`, `strictNullChecks:false`. Só `@typescript-eslint/no-explicit-any: error` foi adotado (`eslint.config.js`). Somado a ADR-010G-2, o compilador não checa nada no CI | Corrigir o tsc do CI e ligar `strictNullChecks` por diretório | Erros null/undefined em runtime continuam | G |
| ADR-018-2 | Rollout gradual via `useFeatureFlag(name)` | docs/adr/018-…md:23-29 | 🔌 | `src/hooks/useFeatureFlag.ts:15` tem **0 consumidores** em `src/`: nenhuma feature é controlada por flag. A flag `external_data_fallback` do DR (`docs/DISASTER_RECOVERY.md:73`) não existe. O nome de migration citado (`20260420_optimistic_locking_feature_flags.sql`, `:57`) também não existe | Usar flags nas features novas e no fallback do DR | "Rollout reversível sem deploy" não existe na prática | M |
| ADR-018-3 | Optimistic locking ponta a ponta em contacts/companies | docs/adr/018-…md:31-34 | 🟨 | A coluna `version` só foi garantida no banco canônico em 2026-10-05 (`supabase/migrations/20261005230000_...sql:1-7`, "Restaura as escritas em contacts, companies…"). A atualização de tags de empresa vai sem versão (`src/pages/Empresas.tsx:201` → `src/hooks/useCompanies.ts:369-371`) | Enviar a versão em todos os `updateCompany` e testar 409 em E2E | Perda silenciosa por last-write-wins em edições concorrentes | P |

## ADR-019 — Observabilidade externa (Prometheus/Alertmanager) + `docs/runbooks/db-guards.md` + `monitoring/` + `scripts/monitoring/`

**OK verificados: 2.** `amtool check-config` passa. `check-runbook-coverage.sh` roda no CI.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-019-1 | Exporter textfile (`full-audit-exporter.sh`) via node_exporter + cron a cada 5 min | docs/adr/019-external-observability-alerting.md:13-14; scripts/migration/verify/exporter/README.md:6-16 | 📜 | O script existe (`scripts/migration/verify/exporter/full-audit-exporter.sh`), mas nenhum host, IaC, cron ou workflow o executa. A instalação manual em `/opt/db-guards` não está registrada. Há 63 guards (26 FATAL + 37 WARN, `scripts/migration/verify/full-audit.sh:14-42+`), não os 66 citados no ADR (`:7`) | Provisionar o runner (VM ou GitHub Actions agendado) com `DEST_DB_URL` em segredo | Nenhum dos 63 guards de saúde do banco roda; problema de wraparound, bloat ou corrupção só é visto quando já é incidente | M |
| ADR-019-2 | Servidor Prometheus avaliando as regras | docs/adr/019-…md:13-17 | ❌ | `monitoring/` só tem `prometheus/rules/*.yml` e `alertmanager/alertmanager.yml`. Não há `prometheus.yml`, scrape config nem deploy | Prometheus gerenciado (Grafana Cloud etc.) ou alertas via pg_cron + `system_alerts` | Alertas de SLO e dead-man nunca disparam | M |
| ADR-019-3 | Alertmanager page → PagerDuty, ticket → Slack, silence por label `maintenance` | docs/adr/019-…md:17-19 | 🔌 | Receivers com placeholders `REPLACE_ME` (`monitoring/alertmanager/alertmanager.yml:31,38,44`). A rota `maintenance="true"` vem depois das rotas por severity com `continue:false` (`:12-24`), então o silence nunca casa | Secrets reais e rota de maintenance primeiro | Mesmo com Prometheus, nenhum alerta chega ao on-call | P |
| ADR-019-4 | "CI exige promtool válido" | docs/adr/019-…md:24 | 🔌 **(verificado)** | O job promtool falhou em **10/10** execuções (última: run 30908330469, 2026-08-04: `prometheus: error: unexpected promtool`), porque usa o entrypoint da imagem `prom/prometheus` (`.github/workflows/monitoring-lint.yml:20-23`). O workflow não é gate de merge | `--entrypoint promtool` e tornar o check obrigatório | As regras de alerta nunca foram validadas | P |
| ADR-019-5 | Runbook por alerta com link | docs/adr/019-…md:20 | 📄 | `runbook_url` aponta para `https://github.com/lovable/repo/...` (`monitoring/prometheus/rules/db-guards.yml:16,27,41,52,63`), não para `adm01-debug/Singu_V2` | Corrigir a URL base | O plantonista cai em link inexistente | P |
| ADR-019-6 | Exporters de RPC/AI Gateway (Rodadas 59/10 e 65/10) com regras próprias | scripts/monitoring/rpc-perf-exporter.sh:1-10; rpc-plan-exporter.sh:1-11; ai-gateway-partitions-exporter.sh:1-15 | 📜 | Os 3 exporters não são executados por nada. `rpc-perf-alerts.yml` e `ai-gateway-partitions-alerts.yml` ficam fora de `monitoring/prometheus/rules`, então nem promtool nem `check-runbook-coverage.sh` (`:6`) os cobrem | Mover as regras e agendar os exporters | Regressão de plano e bloat de partição sem alerta | M |
| ADR-019-7 | Alerta "p95 de qualquer RPC instrumentada" | docs/runbooks/db-guards.md (seção rpc-perf-degradation) | 🟨 | Só **2 RPCs** gravam `rpc_perf_samples`, e ambas são da própria observabilidade: `get_ai_gateway_health` e `get_ai_gateway_partition_stats` (`supabase/migrations/20261006140000_ai_gateway_observability.sql:297,352`) | Instrumentar as RPCs de negócio (`get_company_360_view`, relatórios, pipeline) | A latência das RPCs do usuário não é medida | M |

## ADR-020 / ADR-021 — Ratchet zero-warning

**OK verificados: 2.** Os 4 checks `--max-warnings=0` (`.github/workflows/ci.yml:78-81`) rodam e o CI está verde em `main` (2026-10-11).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-020-1 | Toda supressão `eslint-disable` exige `-- motivo` | docs/adr/ADR-020-zero-warning-ratchet.md:11 | 🟨 | **80 de 268** diretivas não têm justificativa, por exemplo `src/components/celebrations/MiniCelebration.tsx:206`, `src/components/companies/CompanyGrouping.tsx:15,89`, `src/components/ficha-360/ScoreProntidaoCard.tsx:94`. Não há regra automatizada (`eslint-comments/require-description` ausente em `eslint.config.js`) | Adicionar o plugin eslint-comments e justificar as 80 | O ratchet pode ser contornado em silêncio | P |

## ADR-022 — Baseline do linter backend

**OK verificados: 2.** As migrations de REVOKE existem (`supabase/migrations/20260924143556_t202_…sql`, `20260924144037_t203_…sql`) e são testadas no CI (`tests/rls/functions_least_privilege.sql`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ADR-022-1 | `check-backend-linter-baseline.mjs` falha em drift positivo | docs/adr/ADR-022-backend-linter-baseline-ratchet.md:25-26 | 📜 | O script não é chamado no CI nem em cron (grep `.github` vazio). Sem stdin, sai com 0 (`scripts/check-backend-linter-baseline.mjs:20-23`). O teto é 12 no script (`:17`) e 46 no ADR. O baseline foi medido no projeto Lovable antigo; `docs/qa/security-definer-audit.md:5` registra 103 DEFINERs no canônico | Job no CI rodando `supabase inspect db linter --linked` contra o canônico | Regressão de grants SECURITY DEFINER passa sem gate | P |

---

## docs/MIGRATION_EXECUTIVE_BRIEF.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MEB-1 | RPO 0 via CDC WAL lógico na janela | docs/MIGRATION_EXECUTIVE_BRIEF.md:14 | 📜 NÃO VERIFICADO | `scripts/migration/cdc/{drain.sh,replay.ts,lag-watch.sh,order-guard.ts}` existem, sem evidência de execução. Não há postmortem da migração (`c9b22b5`, 2026-08-04) | Registrar como a migração rodou de fato e qual foi o RPO obtido | Não dá para saber se houve perda de dados no cutover | P |
| MEB-2 | "Circuit breaker desliga cron ao estourar budget de IA" (trigger `ai_cost_budget`) | docs/MIGRATION_EXECUTIVE_BRIEF.md:23; docs/MIGRATION_MASTER_RUNBOOK.md:165 | ❌ | `ai_cost_budget` não aparece em migrations, scripts nem functions | Tabela de budget, trigger ou cron que desliga os jobs de IA e alerta | Custo de IA sem teto | M |
| MEB-3 | Backups com rotação KMS, Object Lock 30d e réplica cross-region | docs/MIGRATION_EXECUTIVE_BRIEF.md:40 | ❌ | Nenhum IaC, bucket ou workflow (ver BS-1/BS-2) | Ver BS-1/BS-2 | Promessa a stakeholders sem lastro | G |
| MEB-4 | "100% das operações em `audit_log` particionado" | docs/MIGRATION_EXECUTIVE_BRIEF.md:39 | 🟨 | Partições criadas só para os 6 meses seguintes à aplicação, mais DEFAULT (`supabase/migrations/20260711152812_...sql:64-75`). `ensure_audit_log_partition` só é chamada nessa migration: não há cron | Cron mensal de `ensure_audit_log_partition` | Depois da janela, tudo cai em `audit_log_default` e a retenção por partição deixa de funcionar | P |
| MEB-5 | Metas de RPO/RTO e decisões pendentes | docs/MIGRATION_EXECUTIVE_BRIEF.md:14-15,44-46 | 📄 | Três metas conflitantes: RPO 0/RTO 2h aqui; RPO 1h/RTO 4h em `docs/DISASTER_RECOVERY.md:9-10`; RPO ≤15min/RTO ≤2h em `docs/dr/backup-strategy.md:7-8`. Os 3 checkboxes de decisão continuam abertos | Fixar uma única meta e fechar as decisões | Ninguém sabe qual SLA de recuperação foi prometido | P |
| MEB-6 | Manifesto LGPD assinado (`compliance/lgpd-snapshot.ts`) | docs/MIGRATION_EXECUTIVE_BRIEF.md:38 | 📜 | O script existe; nenhum manifesto foi arquivado e nada o executa | Executar e arquivar o manifesto da migração real | Falta prova de conformidade da migração | P |

## docs/MIGRATION_MASTER_RUNBOOK.md

**OK verificados: 1.** Deploy das 108 functions no destino confirmado em runtime (108/108 OPTIONS 200).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MMR-1 | Checklists 10/10, 11/10 e 12/10 (≈45 itens: freeze, DNS 6/12 resolvers, parity de RLS/triggers/sequences, row-diff, storage SHA-256, CDC etc.) | docs/MIGRATION_MASTER_RUNBOOK.md:133-181 | 📄 NÃO VERIFICADO | Todos `[ ]`. Os artefatos são gitignored (`scripts/migration/.gitignore`) e não há postmortem nem log arquivado da janela de 2026-08-04 | Arquivar as evidências da janela (outputs dos verify) e marcar o checklist | A migração é tratada como "feita" sem prova de paridade | P |
| MMR-2 | Bake de dual-write T+0..T+2h e depois retirar | docs/MIGRATION_MASTER_RUNBOOK.md:161 | ⬛ | `dual-write-proxy` continua publicado no canônico (OPTIONS 200), autenticado só por `DUAL_WRITE_SECRET` (`supabase/functions/dual-write-proxy/index.ts:37`), sem rate limit | Despublicar a function de bake | Superfície de escrita residual pós-migração | P |
| MMR-3 | Backpressure da fila de regen em `system_config` | docs/MIGRATION_MASTER_RUNBOOK.md:166 | ❌ | grep `backpressure` vazio em migrations | Implementar ou remover do checklist | Fila de IA sem proteção contra sobrecarga | P |
| MMR-4 | Monitoramento pós-cutover (`post-cutover-watch.sh` 24h, `synthetic-checks.ts` 1h, `smoke-tests.ts`) | docs/MIGRATION_MASTER_RUNBOOK.md:86,153-154 | 📜 | `scripts/migration/monitoring/post-cutover-watch.sh`, `synthetic-checks.ts` e `cutover/smoke-tests.ts` não são agendados nem chamados em CI | Transformar `smoke-tests.ts` em check sintético agendado (Actions cron) | Não há verificação sintética contínua da produção | M |
| MMR-5 | Cutover via `.env` do projeto Lovable | docs/MIGRATION_MASTER_RUNBOOK.md:79-81 | 📄 | O frontend real foi para a Vercel (`singu-v2.vercel.app`; `vercel.json`); o runbook não cobre Vercel nem a allowlist CORS (ver ADR-007-1) | Reescrever a fase 6 para Vercel + CORS + Auth URL | Repetir o procedimento hoje reproduziria a quebra de CORS | P |

## docs/MIGRATION_DDL.md e docs/MIGRATION_DATA.md

**OK verificados: 2.** O pacote DDL 00–12 + `99_apply_all.sql` existe com os tamanhos declarados. `export/import/compare-counts` existem.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MDDL-1 | Recriar os cron jobs no destino (`12_cron_jobs.sql`) e reescrever URLs antigas | docs/MIGRATION_DDL.md:58-62; docs/MIGRATION_DATA.md:132; docs/MIGRATION_EDGE_FUNCTIONS.md:112-128 | ❌ | `scripts/migration/ddl/12_cron_jobs.sql:1-3` está vazio ("pg_cron não disponível na origem"). Os únicos 2 crons que chamam edge functions apontam para refs errados e não enviam `x-cron-secret`: `smart-notify` → `hjhthvzwtvwgdrochcam` (`supabase/migrations/20260512105729_...sql:10-11`); `validation-queue-worker` → `rqodmqosrotmtrjnnjul`, com JWT anon embutido (`20260417120721_...sql:18-19`). **23 functions com `requireCronSecret` não têm agendador**, entre elas nurturing-runner, sequence-processor, lead-score-cron, weekly-digest, check-health-alerts, process-webhook-dlq, forecast-snapshot-cron e cs-health-recalc | Migration com `cron.schedule` para as 23 functions, URL do canônico e `x-cron-secret` vindo do Vault; remover os 2 crons quebrados | Automações de vendas e marketing, alertas de saúde, DLQ e snapshots não rodam | M |
| MDDL-2 | Schema 100% reconstruível pelo repositório (base do DR cenário B) | docs/MIGRATION_DDL.md:3; docs/dr/backup-strategy.md:55 | 🟨 | RPC `get_unified_communication_history` (usada em `src/hooks/useInteractionsRpc.ts:178`) e view `vw_singu_data_health` (`src/hooks/useDataHealthView.ts:11`) só existem em `scripts/recreate_unified_comm.sql` e `scripts/recreate_data_health_view.sql`, com **0 CREATE** em `supabase/migrations` e no pacote `ddl/`. O pacote DDL é um snapshot de 2026-07-21 (`docs/MIGRATION_DDL.md:8`) | Mover para migrations; regenerar `ddl/` ou declarar `supabase/migrations` como fonte única do DR | Restore a partir do repo perde funcionalidades da UI | P–M |

## docs/MIGRATION_EDGE_FUNCTIONS.md

**OK verificados: 2.** 108/108 functions publicadas (runtime). `deploy-all.sh` passa `--no-verify-jwt` condicionalmente (`scripts/migration/functions/deploy-all.sh:98-100`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MEF-1 | Trocar o `project_id` do `config.toml` para o DEST_REF antes do deploy | docs/MIGRATION_EDGE_FUNCTIONS.md:19,49-56 | 📄 | `supabase/config.toml:1` continua com `hjhthvzwtvwgdrochcam` (OLD_REF), enquanto o projeto linkado é `pgxfvjmuubtbowutlide` (`supabase/.temp/linked-project.json:1`). O DEST_REF ficou como placeholder `xxxxxxxx` (`:19`). A afirmação "default `verify_jwt=false`" (`:58-59`) é falsa para a CLI | Atualizar `config.toml` e o runbook com os refs reais | Deploy ou `supabase link` acidental contra o projeto antigo | P |
| MEF-2 | Preflight garante que todos os secrets usados existem no template | docs/MIGRATION_MASTER_RUNBOOK.md:61; scripts/migration/functions/preflight-secrets.sh:2-3 | 🟨 | O preflight só detecta `Deno.env.get("X")` literal em `*/index.ts` (`preflight-secrets.sh:16-19`). Não vê `requireWebhookSecret(req,'X')`, então `EVOLUTION_API_SECRET` (`supabase/functions/evolution-webhook/index.ts:20`), `LUX_WEBHOOK_SECRET` (`lux-webhook/index.ts:18`) e `BITRIX24_WEBHOOK_SECRET` (`bitrix24-webhook/index.ts:40`) **faltam em `secrets.template.env`** | Ampliar o grep para `_shared` e para as chamadas `requireWebhookSecret`; atualizar o template | Num DR ou nova migração, 3 webhooks sobem sem secret e devolvem 500 | P |
| MEF-3 | Smoke: "aguardar 5 min e ver heartbeat em `system_health_snapshots`" | docs/MIGRATION_EDGE_FUNCTIONS.md:145-146 | 🔌 | Nenhum cron gera snapshot; a única escrita acontece quando alguém chama `system-health` (`supabase/functions/system-health/index.ts:182-190`) | Ver RB-6 | O smoke test passa ou falha por acaso | P |

## docs/MIGRATION_STORAGE.md

**OK verificados: 1.** O pipeline `list → create → copy → verify` existe (`scripts/migration/storage/*`). A execução real é **NÃO VERIFICADA** (o `storage-copy.log` é gitignored).

## docs/MIGRATION_PASSWORD_RESET.md

**OK verificados: 3.** Guard no `signIn` (`src/hooks/useAuth.tsx:247-248`), limpeza em `src/pages/ResetPassword.tsx:45-50`, e `clear-must-reset-flag` marca `completed_at` (`supabase/functions/clear-must-reset-flag/index.ts:69-70`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MPR-1 | Métricas de sucesso de 24h/7d/30d e função de limpeza endurecida | docs/MIGRATION_PASSWORD_RESET.md:139-142,158-160 | 🟨 NÃO VERIFICADO | `migration_password_reset_log` só existe em `scripts/migration/sql/create-reset-log.sql` (fora de `supabase/migrations`). Não há registro das métricas. `clear-must-reset-flag` não tem rate limit nem CORS escopado | Arquivar as métricas e endurecer a function | Usuários migrados podem ter ficado presos sem ninguém medir | P |

## docs/MIGRATION_POSTMORTEM_TEMPLATE.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MPT-1 | Postmortem preenchido depois do cutover | docs/MIGRATION_POSTMORTEM_TEMPLATE.md:1-69; docs/MIGRATION_MASTER_RUNBOOK.md:155 | ❌ | Só o template existe; não há `docs/postmortems/`. Houve incidentes reais pós-migração sem postmortem: escritas em contacts/companies quebradas até `supabase/migrations/20261005230000_...sql:1` e 32 RPCs quebradas no canônico até 2026-10-08 (`CHANGELOG.md:19`) | Escrever o postmortem da migração e desses incidentes | Lições perdidas e reincidência | P |

---

## docs/HARDENING_FINAL_10_10.md

**OK verificados: 0** (o próprio doc se declara "registro histórico", `:3-4`)

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| HF-1 | Revogar o PAT vazado `ghp_f9Hr...` (URGENTE) | docs/HARDENING_FINAL_10_10.md:101; docs/HARDENING_PHASE3_FINAL.md:68 | 🟨 NÃO VERIFICADO | O checkbox continua aberto nos dois docs; não há registro de revogação | Confirmar a revogação e registrar | Acesso ao GitHub com token vazado | P |
| HF-2 | Inventário "45/45 edge functions, 20 verify_jwt=true, 3 cron" | docs/HARDENING_FINAL_10_10.md:17-19,89-94 | 📄 | Hoje são 108 functions, 23 cron-gated e 57 com `withAuth`/`withAuthOrServiceRole`/`authenticateRequest`; o `config.toml` não tem blocos `[functions.*]` | Marcar como obsoleto e apontar para o inventário atual | Auditor lê números de outro sistema | P |

## docs/HARDENING_PHASE2_20260410.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| HP2-1 | 6 migrations de hardening (security_invoker em 113 views, search_path em 182 funções, policies public→authenticated…) | docs/HARDENING_PHASE2_20260410.md:9-20 | 🟨 | Aplicadas via MCP direto no banco. `harden_views_security_invoker_all`, `harden_functions_search_path_all`, `harden_rls_public_to_authenticated` e `cleanup_redundant_mcp_policies` têm **0 ocorrências** em `supabase/migrations` | Versionar como migrations idempotentes | Ambiente recriado do repo (DR) nasce sem esse hardening | M |
| HP2-2 | Ações manuais: 5 secrets, deletar POC exploit, rotacionar PAT e anon key | docs/HARDENING_PHASE2_20260410.md:37-43 | 🟨 NÃO VERIFICADO | Nenhum registro de conclusão | Registrar a conclusão com data | Pendências de segurança sem dono | P |

## docs/HARDENING_PHASE3_FINAL.md

**OK verificados: 1.** As policies `mcp_public_read` não expõem nada a anon hoje: o baseline mede anon = 0 nas 38 tabelas (`scripts/rls-matrix/rls-baseline.json`). O DROP, porém, não está versionado.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| HP3-1 | Rotacionar a anon key do projeto `rqodmqosrotmtrjnnjul` | docs/HARDENING_PHASE3_FINAL.md:69 | 🟨 NÃO VERIFICADO | Um JWT anon completo continua versionado em `supabase/migrations/20260417120721_823eaa43-...sql:18-19`, dentro de um cron | Rotacionar e remover o cron da migration (substituir por um novo) | Credencial válida em repositório | P |
| HP3-2 | Hardening de `bitrix24-proxy`/`evolution-proxy` e das "43 edges restantes" | docs/HARDENING_PHASE3_FINAL.md:21,111 | 📄 | Essas functions não existem em `supabase/functions/`. Hoje há 3 functions sem guard (form-submit-handler, intent-pixel-snippet, intent-tracker), públicas por desenho, mas sem validação de schema | Fechar o doc e registrar as exceções públicas em ADR | Doc induz a erro sobre o estado das edges | P |

---

## docs/DISASTER_RECOVERY.md

**OK verificados: 1.** A function `health` existe (`supabase/functions/health/`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| DR-1 | Backups e PITR no "Lovable Cloud", com escalation ao "Suporte Lovable" | docs/DISASTER_RECOVERY.md:20-22,80-85,94 | 📄 NÃO VERIFICADO | O backend é o projeto Supabase `pgxfvjmuubtbowutlide` em org Vercel (`supabase/.temp/linked-project.json:1`). Plano, PITR e retenção do projeto canônico não foram verificados | Confirmar o plano/PITR do canônico e reescrever DR-1 | O procedimento de restore aponta para o painel errado | P |
| DR-2 | Detecção de 5xx via `edge_function_logs` | docs/DISASTER_RECOVERY.md:30; docs/LOAD_TESTING.md:65 | ❌ | A tabela `edge_function_logs` não existe (0 `CREATE TABLE` nas migrations) | Alerta de taxa de 5xx (logs do Supabase → drain ou `error_logs`) | Edge function quebrada sem detecção automática | M |
| DR-3 | Monitoramento externo (UptimeRobot) do frontend | docs/DISASTER_RECOVERY.md:56 | ❌ NÃO VERIFICADO fora do repo | Nada configurado ou versionado | Uptime check em `singu-v2.vercel.app` e `/functions/v1/health` | Queda total percebida pelo cliente, não pelo time | P |
| DR-4 | "Reabertura natural do circuit breaker (60s default)" | docs/DISASTER_RECOVERY.md:72 | 📄 | O real é 30 s (`src/lib/circuitBreaker.ts:39`; `src/lib/externalData.ts:56-57`) | Corrigir | Expectativa errada no incidente | P |
| DR-5 | Feature flag `external_data_fallback` (modo cache-only) + banner global | docs/DISASTER_RECOVERY.md:73-74 | ❌ | A flag não existe; `useFeatureFlag` não tem consumidores (ADR-018-2) | Implementar o modo cache-only controlado por flag | Banco externo fora do ar = CRM vazio sem mitigação | M |
| DR-6 | Drills trimestrais registrados em `docs/dr-drills/YYYY-MM-DD.md` | docs/DISASTER_RECOVERY.md:96-105 | ❌ | Só existe `docs/dr-drills/2026-Q2.md` (ver DD-3) | Executar e registrar | DR nunca exercitado de verdade | M |
| DR-7 | Template de postmortem "em `docs/RUNBOOK.md`" e seção on-call | docs/DISASTER_RECOVERY.md:111; docs/RUNBOOK.md:300 | 📄 | O template está em `docs/postmortem-template.md`; `DISASTER_RECOVERY.md` não tem a seção `#on-call-rotation` linkada pelo RUNBOOK | Corrigir os links e criar a escala de on-call | Ninguém sabe quem está de plantão | P |

## docs/dr/backup-strategy.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| BS-1 | `pg_dump` diário às 03:00 UTC via GitHub Action, gpg e S3 | docs/dr/backup-strategy.md:19-28 | ❌ | `.github/workflows/` só tem `ci.yml`, `monitoring-lint.yml` e `rls-exposure-guard.yml` | Workflow agendado com `pg_dump` cifrado para um bucket fora do Supabase | A única cópia é o backup nativo do mesmo provedor | M |
| BS-2 | Bucket S3 com Object Lock 30d + cross-region | docs/dr/backup-strategy.md:30-31 | ❌ | Nenhum IaC ou bucket referenciado | Provisionar o bucket WORM | Sem defesa contra ransomware ou delete de conta | G |
| BS-3 | Storage replicado diariamente (`copy-objects.ts`) + diff `verify-counts.ts` com alerta >1% | docs/dr/backup-strategy.md:35-37 | 📜 | Os scripts existem (`scripts/migration/storage/`), mas nada os agenda | Agendar com destino espelho | Perda de documentos e anexos sem cópia | M |
| BS-4 | Snapshot semanal dos nomes de secrets | docs/dr/backup-strategy.md:41 | ❌ | Nenhum job | Job semanal comparando com `secrets.template.env` | Recriar o ambiente com secrets faltando | P |
| BS-5 | Idade do último backup em `system_health_snapshots`, alerta >26h, aba DR no `/admin/error-budget` | docs/dr/backup-strategy.md:76-78 | ❌ | grep `last_backup`/`backup_age` vazio; `src/pages/admin/ErrorBudget.tsx` não tem aba DR | Coletar a idade do backup e alertar | Backup parado sem ninguém saber | M |
| BS-6 | Failover anual com DNS flip | docs/dr/backup-strategy.md:71 | ❌ | Sem evidência | Planejar e executar | RTO real desconhecido | G |
| BS-7 | Drill de restore automatizado (`dr/restore-drill.sh`, `dr/wal-archive-check.sh`) | docs/dr/backup-strategy.md:68-72 | 🟨 | Os scripts são órfãos na HEAD (`scripts/migration/dr/restore-drill.sh:1-15`; o cabeçalho cita `BACKUP_URL` mas o script exige `BACKUP_FILE`). O **PR #97 aberto** (`devin/1791735331-restore-drill`) adiciona o workflow "Teste de restauração lógica", que **não está na HEAD** (2 das 4 execuções falharam em 2026-10-11) | Mergear o #97 e agendá-lo | Restore nunca validado | P |

## docs/dr/backup-encryption-check.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| BEC-1 | Checagem trimestral de KMS, Object Lock, versioning e MFA Delete + "CI cron semanal alerta" | docs/dr/backup-encryption-check.md:3-9,27-28 | 📜 | `scripts/migration/dr/backup-encryption-check.sh` não é chamado por nada. O bucket citado `lovable-backups-prod` (`:14`) não existe neste ambiente | Só faz sentido depois de BS-1/BS-2; então criar o cron | Controle declarado como "trava release" que não existe | P |

## docs/dr-drills/README.md e docs/dr-drills/2026-Q2.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| DD-1 | Game days Q1–Q4 (matar external-data, revogar EVOLUTION_API_KEY, schema drift, load test 2×) | docs/dr-drills/README.md:9-12 | ❌ | Os 4 estão `_agendar_`; não há arquivos `AAAA-Q{N}-*.md` | Executar e registrar | Resiliência nunca testada sob falha | M |
| DD-2 | Restore drill mensal (`AAAA-MM-restore.md`, 12 por ano) | docs/dr-drills/README.md:20,61 | ❌ | 0 arquivos `*-restore.md` | Automatizar (PR #97) e registrar | Backup que não é testado não é backup (o próprio `RUNBOOK.md:633` diz isso) | M |
| DD-3 | Evidência do drill 2026-Q2 ("✅ SUCESSO", RTO 14 min) | docs/dr-drills/2026-Q2.md:1-16 | 📄 | O cenário (região US-East) difere do calendário (Q2 = revogar a chave da Evolution). Não há timeline, comandos nem artefatos. Diz "backups horários" (`:16`), contra "Diário" em `docs/DISASTER_RECOVERY.md:82`. O arquivo entrou no repo no commit `bea2000` (2026-07-26) | Refazer com evidência reproduzível | Falsa sensação de DR validado | P |

## docs/CHAOS_DRILL.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| CH-1 | 5 cenários de caos em staging, release-blocker e trimestral | docs/CHAOS_DRILL.md:10-16,32-40 | 📜 | `scripts/migration/chaos/inject.sh` existe, mas não há registro de execução nem ambiente STAGING versionado. O critério "`system_alerts` com 1 registro por cenário" (`:33`) é impossível: `inject.sh` não grava em `system_alerts` | Staging + execução registrada; ajustar o critério | Resposta a falha nunca ensaiada | M |

## docs/LOAD_TESTING.md

**OK verificados: 1.** Os scripts k6 existem (`tests/load/{external-data,ask-crm,incoming-webhook,pool-saturation}.js`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| LT-1 | Executar o k6, documentar em `docs/load-results/YYYY-MM-DD.md` e validar os SLOs p95 | docs/LOAD_TESTING.md:28-30,66 | 📜 | `docs/load-results/` não existe. k6 não aparece em `.github` nem no `package.json`. `pool-saturation.js` não está documentado | Rodar baseline e agendar periodicamente (Actions, staging) | Capacidade e SLO de latência desconhecidos | M |

## docs/RUNBOOK.md

**OK verificados: 5.** Health público (`health`, `system-health`). Inventário de cron e webhook coerente com o código. Guard de esm.sh no CI (`.github/workflows/ci.yml:35`). Alertas `error_budget_50/75/100` (`supabase/migrations/20260723152932_...sql:35-63`). Tabela `system_health_snapshots` e função de cleanup existem (`20260420204951`, `20260420211439_...sql:37`).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| RB-1 | Deploy e rollback via Lovable; deploy automático de edge e migrations | docs/RUNBOOK.md:28-32,91-106,119-125 | 📄 | Frontend na Vercel (`vercel.json`; Vercel API), backend no canônico. Não há workflow de deploy de functions ou migrations no repo | Documentar o fluxo real (Vercel + CLI Supabase) e versionar o pipeline | Rollback em incidente segue um procedimento que não existe | M |
| RB-2 | Kill switches sem deploy: `UPDATE connection_configs SET is_active=false WHERE provider IN (...)` + `useConnectionConfigs()` oculta CTAs | docs/RUNBOOK.md:34-39,376-394 | ❌ | `connection_configs` **não tem coluna `provider`** (tem `connection_type` ∈ supabase_external/bitrix24/n8n/mcp_claude/custom: `supabase/migrations/20260420115057_...sql:5`). `evolution-webhook`, `evolution-api`, `firecrawl-scrape`, `enrichlayer-linkedin` e `lux-webhook` não consultam `is_active`. O hook `useConnectionConfigs` não existe | Kill switch real (feature flag ou `system_config`) checado nas functions | Em incidente, a única forma de desligar uma integração é redeploy | M |
| RB-3 | Rate limits por grupo de functions | docs/RUNBOOK.md:173-184 | 📄 | Diverge do código: `lead-scorer` 60, `disc-analyzer` 30, `generate-insights` 30, `playbook-generator` 5 (vs "10/min" para "AI análise") | Gerar a tabela a partir do código | Tuning errado | P |
| RB-4 | `system-health` devolve 200 em `degraded` | docs/RUNBOOK.md:137 | 📄 | Devolve 503 para tudo que não é `healthy` (`supabase/functions/system-health/index.ts:194`) | Alinhar o doc ou o código | Monitores externos tratam degradação como queda | P |
| RB-5 | `x-trace-id` em toda resposta das 5 functions críticas | docs/RUNBOOK.md:231-245 | 📄 | Ver ADR-008-3: as 5 não devolvem o header | Implementar | O passo de correlação do runbook falha | P |
| RB-6 | Error budget alimentado por cron `system-health-snapshot-5min` + cleanup semanal `system-health-snapshots-cleanup` | docs/RUNBOOK.md:11-12,457,487-489 | 🔌 | 0 ocorrências desses crons nas migrations (o comentário da tabela diz "Populado a cada 5 min via cron", `supabase/migrations/20260420204951_...sql:31`). Os snapshots só nascem quando alguém abre `/status` ou o widget. Dias sem amostra aparecem como 100% (`:489`) | Agendar o snapshot com `x-cron-secret` e marcar dias sem amostra como "sem dado" | O error budget mostra 100% de uptime mesmo com o sistema fora do ar | P |
| RB-7 | Query de minutos não-healthy | docs/RUNBOOK.md:460-469 | 📄 | Usa `health_check_history`, tabela inexistente | Reescrever sobre `system_health_snapshots` | Query falha no momento do incidente | P |
| RB-8 | SLOs (disponibilidade de external-data, p95 de select/update, taxa de 409, 5xx) | docs/RUNBOOK.md:247-256 | ❌ | `query_telemetry` **não tem escritor** (só leitura em `src/pages/AdminTelemetria.tsx:56,79`). Nenhuma function loga `concurrent_edit_detected`. Não há medição de disponibilidade | Instrumentar a telemetria (edge → `query_telemetry`) e calcular os SLOs | SLOs declarados sem medição | M |
| RB-9 | Checklist trimestral de segurança em `docs/security-audits/AAAA-Q*.md` | docs/RUNBOOK.md:418-429 | ❌ | Todas as linhas `_registrar data_`; o diretório não existe | Executar e registrar | Sem trilha de auditoria de segurança | P |
| RB-10 | Postmortem em até 48h em `docs/postmortems/AAAA-MM-DD.md` | docs/RUNBOOK.md:298,331; docs/HOTFIX_PROCEDURE.md:15 | ❌ | O diretório não existe; incidentes reais sem postmortem (ver MPT-1) | Instituir | Reincidência | P |
| RB-11 | Sinais de capacity planning com revisão mensal | docs/RUNBOOK.md:524-537 | ❌ | Nenhum sinal é coletado ou alertado (pool, cold start, tokens de IA, linhas de `interactions`/`audit_log`) | Coletar via pg_cron → `system_alerts` | Escala vira incidente | M |
| RB-12 | Status page oficial `dialogue-diamond.lovable.app/status` e rota `/admin/conexoes/whatsapp` | docs/RUNBOOK.md:307,317,372 | 📄 | O frontend real está em `singu-v2.vercel.app`, onde `/status` chama `system-health` e é bloqueado por CORS (ADR-007-1). A rota `/admin/conexoes/whatsapp` não existe em `AppRoutes.tsx` | Corrigir URLs e rotas | Comunicação de incidente aponta para página errada ou quebrada | P |

## docs/HOTFIX_PROCEDURE.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| HX-1 | Branch `hotfix/<slug>`, review em 1h, QA no preview do Lovable, postmortem em 48h | docs/HOTFIX_PROCEDURE.md:5-15 | 📄 | Conflita com `AGENTS.md` (worktree `fix/hermes-*`). O QA no "preview Lovable Cloud" não se aplica ao deploy Vercel. Não há postmortems. Branch protection e review obrigatório: NÃO VERIFICADO | Unificar o procedimento e configurar o preview da Vercel | Hotfix sem processo confiável | P |

## docs/SECURITY.md

**OK verificados: 2.** Headers via `vercel.json` (CHANGELOG `:29`) e CSP meta em `index.html:9`. DOMPurify nos 2 usos de `dangerouslySetInnerHTML`.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| SEC-1 | "JWT obrigatório em todas as Edge Functions via `withAuth()`" | docs/SECURITY.md:12,54 | 📄 | 57/108 usam `withAuth`/`withAuthOrServiceRole`/`authenticateRequest`; o resto é cron, webhook ou público; 3 não têm guard nenhum (form-submit-handler, intent-pixel-snippet, intent-tracker) | Corrigir a afirmação e documentar as exceções | Auditoria externa recebe declaração falsa | P |
| SEC-2 | "212 políticas, 100% escopadas por `auth.uid() = user_id`" | docs/SECURITY.md:19-20,53 | 📄 | Ver ADR-004-3: usuário sem role vê suppliers, carriers, permissions etc. A Fase 3 está pendente (`scripts/rls-matrix/README.md`, critério de sucesso) | Concluir a Fase 3 e atualizar o doc | Exposição interna de dados | M |
| SEC-3 | "TypeScript strict check" e "`security-hardening.test.ts`" | docs/SECURITY.md:79-80 | 📄 | `strict:false` (`tsconfig.app.json:17`) e tsc no CI é no-op (ADR-010G-2). O arquivo `security-hardening.test.ts` **não existe** no repo | Corrigir o CI e criar ou remover a menção | Garantias de revisão inexistentes | P |
| SEC-4 | "0 CVEs em dependências" | docs/SECURITY.md:55 | 📄 | O CI só reprova high+ em deps de produção (`.github/workflows/ci.yml:84`). Há 2 PRs do Dependabot abertos (#83 e #7, este de 2026-06-22) | Mergear ou triar os PRs; mudar a frase para "0 high/critical em prod" | Declaração imprecisa | P |
| SEC-5 | Responsible disclosure com canal definido | docs/SECURITY.md:64-73 | ❌ | Não há e-mail nem canal; não há security policy no GitHub | Definir e-mail e `SECURITY.md` com contato | Pesquisador não tem como reportar | P |

## docs/SIGNING_KEY_ROTATION.md

**OK verificados: 1.** O canônico já usa ES256 (JWKS com 1 chave, runtime).

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| SKR-1 | Rotação dual-key de 48h via `rotate-jwt.sh prepare/activate/retire` | docs/SIGNING_KEY_ROTATION.md:24-66 | ⬛ | O script é um stub: só grava timestamps em `.rotate-state.*` e manda "executar a tool `supabase--migrate_signing_keys` no Lovable" (`scripts/migration/auth/rotate-jwt.sh:21-45`), ferramenta que não se aplica ao projeto canônico. Não há registro de rotação anual | Reescrever com a API de signing keys do Supabase | Rotação preventiva ou pós-incidente sem procedimento executável | M |
| SKR-2 | Monitorar `audit_log WHERE action='auth.token.verify_failed'` no grace period | docs/SIGNING_KEY_ROTATION.md:54 | 📄 | `audit_log.action` tem `CHECK IN ('INSERT','UPDATE','DELETE')` (`supabase/migrations/20260711152812_...sql:12`) e nada grava esse evento | Usar os logs de auth do Supabase | Sinal de falha de rotação invisível | P |

## docs/perf/explain-analyze.md

**OK verificados: 0**

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| PERF-1 | EXPLAIN ANALYZE das top queries "✅ OTIMIZADO" | docs/perf/explain-analyze.md:1-22 | 📄 **DOC FALSO** | Gerado por `scripts/run_explain_analyze.py`, que declara literalmente "I will simulate the documentation of the EXPLAIN results" (`:11`). Os índices citados (`contacts_first_name_idx`, `deals_stage_id_user_id_idx`, `interactions_contact_id_created_at_idx`) têm 0 ocorrências em migrations e no pacote DDL. `ILIKE '%joao%'` não usa Index Scan btree. `scripts/explain-top-queries.sql` é órfão. O mesmo padrão aparece em `scripts/generate_er_diagram.py:4` ("simulate") | Apagar o doc e rodar EXPLAIN real (pg_stat_statements) no canônico | Falsa garantia de performance usada em decisões | P |

## docs/GRAPHIFY.md

**OK verificados: 1.** Os artefatos `graphify-out/{graph.json,GRAPH_REPORT.md,graph.html}` foram regenerados na HEAD (`e616c20`). A atualização é manual (não há job de CI); risco baixo.

## docs/postmortem-template.md / docs/postmortem-example.md

**OK verificados: 1.** O template existe e o exemplo se declara fictício (`docs/postmortem-example.md:5`). A falta de postmortems reais está em RB-10/MPT-1.

## scripts/ (raiz) e scripts/rls-matrix

**OK verificados: 4.** No CI rodam `check-edge-cors.mjs`, `check-edge-imports.mjs` e `check-bundle-size.mjs` (`.github/workflows/ci.yml:32,35,138`). `rls-matrix/check-rls-baseline.mjs` roda no workflow semanal.

| ID | Decisão/mecanismo planejado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| SCR-1 | Mudanças de schema só via `supabase/migrations` | docs/RUNBOOK.md:102-106 | 📜/⬛ | Há scripts ad-hoc que aplicam DDL via Management API (`scripts/apply-*.js`, `chunk-apply.js`, `fix-enums.js`, `retry-failed.js`) e SQL avulso (`recreate_*.sql`, `drop_unified_comm.sql`, `test_unified_comm*.sql`), com 0 referências no CI. Causa direta de MDDL-2 | Converter o que está vivo em migrations e arquivar o resto | Drift entre repo e banco | P |
| SCR-2 | Guard de ordem dos providers (`lint-providers.cjs`) | scripts/lint-providers.cjs:3-8 | 📜 | Não roda no CI nem no `package.json` | Adicionar ao CI ou remover | Regressão de providers não detectada | P |
| SCR-3 | Testes dos guards de CORS e imports (`check-edge-cors.test.mjs`) | scripts/check-edge-cors.test.mjs:1-3 | 📜 | O include do vitest não cobre `scripts/` e o CI não chama o arquivo | Rodar via `node --test` no CI | Os guards do CI ficam sem teste | P |
| SCR-4 | Guards de migração/verificação (`scripts/migration/**`, 180 scripts .sh/.ts/.sql; 96 em `verify/`) e cenários de teste dos guards (`verify/tests/run-all.sh`, 22 cenários) | docs/MIGRATION_MASTER_RUNBOOK.md:133-181; docs/runbooks/db-guards.md | 📜 | **2 de 180 (1,1%)** rodam no CI: `invalid-indexes-guard.sql` (`ci.yml:67`) e `rls-coverage.sql` (`ci.yml:135`). `full-audit.sh` (63 guards) e `verify/tests/run-all.sh` não rodam em lugar nenhum | Agendar `full-audit.sh` no canônico (Actions cron com secret) e rodar `run-all.sh` no CI | O investimento das rodadas 13–25/10 não protege a produção | M |

---

## Classificação das rodadas de hardening (10/10 → 65/10)

| Rodada | Entrega declarada | Classe | Evidência |
|---|---|---|---|
| 10/10–12/10 | Freeze, DNS, parity, CDC (RPO 0), dual-write, chaos, LGPD | **(a)** scripts escritos; a execução da janela não é evidenciada | Checklists `[ ]` em `docs/MIGRATION_MASTER_RUNBOOK.md:133-181`; scripts sem chamador |
| 13/10–25/10 | 63 guards SQL e de shell + 22 cenários de teste ("simulação de 300 a 1.200 cenários": `.lovable/memory/migration/completion-1x-10.md`) | **(a)**, exceto `invalid-indexes-guard` **(b)** | Apenas `ci.yml:67,135` executam guards |
| 26/10 | Exporter Prometheus, burn-rate, Alertmanager, runbooks | **(a)**, e o lint de CI está quebrado (10/10 falhas) | ADR-019-1..4 |
| 27/10–31/10 | Ratchet ESLint 0/0 | **(b)** | `ci.yml:78-81`, CI verde |
| 32/10–42/10 | REVOKE em SECURITY DEFINER + baseline do linter | Migrations **(b)**; guard de baseline **(a)** | ADR-022-1 |
| 45/10–47/10 | Least privilege para anon, authenticated e functions | **(b)** | `tests/rls/*_least_privilege.sql` via `ci.yml:126` |
| 59/10, 65/10 | Exporters de partições do AI Gateway e de planos de RPC | **(a)** | ADR-019-6 |
| HARDENING_PHASE2/3, FINAL_10_10 | Hardening físico via MCP + ações manuais | **(c)** + drift (não versionado) | HP2-1, HF-1, HP3-1 |

---

## Resumo numérico

- **Documentos auditados:** 49 arquivos (23 ADRs + README, 8 MIGRATION_*, 3 HARDENING_*, DR + 2 `dr/` + 2 `dr-drills/`, CHAOS, LOAD, RUNBOOK, `runbooks/db-guards`, HOTFIX, SECURITY, SIGNING_KEY_ROTATION, `perf/`, GRAPHIFY, 2 postmortem), mais `scripts/` e `monitoring/`.
- **Itens verificados como ✅ OK:** **83**, soma das contagens "OK verificados" de cada seção.
- **Itens não-OK detalhados:** **111** linhas (status primário, contado no próprio arquivo).

| Status (primário) | Quantidade |
|---|---|
| 📄 DOC FALSO/DESATUALIZADO | 27 |
| 🟨 PARCIAL | 27 |
| ❌ NÃO INICIADO | 26 |
| 📜 SCRIPT ÓRFÃO | 14 |
| 🔌 DESCONECTADO | 12 (3 confirmados em runtime: ADR-007-1, ADR-010G-2, ADR-019-4) |
| ⬛ MORTO | 5 (mais 1 linha 📜/⬛, SCR-1) |
| **Total** | **111** |

- **Linhas marcadas NÃO VERIFICADO** (dependem de estado do banco, painel ou secret): **12**.

**Coberturas medidas:**

| Mecanismo | Cobertura |
|---|---|
| Rate limit (`_shared/rate-limit.ts`) | 83/108 functions (77%); 5 não-cron sem limite |
| CORS escopado | 106/108 no código; **0/108 aceitam o domínio de produção da Vercel** (runtime) |
| Tracing estruturado (`tracedLogger`) | 15/108 (14%); `x-trace-id` devolvido em 4/108 |
| Validação de schema (zod ou `validate.ts`) | 73/108 (68%); zod em 39/108 |
| Guards de auth explícitos (`withAuth`*) | 57/108; cron-gated 23 (0 agendadas corretamente); webhook 4 |
| Tratamento de 402 da IA | 25/33 chamadores do gateway |
| Circuit breaker | 1 de 4 serviços externos citados (só o DB externo, só no front) |
| Feature flags | 0 consumidores de `useFeatureFlag` |
| Scripts de migração e guards executados | 2/180 (1,1%) |
| Crons pg_cron que chamam edge functions | 2 versionados, ambos com ref errado e sem `x-cron-secret`; 23 functions cron sem agendador |
| Monitoramento Prometheus/Alertmanager | 0 componentes em execução; lint de CI 0/10 verde |
| DR | 0 backups fora do provedor; 0 restore drills mensais; 0/4 game days; 1 "drill" sem evidência |

## Top 10 lacunas de maior impacto

1. **ADR-007-1, CORS bloqueia o frontend de produção (runtime).** 106 das 108 functions do canônico respondem `Allow-Origin: dialogue-diamond.lovable.app` para `singu-v2.vercel.app` (`supabase/functions/_shared/auth.ts:70-93`). No domínio Vercel, external-data, IA, /status, conexões e voz ficam bloqueados pelo navegador. Esforço P.
2. **MDDL-1 + ADR-014-1, a automação agendada não roda.** `12_cron_jobs.sql` está vazio; 23 functions cron sem agendador; os 2 crons existentes usam ref errado e não enviam `x-cron-secret`. A DLQ de webhooks nunca reprocessa, e o botão manual leva 401. Nurturing, sequências, lead score, digest, alertas e snapshots ficam parados. Esforço M.
3. **BS-1..BS-6 / DD-1..DD-3, DR inexistente na prática.** Não há `pg_dump` externo, bucket WORM, réplica de storage, alerta de idade de backup, restore drill mensal nem game day. O único "drill" (2026-Q2) não tem evidência. O PR #97 (restore drill) está aberto, fora da HEAD. Esforço M–G.
4. **ADR-019-1..4, observabilidade "Rodada 26/10" no papel.** Os 63 guards e os 3 exporters não rodam; não há Prometheus; o Alertmanager tem placeholders `REPLACE_ME`; o promtool do CI falhou 10/10. Nenhum alerta chega a ninguém. Esforço M.
5. **ADR-004-3 + SEC-2, signup público com leitura indevida.** `disable_signup:false` (runtime) e um usuário sem role lê suppliers (754), carriers (114) e permissions (`scripts/rls-matrix/rls-baseline.json`). Esforço P–M.
6. **ADR-010G-2 + ADR-018-1, typecheck do CI é no-op.** `tsc --noEmit` sobre `tsconfig.json` com `files: []` checa 0 arquivos, e `strict:false`. O gate de tipos declarado em ADR, SECURITY e CI não existe. Esforço P (correção) / G (strict).
7. **ADR-013-1, chave de criptografia de credenciais de terceiros com fallback público** (`supabase/migrations/20260420120250_...sql:29-31`); não há configuração de GUC nem Vault no repo. Uso em runtime NÃO VERIFICADO. Esforço P.
8. **RB-2 + ADR-018-2 + DR-5, não há kill switch nem feature flag operável.** A coluna `provider` do runbook não existe; as functions não checam `is_active`; `useFeatureFlag` tem 0 consumidores; `external_data_fallback` não existe. Em incidente, só resta redeploy. Esforço M.
9. **ADR-015-2 + ADR-015-1, retenção LGPD provavelmente sem efeito.** `apply_retention_policies` grava em colunas de `audit_log` que não existem no schema versionado e o rollback reverte o DELETE; `audit_log` e `connection_quotas` estão fora da política. Esforço P.
10. **RB-6 + RB-8 + ADR-008-3, SLO e error budget sem medição real.** Os snapshots só nascem quando alguém abre /status e dias vazios contam como 100%; `query_telemetry` não tem escritor; tracing em 15/108 functions. O painel de confiabilidade mostra saúde fictícia. Esforço M.

*Menções honrosas:* PERF-1 (EXPLAIN declaradamente "simulado" apresentado como medição), ADR-013-3/ADR-017-2 (página de logs, DLQ e anomalias sem rota), MEF-2 (preflight de secrets cego a 3 webhooks) e ADR-004-1 (Google OAuth desligado no canônico).
