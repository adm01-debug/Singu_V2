# Estado — RevOps, Vendas Avançadas e Performance

> **Método e limites desta auditoria.**
> Tudo aqui é derivado de leitura estática do repositório em `/home/user/singu-v2`. **Não houve acesso ao banco em runtime** — nenhuma afirmação sobre existência de linhas, volume de dados ou execução real de jobs foi feita. Tudo que dependeria disso está marcado como `NAO_VERIFICADO`.
> `node_modules` está vazio: **não foi executado build, test, lint ou typecheck**. Nenhuma afirmação de "compila" ou "teste passa" é feita.
> Documentação existente (`docs/`, `.lovable/memory/features/*.md`, `*.md` da raiz) foi tratada como **hipótese**, não como evidência. Só vale `arquivo:linha`.
> Onde não houve evidência verificável, a classificação **caiu para 🟦**, nunca subiu.

---

## Resumo (contagem por classificação com denominador)

Denominador: **59 funcionalidades avaliadas** (uma linha por item na Tabela de evidências).

| Classificação | Qtd | % |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 34 / 59 | 57,6% |
| 🟨 IMPLEMENTADO_PARCIAL | 11 / 59 | 18,6% |
| 🟦 SUGERIDO_OU_INICIADO | 8 / 59 | 13,6% |
| ⬛ MORTO_OU_ABANDONADO | 6 / 59 | 10,2% |
| **Total avaliado** | **59** | **100%** |

Recorte por camada, porque a média esconde o padrão:

| Camada | ✅ | 🟨 | 🟦 | ⬛ | Leitura |
|---|---|---|---|---|---|
| Telas CRUD e fluxos acionados por clique | 30 | 4 | 1 | 0 | Maduro |
| Rotinas automáticas (snapshot, recálculo, varredura, reset) | 0 | 2 | 6 | 1 | **Não existe automação neste escopo** |
| Edge Functions do escopo (21) | 10 | 2 | 6 | 3 | 9 das 21 sem chamador nem agendador |
| Dashboards agregados (/analytics, /performance, /metas) | 0 | 2 | 1 | 0 | Dado fictício ou banco externo |

**Três achados estruturais que atravessam todo o escopo:**

1. **Nenhum job agendado existe no repositório para este escopo.** Há 15 chamadas `cron.schedule` em `supabase/migrations/*.sql` e **nenhuma** delas agenda `forecast-snapshot-cron`, `revops-snapshot-builder`, `lead-score-cron`, `cs-health-recalc`, `mql-evaluator` ou `lead-routing reset_daily`. O próprio arquivo de migração de cron está vazio: `scripts/migration/ddl/12_cron_jobs.sql:3` diz literalmente `-- pg_cron não disponível na origem`. Toda a camada de snapshot/recálculo automático é **dormente no código versionado**.
2. **Três botões da UI chamam Edge Functions protegidas por `requireCronSecret`.** O navegador não envia o header `x-cron-secret`, então `requireCronSecret` (`supabase/functions/_shared/auth.ts:270-281`) devolve `401 Unauthorized`. Afeta "Atualizar Snapshot" (/revops) e "Resetar Contadores Diários" (/rodizio).
3. **`src/integrations/supabase/types.ts` não declara nenhuma das tabelas novas deste escopo.** `grep abm_accounts|forecast_periods|revops_snapshots|deal_rooms|cs_accounts src/integrations/supabase/types.ts` → **0 ocorrências**; o backup `src/integrations/supabase/types.ts.lovable.bak` declara todas. E `src/integrations/supabase/types.ts:16608-16610` tem `Functions: { _postgrest_anon_placeholder: ... }` — ou seja, **nenhuma RPC declarada**. O commit `c9b22b5 feat: Migração Banco Lovable para Supabase Singu v2` trocou o arquivo. Isso é um risco de tipagem em ~20 hooks do escopo (não afirmo que quebra o build — não foi possível compilar).

---

## Tabela de evidências

