# Estado — Core CRM

> **Método:** auditoria estática do código-fonte. Cada linha da tabela cita `arquivo:linha`.
> **Sem acesso a banco em runtime.** Nenhuma afirmação sobre conteúdo de tabelas foi feita.
> **`node_modules` vazio:** nenhum build/test/lint foi executado. Nada aqui afirma que o projeto compila ou que testes passam.
> **README/HANDOFF/ARCHITECTURE/AUDITORIA\* foram tratados como hipótese**, não como prova.

## Contexto arquitetural que condiciona todas as classificações

O Core CRM **não tem uma única persistência**. Existem três destinos de escrita/leitura distintos, e o mesmo domínio (contatos, empresas, deals, tasks) é acessado por caminhos diferentes conforme a tela:

1. **Banco EXTERNO**, via edge function proxy `external-data` (`src/lib/externalData.ts:50`, `supabase/functions/external-data/index.ts:157-158` lê `EXTERNAL_SUPABASE_URL` / `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`). O proxy só aceita tabelas de uma allowlist (`supabase/functions/external-data/index.ts:385-387`) e RPCs de outra allowlist (`supabase/functions/external-data/index.ts:10-90`).
2. **Banco LOCAL**, via `supabase.from(...)` direto (ex.: `src/hooks/useContactDetail.ts:40-42`).
3. **`localStorage` / `profiles.preferences`** para algumas preferências (`src/pages/Notificacoes.tsx:66,69`).

Consequência auditável: **o schema do banco externo não existe neste repositório**. As migrations locais (`supabase/migrations/`, 390 arquivos) descrevem o banco local. Portanto, para toda funcionalidade servida pelo proxy, a existência real do objeto no banco externo é `NAO_VERIFICADO` — só é possível provar que o código **declara** e **permite** aquele objeto.

**Critério de classificação adotado:**
- ✅ exige fio completo em código **e** objeto de banco comprovável no repositório (migration local, ou presença na allowlist do proxy que é o contrato de acesso). Runtime carimbado `NAO_VERIFICADO`.
- 🟨 quando falta camada, há stub, fio quebrado, dado fictício, ou o objeto referenciado **não** está declarado/permitido.
- 🟦 quando há só esqueleto/menção sem consumidor.
- ⬛ quando nenhum caminho de execução no repositório alcança o código.

---

## Resumo

Total auditado: **65 funcionalidades**.

| Classificação | Contagem |
|---|---|
| ✅ IMPLEMENTADO_TOTAL | **47 de 65** |
| 🟨 IMPLEMENTADO_PARCIAL | **11 de 65** |
| 🟦 SUGERIDO_OU_INICIADO | **3 de 65** |
| ⬛ MORTO_OU_ABANDONADO | **4 de 65** |

Rotas do escopo registradas em `src/app/AppRoutes.tsx`: **25 de 25**. Nenhuma página do escopo é órfã de rota.

Ressalva que atravessa todos os ✅: a existência dos objetos no **banco externo** é `NAO_VERIFICADO` (sem runtime). Um ✅ aqui significa "o fio está completo e correto no código e o objeto está declarado/permitido no contrato", não "funciona em produção".

---

## Tabela de evidências

