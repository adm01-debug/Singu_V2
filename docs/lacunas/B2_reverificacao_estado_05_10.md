# B2 — Re-verificação no HEAD da auditoria de 2026-08-16 (ESTADO_ATUAL.md + docs/estado/05–10, 12)

> **HEAD auditado:** `e616c20` (2026-10-11) · **Base anterior:** `0fa6177` (2026-08-16) · 97 commits entre as duas.
> **Escopo:** `ESTADO_ATUAL.md` (riscos R1–R14 e plano §8), `docs/estado/05`, `06`, `07`, `08`, e as correções de `09`, `10`, `12`.
> **Método:** leitura estática + `git log`/`git diff 0fa6177 HEAD` + scripts próprios de medição (locais do auditor, não versionados: `scripts/drift.py`, `toplevel.py`, `orphanfn.py`, validados contra uma cópia `git archive 0fa6177`). Nada do repositório foi modificado.
> **Runtime:** o estado do CI foi lido da API do GitHub (`VERIFICADO`). Todo o resto (cron.job real, secrets provisionados, deploy das EFs, rotação de chaves, banco canônico) é `NÃO VERIFICADO`.
> **Legenda de status:** ❌ NÃO INICIADO · 🟨 PARCIAL · 🎭 VITRINE · 🔌 DESCONECTADO · ⬛ MORTO · ✅ RESOLVIDO DESDE 08/2026 · ⚠️ REGREDIU.
> **Esforço:** P = horas a 1 dia · M = alguns dias · G = semanas.