| Funcionalidade | Classificação | UI | Lógica/EF | Persistência | Gatilho | Evidência / o que falta |
|---|---|---|---|---|---|---|
| **Forecasting — página /forecasting** | ✅ | `src/pages/Forecasting.tsx:17-104`, rota `src/app/AppRoutes.tsx:123` | `src/hooks/useForecasting.ts:200-217` (`useForecastSummary`, cálculo em memória) | `forecast_periods`, `deal_forecasts` (`supabase/migrations/20260417001337_e3b9438d…sql`) | Navegação do usuário | KPIs, waterfall, quota bar e tabs renderizam de dados reais das tabelas. Componentes existem: `src/components/forecasting/` (9 arquivos). |
| **Criar período de forecast** | ✅ | Botões "Mês"/"Trimestre" `src/pages/Forecasting.tsx:47-48` | RPC `seed_forecast_period` (`src/hooks/useForecasting.ts:104`) | `forecast_periods` | Clique | RPC existe: `supabase/migrations/20260522142957_beb532ac…sql` e `…20260723121057_9d1bb7f0….sql`. |
| **Categorização IA de deals (forecast-analyzer)** | ✅ | Botão "Re-analisar com IA" `src/pages/Forecasting.tsx:83` | `supabase.functions.invoke("forecast-analyzer")` `src/hooks/useForecasting.ts:172` | `deal_forecasts` | Clique manual | EF existe (`supabase/functions/forecast-analyzer/`), lê pesos de `forecast_quota_settings` em `supabase/functions/forecast-analyzer/index.ts:81`. |
| **Narrativa executiva IA** | ✅ | Tab "Narrativa IA" `src/pages/Forecasting.tsx:100` → `ForecastNarrativeCard` | `invoke("forecast-narrative")` `src/hooks/useForecasting.ts:230` | Sem persistência (resposta transitória) | Clique | `src/components/forecasting/ForecastNarrativeCard.tsx` existe. |
| **Snapshots históricos de forecast (AccuracyChart)** | 🟨 | Tab "Trending" `src/pages/Forecasting.tsx:99` lê `useForecastSnapshots` (`useForecasting.ts:182-197`) | `supabase/functions/forecast-snapshot-cron/index.ts` — único escritor de `forecast_snapshots` | `forecast_snapshots` (tabela existe na migration) | **NENHUM** | EF nunca é invocada: `grep -r "forecast-snapshot-cron" src/` → 0. Nenhum `cron.schedule` a agenda. Além disso `index.ts:8` exige `requireCronSecret`. Gráfico de accuracy só terá dados se alguém chamar a EF por fora do repo. |
| **/forecasting/setup — quotas e pesos de health** | ✅ | `src/pages/ForecastingSetup.tsx:11-80`, rota `AppRoutes.tsx:124` | `useQuotaSettings`/`useUpsertQuotaSettings` `src/hooks/useForecasting.ts:239-266` | `forecast_quota_settings` | Clique "Salvar" | Os pesos **são** consumidos: `supabase/functions/forecast-analyzer/index.ts:81`. Fio completo. |
| **RevOps — KPIs (/revops)** | ✅ | `src/pages/RevOps.tsx:14-78`, rota `AppRoutes.tsx:125` | RPC `compute_revops_kpis` `src/hooks/useRevOps.ts:94` | Computado on-the-fly (não persiste) | Navegação | RPC existe: `supabase/migrations/20260522142957_beb532ac…sql`, `…20260723122017_4576ad54….sql`. |
| **RevOps — funil ponta-a-ponta** | 🟨 | Tab "Funil" `src/pages/RevOps.tsx:67-73` → `RevenueFunnelChart` | Mesmo `compute_revops_kpis` | — | Navegação | Renderiza, mas os estágios MQL/SQL do funil dependem de `mql_classifications`, cuja única fonte de escrita no repo é `mql-evaluator` — que é órfã (ver linha própria). Cadeia a montante quebrada. |
| **RevOps — benchmarks configuráveis** | ✅ | Tab "Benchmarks" `src/pages/RevOps.tsx:75-77` → `BenchmarkConfigForm` | `useRevOpsBenchmarks`/`useUpsertBenchmark` `src/hooks/useRevOps.ts:105-152` | `revops_benchmarks` (`migrations/20260417105530_03a1c9e4…sql`) | Clique | CRUD completo com `onConflict: "user_id,metric_key"`. |
| **RevOps — alertas de queda de conversão** | 🟦 | `RevOpsAlertList` em `src/pages/RevOps.tsx:52` | Leitura: `useRevOpsAlerts` `src/hooks/useRevOps.ts:154-173`; dismiss via RPC `dismiss_revops_alert` (`:179`) | `revops_alerts` | **NENHUM produtor acessível** | Único escritor é `supabase/functions/revops-snapshot-builder/index.ts:133-142`, que exige `x-cron-secret` (`:19`) e não tem cron. A lista de alertas é código completo sobre uma tabela que nada preenche a partir deste repo. |
| **RevOps — botão "Atualizar Snapshot"** | 🟦 | `src/pages/RevOps.tsx:41-44` | `invoke("revops-snapshot-builder")` `src/hooks/useRevOps.ts:193` | `revops_snapshots` + `revops_alerts` | Clique — **mas falha** | `supabase/functions/revops-snapshot-builder/index.ts:19` chama `requireCronSecret(req)`; `supabase.functions.invoke` do browser não envia `x-cron-secret` → `401` (`_shared/auth.ts:276-279`). Botão existe, caminho está fechado. |
| **RevOps — histórico de snapshots** | ⬛ | **nenhuma** | `useRevOpsSnapshots` `src/hooks/useRevOps.ts:65-84` | `revops_snapshots` | — | Hook exportado e sem nenhum consumidor: `grep -rn "useRevOpsSnapshots" src/` só retorna a própria definição. Código escrito e nunca ligado. |
| **Win/Loss — dashboard /win-loss** | 🟨 | `src/pages/WinLoss.tsx:1-216`, rota `AppRoutes.tsx:119` | `useWinLossMetrics` agrega em memória `src/hooks/useWinLoss.ts:305-389` | `win_loss_records` (`migrations/20260416235533_dfd48be7…sql:59`) | Navegação | Página completa (métricas, gráficos, tabela). Porém a tabela-fonte não tem escritor ativo — ver duas linhas abaixo. |
| **Win/Loss — captura de resultado do deal** | 🟦 | **componente existe mas nunca é montado**: `src/components/win-loss/WinLossCaptureDialog.tsx` | `useUpsertWinLossRecord` `src/hooks/useWinLoss.ts:118-140` | `win_loss_records` | — | `grep -rn "WinLossCaptureDialog" src/` fora do próprio arquivo → **0 importadores**. É o único caminho de UI que escreve em `win_loss_records`. Sem ele, o módulo é read-only sobre uma tabela sem produtor. |
| **Win/Loss — EF `win-loss-record-deal`** | ⬛ | nenhuma | `supabase/functions/win-loss-record-deal/index.ts` (completa, com zod + rate limit) | `win_loss_records` | **nenhum** | Testadas as duas formas: `invoke('win-loss-record-deal'` e `invoke<…>('win-loss-record-deal'` → 0 ocorrências em `src/`, `supabase/functions/`, `tests/`, `e2e/`. Duplicada pelo upsert direto do hook. `docs/RUNBOOK.md:201` a lista em "Especiais", sem chamador. |
| **Win/Loss — insights IA (win-loss-analyzer)** | ✅ | Botão em `src/pages/WinLoss.tsx:27` (`useGenerateInsights`) | `invoke('win-loss-analyzer')` `src/hooks/useWinLoss.ts:417` | `win_loss_insights` (`migrations/20260416235533…sql:96`) | Clique | EF existe em `supabase/functions/win-loss-analyzer/`. |
| **Win/Loss — /win-loss/setup (motivos e concorrentes)** | ✅ | `src/pages/WinLossSetup.tsx:1-33`, rota `AppRoutes.tsx:120`; `ReasonsEditor`, `CompetitorEditor` | `src/hooks/useWinLoss.ts:161-287` | `win_loss_reasons`, `competitors` | Clique | CRUD completo + soft-delete via `active=false`. |
| **Win/Loss — seed de motivos padrão** | ✅ | Dentro de `ReasonsEditor` | RPC `seed_win_loss_defaults` `src/hooks/useWinLoss.ts:224` | `win_loss_reasons` | Clique | RPC existe em `supabase/migrations/20260416235533_dfd48be7…sql`. Nota: o hook faz cast `supabase.rpc as unknown as (…)` — sintoma do `types.ts` sem RPCs. |
| **ABM — lista de contas (/abm)** | ✅ | `src/pages/ABM.tsx:1-182`, rota `AppRoutes.tsx:110` | `useABMAccounts` `src/hooks/useABM.ts:90-108` | `abm_accounts` (`migrations/20260416232800_aca98b93…sql`) | Navegação | Filtros, tabela, badge de tier, `CreateAccountDialog` montado em `ABM.tsx:164`. |
| **ABM — detalhe da conta (/abm/:id)** | ✅ | `src/pages/ABMAccountDetail.tsx`, rota `AppRoutes.tsx:112` | `useABMAccount`, `useBuyingCommittee`, `useABMAccountPlans` (`useABM.ts:110-391`) | `abm_buying_committee`, `abm_account_plans` | Navegação | Todos os 6 componentes importados existem em `src/components/abm/`. |
| **ABM — scoring de contas (abm-account-scorer)** | ✅ | Botão em `src/pages/ABM.tsx:20` e `ABMAccountDetail.tsx:21` | `invoke("abm-account-scorer")` `src/hooks/useABM.ts:197` | `abm_accounts.account_score` via upsert `supabase/functions/abm-account-scorer/index.ts:123-128` | Clique manual | EF usa `withAuth` (`abm-account-scorer/index.ts:46`) — chamável do browser. **Sem cron**: recálculo é 100% manual. |
| **ABM — whitespace IA (abm-whitespace-analyzer)** | ✅ | `src/components/abm/WhitespaceOpportunities.tsx:22` | `invoke("abm-whitespace-analyzer")` `src/hooks/useABM.ts:308`; IA em `supabase/functions/abm-whitespace-analyzer/index.ts:34` | `abm_whitespace_opportunities` (insert `:165`) | Clique | Fio completo UI→hook→EF→tabela. |
| **ABM — campanhas (/abm/campanhas)** | 🟨 | `src/pages/ABMCampaigns.tsx`, rota `AppRoutes.tsx:111` | `useABMCampaigns`/`useUpsertCampaign` `src/hooks/useABM.ts:395-471` | `abm_campaigns` | Clique | CRUD funciona, mas o campo `metrics` (`useABM.ts:84`) **nunca é escrito nem renderizado**: `grep -n metrics src/pages/ABMCampaigns.tsx src/components/abm/ABMCampaignDialog.tsx` → 0. Campanha não mede nada. |
| **Intent — página /intent** | ✅ | `src/pages/Intent.tsx:1-141`, rota `AppRoutes.tsx:113` | `useIntentSignals`, `useTopIntentScores` `src/hooks/useIntent.ts:56-109` | `intent_signals`, `intent_scores` (`migrations/20260416233829_14fcc07a…sql`) | Navegação | Timeline e HotAccountsTable existem em `src/components/intent/`. |
| **Intent — pixel de rastreio (/intent/setup)** | ✅ | `src/pages/IntentSetup.tsx`, rota `AppRoutes.tsx:114`; `PixelSetupCard` | `useCreatePixel` gera chave com `crypto.getRandomValues` (`useIntent.ts:50-54`); snippet aponta para `intent-pixel-snippet` (`PixelSetupCard.tsx:24`) | `intent_tracking_pixels` | Clique + tráfego do site do cliente | `supabase/functions/intent-pixel-snippet/index.ts:26` gera o JS que posta em `intent-tracker`. Cadeia pixel→tracker→`intent_signals` fechada. Depende de `VITE_SUPABASE_PROJECT_ID` (`.env.example:18`). |
| **Intent — recálculo de scores (intent-aggregator)** | 🟨 | Botão em `src/pages/Intent.tsx:25` (`useRefreshIntent`) | `invoke("intent-aggregator")` `src/hooks/useIntent.ts:189` | `intent_scores` | Clique manual | Funciona sob demanda. **Sem cron** — `intent_scores` só se atualiza quando alguém abre /intent e clica. Score "atual" pode estar arbitrariamente velho: `NAO_VERIFICADO`. |
| **Lead Scoring — hub /lead-scoring** | 🟨 | `src/pages/LeadScoring.tsx:1-90`, rota `AppRoutes.tsx:115` | `useTopLeads`, `useLeadScoreDistribution` `src/hooks/useLeadScoring.ts:72-122` | `lead_scores` | Navegação | **Conflito de domínio de grade** — ver seção Achados. `useLeadScoring.ts:108` joga qualquer grade fora de A/B/C/D no bucket "D", e a implementação paralela `src/hooks/useLeadScore.ts:7` grava `cold/warm/hot/on_fire` na mesma tabela. Distribuição do hub é enganosa. |
| **Lead Scoring — config de regras e thresholds** | ✅ | `src/pages/LeadScoringConfig.tsx`, rota `AppRoutes.tsx:116` | `useScoreRules`/`useUpdateRule`/`useScoreThresholds`/`useUpdateThreshold` `src/hooks/useLeadScoring.ts:178-252` | `lead_score_rules`, `lead_score_thresholds` (`migrations/20260416234628_b8308aff…sql:55,87`) | Clique | Editores existem: `src/components/lead-scoring/ScoreRulesEditor.tsx`, `ThresholdsEditor.tsx`. |
| **Lead Scoring — EF `lead-scorer` (single + batch)** | ✅ | Botão "Recalcular fila" `src/pages/LeadScoring.tsx:45` | `invoke('lead-scorer')` `src/hooks/useLeadScoring.ts:146,165` | `lead_scores`, `lead_score_history`, drena `lead_score_recompute_queue` (`supabase/functions/lead-scorer/index.ts:221,391`) | Clique manual | Sem guarda de cron — chamável do browser. Fio completo. |
| **Lead Scoring — automações por threshold** | ✅ | `src/pages/LeadScoringAutomations.tsx`, rota `AppRoutes.tsx:117`; wizard + templates + log | `lead-score-threshold-runner`, chamado por `supabase/functions/lead-scorer/index.ts:157,401` | `lead_score_threshold_automations`, `lead_score_automation_log` (`migrations/20260417004129_55991427…sql:2,36`) | Encadeado ao `lead-scorer` | Fio completo: recálculo → runner → ação (notify/task/sequence/webhook/tag). Runner usa `withAuthOrServiceRole` (`threshold-runner/index.ts:5`). |
| **Lead Scoring — EF `lead-score-cron` (varredura diária)** | 🟦 | nenhuma | `supabase/functions/lead-score-cron/index.ts` — enfileira contatos com atividade em 60d | `lead_score_recompute_queue` | **NENHUM** | `grep -r "lead-score-cron" src/ supabase/` fora do próprio dir → 0. Nenhum `cron.schedule`. O comentário no topo (`:2`) diz "Aciona-se via cron"; o cron não existe no repo. Código completo, nunca executado a partir deste repositório. |
| **Lead Scoring — trigger `intent_signals` → fila** | 🟨 | — | `trigger_lead_score_recompute` + `tg_intent_signals_enqueue_score` (`migrations/20260416234628_b8308aff…sql:171-198`) | `lead_score_recompute_queue` | Trigger de INSERT em `intent_signals` | O gatilho de **enfileiramento** existe de verdade. Mas o **consumidor** da fila (`lead-scorer` batch) só roda por clique humano em /lead-scoring. Fila enche sozinha, esvazia manualmente. |
| **MQL — EF `mql-evaluator`** | 🟦 | nenhuma | `supabase/functions/mql-evaluator/index.ts` | `mql_classifications` (`migrations/20260417011613_40e57206…sql:149`) | **NENHUM** | Órfã pelas duas formas de busca. Exige `requireCronSecret` (`:10`) e não há cron. Consequência em cascata: `revops-snapshot-builder/index.ts:64-65` conta MQL/SQL a partir de `mql_classifications`. `src/hooks/useMQL.ts:90,127` só lê e atualiza status — nunca insere. Sem produtor, o funil RevOps fica truncado. |
| **Roteamento de leads — `distribute` / `redistribute`** | ✅ | `src/components/lead-routing/LeadRoutingModule.tsx:32,68`; `QuickDistributeWidget.tsx:11` | `invoke('lead-routing')` `src/hooks/useLeadRoutingServer.ts:34,64` | `sales_team_members`, atribuições | Clique | `supabase/functions/lead-routing/index.ts:243` autentica por JWT para estas duas ações. Fio completo. |
| **Roteamento — "Resetar Contadores Diários"** | 🟦 | `src/components/lead-routing/LeadRoutingModule.tsx:76-82` | `invoke('lead-routing', {action:'reset_daily'})` `src/hooks/useLeadRoutingServer.ts:96` | `sales_team_members` | Clique — **mas falha** | `supabase/functions/lead-routing/index.ts:237-240`: a ação `reset_daily` exige `requireCronSecret`. Chamada do browser → `401`. E não há cron que a dispare. Reset diário não acontece por nenhum caminho existente. |
| **/rodizio — página** | ✅ | `src/pages/Rodizio.tsx:1-17`, rota `AppRoutes.tsx:133`; 6 abas lazy em `src/components/lead-routing/tabs/` | `useSalesTeam`, `usePendingHandoffCount`, `useHandoffRealtime` | tabelas de time/handoff | Navegação | Módulo montado e funcional exceto o reset diário acima. |
| **Enrichment — página /enrichment** | ✅ | `src/pages/Enrichment.tsx:1-75`, rota `AppRoutes.tsx:118` | `email-verifier`, `email-finder`, `phone-validator` (`src/hooks/useEnrichmentSuite.ts:35,51,67`) | `email_verifications`, `phone_validations`, `email_finder_results`, `people_intelligence_events` | Clique | 11 componentes em `src/components/enrichment/` todos usados. Fila de validação tem cron real: `validation-queue-drain` (`migrations/20260417120721_823eaa43…sql:14`). |
| **Enrichment — EF `enrich-contacts`** | ⬛ | nenhuma | `supabase/functions/enrich-contacts/index.ts` (usa `withAuth`, depende de `EXTERNAL_SUPABASE_URL` `:38-39`) | — | **nenhum** | Testadas as duas formas de invoke → 0 chamadores em `src/`. `docs/EDGE_FUNCTIONS_API.md:25` a lista como "Frontend (JWT)", mas nenhum front a chama. A página /enrichment usa outras três EFs. |
| **Playbooks — hub /playbooks** | ✅ | `src/pages/Playbooks.tsx`, rota `AppRoutes.tsx:130` | `usePlaybooks`, `useBattleCards` | `sales_playbooks`, `battle_cards` (`migrations/20260417005023_6d2d8ea7…sql`) | Navegação | Listagem + filtros + `GeneratePlaybookDialog`. |
| **Playbooks — geração IA e recomendação** | ✅ | `GeneratePlaybookDialog` | `invoke("playbook-generator")` `src/hooks/usePlaybooks.ts:199`; `invoke("playbook-recommender")` `:226` | `sales_playbooks`, `playbook_usage_log` (`:251`) | Clique | Ambas as EFs existem em `supabase/functions/`. |
| **Playbooks — detalhe e battle card** | ✅ | `src/pages/PlaybookDetail.tsx` (`AppRoutes.tsx:132`), `src/pages/BattleCardDetail.tsx` (`:131`) | `usePlaybook`, `useBattleCard` | mesmas tabelas | Navegação | `PlaybookSectionRenderer.tsx` e `BattleCardView.tsx` existem. |
| **Playbooks — `PlaybookSuggestionDrawer`** | ⬛ | nenhuma | `src/components/playbooks/PlaybookSuggestionDrawer.tsx` | — | — | 0 importadores (`grep -rn PlaybookSuggestionDrawer src/` fora do arquivo). Superfície do `playbook-recommender` que nunca foi ligada. |
| **Deal Rooms — CRUD e detalhe** | ✅ | `src/pages/DealRooms.tsx` (`AppRoutes.tsx:128`), `DealRoomDetail.tsx` (`:129`) | `src/hooks/useDealRooms.ts:121-431` | `deal_rooms`, `deal_room_milestones`, `_stakeholders`, `_documents`, `_comments`, `_activities` (`migrations/20260417003149_4ff2385c…sql`) | Navegação/clique | 8 componentes em `src/components/deal-rooms/` todos usados. Upload usa bucket `documents` (`useDealRooms.ts:343`). |
| **Deal Rooms — compartilhamento por token** | ✅ | `ShareDialog.tsx:15` | `invoke("deal-room-share")` `src/hooks/useDealRooms.ts:436`; EF valida `withAuth` + posse (`deal-room-share/index.ts:12-40`) | `deal_rooms.share_token/share_enabled` | Clique | Rotação de token via `crypto.randomUUID()` (`:46`). |
| **Deal Rooms — health score IA** | ✅ | `RoomHealthCard.tsx:7` (`useRoomHealth`) | `invoke("deal-room-health")` `src/hooks/useDealRooms.ts:452`; heurística + IA em `deal-room-health/index.ts:50-60` | `deal_rooms.health_score/health_recommendations` | Clique | Fio completo. Sem cron — recálculo é manual (aceitável para o caso de uso). |
| **Deal Rooms — visão pública /dr/:token** | ✅ | `src/pages/PublicDealRoom.tsx`, rota pública `AppRoutes.tsx:66` | RPCs `get_deal_room_by_token`, `buyer_toggle_milestone`, `buyer_add_comment`, `get_buyer_document_path` (`useDealRooms.ts:467-498`) + `invoke("deal-room-buyer-view")` `:484` | `deal_room_*` | Acesso do comprador | Todas as 4 RPCs existem: `migrations/20260417003149_4ff2385c…sql:318` e `20260509105231_7512f767…sql`. Grant para `anon` em `:344`. |
| **Customer Success — portfólio /customer-success** | ✅ | `src/pages/CustomerSuccess.tsx`, rota `AppRoutes.tsx:126` | `useCSAccounts` `src/hooks/useCustomerSuccess.ts:82-100` | `cs_accounts` (`migrations/20260417110650_9365a2d8…sql`) | Navegação | 8 componentes em `src/components/customer-success/` usados. |
| **Customer Success — health score por conta** | ✅ | `src/pages/CustomerSuccessAccount.tsx:22` (`useRecalcAccountHealth`) | RPC `compute_account_health` `src/hooks/useCustomerSuccess.ts:159` | `cs_accounts.health_score`, `cs_health_signals` | Clique | RPC existe (`migrations/20260417110650…sql`, `20260522142957…sql`). Recálculo por conta funciona. |
| **Customer Success — EF `cs-health-recalc` (lote)** | 🟦 | nenhuma | `supabase/functions/cs-health-recalc/index.ts` | `cs_accounts`, alertas | **NENHUM** | Órfã pelas duas formas de invoke. `requireCronSecret` em `:7`, sem `cron.schedule`. `.lovable/memory/features/customer-success-suite.md:20` afirma "cron 05:00 UTC" — não existe no repo. Recálculo em massa é dormente; só o botão por conta funciona. |
| **Customer Success — renovações e NPS** | ✅ | `RenewalPipelineList`, `NPSDistributionChart`, `NPSResponseDialog`, `QBRTimeline` | RPC `cs_renewal_pipeline` `src/hooks/useCustomerSuccess.ts:350`; CRUD em `cs_renewals`, `cs_nps_responses`, `cs_qbrs` | tabelas de `migrations/20260417110650…sql:117` | Navegação/clique | RPC existe. Fio completo. |
| **Churn — `detect-churn-risk`** | ✅ | `src/components/churn-risk/ChurnRiskPanel.tsx` (montado em `ContactIntelligenceTab.tsx:197`) | `invoke("detect-churn-risk")` `src/hooks/useChurnRisk.ts:122`; EF usa `withAuth` (`detect-churn-risk/index.ts:18`) | `churn_risk_scores` (`:161`) | Clique | Fio completo. Observação: **não** está integrado à tela de Customer Success — o CS usa `compute_account_health`, sem cruzar com churn. |
| **Territórios — /territorios** | 🟨 | `src/pages/Territorios.tsx`, rota `AppRoutes.tsx:108` | `callExternalRpc('get_territories')` `src/hooks/useTerritories.ts:38` → EF `external-data` | **Banco EXTERNO** (não este projeto) | Navegação | As tabelas locais `territories`/`territory_assignments` existem em `types.ts`, mas **não são usadas**. RPCs `get_territories`, `get_territory_performance`, `create_territory` não existem em `supabase/migrations` (0 ocorrências); estão só no allowlist `supabase/functions/external-data/index.ts:76-80`. Erros são engolidos e viram `[]` (`useTerritories.ts:41-48`) → tela vazia silenciosa. |
| **Território — otimização IA (/territory-optimization)** | 🟨 | `src/pages/TerritoryOptimization.tsx:1-178`, rota `AppRoutes.tsx:109` | `invoke('territory-optimization')` `src/hooks/useTerritoryOptimization.ts:67`; EF usa `withAuth` (`territory-optimization/index.ts:203`) e IA (`:109`) | **Nada persiste** — resposta transitória | Clique/navegação | A EF só produz dados se `EXTERNAL_SUPABASE_URL`/`..._SERVICE_ROLE_KEY` estiverem definidos (`territory-optimization/index.ts:216-236`); caso contrário `territories = []` e todos os KPIs viram 0. O hook também converte qualquer erro em `EMPTY` (`useTerritoryOptimization.ts:70-91`) — **falha indistinguível de "malha saudável e vazia"**. Nenhuma recomendação é gravada; some ao recarregar. |
| **Metas & Gamificação (/metas)** | 🟨 | `src/pages/Metas.tsx:1-68`, rota `AppRoutes.tsx:106`; 5 widgets em `src/components/gamification/` | `callExternalRpc` para `get_user_goals`, `get_goals_dashboard`, `get_quota_status`, `get_leaderboard`, `get_user_badges`, `check_and_award_badges` (`src/hooks/useGamification.ts:71,88,105,124,141,157`) | **Banco EXTERNO** | Navegação | Nenhuma das 6 RPCs existe em `supabase/migrations` (0 ocorrências cada). Estão apenas no allowlist `supabase/functions/external-data/index.ts:69-71`. Todos os hooks capturam erro e devolvem `[]`/`null` → ranking e badges renderizam "não disponível" sem sinalizar falha. Se as metas existem no banco externo: `NAO_VERIFICADO`. |
| **Performance (/performance)** | 🟨 | `src/pages/Performance.tsx:1-293`, rota `AppRoutes.tsx:107` | `usePerformanceMetrics` `src/hooks/usePerformanceMetrics.ts:49-176` | Deriva de `contacts`/`companies`/`interactions` locais | Navegação | Métricas de atividade, canal, sentimento e follow-up são **reais**. Mas o bloco "Maestria PNL em Vendas" é **100% fictício** — ver Achados (`usePerformanceMetrics.ts:160-164` e `Performance.tsx:108-109`). |
| **Analytics — aba Overview (/analytics)** | 🟦 | `src/pages/Analytics.tsx:85-92`, rota `AppRoutes.tsx:91` | `src/data/analyticsData.ts` — constantes literais | **nenhuma** | Navegação | KPIs, evolução de relacionamento, distribuição de sentimento, engajamento por canal, radar e "top performers" vêm de arrays hardcoded. Inclui nomes de pessoas inventados (`analyticsData.ts:171-177`). Loading é `setTimeout(800)` (`Analytics.tsx:82`). As demais abas (DISC, NLP, RFM, Churn) usam hooks reais — por isso a página não é ⬛, mas a aba de entrada é demonstração. |
| **Attribution — EF `attribution-calculator`** | ⬛ | nenhuma | `supabase/functions/attribution-calculator/index.ts` (zod + rate limit + `withAuth`) | `attribution_touchpoints` | **nenhum** | 0 chamadores pelas duas formas de invoke. O caminho vivo é a RPC `compute_attribution` (`src/hooks/useAttribution.ts:59`), usada em `src/pages/MarketingHub.tsx:48`. EF é implementação paralela abandonada. |
| **Assinatura pública (/signature/:token)** | ✅ | `src/pages/PublicSignaturePage.tsx:48,78`, rota pública `AppRoutes.tsx:67` | `fetch` direto para `get-signature` e `submit-signature` | `document_signatures` (`types.ts:5031`; EFs em `get-signature/index.ts:42`, `submit-signature/index.ts:48`) | Link enviado ao signatário | Produtor existe: `src/hooks/useDocumentTemplates.ts:190-200` cria a solicitação a partir de `/documentos`. Fio completo ponta a ponta. |
| **Componentes `lead-scoring/LeadScoreCard` + Breakdown + Sparkline** | ⬛ | nenhuma | `src/components/lead-scoring/LeadScoreCard.tsx:60` | — | — | 0 importadores. Ele importa `LeadScoreBreakdown` e `LeadScoreSparkline` (`LeadScoreCard.tsx:8-9`), que também não têm outro consumidor → subárvore morta de 3 arquivos. O card vivo na ficha do contato é o homônimo `src/components/lead-score/LeadScoreCard.tsx`. |