| Funcionalidade | Classificação | UI | Lógica | Persistência | Evidência / o que falta |
|---|---|---|---|---|---|
| Registro de rotas do Core CRM | ✅ | `src/app/AppRoutes.tsx:76-104` | `src/app/lazyPages.tsx:1-168` | n/a | As 25 rotas do escopo estão registradas e protegidas por `Protected` (`src/app/AppRoutes.tsx:31-37`). Nenhuma página órfã. |
| Dashboard `/` — abas e navegação | ✅ | `src/pages/Index.tsx:125-201` | `src/pages/Index.tsx:90-96` (`handleTabChange`) | n/a (estado local) | 4 abas montadas com `DashboardErrorBoundary` por seção (`src/pages/Index.tsx:104,151,171,183,197`). |
| Dashboard — KPIs e estatísticas | ✅ | `src/components/dashboard/tabs/OverviewTab.tsx` via `src/pages/Index.tsx:152-163` | `src/hooks/useDashboardStats.ts:107-183` (agregação real: sparkline 7 semanas, média de score, top contatos) | Deriva de `useContacts`/`useCompanies`/`useInteractions` (`src/pages/Index.tsx:52-61`) | Cálculo real, sem valores fixos. Nenhum `Math.random` no hook. |
| Dashboard — Briefing diário | ✅ | `src/components/dashboard/DailyBriefingCard.tsx` via `src/pages/Index.tsx:108-112` | recebe `contacts`/`interactions`/`weeklyInteractions` | derivado | Fio completo a partir dos hooks de dados. |
| Dashboard — Checklist de onboarding | ✅ | `src/pages/Index.tsx:115-120` | `src/pages/Index.tsx:85-88` (flags derivadas de contagens reais) | derivado | Sem hardcode; flags vêm de `dashboardStats`. |
| Dashboard — Painel de performance do time | 🟨 | `src/components/team/TeamDashboardPanel.tsx:9` | `src/hooks/useTeamDashboard.ts:26,41,51-54` | local `sales_team_members`, `contacts`, `interactions`, `deals` | **Fio quebrado na parte de deals:** `src/hooks/useTeamDashboard.ts:54` faz `.from('deals' as never).select('user_id, value, stage')`. A coluna `stage` só existe na definição antiga (`supabase/migrations/20260317213221_...sql:3`); a definição mais recente usa `stage_id` (`supabase/migrations/20260512184042_...sql:24`) e o `types.ts` usa `pipeline_stage`. O próprio comentário no código admite o problema (`src/hooks/useTeamDashboard.ts:53`: "planned table not yet in the generated types"). Contatos/interações funcionam. |
| Dashboard — Log de auditoria de automações | ✅ | `src/components/crm/CRMAutomationAuditLog.tsx:48` | `src/components/crm/CRMAutomationAuditLog.tsx:48-79` | local `crm_automation_logs`, `crm_automation_reprocess_queue` — migration em `supabase/migrations/20260723150429_...sql` | Leitura + reprocessamento. Fio completo. |
| Listagem de Contatos `/contatos` | ✅ | `src/pages/Contatos.tsx:289-330` → `src/pages/contatos/ContatosContent.tsx` | `src/hooks/useContacts.ts:1-361` (infinite query) | EXTERNO `contacts` via proxy — `src/lib/externalData.ts:98`; tabela na allowlist (`supabase/functions/external-data/index.ts` ALLOWED_TABLES, bloco "Core tables") | Existência no banco externo `NAO_VERIFICADO`. |
| Contatos — criar / editar / excluir | ✅ | `src/pages/Contatos.tsx:332-355` (dialogs + AlertDialog) | `src/pages/Contatos.tsx:214-252` | `insertExternalData`/`updateExternalDataWithVersion`/`deleteExternalData` (`src/hooks/useContacts.ts:7`) | Inclui controle de concorrência otimista (`version`) em `src/pages/Contatos.tsx:230`. |
| Contatos — filtros avançados, multi-sort e estado na URL | ✅ | `src/pages/Contatos.tsx:44-89` (configs), `310-318` | `src/pages/Contatos.tsx:164-201` (sync URL + filtragem + `sortArray`) | URL search params | Filtros de hobbies/interesses são populados dinamicamente a partir dos dados (`src/pages/Contatos.tsx:96-119`), não hardcoded. |
| Contatos — Saved Views | ✅ | `src/pages/Contatos.tsx:296-307`, `370-385` | `src/hooks/useSavedViews.ts:77` | id gerado client-side; escopo `'contatos'` | Fio completo UI→hook. |
| Contatos — ações em massa (excluir, tag, estágio) | ✅ | `src/pages/Contatos.tsx:319-323` | `src/pages/Contatos.tsx:265-287` | `deleteContact`/`updateContact` (externo) | Três operações em massa implementadas. |
| Detalhe do Contato `/contatos/:id` | ✅ | `src/pages/ContatoDetalhe.tsx:79-120` | `src/hooks/useContactDetail.ts:27-80` | **híbrido**: local primeiro (`src/hooks/useContactDetail.ts:47`), com fallback externo (`:59-63`); `interactions`/`insights`/`alerts` locais (`:40-42`) | Estratégia local-first-then-external é explícita e coerente. |
| Contato — Lux Intelligence (enriquecimento) | ✅ | `src/pages/ContatoDetalhe.tsx:22-23,106-118` | `src/hooks/useLuxIntelligence.ts:101,141,188` | **LOCAL** `lux_intelligence` (`:101`) — migration confirmada e presente em `types.ts`; disparo via edge `lux-trigger` (`:141`); criação de stakeholder em `contacts` local (`:188`) | Fio UI→hook→edge→tabela completo e inteiramente local (não usa o proxy externo, apesar de `lux_intelligence` também constar da allowlist). |
| Ficha 360 `/contatos/:id/ficha-360` | ✅ | `src/pages/Ficha360.tsx:78-98` | `src/hooks/useFicha360.ts:1-6` compõe 5 sub-hooks | views EXTERNAS `vw_singu_contact_360` (`src/hooks/useContactView360.ts:47`), `vw_interaction_timeline` (`src/hooks/useExternalInteractions.ts:62`), `vw_singu_rapport_intel` (`src/hooks/useRapportIntelView.ts:28`), `vw_rapport_points` (`src/hooks/useRapportPoints.ts:30`) — **todas presentes na allowlist** | Fio completo. Conteúdo das views `NAO_VERIFICADO`. |
| Ficha 360 — resumo de conversas por IA | ✅ | `src/components/ficha-360/GerarResumoIAButton.tsx` via `src/pages/Ficha360.tsx:26` | `src/hooks/useFicha360ConversationSummary.ts:79` | edge `ficha360-conversation-summary` grava cache em `ficha360_conversation_summaries` (`supabase/functions/ficha360-conversation-summary/index.ts:229-237`); migration em `supabase/migrations/20260422122247_...sql` | Inclui cache-hit (`:135-147`) e degradação explícita 503 se faltar `LOVABLE_API_KEY` (`:155-156`). |
| Ficha 360 — Score de Prontidão / Próximos passos | ✅ | `src/pages/Ficha360.tsx:39-44` | `src/hooks/useFicha360Domain.ts:2-5` → `src/domain/leadScoring.ts`, `src/domain/nextStepLogic.ts`, `src/domain/churnRisk.ts` | derivado de dados reais + pesos em `src/stores/useProntidaoWeightsStore.ts` | Lógica de domínio isolada, sem valores aleatórios. |
| Ficha 360 — filtros, favoritos e deeplink | ✅ | `src/pages/Ficha360.tsx:21-25,31-33` | `src/hooks/useFicha360Filters.ts`, `useFicha360FilterFavorites.ts:123` | URL + storage local | Fio completo. |
| Listagem de Empresas `/empresas` | ✅ | `src/pages/Empresas.tsx:1-275` → `src/pages/empresas/EmpresasContent.tsx` | `src/hooks/useCompanies.ts:1-440` | EXTERNO `companies` via proxy (`src/hooks/useCompanies.ts:6`) | Mesmo padrão de Contatos. |
| Empresas — criar / editar / excluir | ✅ | `src/pages/Empresas.tsx` (dialogs) | `src/hooks/useCompanies.ts:6` (`insertExternalData`, `updateExternalDataWithVersion`, `deleteExternalData`) | EXTERNO `companies` | Com guarda de edição concorrente (`ConcurrentEditError`). |
| Detalhe da Empresa `/empresas/:id` | ✅ | `src/pages/EmpresaDetalhe.tsx:1-327` | `src/hooks/useCompanyViews.ts:57`, `src/hooks/useCompanyRelatedData.ts:73` | views/tabelas EXTERNAS parametrizadas | Fio completo. |
| Empresa — telefones, emails, endereços, CNAEs, RFM, stakeholders | ✅ | `src/pages/EmpresaDetalhe.tsx:12` | `src/hooks/useCompanyRelatedData.ts:73` | `company_phones`, `company_emails`, `company_addresses`, `company_social_media`, `company_cnaes`, `company_rfm_scores`, `company_stakeholder_map` — **todas na allowlist** do proxy | 7 tabelas relacionadas, todas permitidas pelo contrato. |
| Analytics da Empresa `/empresas/:companyId/analytics` | 🟨 | `src/pages/CompanyProfileAnalytics.tsx:1-128` | `src/hooks/useCompanyProfileAnalytics.ts:102-175` (agregação real de canais/interesses) | **100% LOCAL**: `contacts` (`:107`), `interactions` (`:136`), `contact_analytical_profiles` (`:144`), `communication_preferences` (`:148`) | **Fio quebrado por inconsistência de origem:** busca contatos da empresa em `supabase.from('contacts')` local (`:107`), enquanto `/empresas` e `/contatos` leem do banco EXTERNO. Se o contato só existir no externo, `targetIds` fica vazio e a página retorna o resultado vazio construído em `:120-131`. Agregação em si é correta e sem dado fictício. |
| Interações `/interacoes` — listagem e filtros | ✅ | `src/pages/Interacoes.tsx:1-245` → `src/pages/interacoes/InteracoesContent.tsx` | `src/hooks/useInteractions.ts:27,90`, `src/hooks/useInteractionsAdvancedFilter.ts` | local `interactions` (`src/hooks/useInteractions.ts:27`); migration confirmada | Fio completo, persistência local comprovada. |
| Interações — criar / editar / excluir | ✅ | `src/pages/Interacoes.tsx:48` | `src/hooks/useInteractions.ts:190,250` | local `interactions` | CRUD completo. |
| Interações — análise DISC automática ao criar | ✅ | disparo implícito na criação | `src/hooks/useInteractions.ts:119` (`supabase.functions.invoke('disc-analyzer')`) | edge `supabase/functions/disc-analyzer/index.ts` existe | Edge function presente no repositório. |
| Inbox `/inbox` — fila priorizada | ✅ | `src/pages/Inbox.tsx:1-350` | `src/pages/Inbox.tsx:25-50` (tipos + score de prioridade), agrega tarefas e interações | tasks EXTERNO (`src/hooks/useTasks.ts:41,99`) + interactions local (`src/hooks/useInteractions.ts:27`) | Composição de duas origens é intencional e funcional; `priorityScore` calculado, não fixo. |
| Pipeline `/pipeline` — leitura do funil | ✅ | `src/pages/Pipeline.tsx:1-438` | `src/hooks/usePipeline.ts:73-179` | RPCs EXTERNAS `get_deals_pipeline`, `get_pipeline_summary`, `get_weighted_forecast`, `get_stage_velocity`, `get_stalled_deals`, `get_velocity_metrics` — **todas na allowlist** (`supabase/functions/external-data/index.ts`, bloco "Deals / Pipeline") | Leitura coerente e permitida. |
| Pipeline — mover deal (drag & drop) | 🟨 | `src/pages/Pipeline.tsx` (drag handler) | `src/hooks/usePipeline.ts:181-229` | **LOCAL** `supabase.rpc('move_deal_atomic')` (`src/hooks/usePipeline.ts:189`) | **Fio quebrado — escrita no banco errado e em colunas inexistentes.** (a) Lê deals do banco EXTERNO (`:80`) mas escreve via RPC no banco LOCAL (`:189`); IDs externos não existem localmente, e a função retorna `'Deal not found'` (`supabase/migrations/20260513165148_...sql:63-65`). (b) A RPC faz `UPDATE public.deals SET pipeline_stage=..., probabilidade=...` (`supabase/migrations/20260513165148_...sql:80-83`), mas **nenhuma** das duas definições locais de `deals` tem essas colunas: `supabase/migrations/20260317213221_...sql:3` usa `stage`/`probability`; `supabase/migrations/20260512184042_...sql:24` usa `stage_id`/`probability`. Não há `ALTER TABLE` adicionando-as. (c) Existe RPC externa `move_deal_to_stage` na allowlist, não utilizada. Há update otimista (`:202-213`) que mascara a falha até o `onSettled`. |
| Pipeline — criar deal | ✅ | `src/pages/Pipeline.tsx` | `src/hooks/usePipeline.ts:231-240` | RPC EXTERNA `create_deal` — presente na allowlist | Coerente com a leitura (mesmo banco), ao contrário do "mover". |
| Cadastro `/cadastro` — nova empresa | ✅ | `src/pages/Cadastro.tsx:28-38` → `src/pages/cadastro/EmpresaForm.tsx` | `src/pages/cadastro/EmpresaForm.tsx:50` | `insertExternalData` (`src/pages/cadastro/EmpresaForm.tsx:7`) → EXTERNO `companies` | Consistente com `/empresas`. |
| Cadastro — nova pessoa | ✅ | `src/pages/Cadastro.tsx:40-50` → `src/pages/cadastro/PessoaForm.tsx` | `src/pages/cadastro/PessoaForm.tsx:52` | `insertExternalData` → EXTERNO `contacts` | Consistente com `/contatos`. |
| Cadastro — vínculo entre entidades | 🟨 | `src/pages/Cadastro.tsx:52-64` → `src/pages/cadastro/VinculoForm.tsx:54-80` | `src/hooks/useEntityRelationships.ts:70,94,112` | **LOCAL** `entity_relationships` — migration em `supabase/migrations/20260712215719_...sql:29`, com RLS (`:59-75`) | Tabela existe e tem RLS. **Duas inconsistências:** (a) o seletor de entidades busca no banco EXTERNO (`src/pages/cadastro/EntityPicker.tsx:29` usa `queryExternalData`), mas o vínculo é gravado na tabela LOCAL — cria FK lógica entre bancos diferentes, sem integridade referencial; (b) `entity_relationships` **não existe** em `src/integrations/supabase/types.ts` (0 ocorrências), então o acesso é não tipado. |
| Histórico unificado `/historico` | ✅ | `src/pages/Historico.tsx:1-207` | `src/hooks/useUnifiedHistory.ts:96-160` (merge de 3 canais com filtros por canal/data/busca) | local `whatsapp_messages` (`:107`), `call_logs` (`:125`), `interactions` (`:146`) — as 3 têm migration | Fio completo e local. `call_logs` ausente de `types.ts`. |
| Perfis comportamentais `/perfis-comportamentais` | ✅ | `src/pages/PerfisComportamentais.tsx:1-221` | `src/hooks/useBehavioralProfilesList.ts:77` + `applyBehavioralFilters` | local `contact_analytical_profiles` — migration existe | Facetas e filtros derivados dos dados. Tabela ausente de `types.ts`. |
| Deduplicação `/deduplicacao` — detecção | 🟨 | `src/pages/Deduplicacao.tsx:84-232` | `src/hooks/useDedupEngine.ts:60-70` (fuzzy matching client-side) | **LOCAL** `contacts` (`:30`) e `companies` (`:46`), limite 2000 | **Fio quebrado:** varre apenas o banco LOCAL, enquanto contatos/empresas vivem no EXTERNO. Além disso o proxy já expõe RPCs dedicadas e não usadas: `get_duplicate_contacts`, `find_duplicate_companies`, `find_duplicate_emails` (allowlist, bloco "Data Quality"). Motor de similaridade em si é real. |
| Deduplicação — merge de registros | 🟨 | `src/pages/Deduplicacao.tsx:72-82,187-199` | `src/hooks/useMergeRecords.ts:26-69` | **LOCAL**: update primário (`:34`), repontuação de `contacts.company_id` (`:44`), delete secundário (`:52`), auditoria em `audit_log` (`:57`) | Merge é transacionalmente ingênuo (4 operações sem transação; falha no meio deixa estado parcial) e opera no banco LOCAL. As RPCs externas `merge_contacts`, `merge_duplicate_contacts`, `merge_companies` estão na allowlist e não são usadas. |
| Calendário `/calendario` | ✅ | `src/pages/Calendario.tsx:1-137` → `src/pages/calendario/CalendarioContent.tsx` | `src/pages/Calendario.tsx:35-45` (join client-side de follow-ups com contatos/empresas) | local `interactions` filtrado por `follow_up_required` (`:43`), `contacts` (`:44`), `companies` (`:45`) | Conclusão de follow-up implementada (`:68`). Fio completo. |
| Calendário — detalhe do follow-up | ✅ | `src/pages/calendario/FollowUpDetailDialog.tsx` | recebe item + callback de conclusão | local `interactions` (`src/pages/Calendario.tsx:68`) | Fio completo. |
| Tarefas `/tarefas` — listagem e categorização | ✅ | `src/pages/Tarefas.tsx:17-143` | `src/pages/Tarefas.tsx:38-45` | EXTERNO `tasks` via `queryExternalData` (`src/hooks/useTasks.ts:41,99`) e RPCs `get_all_tasks`/`get_overdue_tasks` (allowlist) | Tabela `tasks` está na allowlist do proxy. |
| Tarefas — criar / editar / excluir | ✅ | `src/pages/tarefas/CreateTaskDialog.tsx`, `TaskDetailDrawer.tsx` | `src/hooks/useTasks.ts:121-178` | RPC EXTERNA `create_task` (allowlist) + `updateExternalData`/`deleteExternalData` em `tasks` | Fio completo. |
| Tarefas — concluir | ✅ | `src/pages/Tarefas.tsx:29-36` | `src/hooks/useTasks.ts:180-217` (com update otimista e rollback) | RPC EXTERNA `complete_task` — presente na allowlist | Fio completo. |
| Tarefas — reabrir (Desfazer) | 🟨 | `src/pages/Tarefas.tsx:34` (`onUndo`) | `src/hooks/useTasks.ts:222-242` | RPC EXTERNA `reopen_task` | **Caminho primário morto:** `reopen_task` **não está** na allowlist de RPCs do proxy (0 ocorrências em `supabase/functions/external-data/index.ts`), logo a chamada em `src/hooks/useTasks.ts:226` sempre é rejeitada. A funcionalidade só sobrevive pelo fallback em `:228-232` (`updateExternalData` direto na tabela `tasks`). |
| Notificações `/notificacoes` — push PWA | ✅ | `src/pages/Notificacoes.tsx:25-191` | `src/hooks/useNotifications.ts:19` (permission, subscribe, unsubscribe, showNotification) | assinatura no browser + preferências em `profiles.preferences` (`src/pages/Notificacoes.tsx:69`) | Inclui prompt de instalação PWA (`:38-51`) e teste de notificação (`:53-59`). |
| Notificações — geração de alertas | 🟨 | `src/pages/Notificacoes.tsx:29` | `src/hooks/useNotifications.ts:182-334` | deriva de `interactions` (`:182`), `contacts` (`:201,247`), `stakeholder_alerts` (`:295`); dedupe em `localStorage` (`:313-334`) | **Tabela `notifications` existe (migration + `types.ts`) mas nunca é lida pelo app**: 0 ocorrências de `from('notifications')` em `src/`. Só a edge `social-events-detector` escreve nela (`supabase/functions/social-events-detector/index.ts:350`). O estado "já notificado" vive em `localStorage`, portanto não sincroniza entre dispositivos. |
| Notificações — Smart Reminders | ✅ | `src/components/smart-reminders/SmartRemindersPanel.tsx` via `src/pages/Notificacoes.tsx:15` | `src/hooks/useSmartReminders.ts:93` | edge `smart-reminders` lê `interactions`, `contacts`, `life_events`, `contact_next_actions`, `contact_automation_settings` (`supabase/functions/smart-reminders/index.ts:79-136`) | Fio UI→hook→edge→tabelas completo. Também consumido no dashboard (`src/components/dashboard/tabs/OverviewTab.tsx`). |
| Config. de notificações `/notificacoes/configuracoes` | ✅ | `src/pages/NotificacoesConfig.tsx:29-185` | `src/hooks/useNotificationPreferences.ts:42,66` | local `notification_preferences` com `upsert onConflict: user_id` (`:66`); migration existe | Canais, urgência e modo digest persistidos. Tabela ausente de `types.ts`. |
| Configurações → aba "Notificações" (4 toggles) | 🟨 | `src/pages/Configuracoes.tsx:103,157` → `src/pages/configuracoes/ConfigNotificationsTab.tsx:41-54` | `src/pages/configuracoes/ConfigNotificationsTab.tsx:49-51` | **NENHUMA** | **Camada de persistência ausente.** Os 4 switches (`emailNotifications`, `pushNotifications`, `weeklyDigest`, `interactionReminders`) só chamam `onChange` (`:50`), que atualiza `useState` em `src/pages/Configuracoes.tsx:46`. Não há `supabase`, nem `localStorage`, nem chamada de save no componente — as escolhas se perdem no reload. Agrava o problema o fato de existirem **três** stores paralelos de preferência de notificação: este (volátil), `profiles.preferences` (`src/pages/Notificacoes.tsx:69`) e `notification_preferences` (`src/hooks/useNotificationPreferences.ts:66`). |
| Network `/network` — grafo de relacionamentos | ✅ | `src/pages/Network.tsx:31-59` → `src/components/network/NetworkVisualization.tsx:27` | `src/hooks/useNetworkGraph.ts:73-75` (monta nós e arestas) | local `companies`, `contacts`, `interactions` (`:73-75`) | Renderização com `react-force-graph-2d` (`src/components/network/NetworkVisualization.tsx:2`), filtros e painel de nó selecionado. Mesma ressalva de origem local vs. externa das listagens. |
| Documentos `/documentos` — templates | ✅ | `src/pages/Documentos.tsx:33-454` | `src/hooks/useDocumentTemplates.ts:81-140` (CRUD + `extractMergeFields`/`renderMergeFields`) | local `document_templates` — migration + `types.ts:5148` | CRUD completo com merge fields detectados dinamicamente (`src/pages/Documentos.tsx:53`). |
| Documentos — envio para assinatura | 🟨 | `src/pages/Documentos.tsx:145-147,300-303` | `src/hooks/useDocumentTemplates.ts:176-217` | local `document_signatures` (`:190`) — migration + `types.ts:5031` | **Falta a camada de entrega.** O botão grava a linha e emite o toast "Documento enviado para assinatura" (`:214`), mas **nada é enviado**: não há invocação de edge de email nem uso de Resend em `src/hooks/useDocumentTemplates.ts`. A entrega é manual, via botão de copiar link (`src/pages/Documentos.tsx:145-147`). O consumo público existe e está íntegro (`src/pages/PublicSignaturePage.tsx:48,78` → edges `get-signature`/`submit-signature`). |
| ERP `/erp` — produtos, propostas e KPIs | 🟨 | `src/pages/ErpViewer.tsx:41,114,183-203` | `src/hooks/useErpData.ts:36-108` | **NENHUMA alcançável** | **Fio quebrado no gateway.** As 7 tabelas candidatas — `vw_produtos`, `produtos`, `vw_products`, `products`, `vw_propostas`, `propostas`, `vw_proposals` (`src/hooks/useErpData.ts:32-33`) — **não estão** na allowlist do proxy (0 ocorrências cada em `supabase/functions/external-data/index.ts`). Toda requisição cai em `Invalid table` (`supabase/functions/external-data/index.ts:385-387`). O `tryFetch` engole o erro e retorna `[]` (`src/hooks/useErpData.ts:45,50`), então a tela renderiza silenciosamente "Nenhum produto encontrado no ERP" (`src/pages/ErpViewer.tsx:74,143`) e KPIs zerados (`:200-203`) — sem estado de erro. UI e hook estão completos; falta apenas liberar as tabelas no proxy. |
| Relatório do contato `/relatorio/:id` | ✅ | `src/pages/RelatorioContato.tsx:1-768` + `src/pages/relatorio/ReportScriptsSection.tsx` | `src/pages/RelatorioContato.tsx:70-142` (local-first com fallback externo) | local `contacts`/`interactions`/`disc_analysis_history` (`:70-72`), fallback externo (`:79,85,91`), overrides em `contact_report_overrides` (`:114,187`), consentimento em `social_consent_audit` (`:121`) | Edição e persistência de insights customizados (`:187-192`). Fio completo. |
| Importação de WhatsApp `/whatsapp/importar` | ✅ | `src/pages/WhatsAppImport.tsx:1-220` | `src/hooks/useWhatsAppImport.ts:35-70` | edge `whatsapp-import` valida posse (`supabase/functions/whatsapp-import/index.ts:74,78`) e grava em `whatsapp_messages` (`:128-130`), `whatsapp_transcriptions` (`:177`), `whatsapp_ingestion_logs` (`:178`); upload de áudio no bucket `whatsapp-audio` com RLS por usuário (`supabase/migrations/20260712220209_...sql:16-26`) | Fio mais completo do escopo: UI → hook → edge → 3 tabelas + storage, com contagem de sucesso/falha por item (`:181`). |
| Onboarding `/onboarding` | ✅ | `src/pages/Onboarding.tsx:6-38` | `src/components/onboarding/OnboardingWizard.tsx` | local `profiles` (`src/components/onboarding/OnboardingWizard.tsx:115`) | Guarda de auth (`:10-14`) e redirect ao concluir (`:16-18`). |
| Configurações `/configuracoes` — perfil | ✅ | `src/pages/Configuracoes.tsx:110-152` | `src/pages/Configuracoes.tsx:52-84` | local `profiles` (`:58` leitura, `:75` escrita) + `auth.updateUser` (`:77`) | Com guarda de alterações não salvas (`:50`). |
| Configurações — demais abas (PNL, treinamento, aparência, campos, score) | ✅ | `src/pages/Configuracoes.tsx:98-107,153-161` | componentes dedicados montados em `:153-161` | variadas (`CustomFieldsManager`, `ProntidaoDefaultsSection`, `ThemeCustomizer`) | 10 abas registradas, todas com componente montado — nenhuma aba vazia. |
| Edge `send-push-notification` | ✅ | n/a (server-side) | `supabase/functions/send-push-notification/index.ts` (142 linhas) | — | Tem 3 chamadores server-side: `supabase/functions/check-health-alerts/index.ts:241`, `supabase/functions/template-success-notifications/index.ts:204`, `supabase/functions/check-notifications/index.ts:175`. Não é chamada pelo frontend (correto para push). |
| Edge `enrich-contacts` | ⬛ | — | `supabase/functions/enrich-contacts/index.ts` (183 linhas) | — | **Zero chamadores em todo o repositório.** Busca por `enrich-contacts` em `src/`, `supabase/functions/` (fora do próprio diretório), migrations, `config.toml` e workflows retorna 0 resultados. Nenhum `cron.schedule` a referencia. |
| Edge `check-notifications` | ⬛ | — | `supabase/functions/check-notifications/index.ts` (223 linhas) | — | **Zero chamadores.** A função *chama* `send-push-notification` (`:175`), mas nada a invoca: 0 referências fora do próprio diretório. Não aparece em nenhum dos 15 `cron.schedule` das migrations. |
| Edge `client-notifications` | ⬛ | — | `supabase/functions/client-notifications/index.ts` (267 linhas) | — | **Zero chamadores executáveis.** As únicas referências são **comentários** em `supabase/migrations/20260720000024_cron_notification_indexes.sql:1,3,9,19,26`, que descrevem a função como um cron ("queries these tables across ALL users") — mas o agendamento correspondente não existe em nenhuma migration. |
| Tabela local `deals` (esquema) | ⬛ | — | — | duas definições conflitantes | `CREATE TABLE public.deals` aparece duas vezes, sem `IF NOT EXISTS`, com colunas incompatíveis: `supabase/migrations/20260317213221_...sql:3` (`stage`, `value`, `probability`, `expected_close_date`) e `supabase/migrations/20260512184042_...sql:24` (`stage_id`, `value`, `probability`, `expected_closing_date`). Nenhuma das duas corresponde ao `types.ts` (`titulo`, `valor`, `pipeline_stage`, `probabilidade`). Nenhum caminho de leitura do Core CRM consome a tabela local com sucesso (Pipeline lê do externo; `useTeamDashboard` pede coluna `stage` que só existe na versão antiga). |
| Views/tabelas ERP no proxy | 🟦 | — | `src/hooks/useErpData.ts:32-33` declara os candidatos | ausente da allowlist | Intenção declarada em código, contrato de acesso nunca criado. É o esqueleto que sustenta a linha "ERP" acima. |
| Notificações persistidas (tabela `notifications`) | 🟦 | — | — | migration + `types.ts` existem | Objeto de banco criado, escrito por uma única edge (`supabase/functions/social-events-detector/index.ts:350`), mas **nenhuma tela do Core CRM o lê**. Estrutura pronta, consumo não implementado. |
| RPC `reopen_task` no proxy | 🟦 | — | `src/hooks/useTasks.ts:226` chama | ausente da allowlist | Chamada existe no cliente; permissão no gateway nunca foi adicionada. |