### O que mudou de fato entre 0fa6177 e e616c20 (contexto)
- 57 migrations novas + **44 migrations históricas reescritas** (commit `e2fd798`, "conclui correções de segurança e migrations históricas") → total 447.
- Edge Functions: `lead-routing` **removida** (`7f863d9`), `evolution-bitrix-connector` **adicionada** (480 linhas) → total 108. Só 10 EFs foram tocadas (`_shared`, audit-analytics, dual-write-proxy, external-data, health, health-aggregate, incoming-webhook, revops-snapshot-builder, system-health, evolution-bitrix-connector).
- CI reescrito (`c70ef02` #84, `473eb02`) e workflow novo `rls-exposure-guard.yml`; `vercel.json` (`7250e56`).
- **Intocados desde a auditoria** (git log vazio): `src/integrations/supabase/types.ts`, `client.ts`, `useMFAGuard.ts`, `MFAGuard.tsx`, `Auth.tsx`, `RequireAdmin.tsx`, `useWebAuthn.ts`, `useRBAC.tsx`, `useFeatureFlag.ts`, `AdminAuditTrail.tsx`, `AdminTelemetria.tsx`, `AdminSchemaDrift.tsx`, `usePasswordResetRequests.ts`, `ErrorBudget.tsx`, `useWebhookDlq.ts`, `useHealthAlerts.ts`, `lazyPages.tsx`, `circuitBreaker.ts`, `AdminSidebar.tsx`, `ResetPassword.tsx`, `smart-notify`, `sequence-processor`, `nurturing-runner`, `check-health-alerts`, `weekly-digest`, `send-push-notification`, `intent-tracker`, `evolution-api`, `meeting-summary`.

---

## 1. Riscos estruturais (ESTADO_ATUAL.md §3)

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| R1 | `types.ts` deve descrever o banco deste produto | ESTADO_ATUAL.md:62-77 | ❌ NÃO INICIADO (drift **aumentou**) | `src/integrations/supabase/types.ts:5,14332,16608-16611` (Functions só `_postgrest_anon_placeholder`, Enums vazio); `git log -- types.ts` → único commit `c9b22b5`; medição HEAD (`drift.py`): 120 de 272 tabelas das migrations estão no `types.ts`; **130 dos 244** alvos de `.from()` não estão no `types.ts` (128 deles existem nas migrations); **0 de 54** RPCs tipadas; 6 tabelas `carrier*` (transportadoras) seguem no arquivo. Desde 08/2026 entraram 7 tabelas novas (`customer_rotation_state`, `rodizio_execucoes`, `rodizio_distribuicao_staging`, `customer_purchases`, `incoming_webhook_nonces`, `rpc_perf_samples`, `rpc_plan_snapshots`) e 106 funções criadas/redefinidas — nenhuma no contrato | Regerar `types.ts` a partir do banco canônico (`pgxfvjmuubtbowutlide`, o linkado em `supabase/.temp/linked-project.json`), apagar `types.ts.lovable.bak`, e pôr no CI um check de drift (gerar tipos e falhar se diferir) | O sistema compila "verde" sem enxergar 130 tabelas que usa: erro de coluna/tabela só aparece na tela do vendedor | M |
| R2 | Automação agendada (EFs de cron) precisa rodar | ESTADO_ATUAL.md:79-92 | ❌ NÃO INICIADO | Continuam **só 2** `net.http_post` em migrations: `20260417120721_…sql:17-19` e `20260512105729_…sql:9-11`, ambos **sem `x-cron-secret`** (`grep x-cron-secret supabase/migrations` = 0). `requireCronSecret` inalterado (`supabase/functions/_shared/auth.ts:237-248`). **23 EFs** exigem o header incondicionalmente (lista na seção 8) + `connection-anomaly-detector` opcional; 21 sem agendador no repo. Nenhum caller do front envia o header (`grep x-cron-secret src` = 0; `client.ts:12-23` sem header global). Mudança: `lead-routing` foi removida e o rodízio passou a ter 4 jobs **SQL** (`20260924213115_t213_rodizio_pg_cron_jobs.sql:39-42`) | Criar jobs `pg_cron` com header `x-cron-secret` lido do Vault, um por EF de cron (21), e trocar as EFs acionadas por botão para `withAuth` **ou** cron | Lembretes, sequências, nutrição, snapshots de forecast/RevOps, recálculo de saúde do cliente e lead score **nunca rodam sozinhos**; o gestor acha que há automação e não há | M |
| R2b | Um único project-ref coerente (config, crons, CSP, runbook) | ESTADO_ATUAL.md:94-104 | ❌ NÃO INICIADO | `supabase/config.toml:1` = `hjhthvzwtvwgdrochcam`; `supabase/.temp/linked-project.json` = `pgxfvjmuubtbowutlide`; crons apontam `rqodmqosrotmtrjnnjul` (`20260417120721_…sql:18`) e `hjhthvzwtvwgdrochcam` (`20260512105729_…sql:10`); CSP `vite.config.ts:19` = `pgxfvjmuubtbowutlide`; `docs/MIGRATION_EDGE_FUNCTIONS.md:20` `DEST_REF="xxxxxxxxxxxxxxxxxxxx"` | Corrigir `config.toml`, reescrever/desagendar os 2 crons com URL parametrizada (`current_setting`/Vault), preencher o runbook | Os 2 únicos agendamentos apontam para bancos que não são o de produção — mesmo com o header certo, bateriam no lugar errado | P |
| R3 | CI tem de voltar a ser portão de qualidade | ESTADO_ATUAL.md:106-118 | ✅ RESOLVIDO DESDE 08/2026 (VERIFICADO via API) | `.github/workflows/ci.yml:37-58` valida secrets obrigatórios e falha se faltarem (substituiu `if: secrets.PGHOST != ''`); gates de banco agora incondicionais (`:60-67`, `:116-126`, `:128-135`). API GitHub (`ci.yml`, `main`): runs #764 (`79fdb0d`), #769, #780, #785, #793, #808 = **success**; #773 (`ef7eea3`, 07/10) = failure; #822 (`e616c20`) em andamento. Nos 30 últimos runs: 6 success / 23 failure / 1 em curso — todas as falhas anteriores a 06/10 | Manter; pendências remanescentes do CI estão na dimensão 6 (Deno tests, cobertura, Lighthouse) | O merge para produção voltou a ter verificação automática de lint, tipos, build, E2E e RLS | — |
| R3b | Pipeline de deploy versionado | ESTADO_ATUAL.md:120 | 🟨 PARCIAL | `vercel.json:1-24` (SPA fallback + headers, `7250e56`); nenhum workflow de deploy em `.github/workflows/` (só `ci.yml`, `monitoring-lint.yml`, `rls-exposure-guard.yml`); EFs publicadas por script manual `scripts/migration/functions/deploy-all.sh:66-100`; migrations aplicadas fora do Git (commits "paridade ledger↔repo" `a728fc2`, `f457744`) | Workflow de deploy de EFs + `supabase db push` com aprovação, ou documentar oficialmente o caminho Vercel/Lovable | Não há registro de o que está em produção nem rollback reproduzível | M |
| R4 | Remover segredo (JWT anon) versionado | ESTADO_ATUAL.md:122-126 | ❌ NÃO INICIADO | `supabase/migrations/20260417120721_823eaa43-…sql:19` continua com `Authorization: Bearer eyJ…` (ref `rqodmqosrotmtrjnnjul`). Rotação da chave no projeto: NÃO VERIFICADO | Migration nova que desagenda o job e recria sem segredo; rotacionar a anon key do ref `rqodmqosrotmtrjnnjul` | Chave de um projeto Supabase exposta para sempre no histórico do Git | P |
| R4b | Inventário de secrets de backend no repositório | ESTADO_ATUAL.md:126 | 🟨 PARCIAL | `.env.example` segue só com 3 `VITE_*`; mas `scripts/migration/functions/secrets.template.env` lista 25 variáveis (commits `473eb02`, `d0d2461`, `e2fd798`). **Faltam** no template: `BITRIX24_WEBHOOK_SECRET` (`bitrix24-webhook/index.ts:40`), `EVOLUTION_API_SECRET` (`evolution-webhook/index.ts:20`), `LUX_WEBHOOK_SECRET` (`lux-webhook/index.ts:18`), `SUPABASE_DB_URL` | Completar o template e referenciá-lo no README | Novo ambiente/DR sobe com webhooks de entrada quebrados por falta de 3 secrets | P |
| R5 | O banco precisa nascer do repositório | ESTADO_ATUAL.md:128-140 | 🟨 PARCIAL (reparo mascara o buraco) | 44 migrations históricas reescritas com guardas `to_regclass` (`e2fd798`): ex. `20260721000028_fix_rls_user_private_tables.sql:7-43`, `20260721000042_…sql:10-21`, `20260721000057_…sql:14-20`, `20260719000002_…sql:60-64` (índice agora em `behavioral_profile_regen_queue`). Replay estático de topo (`toplevel.py`): **0** statements sem `CREATE TABLE` no HEAD vs **193 / 15 arquivos / 51 tabelas** em `0fa6177`. **Porém** as 28 tabelas continuam sem `CREATE TABLE` (ex.: `contact_notes`, `meetings`, `proposals`, `reminders`, `automations`, `activity_feed`, `commissions`, `sales_goals`, `territory_assignments`, `workspace_accounts`, `churn_predictions`, `product_novelties`), e a EF nova `evolution-bitrix-connector` usa `connector_log`/`oauth_tokens` (`index.ts:134,141,150`) também sem `CREATE TABLE` | Versionar o DDL (`CREATE TABLE`) das tabelas que existem só no banco vivo (dump do canônico) e rodar `supabase db reset` no CI | Em desastre ou num ambiente de homologação o banco "sobe sem erro" mas sem dezenas de tabelas — falha silenciosa | G |
| R6 | Acabar com o split-brain externo × local | ESTADO_ATUAL.md:142-153 | 🟨 PARCIAL | **Pipeline resolvido** (`e616c20`): leitura `src/hooks/usePipeline.ts:91-101` via `queryExternalData('deals')` e movimento `:219` via `callExternalRpc('move_deal_atomic')`. **Continua**: `/mapa-empresas` lê e grava `companies` local (`src/pages/MapaEmpresas.tsx:50,80`); `/erp` consulta `vw_produtos/produtos/vw_products/products/vw_propostas/propostas/vw_proposals` (`src/hooks/useErpData.ts:33-34`), **nenhuma** na `ALLOWED_TABLES` (`supabase/functions/external-data/index.ts:108-158`) → sempre vazio | Migrar `/mapa-empresas` para o proxy; incluir as tabelas ERP na allowlist ou remover a tela | Mapa mostra empresas diferentes do resto do CRM; tela de ERP nunca mostra produto nem proposta | M |
| R7 | Envio de e-mail real (hoje encenado) | ESTADO_ATUAL.md:155-165 | ❌ NÃO INICIADO | `src/hooks/useEmailCampaigns.ts:85,124,136` ("Simula o envio" e grava `sent`); `supabase/functions/sequence-processor/index.ts:331,337,346` (`sent` antes de invocar `send-transactional-email`, EF inexistente — 0 diretórios); `nurturing-runner/index.ts:91-99` (só grava interação); `check-health-alerts/index.ts:226-227` (`email_simulated`); `smart-notify/index.ts:144-145`; `weekly-digest/index.ts:194,226` (`generateEmailHtml` nunca chamada). Nenhum provedor (resend/sendgrid/smtp) em `supabase/functions` | Implementar provedor (Resend) + EF `send-transactional-email`; marcar `sent` só após aceite do provedor | Campanhas e sequências aparecem como "enviadas" sem que nenhum cliente receba nada; métricas de marketing são falsas | M |
| R8 | Fim do lockout de admin por MFA | ESTADO_ATUAL.md:167-177 | ❌ NÃO INICIADO (blast radius **maior**) | `src/hooks/useMFAGuard.ts:30,33-34`; `src/components/auth/MFAGuard.tsx:13-14` (`return null`); `/seguranca` sob `Protected` (`src/app/AppRoutes.tsx:31-37,154`); `src/pages/Auth.tsx` sem `mfa/challenge/aal` (0 ocorrências); `TwoFactorSetup.tsx:33,46-57` sem campo para elevar a `aal2`. Agravante: `/rodizio` passou para `<Admin>` (`AppRoutes.tsx:133`, `dc93c97`) e herda o bloqueio | Liberar `/seguranca` do `MFAGuard` e adicionar challenge TOTP no login/na própria página | Administrador que ligar 2FA perde acesso ao painel e ao rodízio de carteira | P |
| R9 | Remover dado fictício de métricas de negócio | ESTADO_ATUAL.md:182-191 | 🟨 PARCIAL | Corrigidos em `473eb02`: `useCognitiveBiases.ts` (Math.random removido) e `NLPMasteryScore.tsx` ("10/10" fixo removido). **Continuam**: `src/hooks/useEmotionalIntelligence.ts:53,73`; `src/hooks/useDealVelocity.ts:67`; `supabase/functions/suggest-next-action/index.ts:192` (sorteado e persistido); `src/data/analyticsData.ts:171-177` usado em `src/pages/Analytics.tsx:86,92`; `src/pages/MarketingHub.tsx:254,258,262` (CPL/CAC/LTV fixos); supressões "mock" mentirosas em `useEmotionalIntelligence.ts:52,72`, `useDealVelocity.ts:66`, `suggest-next-action/index.ts:191` | Substituir por cálculo real ou rotular como exemplo; remover as supressões de lint | Gestor toma decisão com velocidade de pipeline, ranking de vendedores e CAC/LTV inventados | P |
| R9b | `/status` público sem fail-open | ESTADO_ATUAL.md:181; §8 item 7 | 🟨 PARCIAL | Fail-open corrigido: `src/pages/StatusPage.tsx:57` → `'unavailable'` em erro; `src/lib/systemHealth.ts:29-42`. **Mas** `system-health` segue exigindo JWT (`supabase/functions/system-health/index.ts:139`) → visitante anônimo sempre vê "indisponível" | Endpoint anônimo (ou `system-health` público com rate-limit) só com status agregado | Página de status pública não serve ao cliente externo | P |
| R10 | Tabelas/painéis sem produtor de dados | ESTADO_ATUAL.md:197-203 | 🎭 VITRINE | `insights`: 0 `INSERT` no repo; `generate-insights/index.ts` com 0 `.from(`; leitores vivos `useYourDay.ts:78`, `useContactDetail.ts:41,195`, `useRealtimeNotifications.ts:185`. `ai_recommendation_audit_logs_v2`: lida em `src/hooks/useRecommendationAudit.ts:25` e `src/pages/RecommendationAudit.tsx:30`, sem `CREATE TABLE` (só `ALTER POLICY` guardado em `20260926195756_wave_rls_initplan_batch1.sql:33-42`). `win_loss_records`: `WinLossCaptureDialog` com 0 importadores. `query_telemetry`, `schema_drift_alerts`, `password_reset_requests`: só leitores (ver seção 3) | Criar escritores (EF `generate-insights` gravar em `insights`; ligar `WinLossCaptureDialog`) ou remover as telas | Telas de insights, auditoria de recomendação e win/loss ficam vazias para sempre | M |
| R11 | Testes que protegem de verdade | ESTADO_ATUAL.md:205-211 | 🟨 PARCIAL | Resolvido: `e2e/` agora roda (`playwright.config.ts:18-32`), credenciais E2E injetadas (`ci.yml:100-101`), E2E contra build (`playwright.config.ts:41`), testes viraram gate (CI verde). Continua: **16 arquivos / 90 casos** `Deno.test` sem runner (nenhum `deno test` em `.github/`), `scripts/check-edge-cors.test.mjs` sem runner, testes-espelho/grep intactos, sem `coverage.thresholds` (`vitest.config.ts:4-34`) | Step `deno test supabase/functions` no CI; threshold de cobertura; reescrever espelhos para importar o código real | As 108 Edge Functions (onde mora a regra de negócio) seguem sem nenhum teste executado | M |
| R12 | Feature flags que gateiam algo | ESTADO_ATUAL.md:239-241 | 🔌 DESCONECTADO | `useFeatureFlag` com 0 consumidores (único hit é a definição `src/hooks/useFeatureFlag.ts:15`); sem seed (`grep "INSERT INTO public.feature_flags"` = 0); `roles[]` não lida; único escritor externo usa coluna inexistente `key` (`scripts/migration/verify/dual-write-diverge.ts:68` × `20260420163323_…sql:29-36`, PK é `name`) | Plugar `useFeatureFlag` nas features de risco e corrigir o kill-switch do dual-write | Painel de flags liga/desliga nada; kill-switch de migração não funciona | P |
| R13 | Camada PWA coerente | ESTADO_ATUAL.md:213-227 | ❌ NÃO INICIADO | `src/main.tsx:19-26` (diz `prompt`/`injectManifest`/`src/sw.ts`) × `vite.config.ts:26` (`autoUpdate`); `src/lib/pushNotifications.ts:30` re-registra `/sw-push.js`; `src/sw.ts` inexistente | Unificar SW via `injectManifest` ou ajustar comentários e o fluxo de push | Push nunca estabiliza; migração de service worker não converge | M |
| R13b | `verify_jwt` versionado | ESTADO_ATUAL.md:225 | 🟨 PARCIAL | `supabase/config.toml` continua com 1 linha; porém `scripts/migration/functions/deploy-all.sh:66-77` versiona lista de 37 EFs publicadas com `--no-verify-jwt` (`:98-100`) | Mover a lista para `[functions.*]` no `config.toml` (fonte única) | Política de autenticação das EFs depende de quem rodou o script | P |

> **R14** (classificação ⬛ não confiável) é risco de método, não de produto; foi tratado na dimensão 7, reverificando os 27 alvos.

---

## 2. Plano de ação do ESTADO_ATUAL.md (§8)

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| P1 | Restaurar/regerar `types.ts` | ESTADO_ATUAL.md:334 | ❌ NÃO INICIADO | ver R1 (`types.ts:16609`) | Regerar do banco canônico | Sem rede de proteção de tipos | M |
| P2 | Corrigir `ci.yml` | ESTADO_ATUAL.md:335 | ✅ RESOLVIDO DESDE 08/2026 | ver R3 (`ci.yml:37-58`; runs #764–#808 success) | — | Portão de qualidade ativo | — |
| P3 | `x-cron-secret` nos 2 crons + project-ref parametrizado | ESTADO_ATUAL.md:336 | ❌ NÃO INICIADO | `20260417120721_…sql:19`, `20260512105729_…sql:11` | ver R2/R2b | Os únicos 2 jobs HTTP seguem falhando | P |
| P4 | Migrations faltantes das tabelas só com POLICY/INDEX | ESTADO_ATUAL.md:337 | 🟨 PARCIAL | ver R5 (guardas `e2fd798`; 28 tabelas sem `CREATE TABLE`) | Versionar `CREATE TABLE` | Banco não reproduzível | G |
| P5 | Remover 4 fontes de dado fictício | ESTADO_ATUAL.md:338 | 🟨 PARCIAL | ver R9 (2 corrigidas, 5 pontos restantes) | Remover os restantes | Métricas inventadas | P |
| P6 | Corrigir `MFAGuard` | ESTADO_ATUAL.md:339 | ❌ NÃO INICIADO | ver R8 (`useMFAGuard.ts:33`) | — | Lockout de admin | P |
| P7 | Fail-open de `/status` e endpoint anônimo | ESTADO_ATUAL.md:340 | 🟨 PARCIAL | ver R9b | Endpoint público | Status inútil para público | P |
| P8 | Atualizar docs canônicas | ESTADO_ATUAL.md:341 | 🟨 PARCIAL | `README.md` revisado em RLS/MFA/10-10 (`473eb02`) e `npm run test` passou a existir (`package.json` scripts.test). **Continuam errados**: `HANDOFF.md:3-4` (2026-04-15, "30 Edge Functions / 40+ tabelas"), `README.md:34` (TS 5.8), `:105` ("31 Edge Functions"), `:108` ("~50 migrations"), `:151` ("4.470 testes") | Recontar e corrigir | Quem chega ao projeto subestima o sistema 4–8× | P |
| PA | Rotacionar JWT anon versionado | ESTADO_ATUAL.md:347 | ❌ NÃO INICIADO (rotação em runtime NÃO VERIFICADA) | ver R4 | — | Segredo exposto | P |
| PB | Decidir destino da automação agendada (22 EFs sem cron) | ESTADO_ATUAL.md:348 | ❌ NÃO INICIADO | ver R2 e seção 8 (21 EFs sem cron hoje) | Decisão + jobs | Automação prometida não existe | M |
| PC | Resolver split-brain | ESTADO_ATUAL.md:349 | 🟨 PARCIAL | ver R6 (Pipeline unificado em `e616c20`) | `/mapa-empresas`, `/erp` | Dados divergentes entre telas | M |
| PD | `incoming-webhook` exigir HMAC sempre | ESTADO_ATUAL.md:350 | ✅ RESOLVIDO DESDE 08/2026 | `supabase/migrations/20261002103000_harden_incoming_webhooks.sql:8-34` (desativa webhooks sem assinatura, default `true`, CHECK); `supabase/functions/incoming-webhook/index.ts:181-200` (503 sem HMAC) + `:57-77` (timestamp + idempotency + HMAC) + nonces | — (efeito colateral em Stripe/GitHub, ver I28/I29) | Ninguém mais injeta contatos/deals só com o token da URL | — |
| PE | Investigar `evolution-api` / `dual-write-proxy` | ESTADO_ATUAL.md:351 | 🟨 PARCIAL | `dual-write-proxy` agora autentica (`index.ts:37` `x-dual-write-secret`), import corrigido (`:2`) e devolve 503 sem config (`:41`) — `473eb02`. `evolution-api` inalterado: `withAuth` sem papel (`evolution-api/index.ts:46`), 44 ações, 0 chamadores | Checagem `has_role('admin')` no `evolution-api` (ou remover após ver logs do gateway) | Qualquer usuário logado pode apagar instância/grupo do WhatsApp | P |
| PF | Definir pipeline de deploy | ESTADO_ATUAL.md:352 | 🟨 PARCIAL | ver R3b (`vercel.json`) | Workflow de deploy de EFs/migrations | Deploy não auditável | M |
| PG | Decidir sobre e-mail encenado | ESTADO_ATUAL.md:353 | ❌ NÃO INICIADO | ver R7 | Provedor real ou remover UI | Métricas de envio falsas | M |

---

## 3. Admin, Segurança e Observabilidade (doc 05)

Itens 🟨/🟦/⬛ da tabela de evidências (39) + achados A11–A15 e contradições documentais.

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| S01 | `MFAGuard` exigindo AAL2 com caminho de elevação | 05:58 | ❌ NÃO INICIADO | = R8 (`useMFAGuard.ts:30-34`, `MFAGuard.tsx:13-14`, `AppRoutes.tsx:154`) | Challenge TOTP + liberar `/seguranca` | Lockout de admin | P |
| S02 | Banner "MFA não configurado" com link válido | 05:59 | ❌ NÃO INICIADO | `src/components/admin/RequireAdmin.tsx:60` → `/configuracoes/seguranca` (rota inexistente; cai em `AppRoutes.tsx:181`); fail-open `:42` | Apontar para `/seguranca` | Admin clica e cai em 404 | P |
| S03 | Login por Passkey/WebAuthn | 05:60 | 🟨 PARCIAL | Só cadastro: `src/hooks/useWebAuthn.ts:41-42` (`credentials.create`, challenge gerado no cliente); `navigator.credentials.get` = 0 em `src/` | Fluxo de autenticação + verificação de challenge no servidor | Usuário cadastra passkey que não serve para entrar | M |
| S04 | Restrição por IP aplicada no login | 05:61 | 🔌 DESCONECTADO | CRUD `src/hooks/useAllowedIPs.ts:15,31,42`; enforcement (`validate-access`) sem chamador | Chamar `validate-access` após login e bloquear | Cliente acredita que restringiu acesso por IP; não restringiu | P |
| S05 | Geo-blocking aplicado | 05:62 | 🔌 DESCONECTADO | `src/components/security/GeoBlockingManager.tsx:24` (CRUD); sem enforcement | idem S04 | idem | P |
| S06 | EF `validate-access` (IP + geo) | 05:63 | 🔌 DESCONECTADO | `supabase/functions/validate-access/index.ts:15` (92 linhas, pronta); 0 chamadores em `src/`, `supabase/functions`, `tests`, `scripts`; escreve `access_blocked_log` (0 leitores) | Integrar no fluxo pós-login | Camada de segurança paga e desligada | P |
| S07 | Detecção de novo dispositivo | 05:64 | 🔌 DESCONECTADO | `supabase/functions/detect-new-device/index.ts:17` pronta, 0 chamadores; `src/hooks/useDeviceDetection.ts:49` 0 consumidores | Chamar no login e notificar | Login de dispositivo estranho passa sem aviso | P |
| S08 | SSO (SAML/OIDC) | 05:65 | ❌ NÃO INICIADO | `src/pages/SSOCallbackPage.tsx:10` (20 linhas, só `getSession`); nenhum `signInWithSSO`/SAML/OIDC em `src/` | Fluxo SSO completo | SSO corporativo prometido não existe | M |
| S09 | RBAC granular por permissão (`useRBAC`) | 05:66 | 🔌 DESCONECTADO | `src/hooks/useRBAC.tsx:13` — único hit do símbolo é a definição | Proteger telas/ações com `hasPermission` | Só existe "admin ou não"; não há perfis de acesso intermediários | M |
| S10 | `/admin/roles` atribuir/revogar papel | 05:67 | 🟨 PARCIAL | `src/pages/RolesPage.tsx:17` só `select`; título "Gerenciar Roles" `:39`; sem mutation | CRUD de `user_roles` | Promover/rebaixar usuário exige SQL manual | P |
| S11 | `/admin/permissions` CRUD | 05:68 | 🟨 PARCIAL | `src/pages/PermissionsPage.tsx:17` só leitura | CRUD | Matriz de permissões não editável | P |
| S12 | `/admin/role-permissions` editor de matriz | 05:69 | 🟨 PARCIAL | `src/pages/RolePermissionsPage.tsx:16` só leitura | Editor | idem | P |
| S13 | Feature flags: painel + seed | 05:70 | 🟨 PARCIAL | `src/pages/admin/FeatureFlagsPage.tsx:42-45` (cria com `enabled:false`); sem seed; `roles` não lida | Seed + uso de `roles` | ver R12 | P |
| S14 | Consumo de flags (`useFeatureFlag`) | 05:71 | 🔌 DESCONECTADO | = R12 | — | Flags não protegem nada | P |
| S15 | `/status` público | 05:72 | 🟨 PARCIAL | = R9b | — | — | P |
| S16 | EF `health-aggregate` (v3.1, inclui Conexões) | 05:75 | ⬛ MORTO | 0 chamadores; mesmo assim mantida em `473eb02` (status `unavailable`, `index.ts:189-214`); doc 09: inconclusivo (índices dedicados `20260720000021_…sql:26,34`) | Decidir: substituir `system-health` por ela ou apagar | Código mantido sem uso | P |
| S17 | Amostragem periódica `system_health_snapshots` (cron 5 min) | 05:76; RUNBOOK.md:487 | ❌ NÃO INICIADO | Nenhum `cron.schedule` cita `system-health` (19 jobs, seção 8); único gravador periódico insere sempre `'healthy'` (`20260717133758_…sql:20-22`); gravação sob demanda `system-health/index.ts:183-190` | Job pg_cron de 5 min chamando `system-health` (com service role) | SLA/uptime calculado sem dado | P |
| S18 | `/admin/error-budget` confiável | 05:77 | 🎭 VITRINE | `supabase/functions/error-budget/index.ts:11` (`SAMPLE_INTERVAL_MIN = 5`), `:141` (uptime 100 sem amostra); `src/hooks/useErrorBudget.ts:58` (dia sem amostra = 100%); UI "atualizado a cada 5 min" `src/pages/admin/ErrorBudget.tsx:97` | Depende de S17 | Painel diz 100% de uptime por falta de dado | P |
| S19 | Alertas automáticos de error budget 50/75/100% | 05:78 | 🟨 PARCIAL | `error-budget/index.ts:69-99` só roda quando admin abre a página (`:152`); nenhum canal (e-mail/push/Slack) | Cron + canal de notificação | Ninguém é avisado quando o orçamento estoura | P |
| S20 | `/admin/telemetria` | 05:79 | 🎭 VITRINE | `src/pages/AdminTelemetria.tsx:56,79` leem/apagam `query_telemetry`; 0 escritores (`grep insert into query_telemetry` = 0) | Gravar telemetria (ex.: `useSlowQueryDetector` persistir) | Tela de performance sempre vazia | P |
| S21 | `/admin/audit-trail` organizacional | 05:83 | 🟨 PARCIAL | Policy SELECT segue `auth.uid() = user_id` (`20260926195756_wave_rls_initplan_batch1.sql:60`); nenhuma policy admin; tela `src/pages/AdminAuditTrail.tsx:70` | Policy `has_role(admin)` para SELECT | Auditoria/compliance mostra só as ações do próprio admin | P |
| S22 | EF `audit-analytics` | 05:84 | ⬛ MORTO | 0 chamadores; paginada em `473eb02` (`audit-analytics/index.ts:34-42`) sem ganhar consumidor | Ligar à tela ou remover | — | P |
| S23 | `/admin/schema-drift` | 05:85 | 🎭 VITRINE | `src/hooks/useSchemaDriftAlerts.ts:29,57,78` só lê/resolve; 0 escritores | Job que detecta drift e grava | Banner global de drift nunca acende | M |
| S24 | `/admin/secrets-management` rotaciona segredos | 05:86 | 🟨 PARCIAL | Inventário estático `src/hooks/useSecretRotation.ts:20-28` (inclui `PROXYCURL_API_KEY` `:27`, integração inexistente); só grava hash `:60` | Integração com API de secrets / Vault | Rotação é manual; tela é um diário | M |
| S25 | `/admin/seguranca` aprovação de reset de senha | 05:87 | 🎭 VITRINE | `src/hooks/usePasswordResetRequests.ts:14,30,42`; 0 escritores de `password_reset_requests`; "aprovar" só troca status `:30` | Produtor do pedido + `resetPasswordForEmail` ao aprovar | Fila sempre vazia; aprovar não envia nada | P |
| S26 | DLQ de webhooks reprocessável | 05:92 | 🔌 DESCONECTADO | `process-webhook-dlq/index.ts:27` exige `x-cron-secret`; front sem header `src/hooks/useWebhookDlq.ts:44,59`; sem cron; e `WebhookDlqPanel` só é montado em `src/pages/AdminConexoesLogs.tsx:15,156` (página **órfã**). DLQ é alimentada (`incoming-webhook/index.ts:332-338`). Alternativa parcial: replay manual por log `WebhookReplayButton` em `IncomingWebhookLogsDialog.tsx:57` | Cron de drenagem + rota para o painel | Webhook que falha fica preso para sempre | P |
| S27 | Alertas `smart-notify` | 05:93 | 🔌 DESCONECTADO | `smart-notify/index.ts:10`; cron sem header `20260512105729_…sql:11`; front `src/hooks/useSmartNotifications.ts:159` sem header | Header no cron + `withAuth` para UI | Lembretes WhatsApp não saem | P |
| S28 | `check-health-alerts` (saúde de contatos) | 05:94 | 🔌 DESCONECTADO | `check-health-alerts/index.ts:107`; front `src/hooks/useHealthAlerts.ts:195`; sem cron; e-mail simulado `:226-227` | Cron + auth + e-mail real | Cliente em risco não gera alerta | P |
| S29 | `check-notifications` | 05:95 | 🔌 DESCONECTADO | `check-notifications/index.ts:15` cron-gated; 0 chamadores; 0 cron no repo (doc 09: inconclusivo — cron externo possível, NÃO VERIFICADO) | Agendar ou apagar | Notificações periódicas não rodam | P |
| S30 | `crm-automation-monitor` (produtor do widget da home) | 05:96 → refutado em 09:52 | 🔌 DESCONECTADO | Único escritor de `crm_automation_logs` (`crm-automation-monitor/index.ts:49`); 0 chamadores; widget montado em `src/pages/Index.tsx:192` e `Automacoes.tsx:80` | Gatilho (cron ou trigger) para a EF | Card de auditoria de automações da home sempre vazio | P |
| S31 | `dual-write-proxy` sem autenticação/import quebrado | 05:97; 06:57 | ✅ RESOLVIDO DESDE 08/2026 | `supabase/functions/dual-write-proxy/index.ts:2` (import `npm:@supabase/supabase-js@2.45.0`), `:37` (`x-dual-write-secret`), `:41` (503) — `473eb02`. Segue sem chamador no repo (por desenho: app legado) | — | Endpoint deixou de ser porta aberta ao banco legado | — |
| S32 | Página `Observability.tsx` | 05:98 | ⬛ MORTO | Só `src/app/lazyPages.tsx:3`; sem rota; colunas inexistentes `src/pages/admin/Observability.tsx:20-21`; números fixos `:59,69` | Apagar | — | P |
| S33 | Painel de performance de RPC de negócio | 05:100 | 🟨 PARCIAL | `record_rpc_perf_sample` chamado só por funções de observabilidade: `20261006140000_ai_gateway_observability.sql:297` (`get_ai_gateway_health`), `:352` (`get_ai_gateway_partition_stats`), `20260723155033_…sql:53,94` | Instrumentar RPCs de negócio (pipeline, contatos, relatórios) | Painel de lentidão mede a si mesmo | M |
| S34 | Prometheus + Alertmanager ativos | 05:102 | ❌ NÃO INICIADO | Sem `prometheus.yml` (find = 0); `monitoring/alertmanager/alertmanager.yml:31,38,44` `REPLACE_ME`; exporters `scripts/monitoring/*-exporter.sh` sem invocação | Stack hospedada + scrape + credenciais | Não existe alerta de infraestrutura para ninguém | G |
| S35 | Circuit breaker cobrindo integrações | 05:103 | 🟨 PARCIAL | Única instância `src/lib/externalData.ts:55`; 0 em `supabase/functions` | Breaker em IA, Evolution, Firecrawl etc. | Uma integração fora do ar derruba fluxos em cascata | M |
| S36 | `/admin/field-mapping` vivo | 05:105 | 🟨 PARCIAL | Mapeamento hardcoded `src/pages/AdminFieldMapping.tsx:23-63` | Gerar a partir do schema | Documentação interna diverge do banco sem aviso | P |
| S37 | `/admin/knowledge-export` com fonte de verdade | 05:106 | 🟨 PARCIAL | `src/pages/AdminKnowledgeExport.tsx:16` (dados compilados de memórias) | Fonte dinâmica | Conhecimento exportado envelhece | P |
| S38 | `/admin/docs` dinâmico | 05:107 | 🟨 PARCIAL | `src/pages/DocsPage.tsx:34` (`DOCS` hardcoded) | idem | idem | P |
| S39 | `/design-system` restrito | 05:115 | 🟨 PARCIAL | `src/app/AppRoutes.tsx:69` rota pública | Colocar sob `Protected` | Superfície pública desnecessária | P |
| S40 | Logs unificados de conexões (`/admin/conexoes/logs`) | 05:206,219 | ⬛ MORTO (link morto) | `src/pages/AdminConexoes.tsx:44` → rota inexistente; página `AdminConexoesLogs.tsx` fora de `lazyPages`/`AppRoutes` | Registrar rota | Admin não vê logs nem DLQ | P |
| S41 | `TelemetryTable.tsx` | 05:207 | ⬛ MORTO | 2 hits só no próprio arquivo | Apagar ou ligar | — | P |
| S42 | `AccessSecurityManager` + `PasswordResetApproval` | 05:208 | ⬛ MORTO | 1 hit cada (definição); duplicatas de `SecuritySettings`/`/admin/seguranca` | Apagar | — | P |
| S43 | `EmailPipelineStatus.tsx` | 05:209 | ⬛ MORTO | 1 hit (definição) | Ligar em `/admin/email-diagnostics` ou apagar | — | P |
| S44 | Rotas admin no menu | 05:222 | 🟨 PARCIAL | `src/components/admin/AdminSidebar.tsx:8-24` sem roles/permissions/role-permissions/error-logs/component-gallery/seguranca | Incluir no menu | Funções administrativas "escondidas" | P |
| S45 | Política de senha forte no reset | 05:229 | ❌ NÃO INICIADO | `src/pages/ResetPassword.tsx:15` `min(6)` | Regras de complexidade/HIBP | Senhas fracas aceitas | P |
| S46 | RUNBOOK coerente com observabilidade real | 05:238-242 | ❌ NÃO INICIADO | `docs/RUNBOOK.md:11` ("observabilidade ativa"), `:466` (`health_check_history` inexistente), `:487-488` (crons `system-health-snapshot-5min` e `system-health-snapshots-cleanup` inexistentes); `cleanup_old_health_snapshots` sem agendador | Corrigir runbook ou criar os 2 crons | Plantonista segue procedimento que não existe | P |
| S47 | `clear-must-reset-flag` com import `/cors` | 06:175 | ❌ NÃO INICIADO (resolução do import NÃO VERIFICADA) | `supabase/functions/clear-must-reset-flag/index.ts:16` mantém `npm:@supabase/supabase-js@2/cors`, o mesmo import que a equipe removeu de `dual-write-proxy` em `473eb02`. Se o subpath não resolver na versão publicada, o reset obrigatório pós-migração quebra | Trocar por `scopedCorsHeaders` de `_shared/auth.ts` | Usuário migrado pode ficar preso na tela de troca de senha | P |

---

## 4. Integrações (doc 06)

Itens 🟨 (10), ⬛ (2) e 🟦 "prometidas sem código" (8), mais achados A-2/A-3/A-7/A-9 e contradições.

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| I02 | Resumo de reunião no host correto do AI Gateway | 06:44,197 | ❌ NÃO INICIADO | `supabase/functions/meeting-summary/index.ts:128` (`api.lovable.dev`; as demais usam `ai.gateway.lovable.dev`) | Trocar host / usar `fetchAI` | Resumo de reunião provavelmente falha em 100% (NÃO VERIFICADO em runtime) | P |
| I05 | `evolution-api` (44 ações WhatsApp) | 06:47,190 | ⬛ MORTO (superfície perigosa) | 0 chamadores (as 2 ocorrências em `evolution-webhook/index.ts:402,581` são tags); `withAuth` sem checagem de papel `evolution-api/index.ts:46` | Exigir admin ou remover | Qualquer usuário logado pode apagar a instância do WhatsApp | P |
| I06 | Lembrete WhatsApp via `smart-notify` | 06:48 | 🔌 DESCONECTADO | = S27 (`smart-notify/index.ts:125-133` envio real existe, gatilho não autentica) | — | Lembretes nunca saem | P |
| I10 | Campanhas SMS (Twilio) | 06:52 | 🔌 DESCONECTADO (não registrado em 08/2026) | Botão `src/hooks/useSmsCampaigns.ts:106` sem `x-cron-secret` × `send-sms-campaign/index.ts:27` exige (introduzido `bea2000` 2026-07-26) → 401/500 sempre; `TWILIO_API_KEY` agora no template | Trocar guard por `withAuth` (ação de usuário) | Nenhuma campanha SMS sai pelo sistema | P |
| I12/I32 | Bitrix24 saída: sincronizar leads/deals (CRM↔CRM) | 06:54,81; HARDENING_PHASE3_FINAL.md:82 | 🟨 PARCIAL | Novo `evolution-bitrix-connector` (`473eb02`…`f5e1a9d`): só consulta CRM (`index.ts:218-229` `crm.duplicate.findbycomm`, `crm.contact.get`) e envia mensagens ao Open Lines (`:266,349` `imconnector.send.messages`); nenhum `crm.lead.add/deal.add/update` no repo; `connection-tester` segue só health-check | Sync de lead/deal/atividade para o Bitrix24 | Vendedor continua digitando em dois CRMs | G |
| I15 | Supabase legado (dual-write) seguro | 06:57 | ✅ RESOLVIDO DESDE 08/2026 | = S31 | — | — | — |
| I16 | HMAC obrigatório no `incoming-webhook` | 06:58,159 (A-2) | ✅ RESOLVIDO DESDE 08/2026 | = PD (`20261002103000_…sql:8-34`; `incoming-webhook/index.ts:181-200`) | — | — | — |
| I18 | MCP Claude saída (consumir servidor MCP externo) | 06:60 | 🟨 PARCIAL | Só `initialize` de teste em `connection-tester` (`testMcpClaude`); nenhum consumo real | Cliente MCP real ou remover o tipo de conexão | Conexão "MCP" cadastrável que não faz nada | M |
| I19 | Web Push com VAPID e criptografia | 06:61,187 | 🎭 VITRINE | `supabase/functions/send-push-notification/index.ts:44-52` (`aes128gcm` sem cifrar, sem `Authorization: vapid`); 0 leituras de `VAPID_*` em `supabase/functions`; chave pública hardcoded `src/lib/pushNotifications.ts:6` | Implementar web-push (VAPID + RFC 8291) | Usuário ativa notificação e nunca recebe | M |
| I20 | Geocoding Nominatim dentro da política de uso | 06:62 | 🟨 PARCIAL | `src/pages/mapa/geocoding.ts:8-9` chamada direta do browser, sem cache nem limite de 1 req/s | Proxy com cache e rate-limit | Risco de bloqueio do mapa por abuso | P |
| I21 | ipapi.co inventariado (LGPD) | 06:63,200 | 🟨 PARCIAL | `src/hooks/useIPValidation.ts:16` | Declarar em política de privacidade ou proxy | IP do usuário enviado a terceiro sem aviso | P |
| I22 | Assets Leaflet sem dependência de CDN | 06:64 | 🟨 PARCIAL | `src/pages/MapaEmpresas.tsx:29-31`, `src/pages/mapa/MapMarkerCluster.tsx:6` | Empacotar ícones localmente | CDN fora → mapa sem marcadores | P |
| I24 | Intent Pixel com assinatura/origem | 06:66,162 | ❌ NÃO INICIADO | `supabase/functions/intent-tracker/index.ts:27,72` (só `pixel_key`, sem Origin/Referer/nonce); arquivo intocado | Allowlist de domínio + assinatura | Concorrente injeta sinais falsos e distorce o lead scoring | M |
| I25 | Resend (e-mail transacional) | 06:74 | ❌ NÃO INICIADO | Só o toast `src/hooks/useWeeklyReport.ts:206`; `send-transactional-email` inexistente (`sequence-processor/index.ts:337`) | = R7 | = R7 | M |
| I26 | Proxycurl | 06:75 | ❌ NÃO INICIADO (prometido em 2 lugares) | `HANDOFF.md:127` e agora também na tela admin de segredos `src/hooks/useSecretRotation.ts:27`; 0 código | Remover das docs/tela ou implementar | Admin "rotaciona" chave de integração que não existe | P |
| I27 | GEMINI_API_KEY direta | 06:76 | ❌ NÃO INICIADO | `docs/RUNBOOK.md:405`; 0 leituras em `supabase/functions` | Remover do runbook | Inventário de segredos enganoso | P |
| I28 | Stripe (webhook de cliente) | 06:77 | 🎭 VITRINE (piorou na prática) | Preset `src/components/admin/conexoes/webhookTemplates.ts:62-74`; o `incoming-webhook` agora exige `x-lovable-signature` + `x-lovable-timestamp` + idempotency (`incoming-webhook/index.ts:57-77`) — formato que o Stripe não envia (usa `Stripe-Signature`); nenhum verificador Stripe | Adapter Stripe (verificar `Stripe-Signature`) ou intermediário (n8n) documentado | Preset sugere integração "plug and play" que é rejeitada com 401 | M |
| I29 | GitHub (webhook de issue) | 06:78 | 🎭 VITRINE | `webhookTemplates.ts:78`; mesmo bloqueio de assinatura (sem `X-Hub-Signature-256`) | idem | idem | M |
| I30 | Alertas no Slack | 06:79 | ❌ NÃO INICIADO | `monitoring/alertmanager/alertmanager.yml:31,38` `REPLACE_ME` | Webhook real + stack rodando | Ninguém recebe alerta | P |
| I31 | PagerDuty | 06:80 | ❌ NÃO INICIADO | `alertmanager.yml:44` `REPLACE_ME_PD_INTEGRATION_KEY` | Chave real | Sem plantão acionável | P |
| IA7 | Retry/DLQ/circuit breaker nas integrações de saída | 06:177-185 | ❌ NÃO INICIADO | `grep -i circuit supabase/functions` = 0 (exceto comentário em `_shared/auth.ts:15`); retry só em `lux-trigger`; `_shared/fetch-utils.ts` só timeout | Retry com backoff + DLQ por integração | Falha de 30 s em IA/WhatsApp/scraping perde a operação de vez | M |
| IC2 | Nome único do segredo do webhook Evolution | 06:209 (C-2) | 🟨 PARCIAL | Agora coexistem: `evolution-webhook/index.ts:20` usa `EVOLUTION_API_SECRET`/`apikey` e `evolution-bitrix-connector/index.ts:96-98` usa `EVOLUTION_WEBHOOK_SECRET`/`x-evolution-secret`; template só tem o segundo | Padronizar e documentar | Configuração errada derruba a entrada de mensagens | P |

---

## 5. Dados e Backend (doc 07, com as correções do doc 10)

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| D01 | 14 domínios 🟨 por estarem fora do contrato de tipos (IA/Comportamental, Marketing, RevOps, Lead Scoring, ABM, CS, Deal Rooms, WhatsApp, Social, Admin, Observabilidade, Conexões, Validação, Triggers) | 07:69-83 | ❌ NÃO INICIADO | `types.ts` intocado (ver R1); 128 tabelas consultadas fora do contrato; ex.: `src/hooks/useABM.ts`, `useRevOps.ts`, `useDealRooms.ts`, `useConnections.ts`, `useCustomerSuccess.ts` | Regerar tipos (R1) | Módulos inteiros sem verificação de tipo | M |
| D02 | Pipeline relacional (`pipelines`, `pipeline_stages`, `pipeline_stage_transitions`) | 07:68,120-122 | ⬛ MORTO | 0 referências em `src/` e `supabase/functions` (grep); o Pipeline usa `deals.pipeline_stage` via proxy (`src/hooks/usePipeline.ts:91-110`) | Apagar as tabelas ou migrar o Pipeline para elas | Funis configuráveis prometidos pelo modelo não existem | M |
| D03 | Trilhas de auditoria (`*_audit` ×7, `interactions_audit`) | 07:84,137-145 | ⬛ MORTO (escrita sem leitor) | 0 referências de app; só `INSERT` por trigger (doc 10:291) | Tela de histórico ou desligar triggers | Custo de armazenamento sem uso | P |
| D04 | Caches (`search_products_cache`, `attribution_models_cache`) | 07:85 | ⬛ MORTO | 0 referências de app | Apagar | — | P |
| D05 | Marketing ROI legado (`marketing_roi_data`, `interaction_summaries`, `life_events_history`, `nlp_feedback`) | 07:86 | ⬛ MORTO | 0 referências de app | Apagar | — | P |
| D06 | 16 arquivos de `src/data/` (`carnegie*`×10, `trigger*`×6) | 07:147-151 | ⬛ MORTO | Importados **só** por testes (`src/data/__tests__/carnegieExtended.test.ts`, `triggerBundles.test.ts`, …) | Ligar a uma tela ou apagar | Conteúdo pago sem aparecer ao usuário | P |
| D07 | Materialized views `mv_daily_kpis`/`mv_daily_stats` versionadas (G-2) | 07:326-327,368; 10:221-236 | 🟨 PARCIAL | `CREATE MATERIALIZED VIEW` = 0 no repo; o `REVOKE` que quebrava agora é guardado (`20260721000042_…sql:10-21`); dashboard lê via proxy externo (`src/hooks/useDailyKpis.ts:40`) | Versionar a definição das MVs | KPIs diários dependem de objeto que só existe no banco vivo | P |
| D08 | Schemas `zapp_history`/`_dormant` versionados (G-7) | 07:328-329,373; 10:238-257 | 🟨 PARCIAL | Policy agora guardada (`20260721000057_…sql:14-20`); `CREATE SCHEMA` só `extensions`, `reporting`, `ops_backup` | `CREATE SCHEMA` + tabelas | Histórico de WhatsApp (ZAPP) não reproduzível | M |
| D09 | Sem `DROP TABLE deals CASCADE` órfão no histórico (G-8) | 07:335-341,374 | ❌ NÃO INICIADO | `supabase/migrations/20260317213904_b7db91ad-…sql:1` continua | Neutralizar a migration (squash/baseline) | Replay do zero perde dependências de `deals` | M |
| D10 | `refresh_daily_kpis/stats` agendadas (G-9) | 07:165,375 | ❌ NÃO INICIADO | `20260721000061_fix_mv_refresh_functions.sql:14,25`; nenhum dos 19 jobs as chama | Job pg_cron diário | KPIs diários podem ficar congelados (NÃO VERIFICADO: refresh pode ocorrer no banco externo) | P |
| D11 | Funções SQL sem consumidor (G-10) | 07:159-167; 10:304-346 | ⬛ MORTO | `orphanfn.py`: **96 de 281** sem referência estrutural (o mesmo método dá 69 de 210 em `0fa6177`, vs 70 do doc 10); 61 sem menção alguma — inclui `singu_query/insert/update/delete`, `refresh_daily_*`, `create_economic_group`… Parte das novas é API externa por desenho (`multiplix_*`, `get_contact_sidebar_by_phone` — `docs/GET_CONTACT_SIDEBAR_BY_PHONE.md`) | Revisar e revogar/apagar as internas sem uso | ~1/3 da superfície SECURITY DEFINER sem dono | M |
| D12 | 9 tabelas órfãs reais (G-11 corrigido) | 10:295-298 | ⬛ MORTO | `ai_recommendation_audit_logs`, `city_whitelist`, `interaction_summaries`, `login_attempts`, `marketing_roi_data`, `neuro_pnl_sessions`, `nlp_feedback`, `nurturing_enrollments` (+partição) — 0 refs de app | Apagar ou usar (`login_attempts` para bloqueio de força bruta) | Tabela de segurança `login_attempts` nunca usada | P |
| D13 | Índice/unicidade em `contacts(email)` (G-12) | 07:378 | ❌ NÃO INICIADO | `grep "index … on contacts(…email…)"` e `unique … contacts … email` = 0 | Índice (e decisão sobre unicidade) | Busca/deduplicação de contato por e-mail lenta e permite duplicados | P |
| D14 | RPCs locais chamadas sem `CREATE FUNCTION` | 07:169-178 | ❌ NÃO INICIADO | `supabase/functions/sequence-processor/index.ts:359` (`increment`) e `nurturing-runner/index.ts:145` (`increment_workflow_completed`) — ausentes das 281 funções; `get_territories*` são do banco externo (`external-data/index.ts:86-87`) e estão OK | Criar as RPCs ou trocar por UPDATE | Contadores de sequência/workflow nunca sobem | P |

---

## 6. Infra, CI, Testes e Documentação (doc 08)

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| F01 | Typecheck estrito | 08:368 | 🟨 PARCIAL | `tsconfig.app.json:17-19` (`strict`, `noImplicitAny`, `strictNullChecks` = false) | Ligar progressivamente | "0 erros de TS" não protege contra nulos | G |
| F02 | Commitlint em commits (não só título de PR) | 08:369 | 🟨 PARCIAL | `.github/workflows/ci.yml:24-26` | Validar commits do PR | — | P |
| F03 | Actions `@v7` existentes | 08:370 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:16,105`; Dependabot `c8eb03e`; runs verdes | — | — | — |
| F04 | Um único lockfile | 08:371 | ⬛ MORTO | `bun.lock`, `bun.lockb`, `package-lock.json` coexistem | Apagar os Bun | Builds locais divergentes da CI | P |
| F05 | Gate de índices inválidos | 08:372 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:60-67` (sem `if:`), precedido de `:37-58` | — | — | — |
| F06 | Gate matriz RLS | 08:373 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:116-126`; `tests/rls/run.sh:21-80` | — | — | — |
| F07 | Gate RLS coverage | 08:374 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:128-135` | — | — | — |
| F08 | Lighthouse bloqueante | 08:375 | 🟨 PARCIAL | `|| echo` removido (`ci.yml:140-141`), mas `lighthouserc.json:13-19` segue 7× `"warn"` | Trocar para `"error"` nos limites críticos | Regressão de performance passa | P |
| F09 | Pipeline de deploy | 08:376 | 🟨 PARCIAL | = R3b | — | — | M |
| F10 | Suíte Vitest sem ~437 casos espelho/grep | 08:381 | 🟨 PARCIAL | Arquivos seguem: `src/test/telemetry/*.test.ts` (4), `src/test/company-filters-audit.test.ts`, `src/__tests__/integration/resilience-patterns.test.ts`, `data-validation.test.ts`, `validate-dashboard-improvements.test.ts`, `design-system-audit.test.ts`, `e2e-regression-suite.test.ts` | Reescrever importando o código real | Contagem de testes infla a confiança | M |
| F11 | E2E contra o build de produção | 08:382 | ✅ RESOLVIDO DESDE 08/2026 | `playwright.config.ts:40-44` (`npm run preview`); `package.json` `pretest:e2e` = build | — | — | — |
| F12 | Threshold de cobertura | 08:383 | ❌ NÃO INICIADO | `vitest.config.ts:4-34` sem `coverage.thresholds`; `ci.yml:113-114` | Definir piso | Cobertura pode cair sem alarme | P |
| F13 | Testes-espelho (7 arquivos) | 08:384 | ⬛ MORTO (como proteção) | ver F10 | — | — | M |
| F14 | Testes-grep | 08:385 | 🟨 PARCIAL | `src/__tests__/validate-dashboard-improvements.test.ts`, `design-system-audit.test.ts` | Trocar por testes de comportamento | — | M |
| F15 | `auth-flow.test.ts` íntegro | 08:386 | 🟨 PARCIAL | `src/__tests__/integration/auth-flow.test.ts:1` (`it(` antes dos imports) | Reestruturar | — | P |
| F16 | `e2e/` executado | 08:387 | ✅ RESOLVIDO DESDE 08/2026 | `playwright.config.ts:18-32` (projetos `e2e-*` com `testDir: './e2e'`) | — | — | — |
| F17 | Testes de Edge Function executados | 08:388 | ⬛ MORTO | 16 arquivos / 90 casos `Deno.test` (`supabase/functions/*/index.test.ts`, `_shared/*_test.ts`); 0 `deno test` em `.github/` | Step `deno test` | Regras críticas (auth, webhook, paginação) sem teste rodando | P |
| F18 | `scripts/check-edge-cors.test.mjs` executado | 08:389 | ⬛ MORTO | Fora de `vitest.config.ts:19-24`; nenhum `node --test` o chama (só `tests/rls/prepare-sql.node-test.mjs` em `run.sh:21`) | Incluir no CI | — | P |
| F19 | Sem skip incondicional | 08:390 | ✅ RESOLVIDO DESDE 08/2026 | `e2e/gap-modules-smoke.spec.ts:81-83` agora condicional | — | — | — |
| F20 | Credenciais E2E na CI | 08:391 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:100-101` | — | — | — |
| F21 | `check:edge-imports` no CI | 08:396 | ✅ RESOLVIDO DESDE 08/2026 | `ci.yml:34-35` | — | — | — |
| F22 | 10 aplicadores `apply-*.js`/`chunk-apply`/`retry-failed`/`fix-enums` | 08:397 | ⬛ MORTO | `scripts/apply-*.js` etc. com 0 referências | Apagar | Script que aplica DDL direto no banco à mão de qualquer um | P |
| F23 | 7 geradores de doc | 08:398 | ⬛ MORTO | `scripts/generate_*.py`, `gen-supabase-types.mjs`, `diff-tables.mjs` sem invocação | Ligar ao CI ou apagar | Dicionário de dados congelado | P |
| F24 | 22 cenários `verify/tests/scenarios` | 08:399 | ⬛ MORTO | 22 arquivos em `scripts/migration/verify/tests/scenarios/`, 0 runner | Runner ou apagar | — | P |
| F25 | ~63 scripts de runbook de migração | 08:400 | 🟨 PARCIAL | Só `deploy-all.sh` ganhou teste (`src/lib/deployAllScript.test.ts`) | Automatizar os relevantes | Procedimento manual não testado | M |
| F26 | Regras Prometheus com scrape | 08:402 | ❌ NÃO INICIADO | sem `prometheus.yml` | = S34 | — | G |
| F27 | Alertmanager configurado | 08:403 | ❌ NÃO INICIADO | `alertmanager.yml:31,38,44` | = I30/I31 | — | P |
| F28 | 3 exporters executados | 08:404 | ⬛ MORTO | `scripts/monitoring/{rpc-perf,rpc-plan,ai-gateway-partitions}-exporter.sh` sem invocação | — | — | M |
| F29 | Deploy do stack de monitoring | 08:405 | ❌ NÃO INICIADO | sem Dockerfile/compose/k8s | — | — | G |
| F30 | README/HANDOFF/ARCHITECTURE atualizados | 08:408 | 🟨 PARCIAL | = P8 (`HANDOFF.md:3-4`; `README.md:34,105,108,151`) | — | — | P |
| F31 | `audit_report.md` único | 08:409 | ⬛ MORTO | Diferem na linha 52 ("Backlog" × "Concluído 100%") entre `/audit_report.md` e `/docs/audit_report.md` | Eleger um | Documento oficial contraditório | P |
| F32 | `ARCHITECTURE.md` único | 08:410 | ⬛ MORTO | `diff ARCHITECTURE.md docs/ARCHITECTURE.md` = 257 linhas | Eleger um | — | P |
| F33 | Diagrama ER | 08:411 | ⬛ MORTO | `docs/er-diagram.md` = 111 bytes | Gerar | — | P |

---

## 7. Verificação adversarial (docs 09 e 12) — os 27 alvos hoje

Itens já cobertos acima não são repetidos (S16, S22, S29–S32, S40–S43, S06–S07, I05, R10, S31). Restantes:

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| V01 | Atribuição de marketing funcionando (achado invertido) | 09:51; 12:55-72 | ✅ RESOLVIDO DESDE 08/2026 | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql:428` re-concede `compute_attribution` a `authenticated` (`79fdb0d`) → `src/hooks/useAttribution.ts:61` volta a funcionar em `MarketingHub.tsx:48`. A EF `attribution-calculator` ficou sem chamador (redundante) | Decidir se a EF fica | Painel de atribuição volta a ter dado | — |
| V02 | `auto-regen-behavioral-profiles` (produtor de alerta) | 09:53 | 🔌 DESCONECTADO | `index.ts:15` cron-gated, sem cron no repo; chama `generate-behavioral-profile` só com `x-internal-key` (`:134-138`) → 401 do guard (`generate-behavioral-profile/index.ts:54`) | Cron + corrigir cadeia (N01) | Reanálise automática de perfis não acontece | P |
| V03 | `process-behavioral-regen-queue` (cron externo) | 09:54 | 🔌 DESCONECTADO (cron fora do repo NÃO VERIFICADO) | Job `process-behavioral-regen-queue-5min` só monitorado (`20260713104851_…sql:28-30`), não criado em migration; chamada interna sem `x-cron-secret` (`index.ts:50-56`) | Versionar o job; corrigir header | Fila de reanálise cresce sem ser processada | P |
| V04 | `client-notifications` | 09:59 | 🔌 DESCONECTADO | `index.ts:23` cron-gated; 0 cron; índices dedicados `20260720000024_cron_notification_indexes.sql:9,19,26`; escreve `alerts` (`:246`) | Agendar | Alertas de cliente em risco não são gerados | P |
| V05 | `auto-rebatch-behavioral` | 09:60 | 🔌 DESCONECTADO | Exige **dois** segredos: `x-cron-secret` (`index.ts:35`) e depois `x-internal-key`/`x-cron-key` (`:44-60`); `cron_secrets` semeada (`20260712223208_…sql:21-23`) sem job que a use | Unificar auth + cron | Reprocessamento por feedback negativo nunca roda | P |
| V06 | `enrich-contacts` | 09:62 | ⬛ MORTO | 0 chamadores | Ligar ou apagar | — | P |
| V07 | `win-loss-record-deal` | 09:63 | ⬛ MORTO | 0 chamadores | idem | — | P |
| V08 | `conversation-coaching-digest` | 09:64 | ⬛ MORTO | 0 chamadores; `RUNBOOK.md:189` o lista como cron mas usa `withAuth` | idem | — | P |
| V09 | `WinLossCaptureDialog` (único escritor de win/loss) | 09:76 | 🔌 DESCONECTADO | 0 importadores; `useUpsertWinLossRecord` (`src/hooks/useWinLoss.ts:118`) só usado por ele | Montar no fechamento de deal | Análise de ganho/perda sem dado novo | P |
| V10 | `enrollContact` em sequências | 09:77 | 🔌 DESCONECTADO | `src/hooks/useSequences.ts:167,199`; `src/pages/Sequencias.tsx:19` não o usa | Botão "inscrever contato" | Não há como colocar um contato numa sequência pela tela | P |
| V11 | 6 inconclusivos dependem de `cron.job` e logs do gateway | 09:39-43; 12:83-89 | ❌ NÃO INICIADO (NÃO VERIFICADO em runtime) | Nenhuma evidência nova no repo; continua exigindo `SELECT jobname, schedule, command FROM cron.job` | Rodar a consulta e anexar ao repo | Decisões de apagar/religar continuam no escuro | P |

---

## 8. Edge Functions de cron — status de agendamento HOJE

**Jobs `pg_cron` versionados hoje: 19 nomes distintos** (15 de 08/2026 + 4 do rodízio). Seis foram re-registrados em `20261006140000_ai_gateway_observability.sql:902-915` (mesmos nomes; `cleanup_rpc_perf_samples_daily` mudou de `15 3` para `30 3`). Novos: `singu-rodizio-segmentar`, `singu-rodizio-closer`, `singu-rodizio-sdr`, `singu-rodizio-bloqueios` (`20260924213115_t213_rodizio_pg_cron_jobs.sql:39-42`, todos SQL). **Apenas 2 chamam Edge Function**, ambos sem `x-cron-secret` (`grep x-cron-secret supabase/migrations` = 0).

Contrato exigido: `requireCronSecret` lê só `x-cron-secret` contra `CRON_SECRET` (`supabase/functions/_shared/auth.ts:237-248`); sem `CRON_SECRET` → 500, header errado → 401.

| Function | tem cron.schedule? (migration:linha) | auth do cron correta? | Observação |
|---|---|---|---|
| `smart-notify` | Sim — `20260512105729_9e0ffd45-…sql:6` (`0 */4 * * *`) | ❌ Só `Authorization: Bearer service_role` (`:11`); URL do ref `hjhthvzwtvwgdrochcam` (`:10`), não o linkado | UI também chama sem header (`src/hooks/useSmartNotifications.ts:159`) |
| `validation-queue-worker` | Sim — `20260417120721_823eaa43-…sql:14` (`*/5 * * * *`) | ❌ JWT anon embutido (`:19`), ref `rqodmqosrotmtrjnnjul` (`:18`) | UI sem header (`src/hooks/useValidationQueue.ts:46`); chama `email-verifier`/`phone-validator` com service role (`index.ts:66-72`) |
| `auto-rebatch-behavioral` | Não | ❌ n/a — exige `x-cron-secret` **e** `x-internal-key`/`x-cron-key` (`index.ts:35,44-60`) | Chama `generate-behavioral-profile` sem `x-cron-secret` (`:125-130`) |
| `auto-regen-behavioral-profiles` | Não | ❌ n/a | Único produtor do alerta `behavioral_regen_error_rate` (UI viva em `BehavioralRegenAudit.tsx:436`) |
| `check-health-alerts` | Não | ❌ n/a | Botão "Verificar agora" sem header (`useHealthAlerts.ts:195`); e-mail simulado (`:226`) |
| `check-notifications` | Não | ❌ n/a | Sem chamador; push via `send-push-notification` sem VAPID |
| `client-notifications` | Não | ❌ n/a | Índices dedicados em `20260720000024` |
| `connection-anomaly-detector` | Não | ✅ aceita JWT de admin (`index.ts:47-54`) | Funciona sob demanda pela UI (`useConnectionAnomalies.ts:73`); cron opcional nunca criado |
| `cs-health-recalc` | Não | ❌ n/a | Sem UI e sem cron: saúde de conta de CS nunca recalculada |
| `forecast-snapshot-cron` | Não | ❌ n/a | Sem UI e sem cron: histórico de forecast não acumula |
| `generate-behavioral-profile` | Não (worker) | ❌ exige `x-cron-secret` (`index.ts:54`) | **Todos** os chamadores enviam outra coisa: UI (`useBehavioralProfile.ts:66`, `InsightFeedbackAnalytics.tsx:205`) e 4 EFs com `x-internal-key` — ver N01 |
| `lead-score-cron` | Não | ❌ n/a | Comentário diz "aciona-se via cron" (`index.ts:2`); sem job |
| `mql-evaluator` | Não | ❌ n/a | Sem UI e sem cron |
| `nurturing-runner` | Não | ❌ n/a | UI sem header (`useNurturingExecutions.ts:54`); `increment_workflow_completed` inexistente (`:145`) |
| `process-behavioral-regen-queue` | Não no repo (job `process-behavioral-regen-queue-5min` só monitorado em `20260713104851_…sql:28-30`) | NÃO VERIFICADO (job fora do Git) | Chama `generate-behavioral-profile` sem `x-cron-secret` (`index.ts:50-56`) |
| `process-webhook-dlq` | Não | ❌ n/a | UI sem header (`useWebhookDlq.ts:44,59`), painel só em página órfã |
| `retry-behavioral-profile` | Não (ação manual) | ❌ n/a | Botões em `BehavioralRegenAudit.tsx:150,239` sem header → 401 |
| `revops-snapshot-builder` | Não | ❌ n/a | Botão "Atualizar Snapshot" sem header (`useRevOps.ts:193`); EF paginada em `473eb02` mas guard mantido (`index.ts:20`) |
| `send-sms-campaign` | Não (ação de usuário) | ❌ n/a | UI sem header (`useSmsCampaigns.ts:106`) |
| `sequence-processor` | Não | ❌ n/a | UI sem header (`useSequenceProcessor.ts:9`); invoca `send-transactional-email` inexistente |
| `social-events-detector` | Não | ❌ n/a | UI sem header (`useEdgeFunctionActions.ts:44`, `useEnrichSocialProfiles.ts:77`) |
| `sync-social-interests` | Não | ❌ n/a | UI sem header (`hooks/commercial/useSocialSync.ts:69`) |
| `template-success-notifications` | Não | ❌ n/a | UI sem header (`useTemplateNotifications.ts:102`) |
| `weekly-digest` | Não | ❌ n/a | UI sem header (`useWeeklyReport.ts:169,198`); `generateEmailHtml` nunca chamada |
| `lead-routing` | — | — | **Removida** (`7f863d9`); substituída por 4 jobs SQL do rodízio (`20260924213115:39-42`) — `src/components/lead-routing/LeadRoutingModule.tsx:62-73` |

**Totais:** 24 EFs com contrato de cron (23 obrigatório + 1 opcional) · 2 agendadas no repo (0 com auth correta) · 21 sem nenhum agendamento versionado · 1 com job apenas fora do Git · 15 acionadas por botão da UI que nunca envia o header.

---

## 9. Achados novos (não registrados em 08/2026 ou surgidos depois)

| ID | Funcionalidade/ação planejada | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio | Esforço |
|---|---|---|---|---|---|---|---|
| N01 | Geração de perfil comportamental (DISC/VAK etc.) por botão e por fila | nova (HEAD); doc 05:112 classificava `/admin/insight-feedback` como ✅ | 🔌 DESCONECTADO | `generate-behavioral-profile/index.ts:54` exige `x-cron-secret` (desde `bea2000`, 2026-07-26) antes da lógica de `x-internal-key`/JWT (`:60-90`); chamadores sem o header: `src/hooks/useBehavioralProfile.ts:66`, `src/pages/admin/InsightFeedbackAnalytics.tsx:205`, `process-behavioral-regen-queue/index.ts:50-56`, `auto-regen-behavioral-profiles/index.ts:134-138`, `auto-rebatch-behavioral/index.ts:125-130`, `retry-behavioral-profile/index.ts:119-125` | Remover o `requireCronSecret` do topo (a função já tem auth própria) | O "coração" de inteligência comportamental não gera perfil por nenhum caminho | P |
| N02 | 15 botões de UI que chamam EFs de cron | nova (HEAD) | 🔌 DESCONECTADO | Lista na seção 8 (coluna Observação); todos os `requireCronSecret` introduzidos em `bea2000` (2026-07-26) | Trocar por `withAuthOrCron` | Ações manuais (enviar SMS, processar sequência, atualizar snapshot, detectar eventos sociais) dão erro | M |
| N03 | `evolution-bitrix-connector` operável e reproduzível | nova (EF adicionada após 08/2026) | 🟨 PARCIAL | `supabase/functions/evolution-bitrix-connector/index.ts` (480 l.); tabelas `connector_log`/`oauth_tokens` sem `CREATE TABLE` (`:134,141,150`); `LINE_ID = 44` fixo (`:16`); sem tela, sem doc, publicado `--no-verify-jwt` (`deploy-all.sh:70`) | Versionar DDL, configuração por tela, documentação | Atendimento WhatsApp↔Bitrix depende de tabelas e IDs que só existem no ambiente atual | M |
| N04 | Kill-switch do dual-write | nova (HEAD) | ❌ NÃO INICIADO | `scripts/migration/verify/dual-write-diverge.ts:68` faz `upsert({ key: … })` em `feature_flags`, cuja PK é `name` (`20260420163323_…sql:29-36`) | Corrigir coluna | Divergência na janela de migração não pausa o espelhamento | P |

---

## Resumo numérico

Contagem por linha das tabelas acima (cada ID conta uma vez na sua dimensão; a dimensão 2 repete itens de R por ser o plano oficial).

| Dimensão | Linhas | ❌ | 🟨 | 🎭 | 🔌 | ⬛ | ✅ | ⚠️ |
|---|---|---|---|---|---|---|---|---|
| 1. Riscos estruturais (R) | 18 | 7 | 8 | 1 | 1 | 0 | 1 | 0 |
| 2. Plano de ação §8 | 15 | 6 | 7 | 0 | 0 | 0 | 2 | 0 |
| 3. Admin/Segurança/Observabilidade (05) | 47 | 8 | 16 | 4 | 11 | 7 | 1 | 0 |
| 4. Integrações (06) | 22 | 8 | 6 | 3 | 2 | 1 | 2 | 0 |
| 5. Dados/Backend (07+10) | 14 | 5 | 2 | 0 | 0 | 7 | 0 | 0 |
| 6. Infra/CI/Testes/Docs (08) | 33 | 4 | 9 | 0 | 0 | 11 | 9 | 0 |
| 7. Verificação adversarial (09+12) | 11 | 1 | 0 | 0 | 6 | 3 | 1 | 0 |
| 8. Cron (24 EFs + lead-routing) | 25 | — | — | — | — | — | — | — |
| 9. Achados novos | 4 | 1 | 1 | 0 | 2 | 0 | 0 | 0 |
| **Total (dim. 1, 3–7, 9; sem duplicar o plano)** | **149** | **34** | **42** | **8** | **22** | **29** | **14** | **0** |

*(Contagem conferida por script sobre a coluna "Status HEAD" de cada tabela.)*

Cron (dimensão 8): 24 EFs com contrato de cron → **2 agendadas, 0 com autenticação correta, 21 sem agendamento, 1 só fora do Git**; `lead-routing` removida e substituída por 4 jobs SQL.

Leitura: dos 135 itens que não foram resolvidos, nenhum regrediu no sentido estrito, mas **R1 (tipos), R5 (reprodutibilidade) e R8 (lockout)** ficaram com raio de impacto maior (tabelas novas fora do contrato, guardas que escondem tabelas ausentes, `/rodizio` sob MFA). As resoluções concentraram-se em **CI (R3), webhook HMAC (PD), dual-write (S31), atribuição (V01), Pipeline (R6 parcial) e gates de teste**.

---

## Top 10 lacunas de maior impacto desta fatia

1. **R2 / seção 8 — automação agendada inexistente:** 21 de 24 EFs de cron sem agendamento e os 2 jobs existentes sem `x-cron-secret`, apontando para refs errados. Lembretes, sequências, nutrição, forecast, RevOps, lead score e saúde do cliente nunca rodam sozinhos.
2. **N01 — perfil comportamental quebrado em todos os caminhos:** `generate-behavioral-profile` exige `x-cron-secret` e nenhum dos 6 chamadores (2 telas + 4 EFs) o envia. A inteligência central do produto não gera perfis.
3. **R7 / I25 — e-mail encenado:** campanhas, sequências, nutrição, digest e alertas gravam "enviado" sem provedor; `send-transactional-email` não existe.
4. **R1 / D01 — `types.ts` de outro banco:** 130 de 244 tabelas consultadas e 54 de 54 RPCs fora do contrato; desde 08/2026 entraram mais 7 tabelas e 106 funções sem tipo.
5. **R8 — lockout de admin com 2FA:** inalterado e agora também bloqueia `/rodizio`.
6. **N02 — 15 ações manuais da UI retornam 401/500** (SMS, sequência, snapshot RevOps, DLQ, eventos sociais, templates, digest, validação etc.).
7. **R5 — banco não reproduzível:** o replay deixou de quebrar porque 44 migrations ganharam guardas, mas 28+ tabelas (e as novas `connector_log`/`oauth_tokens`) continuam sem `CREATE TABLE`. A falha ficou silenciosa.
8. **S17/S18/S34 — observabilidade de vitrine:** sem cron de snapshot de saúde, error budget mostra 100% por falta de dado, e Prometheus/Alertmanager seguem com `REPLACE_ME`, sem scrape. Ninguém é alertado.
9. **R10 / S20 / S23 / S25 — telas sem produtor:** insights, telemetria, schema drift, reset de senha, auditoria de recomendação e win/loss leem tabelas que nada escreve.
10. **I19 / I24 / I28–I29 — integrações de fachada:** Web Push sem VAPID, pixel de intenção forjável, e presets Stripe/GitHub que agora são rejeitados pelo HMAC proprietário.