---

## Jobs agendados do escopo: nome | cron encontrado? (migration:linha) | classificação

Levantamento completo: `grep -rn "cron.schedule" supabase/migrations/` retorna **15 ocorrências**, listadas abaixo em três blocos.

### A) Jobs que o escopo *precisa* — nenhum existe

| Job esperado (EF/rotina) | `cron.schedule` encontrado? | Onde a documentação afirma que existe | Classificação |
|---|---|---|---|
| `forecast-snapshot-cron` (snapshots diários de forecast) | **NÃO** — 0 ocorrências | `.lovable/memory/features/forecasting-revenue-intelligence.md:3,18`; `docs/RUNBOOK.md:189` | 🟦 dormente |
| `revops-snapshot-builder` (04:00 UTC) | **NÃO** — 0 ocorrências | comentário no próprio código `supabase/functions/revops-snapshot-builder/index.ts:2`; `.lovable/memory/features/revops-dashboard.md:3,15` | 🟦 dormente |
| `lead-score-cron` (varredura diária) | **NÃO** — 0 ocorrências | `supabase/functions/lead-score-cron/index.ts:2`; `.lovable/memory/features/lead-scoring-server-side.md:3,19`; `docs/RUNBOOK.md:189` | 🟦 dormente |
| `cs-health-recalc` (05:00 UTC) | **NÃO** — 0 ocorrências | `.lovable/memory/features/customer-success-suite.md:20`; `docs/RUNBOOK.md:189` | 🟦 dormente |
| `mql-evaluator` | **NÃO** — 0 ocorrências | `docs/MIGRATION_DDL.md:62` cita como cron existente | 🟦 dormente |
| `lead-routing` ação `reset_daily` | **NÃO** — 0 ocorrências | implícito no nome "Contadores Diários" (`LeadRoutingModule.tsx:81`) | 🟦 dormente |
| `abm-account-scorer` (rescoring periódico) | **NÃO** | nenhuma doc afirma cron | 🟨 manual por design aparente |
| `intent-aggregator` (recálculo de intent) | **NÃO** | nenhuma doc afirma cron | 🟨 manual por design aparente |
| `attribution-calculator` | **NÃO** | — | ⬛ órfã |
| `deal-room-health` | **NÃO** | — | ✅ manual por design (botão na UI) |
| `lead-score-threshold-runner` | **NÃO** (nem precisa) | `docs/RUNBOOK.md:189` lista como cron | ✅ acionado por encadeamento a partir do `lead-scorer` |