---

## Achados relevantes

### 1. Split-brain de persistência: o mesmo domínio em dois bancos

Não é um detalhe de implementação — é a causa-raiz de vários fios quebrados. Contatos, empresas, deals e tasks são lidos do **banco externo** pelas listagens, mas várias telas gravam/consultam o **banco local** para o mesmo domínio:

| Tela / hook | Origem | Evidência |
|---|---|---|
| `/contatos`, `/empresas` | EXTERNO | `src/hooks/useContacts.ts:7`, `src/hooks/useCompanies.ts:6` |
| `/deduplicacao` | LOCAL | `src/hooks/useDedupEngine.ts:30,46`; `src/hooks/useMergeRecords.ts:34,52` |
| `/empresas/:id/analytics` | LOCAL | `src/hooks/useCompanyProfileAnalytics.ts:107` |
| `/network` | LOCAL | `src/hooks/useNetworkGraph.ts:73-75` |
| `/calendario` | LOCAL | `src/pages/Calendario.tsx:43-45` |
| `/pipeline` (leitura) | EXTERNO | `src/hooks/usePipeline.ts:80` |
| `/pipeline` (mover) | LOCAL | `src/hooks/usePipeline.ts:189` |
| `/cadastro` (seleção) | EXTERNO | `src/pages/cadastro/EntityPicker.tsx:29` |
| `/cadastro` (vínculo) | LOCAL | `src/hooks/useEntityRelationships.ts:94` |

`src/hooks/useContactDetail.ts:46-63` é a única implementação que trata a duplicidade explicitamente (local-first com fallback externo) — as demais assumem uma origem só.

### 2. Pipeline: mover deal escreve em colunas que não existem

O achado mais concreto. `src/hooks/usePipeline.ts:189` chama `move_deal_atomic` no banco **local**, e essa função faz:

```
UPDATE public.deals SET pipeline_stage = p_new_stage, probabilidade = COALESCE(...)
```
(`supabase/migrations/20260513165148_b8ac0976-420c-47e8-8d8e-bd658c612250.sql:80-83`)

Nenhuma das duas definições locais de `deals` declara `pipeline_stage` ou `probabilidade` (`supabase/migrations/20260317213221_...sql:3`; `supabase/migrations/20260512184042_...sql:24`), e não há `ALTER TABLE ... ADD COLUMN` para elas em nenhuma das 390 migrations. Somado ao fato de os IDs virem do banco externo, o caminho de escrita não tem como concluir. O update otimista (`src/hooks/usePipeline.ts:202-213`) faz a UI parecer bem-sucedida até a invalidação.

### 3. `deals` tem duas migrations `CREATE TABLE` conflitantes, sem `IF NOT EXISTS`

`supabase/migrations/20260317213221_...sql:3` e `supabase/migrations/20260512184042_...sql:24` criam a mesma tabela com colunas divergentes (`stage` vs `stage_id`, `expected_close_date` vs `expected_closing_date`). O comentário em `src/hooks/useTeamDashboard.ts:53` ("planned table not yet in the generated types") indica que a divergência é conhecida e não resolvida.