### B) Crons que existem nas migrations, mas são de outros escopos (para contraste — provam que a mecânica funciona)

| jobname | cron | migration:linha |
|---|---|---|
| `smart-notify-automation` | `0 */4 * * *` | `20260512105729_9e0ffd45…sql:7` |
| `validation-queue-drain` | `*/5 * * * *` | `20260417120721_823eaa43…sql:15` |
| `revalidate-stale-emails` | `0 4 * * *` | `20260417120721_823eaa43…sql:25` |
| `revalidate-stale-phones` | `30 4 * * *` | `20260417120721_823eaa43…sql:42` |
| `check-contact-health-daily` | `0 0 * * *` | `20260509173046_0804c068…sql:7` |
| `ai-gateway-alerts-eval` | `*/5 * * * *` | `20260723152932_9ebcb761…sql:94` |
| `auto_resolve_ai_gateway_alerts` | `2-59/5 * * * *` | `20260723153336_b3712da2…sql:179` |
| `ai-gateway-metrics-ensure-partition` | `15 3 * * *` | `20260723154109_ad0a12c4…sql:129` |
| `ai-gateway-metrics-drop-old` | `0 4 * * 0` | `20260723154109_ad0a12c4…sql:135` |
| `capture-degraded-rpc-plans` | `*/15 * * * *` | `20260726144422_a6bd4ac3…sql:4` |
| `mtta-sla-breach-auto-ack-hourly` | `7 * * * *` | `20260715184735_158ce47d…sql:32` |
| `mtta-auto-ack-heartbeat-watchdog` | `*/30 * * * *` | `20260717142132_7f20a3a3…sql:70` |
| `apply-data-retention-daily` | `15 3 * * *` | `20260723112943_04c3b77d…sql:125` |
| `cleanup-simulated-alerts-weekly` | `0 3 * * 0` | `20260713124628_449b2996…sql:29` |
| `cleanup_rpc_perf_samples_daily` | `15 3 * * *` | `20260723154748_e54bdf5c…sql:255` |

**Conclusão do bloco:** `pg_cron` está instalado (`20260713102011_e2e3ff09…sql:1`) e é usado com sucesso em 15 jobs de observabilidade/limpeza. **Zero** desses jobs pertence a RevOps/Vendas. Não é limitação técnica — é ausência de agendamento para este escopo.

### C) Confirmação documental da lacuna

`scripts/migration/ddl/12_cron_jobs.sql` tem 3 linhas e o corpo é `-- pg_cron não disponível na origem` (linha 3). `docs/MIGRATION_DDL.md:57-62` reconhece: *"`12_cron_jobs.sql` está vazio… recrie os jobs manualmente… (já documentam os crons `mtta-*`, `nurturing-runner`, `mql-evaluator`, `lead-score-cron`, etc.)"*. **Essa recriação manual não foi feita em nenhuma migration do repositório.**

---

## Achados

### 1. Dado fictício

| # | Arquivo:linha | O que é | Impacto |
|---|---|---|---|
| F1 | `src/hooks/usePerformanceMetrics.ts:160-164` | `// Simulated NLP Mastery Metrics based on interaction quality` seguido de `nlpMasteryScore = 88; vakConsistency = 92; rapportDepth = 85; reframingProficiency = 79;` — **constantes**, idênticas para todo usuário | O bloco de destaque de `/performance` (`src/pages/Performance.tsx:74,83,91,99`) exibe 4 métricas inventadas com aparência de medição |
| F2 | `src/pages/Performance.tsx:108-109` | Texto fixo: *"Você está no **TOP 5%** de comunicadores da organização. Seu padrão cinestésico é sua maior força no fechamento."* | Afirmação de ranking e diagnóstico comportamental sem qualquer cálculo por trás |
| F3 | `src/data/analyticsData.ts:27-66` (`getRelationshipEvolutionData`) | Séries temporais literais por período (`'7d'`, `'30d'`, `'90d'`, `'365d'`) | Gráfico principal de `/analytics` |
| F4 | `src/data/analyticsData.ts:68-93` (`getSentimentDistributionData`) | Distribuição de sentimento hardcoded | Card de sentimento de `/analytics` |
| F5 | `src/data/analyticsData.ts:101-130` (`getEngagementByChannelData`) | Volumes por canal hardcoded | Gráfico de engajamento de `/analytics` |
| F6 | `src/data/analyticsData.ts:132-169` (`getEngagementRadarData`) | Radar de 6 dimensões hardcoded | Radar de `/analytics` |
| F7 | `src/data/analyticsData.ts:171-177` (`getTopPerformersData`) | **Ranking com pessoas inventadas**: "João Silva 92", "Maria Santos 88", "Pedro Costa 85", "Ana Oliveira 82", "Carlos Lima 78" | Leaderboard falso renderizado em `/analytics` |
| F8 | `src/data/analyticsData.ts:179-213` (`getMetricsStats`) | 4 KPIs de topo com valores e variações fixos por período | Cards de KPI de `/analytics` |
| F9 | `src/pages/Analytics.tsx:81-84` | `setTimeout(() => setLoading(false), 800)` | Skeleton de carregamento simulado — sugere busca de dados que não ocorre |
| F10 | `src/hooks/useDealVelocity.ts:63-71` | `averageDays: Math.round(Math.random() * 15) + 3` com `benchmark: 10` fixo e `trend: 'stable'` fixo | `DealVelocityPanel` (renderizado em `/analytics`) mostra velocidade de estágio **aleatória a cada render** |
| F11 | `src/pages/Enrichment.tsx:55-56` | `R$ 0` e `"100% server-side, sem APIs pagas"` hardcoded como card de "Custo" | Card de custo não mede nada |
| F12 | `src/components/territories/TerritoryMap.tsx:6-32` | `UF_PATHS` — mapa do Brasil desenhado com 27 retângulos aproximados | Mapa esquemático; não é dado falso, mas geografia é decorativa. Registrado por transparência |