### 4. ERP: nenhuma das tabelas consultadas está liberada no proxy

`src/hooks/useErpData.ts:32-33` lista 7 nomes candidatos; nenhum consta da allowlist de `supabase/functions/external-data/index.ts`. O gateway responde `Invalid table` (`:385-387`) e o `tryFetch` transforma o erro em lista vazia (`src/hooks/useErpData.ts:45,50`), então **a falha é invisível**: a tela mostra "Nenhum produto encontrado no ERP" (`src/pages/ErpViewer.tsx:74`) em vez de um erro. `isError` nunca fica verdadeiro porque `tryFetch` nunca relança.

### 5. `types.ts` está dessincronizado das migrations e usa um tipo não declarado

- **Tabelas com migration mas ausentes de `src/integrations/supabase/types.ts`:** `entity_relationships`, `notification_preferences`, `contact_analytical_profiles`, `call_logs`, `whatsapp_transcriptions`, `whatsapp_ingestion_logs`, `pipeline_stage_transitions`. Todas são usadas em código de produção do escopo (ex.: `src/hooks/useEntityRelationships.ts:70`, `src/hooks/useNotificationPreferences.ts:42`, `src/hooks/useUnifiedHistory.ts:125`).
- **`deals` em `types.ts` descreve o schema externo** (`titulo`, `valor`, `pipeline_stage`, `probabilidade`), não o local — indício de que o arquivo foi gerado a partir do projeto externo.
- **`src/integrations/supabase/types.ts` usa `integer` como tipo TypeScript em 1760 anotações**, e não há declaração de `integer` em lugar nenhum do repositório (o único `.d.ts` é `src/vite-env.d.ts`, que não a define). Registro isto como fato observado no código; **não afirmo** o efeito em build, pois não executei o compilador.