### 2. Feature dormente (código completo, sem agendador nem chamador)

| # | Componente | Evidência | Por que é dormente |
|---|---|---|---|
| D1 | `forecast-snapshot-cron` | `supabase/functions/forecast-snapshot-cron/index.ts:8` (`requireCronSecret`); 0 chamadores; 0 `cron.schedule` | Único escritor de `forecast_snapshots`. A aba "Trending" de `/forecasting` (`Forecasting.tsx:99`) depende dela |
| D2 | `revops-snapshot-builder` | `index.ts:2` afirma "Cron diário 04:00 UTC"; `index.ts:19` exige `x-cron-secret`; a UI o chama sem esse header (`src/hooks/useRevOps.ts:193`) | Único escritor de `revops_snapshots` **e** de `revops_alerts`. Botão da UI retorna 401 |
| D3 | `lead-score-cron` | `index.ts:2,10`; 0 chamadores; 0 cron | Recálculo automático diário de lead score não acontece |
| D4 | `cs-health-recalc` | `index.ts:7`; 0 chamadores; 0 cron | Recálculo em lote de health de CS não acontece; só o botão por conta (`CustomerSuccessAccount.tsx:22`) |
| D5 | `mql-evaluator` | `index.ts:10`; 0 chamadores; 0 cron | Ninguém popula `mql_classifications` → funil MQL/SQL do RevOps fica sem entrada |
| D6 | `lead-routing` ação `reset_daily` | `supabase/functions/lead-routing/index.ts:237-240`; chamada do browser em `useLeadRoutingServer.ts:96` | Contadores diários do rodízio nunca zeram |
| D7 | Fila `lead_score_recompute_queue` | Produtor: trigger `tg_intent_signals_enqueue_score` (`migrations/20260416234628…sql:191-197`). Consumidor: `lead-scorer` batch, só via clique (`src/pages/LeadScoring.tsx:45`) | Fila com produtor automático e consumidor manual — cresce sozinha |
| D8 | `revops_alerts` (UI de alertas) | `src/components/revops/RevOpsAlertList.tsx` montado em `RevOps.tsx:52`; produtor único é D2 | Lista de alertas sobre tabela sem produtor alcançável |
| D9 | `WinLossCaptureDialog` | `src/components/win-loss/WinLossCaptureDialog.tsx` — 0 importadores | Único caminho de UI que escreve `win_loss_records`. Sem ele, `/win-loss` é um dashboard sobre tabela que a aplicação não alimenta |

### 3. Edge Functions órfãs do escopo (verificadas nas DUAS formas: `invoke('nome'` e `invoke<...>('nome'`, mais `fetch .../functions/v1/nome`)

| EF | Chamadores em `src/` | Chamadores em `supabase/functions/` | Cron | Veredito |
|---|---|---|---|---|
| `attribution-calculator` | 0 | 0 | não | ⬛ órfã — substituída pela RPC `compute_attribution` (`src/hooks/useAttribution.ts:59`) |
| `win-loss-record-deal` | 0 | 0 | não | ⬛ órfã — substituída pelo upsert direto (`src/hooks/useWinLoss.ts:126`) |
| `enrich-contacts` | 0 | 0 | não | ⬛ órfã — a página usa `email-verifier`/`email-finder`/`phone-validator` |
| `forecast-snapshot-cron` | 0 | 0 | não | 🟦 dormente (tem função clara, falta agendador) |
| `lead-score-cron` | 0 | 0 | não | 🟦 dormente |
| `cs-health-recalc` | 0 | 0 | não | 🟦 dormente |
| `mql-evaluator` | 0 | 0 | não | 🟦 dormente |
| `revops-snapshot-builder` | 1 (`useRevOps.ts:193`) — **mas bloqueada por 401** | 0 | não | 🟦 alcançável só com header de cron |
| `lead-score-threshold-runner` | 0 | **2** (`lead-scorer/index.ts:157,401`) | não precisa | ✅ **não é órfã** — só aparece assim se a busca ignorar chamadas EF→EF |

### 4. Código morto no frontend do escopo

| Artefato | Evidência |
|---|---|
| `src/components/lead-scoring/LeadScoreCard.tsx` + `LeadScoreBreakdown.tsx` + `LeadScoreSparkline.tsx` | 0 importadores externos; os dois últimos só são usados pelo primeiro (`LeadScoreCard.tsx:8-9`) |
| `src/components/win-loss/WinLossCaptureDialog.tsx` | 0 importadores |
| `src/components/playbooks/PlaybookSuggestionDrawer.tsx` | 0 importadores |
| `useRevOpsSnapshots` (`src/hooks/useRevOps.ts:65`) | 0 consumidores |

### 5. Conflito de domínio no Lead Scoring (duas implementações escrevendo a mesma tabela)

Existem **dois** sistemas de lead score gravando em `lead_scores`:

- **Server-side (A/B/C/D)** — `src/hooks/useLeadScoring.ts` + EF `lead-scorer`, regras em `lead_score_rules`/`lead_score_thresholds`.
- **Client-side (cold/warm/hot/on_fire)** — `src/hooks/useLeadScore.ts:7`, cálculo no navegador (`:87-163`), upsert direto em `lead_scores` (`:342-343`), config em `lead_score_config`.

A migration reconhece a colisão e afrouxa a constraint para aceitar os dois vocabulários: `supabase/migrations/20260416234628_b8308aff…sql:23-24` → `CHECK (grade IN ('A','B','C','D','cold','warm','hot','on_fire'))`.

Consequência mensurável: `src/hooks/useLeadScoring.ts:108` faz `const g = (['A','B','C','D'].includes(r.grade) ? r.grade : 'D')` — todo contato pontuado pelo caminho client-side é contabilizado como **grade D** nos KPIs e no gráfico de distribuição de `/lead-scoring` (`src/pages/LeadScoring.tsx:57-61`). Quantos registros isso afeta hoje: `NAO_VERIFICADO`.

### 6. Dependência silenciosa de banco externo

Três telas do escopo não leem o Supabase deste projeto:

- `/territorios` → `callExternalRpc('get_territories')` (`src/hooks/useTerritories.ts:38`)
- `/metas` → 6 RPCs externas (`src/hooks/useGamification.ts:71,88,105,124,141,157`)
- `/territory-optimization` → a EF lê `EXTERNAL_SUPABASE_URL` (`supabase/functions/territory-optimization/index.ts:216-236`)

Nenhuma dessas RPCs existe em `supabase/migrations` (verificado nome a nome: 0 ocorrências). Elas constam apenas no allowlist da EF proxy (`supabase/functions/external-data/index.ts:69-71,76-80`). **Todos** os hooks convertem erro em lista vazia (`useTerritories.ts:41-48`, `useGamification.ts:72-75`, `useTerritoryOptimization.ts:70-91`) — logo, indisponibilidade do banco externo é visualmente idêntica a "não há dados". Um operador não consegue distinguir os dois estados. Se essas RPCs existem no destino externo: `NAO_VERIFICADO`.

### 7. Descoberta e navegação

- **19 de 27 páginas do escopo não renderizam `AppLayout`** (sem sidebar/shell). Verificado por `grep -c AppLayout src/pages/<X>.tsx`: têm layout apenas `ABM`, `ABMCampaigns`, `ABMAccountDetail`, `Intent`, `IntentSetup`, `Metas`, `Performance`, `Analytics`. Não têm: `Forecasting`, `ForecastingSetup`, `RevOps`, `WinLoss`, `WinLossSetup`, `LeadScoring`, `LeadScoringConfig`, `LeadScoringAutomations`, `Enrichment`, `Playbooks`, `PlaybookDetail`, `BattleCardDetail`, `DealRooms`, `DealRoomDetail`, `CustomerSuccess`, `CustomerSuccessAccount`, `Territorios`, `TerritoryOptimization`, `Rodizio`. `Protected` em `src/app/AppRoutes.tsx:31-37` não injeta layout e não há `AppLayout` global (`grep -rn AppLayout src/App.tsx src/main.tsx src/app/*.tsx` → 0).
- **9 rotas do escopo não estão na sidebar.** `src/components/layout/AppSidebar.tsx` lista apenas `/abm`, `/analytics`, `/enrichment`, `/lead-scoring`, `/metas`, `/performance`, `/territorios` do escopo. Ficam fora da navegação: `/forecasting`, `/revops`, `/win-loss`, `/intent`, `/playbooks`, `/deal-rooms`, `/customer-success`, `/territory-optimization`, `/rodizio` — acessíveis apenas pela paleta de comandos (`src/components/command/commandRegistry.ts`).

### 8. Tipagem do Supabase desalinhada com o código do escopo

`src/integrations/supabase/client.ts:12` faz `createClient<Database>` a partir de `./types`. Mas em `src/integrations/supabase/types.ts`:

- **0 ocorrências** de: `abm_accounts`, `abm_campaigns`, `abm_buying_committee`, `abm_whitespace_opportunities`, `abm_account_plans`, `forecast_periods`, `deal_forecasts`, `forecast_snapshots`, `forecast_quota_settings`, `revops_snapshots`, `revops_benchmarks`, `revops_alerts`, `win_loss_reasons`, `win_loss_insights`, `intent_signals`, `intent_scores`, `intent_tracking_pixels`, `sales_playbooks`, `battle_cards`, `deal_rooms` (e as 5 tabelas filhas), `cs_accounts` (e as 4 filhas), `attribution_touchpoints`.
- `Functions: { _postgrest_anon_placeholder: … }` (`types.ts:16608-16610`) — **nenhuma RPC declarada**, embora o escopo chame 8 RPCs.
- O backup `src/integrations/supabase/types.ts.lovable.bak` **declara todas** essas tabelas.

Código do escopo que referencia esses tipos explicitamente: `src/hooks/useCustomerSuccess.ts:76-79` (`Database["public"]["Tables"]["cs_accounts"]["Insert"]`, `["cs_qbrs"]…`), `src/hooks/useABM.ts:423` (`TablesUpdate<'abm_campaigns'>`), `src/hooks/useAttribution.ts:78` (`TablesInsert<'attribution_touchpoints'>`). Já há contornos no código sugerindo que o problema é conhecido: `src/hooks/useWinLoss.ts:224` faz `supabase.rpc as unknown as (fn: string, …)`.

**Não afirmo que o build quebra** — `node_modules` está vazio e não foi possível rodar `tsc`. Registro apenas a divergência verificável entre o arquivo importado e o código que o consome. Origem provável: commit `c9b22b5 feat: Migração Banco Lovable para Supabase Singu v2` (único commit que toca `types.ts`).

### 9. Guarda de autenticação inconsistente

`requireCronSecret` é aplicado em 6 EFs do escopo (`forecast-snapshot-cron:8`, `revops-snapshot-builder:19`, `lead-score-cron:10`, `cs-health-recalc:7`, `mql-evaluator:10`, `lead-routing:238`), enquanto EFs que também mutam estado usam `withAuth` (`abm-account-scorer:46`, `abm-whitespace-analyzer:101`, `detect-churn-risk:18`, `territory-optimization:203`, `enrich-contacts`, `attribution-calculator:17`). Em dois casos a guarda de cron está aplicada a caminhos que **a UI tenta usar** (RevOps snapshot, rodízio reset), tornando-os inalcançáveis. `docs/auditoria/01_ACHADOS_SEGURANCA.md:35` já registrou a inconsistência na direção oposta (EFs sem guarda nenhuma).

---

## Contradições com a documentação existente

| # | Documento afirma | Código mostra | Evidência |
|---|---|---|---|
| C1 | `.lovable/memory/features/revops-dashboard.md:3,15`: *"Edge function revops-snapshot-builder (**cron diário 04:00 UTC**)"* | Nenhum `cron.schedule` referencia a função | 0 ocorrências em `supabase/migrations/*.sql` |
| C2 | `supabase/functions/revops-snapshot-builder/index.ts:2` (comentário do próprio código): *"Cron diário 04:00 UTC"* | idem C1 | o próprio arquivo |
| C3 | `.lovable/memory/features/customer-success-suite.md:20`: *"`cs-health-recalc` (**cron 05:00 UTC**)"* | Nenhum cron; EF sem chamador | 0 ocorrências |
| C4 | `.lovable/memory/features/forecasting-revenue-intelligence.md:3,18`: *"forecast-snapshot-cron (**snapshots diários**)"* | Nenhum cron; EF sem chamador | 0 ocorrências |
| C5 | `.lovable/memory/features/lead-scoring-server-side.md:3,19`: *"edge functions lead-scorer (single+batch) e **lead-score-cron**"* | `lead-score-cron` sem cron e sem chamador | 0 ocorrências |
| C6 | `docs/RUNBOOK.md:189` lista `forecast-snapshot-cron`, `lead-score-cron`, `cs-health-recalc` como *"Disparados via cron interno"* | Nenhum dos três é disparado por nada no repositório | 0 `cron.schedule` |
| C7 | `docs/RUNBOOK.md:183` classifica `revops-snapshot-builder` no grupo **A — Autenticadas via JWT (`withAuth`)**, chamadas pelo frontend | O código usa `requireCronSecret`, não `withAuth` | `supabase/functions/revops-snapshot-builder/index.ts:19` |
| C8 | `docs/RUNBOOK.md:179` classifica `mql-evaluator` no grupo **A (JWT, frontend)** | O código usa `requireCronSecret` e nenhum frontend a chama | `supabase/functions/mql-evaluator/index.ts:10` |
| C9 | `docs/RUNBOOK.md:183` classifica `attribution-calculator` como chamada pelo frontend | 0 chamadores; o front usa a RPC `compute_attribution` | `src/hooks/useAttribution.ts:59` |
| C10 | `docs/EDGE_FUNCTIONS_API.md:25` e `docs/RUNBOOK.md:178` listam `enrich-contacts` como função de frontend | 0 chamadores em `src/` | grep nas duas formas de invoke |
| C11 | `docs/RUNBOOK.md:189` lista `lead-score-threshold-runner` como **cron** | É acionada por outra EF (`lead-scorer`), não por cron; e usa `withAuthOrServiceRole`, não `requireCronSecret` | `supabase/functions/lead-scorer/index.ts:157,401`; `lead-score-threshold-runner/index.ts:5` |
| C12 | `docs/MIGRATION_DDL.md:62` afirma que os crons `mql-evaluator`, `lead-score-cron` etc. *"já são documentados"* em `.lovable/memory/features/*.md` e podem ser recriados | A recriação nunca foi versionada; `scripts/migration/ddl/12_cron_jobs.sql:3` = `-- pg_cron não disponível na origem` | os dois arquivos |
| C13 | `docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md:51-52` trata `lead-score-cron` e `forecast-snapshot-cron` como funções em operação, apontando bugs de paginação/`NaN` | Antes do bug de paginação existe um problema maior: **elas não são executadas por nada no repositório** | 0 `cron.schedule`, 0 chamadores |
| C14 | `AUDITORIA_SISTEMA.md:255`: *"`enrich-contacts/`… funcionam com JWT padrão (ok)"* | Autenticação está correta, mas a função não tem consumidor | 0 chamadores |

---

## Arquivos que inspecionei

**Rotas e layout (4)**
`src/app/AppRoutes.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/MobileSidebarDrawer.tsx`, `src/components/command/commandRegistry.ts`

**Páginas do escopo (29)**
`src/pages/`: `Forecasting.tsx`, `ForecastingSetup.tsx`, `RevOps.tsx`, `WinLoss.tsx`, `WinLossSetup.tsx`, `ABM.tsx`, `ABMCampaigns.tsx`, `ABMAccountDetail.tsx`, `Intent.tsx`, `IntentSetup.tsx`, `LeadScoring.tsx`, `LeadScoringConfig.tsx`, `LeadScoringAutomations.tsx`, `Enrichment.tsx`, `Playbooks.tsx`, `PlaybookDetail.tsx`, `BattleCardDetail.tsx`, `DealRooms.tsx`, `DealRoomDetail.tsx`, `PublicDealRoom.tsx`, `CustomerSuccess.tsx`, `CustomerSuccessAccount.tsx`, `Territorios.tsx`, `TerritoryOptimization.tsx`, `Rodizio.tsx`, `Metas.tsx`, `Performance.tsx`, `Analytics.tsx`, `PublicSignaturePage.tsx`