### 6. Três stores paralelos e concorrentes de preferência de notificação

| Store | Onde grava | Evidência |
|---|---|---|
| Estado React volátil (não persiste) | — | `src/pages/Configuracoes.tsx:46` + `src/pages/configuracoes/ConfigNotificationsTab.tsx:49-51` |
| `profiles.preferences` | banco local | `src/pages/Notificacoes.tsx:69` |
| `notification_preferences` | banco local | `src/hooks/useNotificationPreferences.ts:66` |

Os quatro toggles de `/configuracoes` → aba Notificações **não têm camada de persistência alguma**.

### 7. Quatro edge functions sem nenhum caminho de execução

`enrich-contacts`, `check-notifications` e `client-notifications` não têm um único chamador no repositório (verificado em `src/`, `supabase/functions/`, migrations, `config.toml` e `.github/`). Os 15 `cron.schedule` existentes agendam apenas: `validation-queue-drain`, `revalidate-stale-emails`, `revalidate-stale-phones`, `check-contact-health-daily`, `smart-notify-automation`, `ai-gateway-alerts-eval`, `apply-data-retention-daily`, `capture-degraded-rpc-plans` e outros — nenhum deles. Referências a `client-notifications` existem apenas em **comentários** de `supabase/migrations/20260720000024_cron_notification_indexes.sql:1-26`, que criam índices para uma rotina que não é agendada em lugar nenhum do repositório.

### 8. Auditoria de leitura grava uma linha em `activities` a cada consulta

`src/lib/externalData.ts:112-118` insere um registro em `activities` **em toda** `queryExternalData` que retorne dados. Como as listagens de contatos/empresas usam infinite scroll, cada página rolada gera uma escrita adicional, com `query_options` inteiro serializado em `metadata` (`:117`).

### 9. Credencial embutida em migration e project ref divergente

`supabase/migrations/20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql:19` contém um JWT anon hardcoded no header do `cron.schedule`, apontando para o projeto `rqodmqosrotmtrjnnjul`. O `supabase/config.toml:1` declara `project_id = "hjhthvzwtvwgdrochcam"`, e a migration `20260512105729_...sql:10` aponta para esse segundo ref. Dois projects refs distintos coexistem nos agendamentos.

### 10. Dados fictícios (`Math.random`) em hooks de inteligência

Fora do escopo estrito de rotas, mas alcançáveis a partir de `/contatos/:id`:

| Hook | Linha | Valor fabricado |
|---|---|---|
| `src/hooks/useDealVelocity.ts` | `:67` | `averageDays: Math.round(Math.random() * 15) + 3` |
| `src/hooks/useCognitiveBiases.ts` | `:80` | `confidence: 60 + Math.random() * 30` |
| `src/hooks/useHiddenObjections.ts` | `:30` | `probability: 60 + Math.random() * 30` |
| `src/hooks/useEmotionalIntelligence.ts` | `:53,73` | `strength: 7 + Math.random() * 3` / `3 + Math.random() * 4` |

`useDealVelocity` chega ao escopo via `src/components/contact-detail/commercial-tab/DealVelocityCard.tsx`, montado na aba Comercial de `/contatos/:id` (`src/pages/ContatoDetalhe.tsx:32`). Os demais alimentam `src/components/analytics/ApproachRecommendationPanel.tsx`, `CognitiveBiasesPanel.tsx` e `EmotionalIntelligencePanel.tsx`. Os demais usos de `Math.random` no repositório são legítimos (geração de ID, animações de confete, partículas, skeletons).

### 11. Nove páginas do escopo renderizam sem `AppLayout`

`Cadastro`, `Historico`, `PerfisComportamentais`, `Deduplicacao`, `Tarefas`, `NotificacoesConfig`, `ErpViewer`, `RelatorioContato`, `WhatsAppImport` não montam `AppLayout` (0 ocorrências em cada arquivo), enquanto as outras 16 páginas do escopo montam. Para `RelatorioContato` (`/relatorio/:id`) isso pode ser intencional (layout de impressão — há `Printer` importado em telas afins); para `Tarefas`, `Historico` e `Deduplicacao`, que são navegação primária, o usuário perde a navegação lateral.

### 12. Merge de duplicatas sem transação

`src/hooks/useMergeRecords.ts:32-66` executa quatro operações sequenciais (update do primário → repontuação de `contacts.company_id` → delete do secundário → escrita em `audit_log`) sem transação nem RPC atômica. Falha após o passo 2 deixa registros repontuados para um primário não atualizado, com o secundário ainda vivo.

---

## Contradições com a documentação existente

| Doc | Afirmação | Contradição (arquivo:linha) |
|---|---|---|
| `HANDOFF.md:173` | Lista `deals` como tabela do **"Banco de Dados Local (Principais Tabelas)"** | O Pipeline lê deals do banco **externo** via RPC (`src/hooks/usePipeline.ts:80`) e cria via RPC externa (`:235`). A tabela local homônima tem duas definições conflitantes (`supabase/migrations/20260317213221_...sql:3` e `supabase/migrations/20260512184042_...sql:24`) e nenhum caminho de leitura bem-sucedido no Core CRM. |
| `HANDOFF.md` (mesma tabela) | Lista `tasks` como tabela **local** | `src/hooks/useTasks.ts:41,99` lê `tasks` pelo proxy externo, e `:125` cria via RPC externa `create_task`. Nenhum acesso local a `tasks` no escopo. |
| `HANDOFF.md:42` | "**Pipeline** — Kanban de oportunidades com estágios customizáveis" | O movimento entre estágios grava em colunas inexistentes no schema local (`supabase/migrations/20260513165148_...sql:80-83` vs. `supabase/migrations/20260512184042_...sql:24`). Ver achado 2. |
| `ARCHITECTURE.md` §"Fluxo de Dados / 1. Dados Locais" | Apresenta local e externo como dois fluxos **separados e limpos** | O mesmo domínio é servido pelos dois fluxos simultaneamente e de forma inconsistente por tela (achado 1). `src/hooks/useContactDetail.ts:46-63` precisa fazer local-first-com-fallback justamente porque a separação não se sustenta. |
| `README.md:127` | "**RLS** ativo em 100% das tabelas com políticas escopadas por `user_id`" | Não verificável integralmente por leitura estática, e há contraexemplo de escopo: `entity_relationships` usa políticas escopadas por `created_by`, não `user_id` (`supabase/migrations/20260712215719_...sql:69,75`). Marco a afirmação como `NAO_VERIFICADO` no restante. |
| `README.md:18` | "Empresas & Contatos — **Cadastro completo** com (...) preferências e cadência de contato" | O cadastro funciona (`src/pages/cadastro/EmpresaForm.tsx:50`, `PessoaForm.tsx:52`), mas o vínculo entre entidades grava numa tabela local (`src/hooks/useEntityRelationships.ts:94`) referenciando IDs escolhidos no banco externo (`src/pages/cadastro/EntityPicker.tsx:29`) — sem integridade referencial possível. |
| `AUDITORIA_COMPLETA_SISTEMA.md:12` | "322 tabelas", "262 migrações" | O repositório contém **390** arquivos em `supabase/migrations/`. A contagem de tabelas não é verificável estaticamente (parte vive no banco externo, ausente do repositório). Números do doc não conferem com o estado do repo. |
| `AUDITORIA_COMPLETA_SISTEMA.md:112` | Aponta `strict: false` / `noImplicitAny: false` como achado | **Confirmado** — `tsconfig.app.json:17,19,20,28` tem `strict: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `skipLibCheck: true`. Esta é a rara afirmação da documentação que o código sustenta. |

---

## Arquivos que inspecionei

**Roteamento e app shell (2)**
- `src/app/AppRoutes.tsx`
- `src/app/lazyPages.tsx`

**Páginas do escopo (30)**
- `src/pages/Index.tsx`
- `src/pages/Contatos.tsx`
- `src/pages/contatos/ContatosContent.tsx`
- `src/pages/ContatoDetalhe.tsx`
- `src/pages/Ficha360.tsx`
- `src/pages/Empresas.tsx`
- `src/pages/EmpresaDetalhe.tsx`
- `src/pages/CompanyProfileAnalytics.tsx`
- `src/pages/Interacoes.tsx`
- `src/pages/interacoes/InteracoesContent.tsx`
- `src/pages/Inbox.tsx`
- `src/pages/Pipeline.tsx`
- `src/pages/Cadastro.tsx`
- `src/pages/cadastro/EmpresaForm.tsx`
- `src/pages/cadastro/PessoaForm.tsx`
- `src/pages/cadastro/VinculoForm.tsx`
- `src/pages/cadastro/EntityPicker.tsx`
- `src/pages/Historico.tsx`
- `src/pages/PerfisComportamentais.tsx`
- `src/pages/Deduplicacao.tsx`
- `src/pages/Calendario.tsx`
- `src/pages/Tarefas.tsx`
- `src/pages/Notificacoes.tsx`
- `src/pages/notificacoes/NotificationSettingsSection.tsx`
- `src/pages/NotificacoesConfig.tsx`
- `src/pages/Network.tsx`
- `src/pages/Documentos.tsx`
- `src/pages/ErpViewer.tsx`
- `src/pages/RelatorioContato.tsx`
- `src/pages/WhatsAppImport.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/configuracoes/ConfigNotificationsTab.tsx`

**Hooks (32)**
- `src/hooks/useContacts.ts`
- `src/hooks/useCompanies.ts`
- `src/hooks/useInteractions.ts`
- `src/hooks/useContactDetail.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useTeamDashboard.ts`
- `src/hooks/useFicha360.ts`
- `src/hooks/useFicha360Domain.ts`
- `src/hooks/useFicha360NLP.ts`
- `src/hooks/useFicha360ConversationSummary.ts`
- `src/hooks/useFicha360FilterFavorites.ts`
- `src/hooks/useContactView360.ts`
- `src/hooks/useContactIntelligence.ts`
- `src/hooks/useExternalInteractions.ts`
- `src/hooks/useRapportIntelView.ts`
- `src/hooks/useRapportPoints.ts`
- `src/hooks/useCompanyViews.ts`
- `src/hooks/useCompanyRelatedData.ts`
- `src/hooks/useCompanyProfileAnalytics.ts`
- `src/hooks/usePipeline.ts`
- `src/hooks/useTasks.ts`
- `src/hooks/useUnifiedHistory.ts`
- `src/hooks/useBehavioralProfilesList.ts`
- `src/hooks/useDedupEngine.ts`
- `src/hooks/useMergeRecords.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useNotificationPreferences.ts`
- `src/hooks/useNetworkGraph.ts`
- `src/hooks/useEntityRelationships.ts`
- `src/hooks/useDocumentTemplates.ts`
- `src/hooks/useErpData.ts`
- `src/hooks/useWhatsAppImport.ts`
- `src/hooks/useSmartReminders.ts`
- `src/hooks/useDealVelocity.ts`
- `src/hooks/useCognitiveBiases.ts`
- `src/hooks/useHiddenObjections.ts`
- `src/hooks/useEmotionalIntelligence.ts`

**Componentes (5)**
- `src/components/team/TeamDashboardPanel.tsx`
- `src/components/crm/CRMAutomationAuditLog.tsx`
- `src/components/network/NetworkVisualization.tsx`
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/pages/relatorio/ReportScriptsSection.tsx` (listado)