**Hooks (22)**
`src/hooks/`: `useForecasting.ts`, `useRevOps.ts`, `useWinLoss.ts`, `useABM.ts`, `useIntent.ts`, `useLeadScoring.ts`, `useLeadScore.ts`, `useScoreAutomations.ts`, `useCustomerSuccess.ts`, `useChurnRisk.ts`, `useDealRooms.ts`, `usePlaybooks.ts`, `useBattleCards.ts`, `useTerritories.ts`, `useTerritoryOptimization.ts`, `usePerformanceMetrics.ts`, `useGamification.ts`, `useEnrichmentSuite.ts`, `useEnrichmentCoverage.ts`, `useAttribution.ts`, `useLeadRoutingServer.ts`, `useDealVelocity.ts`

**Componentes / dados (inventário de 13 diretórios + leituras pontuais)**
`src/components/`: `abm/`, `intent/`, `win-loss/` (+ `WinLossCaptureDialog.tsx`, `CompetitorEditor.tsx`, `ReasonsEditor.tsx`), `playbooks/`, `deal-rooms/` (+ `RoomHealthCard.tsx`, `ShareDialog.tsx`), `customer-success/`, `territories/` (+ `TerritoryMap.tsx`), `forecasting/`, `revops/`, `lead-scoring/` (+ `LeadScoreCard.tsx`), `lead-score/`, `enrichment/`, `territory-optimization/`, `gamification/` (+ `LeaderboardWidget.tsx`), `churn-risk/ChurnRiskPanel.tsx`, `lead-routing/LeadRoutingModule.tsx`
`src/data/analyticsData.ts`

**Edge Functions do escopo (21 + 3 de apoio)**
`supabase/functions/`: `abm-account-scorer/`, `abm-whitespace-analyzer/`, `attribution-calculator/`, `forecast-snapshot-cron/`, `revops-snapshot-builder/`, `lead-scorer/`, `lead-score-cron/`, `lead-score-threshold-runner/`, `mql-evaluator/`, `lead-routing/`, `territory-optimization/`, `deal-room-share/`, `deal-room-health/`, `deal-room-buyer-view/`, `cs-health-recalc/`, `detect-churn-risk/`, `win-loss-record-deal/`, `get-signature/`, `submit-signature/`, `external-data/`, `enrich-contacts/`, `_shared/auth.ts`, `intent-pixel-snippet/`, `forecast-analyzer/`

**Infra / esquema (6)**
`src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `src/integrations/supabase/types.ts.lovable.bak`, `src/lib/externalData.ts`, `supabase/config.toml`, `.env.example`

**Migrations (varredura completa de 390 arquivos + leitura dirigida de 22)**
Varredura: `cron.schedule` (15 hits em 15 arquivos), `CREATE TABLE` das tabelas do escopo, `CREATE FUNCTION` das 9 RPCs do escopo.
Leitura: `20260416005302_557a4633…`, `20260416232800_aca98b93…`, `20260416233829_14fcc07a…`, `20260416234628_b8308aff…`, `20260416235533_dfd48be7…`, `20260417001337_e3b9438d…`, `20260417003149_4ff2385c…`, `20260417004129_55991427…`, `20260417005023_6d2d8ea7…`, `20260417011613_40e57206…`, `20260417105530_03a1c9e4…`, `20260417110650_9365a2d8…`, `20260417120721_823eaa43…`, `20260420204951_1bd46e2e…`, `20260509173046_0804c068…`, `20260512105729_9e0ffd45…`, `20260713102011_e2e3ff09…`, `20260715184735_158ce47d…`, `20260717142132_7f20a3a3…`, `20260723112943_04c3b77d…`, `20260723152932_9ebcb761…`, `20260726144422_a6bd4ac3…`

**Documentação confrontada (9)**
`docs/RUNBOOK.md`, `docs/EDGE_FUNCTIONS_API.md`, `docs/MIGRATION_DDL.md`, `docs/auditoria/01_ACHADOS_SEGURANCA.md`, `docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md`, `AUDITORIA_SISTEMA.md`, `scripts/migration/ddl/12_cron_jobs.sql`, `.lovable/memory/features/{forecasting-revenue-intelligence,revops-dashboard,lead-scoring-server-side,customer-success-suite,win-loss-intelligence,intent-data-module}.md`

---

## Lacunas: o que NÃO verifiquei e por quê

1. **Estado real do banco.** Sem acesso em runtime. Não sei se `forecast_snapshots`, `revops_snapshots`, `revops_alerts`, `win_loss_records`, `mql_classifications`, `lead_scores`, `abm_accounts`, `cs_accounts` ou `intent_scores` têm linhas, nem quantas. Todas as afirmações de "produtor ausente" são sobre **caminhos de código neste repositório** — não excluem escrita por seed manual, painel do Supabase, script externo ou job criado direto no dashboard. → `NAO_VERIFICADO`.

2. **`cron.job` do banco de produção.** Só inspecionei `cron.schedule` nas migrations versionadas. Jobs podem ter sido criados manualmente via SQL Editor — e `docs/MIGRATION_DDL.md:57-60` diz explicitamente que a extração de `cron.job` falhou por falta de permissão no pooler. Portanto: "não há cron **no repositório**" é o que afirmo; "não há cron **em produção**" é `NAO_VERIFICADO`.

3. **Compilação, testes e lint.** `node_modules` vazio; não executei `tsc`, `vitest`, `eslint`, `playwright` nem build. A divergência do `types.ts` (Achado 8) está descrita como fato textual verificável (`grep` retorna 0), **não** como erro de compilação.

4. **Secrets e variáveis de ambiente.** Não sei se `CRON_SECRET`, `LOVABLE_API_KEY`, `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` e `VITE_SUPABASE_PROJECT_ID` estão configurados. Isso muda o comportamento de `requireCronSecret` (`_shared/auth.ts:272-275` retorna 500 se ausente), de `territory-optimization` (`index.ts:216`) e de todo o proxy `external-data`. → `NAO_VERIFICADO`.

5. **Banco externo (`external-data`).** Não verifiquei se as RPCs `get_user_goals`, `get_goals_dashboard`, `get_quota_status`, `get_leaderboard`, `get_user_badges`, `check_and_award_badges`, `get_territories`, `get_territory_performance`, `create_territory`, `assign_territory` existem no destino. Afirmo apenas que **não estão nas migrations deste repositório**. Se `/metas` e `/territorios` exibem dados reais: `NAO_VERIFICADO`.

6. **RLS efetiva.** Li `CREATE POLICY` em algumas migrations mas não auditei sistematicamente as políticas das tabelas do escopo, nem testei isolamento entre usuários. Fora do escopo declarado desta auditoria.

7. **Deploy real das Edge Functions.** `supabase/config.toml` tem apenas `project_id = "hjhthvzwtvwgdrochcam"` — sem bloco `[functions.*]`, sem `verify_jwt`. Não sei quais das 109 funções do diretório estão efetivamente publicadas. → `NAO_VERIFICADO`.

8. **Comportamento das EFs de IA.** Não executei `abm-whitespace-analyzer`, `deal-room-health`, `territory-optimization`, `forecast-analyzer`, `win-loss-analyzer`, `playbook-generator`. A qualidade e o formato das respostas do gateway de IA não foram avaliados; só confirmei que o código faz a chamada e persiste o resultado onde indicado.

9. **Cobertura de teste do escopo.** Encontrei 5 arquivos que mencionam termos do escopo (`tests/rls/functions_authenticated_allowlist.sql`, `tests/rls/functions_least_privilege.sql`, `tests/stress/thousand-scenarios.test.ts`, `tests/e2e/hubs-smoke.spec.ts`, `e2e/gap-modules-smoke.spec.ts`), mas **não avaliei o que testam nem se passam** — não é possível executá-los.

10. **Histórico Git.** Consultei `git log` apenas de `src/integrations/supabase/types.ts`. Não reconstruí a cronologia de quando cada EF órfã foi escrita nem se algum cron foi removido em algum commit. Poderia distinguir "nunca ligado" de "desligado depois" — não foi feito.

11. **Módulos vizinhos.** `MarketingHub`, `Pipeline`, `Ficha360`/`ContatoDetalhe`, `Sequencias`, `Automacoes` e `NLPAnalytics` só foram tocados quando consumiam algo do meu escopo (ex.: `compute_attribution`, `ChurnRiskPanel`, `LeadScoreWidget`). A auditoria completa deles pertence a outros documentos de `docs/estado/`.