**Infraestrutura de dados (2)**
- `src/lib/externalData.ts`
- `src/integrations/supabase/types.ts`

**Edge Functions (7)**
- `supabase/functions/external-data/index.ts`
- `supabase/functions/whatsapp-import/index.ts`
- `supabase/functions/ficha360-conversation-summary/index.ts`
- `supabase/functions/smart-reminders/index.ts`
- `supabase/functions/enrich-contacts/index.ts` (inventário/chamadores)
- `supabase/functions/check-notifications/index.ts`
- `supabase/functions/client-notifications/index.ts`
- `supabase/functions/send-push-notification/index.ts`

**Migrations e config (9)**
- `supabase/migrations/20260317213221_22e14932-8ba7-4c40-9374-6d7c077b4387.sql`
- `supabase/migrations/20260512184042_fccf5358-81d7-4eae-9083-d92055f150d1.sql`
- `supabase/migrations/20260513165148_b8ac0976-420c-47e8-8d8e-bd658c612250.sql`
- `supabase/migrations/20260712215719_930fd99a-437f-423c-a6ce-9a3c5c065106.sql`
- `supabase/migrations/20260712220209_27f08993-18a2-42f4-b69c-104c5d38b10c.sql`
- `supabase/migrations/20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql`
- `supabase/migrations/20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql`
- `supabase/migrations/20260720000024_cron_notification_indexes.sql`
- `supabase/config.toml`
- `tsconfig.app.json`

**Documentação avaliada como hipótese (5)**
- `README.md`
- `HANDOFF.md`
- `ARCHITECTURE.md`
- `AUDITORIA_COMPLETA_SISTEMA.md`
- `FUNCIONALIDADES_SISTEMA.md`

Além disso, varreduras agregadas (não leitura integral) sobre: os 390 arquivos de `supabase/migrations/` (grep de `CREATE TABLE`, `CREATE FUNCTION`, `cron.schedule`, `functions/v1/`), todo `src/` (grep de `Math.random(`, `TODO/FIXME`, `mock/fake/dummy`, `from('...')`, `.rpc(`, `functions.invoke(`) e todo `supabase/functions/` (grep de chamadores cruzados).

---

## Lacunas: o que NÃO consegui verificar e por quê

1. **Todo o schema do banco EXTERNO.** Não existe neste repositório. Para contatos, empresas, deals, tasks e ~50 views `vw_*`, só pude provar que o código as **declara** e que o proxy as **permite**. Se a tabela/RPC/view existe, tem as colunas esperadas ou retorna dados: `NAO_VERIFICADO`.
2. **Se as RPCs externas da allowlist existem de fato.** Amostrei 8 (`get_complete_dashboard`, `list_contacts_paginated`, `get_deals_pipeline`, `get_all_tasks`, `get_contact_360_by_phone`, `get_duplicate_contacts`, `search_contacts`, `merge_contacts`) contra as migrations locais: apenas `search_contacts` e `merge_contacts` têm definição local, e nenhuma consta de `types.ts`. Isso é consistente com viverem no banco externo — mas é inferência, não prova. `NAO_VERIFICADO`.
3. **Qualquer afirmação sobre conteúdo/volume de dados.** Sem runtime, não afirmo que qualquer tabela tem ou não tem registros.
4. **Se o projeto compila, se os tipos passam, se os testes passam.** `node_modules` vazio; não executei `tsc`, `vite`, `vitest`, `eslint` nem `playwright`. O achado sobre `integer` em `types.ts` é uma observação textual do arquivo, não um resultado de compilação.
5. **Qual migration efetivamente venceu para `deals`.** Duas `CREATE TABLE` sem `IF NOT EXISTS` — o estado final depende da ordem de aplicação e de erros ignorados no histórico real do banco, que não tenho como inspecionar.
6. **Se existem crons configurados fora do repositório** (painel Supabase, agendador externo) que invoquem `enrich-contacts`, `check-notifications` ou `client-notifications`. Classifiquei como ⬛ com base na ausência de qualquer chamador **no repositório**, que é o critério declarado; um agendamento externo mudaria a classificação.
7. **Comportamento de RLS em runtime.** Li as políticas em migrations, mas não posso confirmar quais estão ativas no banco, nem validar a afirmação de "100% das tabelas" do `README.md:127`.
8. **Efeito real do `move_deal_atomic` sobre o banco externo.** Concluí que o caminho está quebrado por análise de schema e de origem dos IDs; a confirmação exigiria executar um movimento de card.
9. **Componentes de terceiro nível.** Auditei páginas, hooks e os componentes de dados diretamente acoplados. Componentes puramente de apresentação abaixo disso (cards, badges, gráficos) não foram abertos um a um — apenas varridos por grep de dado fictício e de acesso a dados.
10. **Variáveis de ambiente e secrets.** `.env.example` lista as chaves esperadas, mas os valores efetivos (`EXTERNAL_SUPABASE_URL`, `LOVABLE_API_KEY`) são de runtime. Funcionalidades que dependem delas — proxy externo, resumo IA da Ficha 360 — têm sua disponibilidade real `NAO_VERIFICADO`.
