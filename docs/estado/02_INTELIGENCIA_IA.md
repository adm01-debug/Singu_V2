# Estado — Inteligência, IA e Voz

> **Auditoria por medição direta do código.** Cada linha abaixo cita `arquivo:linha` que foi
> efetivamente aberto e lido nesta sessão. Documentação existente (README, HANDOFF, docs/RUNBOOK,
> `.lovable/`) foi tratada como **hipótese**, nunca como prova.
>
> **Limites desta auditoria (invioláveis):**
> - **Runtime = `NAO_VERIFICADO`.** Não houve acesso ao banco. Nenhuma afirmação sobre volume de
>   linhas, existência real de objetos no servidor, secrets efetivamente configurados no projeto
>   Supabase (`hjhthvzwtvwgdrochcam`, `supabase/config.toml:1`) ou jobs `pg_cron` realmente ativos.
>   Quando digo "tabela existe", significa **"existe migration no repositório que a cria"**.
> - **`node_modules` vazio.** Não foi executado build, lint, typecheck ou teste. **Nada aqui afirma
>   que o projeto compila ou que testes passam.**
> - Escopo: rotas `/insights`, `/intelligence`, `/intelligence/auditoria`,
>   `/intelligence/relacionamento/auditoria`, `/nlp-analytics`, `/assistente`,
>   `/conversation-intelligence(+/setup)`, `/perfis-comportamentais` (parte comportamental),
>   `/knowledge-base`, `/crm/copywriting`, `/suporte`; 40 Edge Functions de IA/voz;
>   hooks/componentes de IA, DISC, inteligência emocional e vieses cognitivos; `src/domain/`.

---

## Resumo

| Classificação | Contagem |
|---|---|
| ✅ IMPLEMENTADO_TOTAL | **21 de 46** |
| 🟨 IMPLEMENTADO_PARCIAL | **14 de 46** |
| 🟦 SUGERIDO_OU_INICIADO | **5 de 46** |
| ⬛ MORTO_OU_ABANDONADO | **6 de 46** |

Recorte só das **40 Edge Functions do escopo** (inventário na seção própria):

| Classificação | Contagem |
|---|---|
| ✅ IMPLEMENTADO_TOTAL | **24 de 40** |
| 🟨 IMPLEMENTADO_PARCIAL | **9 de 40** |
| 🟦 SUGERIDO_OU_INICIADO | **3 de 40** |
| ⬛ MORTO_OU_ABANDONADO | **4 de 40** |

**Leitura executiva.** O núcleo de IA do SINGU é real e homogêneo: 100% das chamadas de LLM saem
pelo **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) com o secret
`LOVABLE_API_KEY`, e 28 de 29 funções que chamam LLM passam pelo wrapper `fetchAI()`
(`supabase/functions/_shared/fetch-utils.ts:42`), que instrumenta telemetria em
`ai_gateway_metrics`. Voz usa **ElevenLabs** (`ELEVENLABS_API_KEY`) para STT-realtime e TTS, e o
Gateway (Gemini) para NLU e transcrição assíncrona. Os problemas concentram-se em três bolsões:
(1) **dado fictício em telas comportamentais/PNL** — `Math.random()`, hash do `contact.id` e scores
literais servidos como métrica; (2) **quatro Edge Functions sem qualquer chamador** (fila
comportamental automática e digest de coaching); (3) **quebras de fio** — o painel `/insights` gera
insights por IA e **não persiste nada**, enquanto a tabela `insights` é lida por 4 hooks que nunca
recebem escrita, e `/intelligence/auditoria` lê uma tabela que nenhuma migration cria.

---

## Tabela de evidências

Legenda de colunas: **UI** = ponto de entrada visual; **Edge Function** = função invocada;
**Persistência** = objeto de banco criado por migration no repo; **Provider/secret** = provedor de
IA e variável lida via `Deno.env.get`.

| # | Funcionalidade | Classificação | UI | Edge Function | Persistência | Provider/secret | Evidência / o que falta |
|---|---|---|---|---|---|---|---|
| 1 | Assistente IA conversacional (`/assistente`) | ✅ IMPLEMENTADO_TOTAL | `src/pages/Assistente.tsx:23` → `src/hooks/useAiAssistant.ts:143` | `ai-assistant` | `ai_chat_threads`, `ai_chat_messages` — `supabase/migrations/20260416183013_d2d67858-eca4-40cf-b4ef-ed32abbfb00a.sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (`supabase/functions/ai-assistant/index.ts`, model `google/gemini-2.5-flash` linha 151) | Fio completo: UI → hook → `fetch .../functions/v1/ai-assistant` → insert em `ai_chat_messages` (`ai-assistant/index.ts:96,178`) e update de thread (linha 194). Contexto de contato/empresa carregado nas linhas 108-115. |
| 2 | Ask-CRM / NL→SQL (aba "Ask" do Intelligence Hub) | ✅ IMPLEMENTADO_TOTAL | `src/components/intelligence/AskTab.tsx:45` → `src/hooks/useAskCrm.ts:48` | `ask-crm` | RPC `execute_readonly_query` — `supabase/migrations/20260416010445_9a3f6954-e1af-452c-88a4-c32d997a2865.sql:2` (GRANT restrito em `20260509113217_...sql:2-4`) | Lovable AI Gateway · `LOVABLE_API_KEY` (`ask-crm/index.ts:83`, `google/gemini-2.5-flash`) | Fio completo com guarda de segurança real: exige predicado `user_id = '<uid>'` no SQL gerado (`ask-crm/index.ts:152-161`) e valida role admin para queries de integração (linhas 166-172); execução via `supabase.rpc("execute_readonly_query")` (linha 180). |
| 3 | Conversation Intelligence — análise de conversa | ✅ IMPLEMENTADO_TOTAL | `src/pages/ConversationIntelligence.tsx:17` + `src/components/contact-detail/ContactInteractionsTab.tsx:120` → `src/hooks/useConversationIntel.ts:100` | `conversation-analyzer` | `conversation_analyses`, `conversation_topics_catalog` — `supabase/migrations/20260417000551_4e28ff77-21ba-433e-8628-55418356e7b7.sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (`conversation-analyzer/index.ts:90`, `google/gemini-3-flash-preview`) | Fio completo e rico: lê `interactions` (linha 40), consulta catálogo de tópicos (linha 60), grava análise (linha 255), atualiza `interactions` (linha 344) e alimenta `reframing_analysis` (linha 352) e `suggested_life_events` (linha 355). |
| 4 | Conversation Intelligence — Setup (tópicos/scorecards) | ✅ IMPLEMENTADO_TOTAL | `src/pages/ConversationIntelligenceSetup.tsx:5-6` → `TopicsEditor` / `ScorecardEditor` | — (CRUD direto) | `conversation_topics_catalog` — `20260417000551_...sql` | n/a (sem IA) | Rota `/conversation-intelligence/setup` registrada em `src/app/AppRoutes.tsx:122`; editores em `src/components/conversation-intel/TopicsEditor.tsx` e `ScorecardEditor.tsx`; alimentam o catálogo consumido por `conversation-analyzer/index.ts:60`. |
| 5 | Análise DISC automática | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDISCAutoAnalysis.ts:37,86`; `src/hooks/useInteractions.ts:119`; `src/components/contact-detail/ContactInteractionsTab.tsx:123` | `disc-analyzer` (4 chamadores distintos) | `disc_analysis_history`, `disc_communication_logs` — `supabase/migrations/20260124184935_7462f0ba-52a4-4ded-a9a4-316446a8223f.sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (`disc-analyzer/index.ts:159`, `google/gemini-3-flash-preview`) | Fio completo: insere histórico (linha 228), atualiza `contacts` (linha 252) e registra log de comunicação (linha 283). É a Edge Function mais chamada do escopo. |
| 6 | Perfil comportamental analítico (geração) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useBehavioralProfile.ts:66`; `src/pages/admin/InsightFeedbackAnalytics.tsx:205` | `generate-behavioral-profile` | `contact_analytical_profiles` (`20260512132827_...sql`), `contact_analytical_profile_versions` (`20260712221944_...sql`) | Lovable AI Gateway · `LOVABLE_API_KEY` (`generate-behavioral-profile/index.ts`) | Agrega `whatsapp_messages` (linha 99), `call_logs` (104), `interactions` (109) e feedback (144); grava perfil (237) e versão (245). |
| 7 | Listagem `/perfis-comportamentais` | ✅ IMPLEMENTADO_TOTAL | `src/pages/PerfisComportamentais.tsx:112` → `src/hooks/useBehavioralProfilesList.ts:77` | — (leitura direta) | `contact_analytical_profiles` — `20260512132827_...sql` | n/a | Rota em `src/app/AppRoutes.tsx:80`; filtros/facetas calculados em memória (`useBehavioralProfilesList.ts:145-146`) sobre dados reais da tabela. |
| 8 | Auditoria da fila de reanálise comportamental | ✅ IMPLEMENTADO_TOTAL | `src/pages/admin/BehavioralRegenAudit.tsx:123,150,239` (rota `/admin/behavioral-regen-audit`, `src/app/AppRoutes.tsx:178`) | `retry-behavioral-profile` | `behavioral_profile_regen_queue` — `supabase/migrations/20260712221610_4c6bd7d1-8599-4798-a055-a56e9e3f0f5c.sql:2`; RPC `cleanup_behavioral_regen_queue` | via `generate-behavioral-profile` (Gateway) | Listagem paginada, retry individual (linha 150), batch retry (linha 239) e housekeeping por RPC (linha 185). `retry-behavioral-profile/index.ts` valida `has_role` e trata cooldown. |
| 9 | Analytics de feedback de insight comportamental | ✅ IMPLEMENTADO_TOTAL | `src/pages/admin/InsightFeedbackAnalytics.tsx:46,192,205` (rota `/admin/insight-feedback`, `AppRoutes.tsx:177`) | `generate-behavioral-profile` | `behavioral_insight_feedback` (`20260712222427_...sql`), `behavioral_profile_regen_queue` | Lovable AI Gateway · `LOVABLE_API_KEY` | Lê feedback (46), enfileira/atualiza fila (192, 211, 219) e dispara regeneração (205). |
| 10 | Next Best Action (IA) | ✅ IMPLEMENTADO_TOTAL | `src/components/crm/NextBestAction.tsx` (montado em `src/pages/ContatoDetalhe.tsx:44`) → `src/hooks/useNextBestAction.ts:57` | `next-best-action` | `contact_next_actions` — `supabase/migrations/20260417172946_13ae67cd-3e29-4bcb-9b52-c045f69cad82.sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (`next-best-action/index.ts`) | Fio completo com escrita: `upsert` em `contact_next_actions` (`next-best-action/index.ts:142`); UI lê a mesma tabela (`useNextBestAction.ts:38`), edita script (linha 74) e marca conclusão. Lê ainda `contact_analytical_profiles` e `neuro_behavioral_history`. |
| 11 | Sugestão de próxima ação (roadmap preditivo) | ✅ IMPLEMENTADO_TOTAL | `src/components/contact-detail/AIActionsPanel.tsx:53` → `src/hooks/useEdgeFunctionActions.ts:35` | `suggest-next-action` | `contact_predictive_roadmap` — `20260512121618_b41875e6-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` | `AIActionsPanel` é montado por `src/components/contact-detail/ContactIntelligenceTab.tsx:208`. Grava roadmap na tabela. |
| 12 | Contorno de objeções (IA) | ✅ IMPLEMENTADO_TOTAL | `src/components/nlp/copywriting/CopywritingObjectionTab.tsx:43` e `src/components/crm/NextBestAction.tsx:113` | `objection-handler` | `contact_objection_scripts` (`20260512121726_...sql`), `crm_objection_intelligence` (`20260512122055_...sql`) | Lovable AI Gateway · `LOVABLE_API_KEY` | Dois chamadores independentes; persiste script gerado e inteligência agregada de objeção. |
| 13 | Resumo de contexto de objeção | ✅ IMPLEMENTADO_TOTAL | `src/components/interactions/insights/ObjectionsSpotlight.tsx:160` → `src/hooks/useObjectionContextSummary.ts:57` | `objection-context-summary` | Somente leitura de `interactions` (`objection-context-summary/index.ts`) — resumo é efêmero por design (cache React Query, `useObjectionContextSummary.ts:46`) | Lovable AI Gateway · `LOVABLE_API_KEY` | Fio completo para um resumo sob demanda; ausência de tabela é intencional (query key inclui ids + flag `useful`). |
| 14 | Resumo de reunião | ✅ IMPLEMENTADO_TOTAL | `src/components/contact-detail/ContactInteractionsTab.tsx:26` (`MeetingSummaryCard`) → `src/hooks/useMeetingSummary.ts:51` | `meeting-summary` | `meeting_summaries` — `supabase/migrations/20260416013658_9e847ea5-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` | Lê `interactions` e grava `meeting_summaries`; UI invalida cache (`useMeetingSummary.ts:59`). |
| 15 | Resumo de thread de e-mail | ✅ IMPLEMENTADO_TOTAL | `src/components/ai/EmailThreadSummaryCard.tsx` → `src/hooks/useEmailThreadSummary.ts:66` | `email-thread-summary` | `email_thread_summaries` — `20260417162926_50432a8a-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` | Persistência confirmada em `email-thread-summary/index.ts`; card referenciado 2× fora do próprio arquivo. |
| 16 | Refino de e-mail por IA | ✅ IMPLEMENTADO_TOTAL | `src/components/ai/AIEmailComposer.tsx` → `src/hooks/useEmailRefine.ts:20` | `ai-email-refine` | Sem persistência (transformação de texto sob demanda) | Lovable AI Gateway · `LOVABLE_API_KEY` (`ai-email-refine/index.ts`, único env lido) | Fio UI→EF→resposta; `AIEmailComposerTrigger` referenciado 4× no app. Ausência de tabela é coerente com a natureza da função. |
| 17 | AI Writing Assistant (scripts adaptados a DISC) | ✅ IMPLEMENTADO_TOTAL | `src/components/nlp/copywriting/CopywritingAiGeneratorTab.tsx:46` e `src/hooks/useAIWritingAssistant.ts:72` | `ai-writing-assistant` | Sem persistência (geração sob demanda) | Lovable AI Gateway · `LOVABLE_API_KEY` (único env em `ai-writing-assistant/index.ts`) | Dois chamadores; payload inclui perfil DISC, canal preferido e nível de formalidade (`CopywritingAiGeneratorTab.tsx:49-58`). |
| 18 | Sugestão de mapeamento de webhook por IA | ✅ IMPLEMENTADO_TOTAL | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx:58` | `ai-suggest-mapping` | Sem persistência direta (sugestão aplicada no formulário) | Lovable AI Gateway · `LOVABLE_API_KEY` (único env) | Fio UI→EF→formulário. |
| 19 | Busca semântica global | ✅ IMPLEMENTADO_TOTAL | `src/components/search/GlobalSearch.tsx:110` → `src/hooks/useSemanticSearch.ts:94` | `semantic-search` | `semantic_search_cache` (`20260416181200_6d3557ca-...sql:103`); RPCs `search_products_semantic` etc. (mesma migration, linha 50) | Lovable AI Gateway · `LOVABLE_API_KEY` (`semantic-search/index.ts:47`, `google/gemini-2.5-flash-lite`) | Expande a query em variações via IA (linha 170), federa RPCs por entidade (linha 186) e escreve cache (linha 213). |
| 20 | Busca conversacional | ✅ IMPLEMENTADO_TOTAL | `src/components/search/GlobalSearch.tsx:118` → `src/hooks/useConversationalSearch.ts:206` | `conversational-search` | `conversational_search_cache` — `supabase/migrations/20260417194749_5cd8905d-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (`conversational-search/index.ts:169`, `google/gemini-2.5-flash`) | Lê cache (linha 151) e grava (linha 230); modo alternado por toggle persistido em localStorage (`GlobalSearch.tsx:135`). |
| 21 | Servidor MCP (integração externa, ex.: Claude) | ✅ IMPLEMENTADO_TOTAL | `src/components/admin/conexoes/McpInstructionsCard.tsx:8` (instruções + config copiável) | `mcp-server` | `connection_configs` (auth por `X-MCP-Token`), `mcp_tool_calls` — `supabase/migrations/20260420125536_bb83da3a-...sql` | Sem LLM próprio (é o *servidor*); `SUPABASE_SERVICE_ROLE_KEY` | JSON-RPC 2.0 com 8 tools declaradas (`mcp-server/index.ts:26-34`), rate limit 120/min (linha 12) e escape de wildcards/PostgREST (linha 45). **Não é invocado pelo frontend por design** — o consumidor é externo; a UI entrega a URL e o JSON de configuração. |
| 22 | Insights com IA (`/insights`, aba "Insights IA") | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/Insights.tsx:79` (fetch direto) | `generate-insights` | **NENHUMA** | Lovable AI Gateway · `LOVABLE_API_KEY` (`generate-insights/index.ts:33`, `google/gemini-3-flash-preview` linha 103) | **Falta a camada de persistência.** `generate-insights/index.ts` não tem nenhum `.from(...)` — só `return jsonOk({ insights, traceId })` (linha 143). A UI guarda em `useState` (`Insights.tsx:36,92`), então o insight morre no refresh. Pior: a tabela `insights` **existe** (`supabase/migrations/20260109144944_1cfd4579-...sql:203`) e é lida por 4 hooks (`useYourDay.ts:78`, `useRealtimeNotifications.ts:185`, `useContactDetail.ts:41`, `check-notifications/index.ts:58`) — **nenhum escritor foi encontrado no repositório** (grep por `from('insights')` e por `INSERT INTO public.insights` nas 390 migrations). |
| 23 | Auditoria de recomendações de IA (`/intelligence/auditoria`) | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/RecommendationAudit.tsx:30` (rota em `AppRoutes.tsx:98`) | — | **Tabela `ai_recommendation_audit_logs_v2` não é criada por nenhuma migration** | n/a | A UI está completa (query, cast, render). Mas: (a) nenhuma das 390 migrations tem `CREATE TABLE ... ai_recommendation_audit_logs_v2` — só uma menção numa lista de retenção (`supabase/migrations/20260723150429_f81c4021-...sql:33`); (b) a tabela **não existe** em `src/integrations/supabase/types.ts` (0 ocorrências de `ai_recommendation` em 16 615 linhas), o que força o `as unknown as AuditLog[]` de `RecommendationAudit.tsx:39`; (c) **nenhuma Edge Function escreve nela** no repositório. Existência real em runtime = `NAO_VERIFICADO`. |
| 24 | Auditoria de consistência de relacionamento (`/intelligence/relacionamento/auditoria`) | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/CRMRelationshipAuditPage.tsx:28,42` (rota em `AppRoutes.tsx:99`) | — | RPC `check_relationship_consistency` — `supabase/migrations/20260509180917_b4306156-...sql:62`; GRANT em `20260522142957_...sql:5` | n/a | Fio UI→RPC existe. **O que falta:** a página faz N+1 — busca contatos (linha 28) e chama a RPC **uma vez por contato** dentro de um loop (linha 42), sem paginação nem limite visível de lote; e o resultado da auditoria não é persistido em lugar nenhum (só renderizado). |
| 25 | Painel de Inteligência Emocional (pilares/EQ) | 🟨 IMPLEMENTADO_PARCIAL | `src/components/analytics/EmotionalIntelligencePanel.tsx` → `src/hooks/useEmotionalIntelligence.ts` | — (cálculo local) | `emotional_states_history` (escrita real por `src/hooks/useNLPAutoAnalysis.ts:96`) | n/a | **DADO FICTÍCIO.** A "força" (`strength`) de cada indicador emocional é sorteada: `strength: 7 + Math.random() * 3` (`useEmotionalIntelligence.ts:53`) para indicadores positivos e `strength: 3 + Math.random() * 4` (linha 73) para negativos. Esses valores entram diretamente no `calculatePillarScore` (linhas 81-95, `reduce((sum, i) => sum + i.strength, 0)`), ou seja **o score de EQ exibido muda a cada render sem qualquer mudança nos dados**. A detecção do *indicador* em si é real (match de keywords, linha 39). |
| 26 | Vieses cognitivos (detecção + histórico) | 🟨 IMPLEMENTADO_PARCIAL | `src/components/analytics/CognitiveBiasesPanel.tsx:27-28` (+ `src/components/contact-detail/behavioral-tab/BiasesSubTab.tsx`) | — (motor local) | `cognitive_bias_history` — `supabase/migrations/20260111162422_931d8ea9-...sql:32`; escrita em `src/hooks/useCognitiveBiasPersistence.ts:93` | n/a (heurística determinística, sem LLM) | Fio real e **sem** dado aleatório: `useCognitiveBiases.ts:38-61` faz match determinístico de indicadores textuais e define polaridade por lista fixa; auto-save ao mudar a contagem de interações (`CognitiveBiasesPanel.tsx:31-37`). **O que falta para ✅:** nenhuma Edge Function/LLM participa — é regex/`includes` sobre texto, o que limita muito a cobertura; e o salvamento é disparado apenas por variação de `interactions.length` (linha 32), não por mudança de conteúdo. |
| 27 | Score de Maestria PNL (`/nlp-analytics`) | 🟨 IMPLEMENTADO_PARCIAL | `src/components/nlp/NLPMasteryScore.tsx` (montado por `src/pages/NLPAnalytics.tsx:9`) | — | **Nenhuma** | n/a | **DADO FICTÍCIO — 100% hardcoded.** `NLPMasteryScore.tsx:10-16` traz literais fixos (`score: 92`, `85`, `88`, `88`, `95`, `94`, `98`) e `const totalScore = 10; // 10/10 Total Mastery Reached!` (linha 19), renderizado como "SCORE DE MAESTRIA PNL 10/10" com badge animado. Não há `supabase`, `invoke` nem `props` de dados no arquivo. |
| 28 | Meta-Programas (perfilagem por contato) | 🟨 IMPLEMENTADO_PARCIAL | `src/components/nlp/MetaProgramsProfiler.tsx` (montado por `NLPAnalytics.tsx:17`) | — | Nenhuma | n/a | **DADO FICTÍCIO (pseudo-aleatório determinístico).** `MetaProgramsProfiler.tsx:12-19` define `getScore(seed, offset)` que faz hash do `contact.id` e devolve `Math.abs(hash % 100)`; esse valor é usado como score de "Direção de Motivação" (linha 27), "Referência de Decisão" (linha 36) e demais eixos. O número é estável por contato, o que o faz *parecer* real, mas não deriva de nenhum dado comportamental. |
| 29 | Dashboard Carnegie (aba "Carnegie" de `/insights`) | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/Insights.tsx:138` renderiza `<CarnegieDashboard />` **sem prop `contact`** | — | Nenhuma | n/a | **DADO FICTÍCIO.** `src/components/carnegie/CarnegieDashboard.tsx:43`: `// Calculate a sample score for demo` / `const sampleScore = calculateCarnegieScore(65);` — valor literal 65 alimenta o `CarnegieScorePanel` (linha 104). Como `Insights.tsx:138` monta sem contato, `contact = null` (default na linha 38) e toda a análise cai nos defaults `'S'`/`'V'` (`useCarnegieAnalysis.ts:17-18`). O motor Carnegie em si é determinístico e real, mas nesta rota está desconectado dos dados. |
| 30 | Coerência de comunicação (VAK/DISC/metaprograma) | 🟨 IMPLEMENTADO_PARCIAL | `src/components/nlp/CommunicationCoherencePanel.tsx` (montado por `NLPAnalytics.tsx:11`) | — | Nenhuma | n/a | **DADO SEMI-FICTÍCIO.** As sugestões de substituição de palavras são escolhidas aleatoriamente: `vakWords[Math.floor(Math.random() * Math.min(5, vakWords.length))]` (linha 91) e o mesmo padrão para metaprogramas (linha 153). Os scores exibidos (`analysis.overallScore`, `vakScore`, `discScore`, `metaprogramScore`, linhas 290-313) são calculados localmente e não persistidos. |
| 31 | Busca visual por imagem | 🟦 SUGERIDO_OU_INICIADO | `src/components/search/VisualSearchButton.tsx:46` — **componente nunca montado** | `visual-search` | RPC `search_products_semantic` (`visual-search/index.ts:160`) | Lovable AI Gateway · `LOVABLE_API_KEY` (`visual-search/index.ts:32`, `google/gemini-2.5-flash`) | A Edge Function é completa (visão → termos → RPC → merge por score, linhas 160-181) e o componente também. **Mas `VisualSearchButton` não é importado por nenhum arquivo do projeto** — grep por `VisualSearch` retorna apenas ocorrências dentro do próprio `VisualSearchButton.tsx` (linhas 37,46,51,82,87). Não há rota, não há botão em `GlobalSearch.tsx`. Sem caminho de execução a partir da UI. |
| 32 | Digest de coaching de conversas | ⬛ MORTO_OU_ABANDONADO | **Nenhuma** | `conversation-coaching-digest` | Lê `conversation_analyses`; **não escreve nada** | Lovable AI Gateway · `LOVABLE_API_KEY` (`conversation-coaching-digest/index.ts:71,79`) | **Prova de ausência de chamador:** grep por `conversation-coaching-digest` e `coachingDigest` em `src/`, `tests/`, `e2e/`, `scripts/` e `supabase/` (fora do diretório da própria função) retorna **apenas** `docs/RUNBOOK.md:189`. Nenhum `cron.schedule` nas 390 migrations o referencia. A função é funcional (agrega score médio, talk-ratio, objeções não tratadas — linhas 44-70) mas ninguém a executa. |
| 33 | Regeneração automática de perfis comportamentais | ⬛ MORTO_OU_ABANDONADO | Nenhuma | `auto-regen-behavioral-profiles` | Escreve `behavioral_profile_regen_queue`, `system_alerts`; lê `behavioral_insight_feedback` | `SUPABASE_SERVICE_ROLE_KEY` (sem LLM próprio) | **Zero referências no repositório inteiro.** Grep por `auto-regen-behavioral-profiles` em `src/`, `tests/`, `e2e/`, `scripts/` e `supabase/` (excluindo o próprio diretório) retorna **nada**. Nenhum `cron.schedule` a agenda. 254 linhas sem nenhum caminho de execução conhecido. |
| 34 | Re-batch comportamental por feedback | ⬛ MORTO_OU_ABANDONADO | Nenhuma | `auto-rebatch-behavioral` | Lê `behavioral_insight_feedback`, `contact_analytical_profiles`, `cron_secrets` (`20260712223208_...sql`) | `SUPABASE_SERVICE_ROLE_KEY` | **Zero referências.** Mesmo grep da linha anterior: nada. O uso de `cron_secrets` revela a *intenção* de ser um cron, mas **nenhuma migration cria o job** — ver seção "Achados". 166 linhas órfãs. |
| 35 | Drenagem da fila de reanálise comportamental (cron) | 🟨 IMPLEMENTADO_PARCIAL | Indireta (`/admin/behavioral-regen-audit` monitora a fila) | `process-behavioral-regen-queue` | `behavioral_profile_regen_queue` (`20260712221610_...sql:2`); RPC `claim_regen_batch` (`supabase/migrations/20260720000002_ef6_atomic_queue_claim.sql:45`, GRANT a `service_role` linha 74) | `SUPABASE_SERVICE_ROLE_KEY`; chama `generate-behavioral-profile` internamente | A função é sofisticada e correta (claim atômico com `FOR UPDATE SKIP LOCKED`, backoff exponencial `Math.min(60, 5*2^attempts)` linha 79, batch writes linhas 92-100). **O que falta: o agendamento.** O job `process-behavioral-regen-queue-5min` só aparece em RPCs de *monitoramento* — `20260713104851_60372e3b-...sql:29`, `20260713105030_f26185f4-...sql:20`, `20260713105408_4c9c3e79-...sql:35` — e **nenhuma das 390 migrations o cria via `cron.schedule`**. Só existem 2 `net.http_post` para Edge Functions em migrations, e nenhum é este (ver "Achados"). Se ativo, foi configurado fora do repositório → `NAO_VERIFICADO`. |
| 36 | Índice de performance da fila comportamental | 🟨 IMPLEMENTADO_PARCIAL | n/a | n/a | Índice em **tabela inexistente** | n/a | **Bug real.** `supabase/migrations/20260719000002_add_missing_performance_indexes.sql:62-64` cria `idx_behavioral_profile_queue_pending ON public.behavioral_profile_queue (priority DESC, scheduled_at ASC) WHERE status = 'pending'`. A tabela **`behavioral_profile_queue` (sem `_regen_`) não é criada por nenhuma migration** — a tabela real é `behavioral_profile_regen_queue` (`20260712221610_...sql:2`), cujas colunas são `attempts`/`next_run_at`/`last_error`, **não** `priority`/`scheduled_at`/`status`. O `IF NOT EXISTS` do índice não protege contra tabela ausente. Efeito em runtime = `NAO_VERIFICADO`. |
| 37 | Voice AI — comando por voz (STT realtime → NLU → ação) | ✅ IMPLEMENTADO_TOTAL | `src/components/search/GlobalSearch.tsx:27` → `VoiceSearchOverlayConnected` → `src/hooks/useVoiceAgent.ts:121` → `src/hooks/voice/processTranscript.ts:22` | `elevenlabs-scribe-token` + `voice-agent` | Sem persistência do comando (ver linha 40) | **ElevenLabs** (`ELEVENLABS_API_KEY`, `elevenlabs-scribe-token/index.ts:24`, endpoint `api.elevenlabs.io/v1/single-use-token/realtime_scribe` linha 30) + **Lovable AI Gateway** para NLU (`voice-agent/index.ts:143`, `google/gemini-3-flash-preview` com `tool_choice` forçado em `execute_voice_command`, linhas 148-149) | Fio completo e maduro: token efêmero → WebSocket Scribe → transcrito → `voiceFetch("voice-agent")` (`voice/voiceFetch.ts:22`, com retry em 401 e refresh de sessão, linhas 46-52) → tool-call estruturado (`voice-agent/index.ts:162-167`) → ação na UI. |
| 38 | Voice — transcrição assíncrona de áudio | ✅ IMPLEMENTADO_TOTAL | `src/components/voice/VoiceInput.tsx:118` | `voice-to-text` | `interactions` (insert, `voice-to-text/index.ts:126-136`), `whatsapp_messages` (update, linha 144), Storage bucket `interaction-audios` (`VoiceInput.tsx:128`) | Lovable AI Gateway · `LOVABLE_API_KEY` (`voice-to-text/index.ts:99`, `google/gemini-2.5-flash`) — **não** usa Whisper/ElevenLabs | Fio completo com persistência dupla (interação + áudio no Storage). Rate limit 10/min (linha 16). Tags `auto-transcribed`/`voice-to-text` (linha 136). |
| 39 | Voice — TTS (resposta falada) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/voice/playTtsAudio.ts:33` (e `src/components/admin/VoiceAITestPanel.tsx:111`) | `elevenlabs-tts` | Sem persistência (áudio em memória) | **ElevenLabs** · `ELEVENLABS_API_KEY` (`elevenlabs-tts/index.ts:30`), endpoint `api.elevenlabs.io/v1/text-to-speech/{voiceId}` (linha 47), `model_id: "eleven_multilingual_v2"` (linha 56) | Única função de IA do escopo que **não** passa por `fetchAI()` — logo, suas chamadas **não** aparecem em `ai_gateway_metrics` (esperado: é ElevenLabs, não o Gateway). |
| 40 | Voice AI — diagnóstico de saúde (`/admin/voice-diagnostics`) | ✅ IMPLEMENTADO_TOTAL | `src/pages/AdminVoiceDiagnostics.tsx:63` (`useVoiceAIHealth`) + painel de teste na linha 128 | `voice-ai-health` | Sem persistência (health check síncrono) | **ElevenLabs** (`ELEVENLABS_API_KEY`, linhas 16 e 47) + **Lovable AI Gateway** (`LOVABLE_API_KEY`, linha 87) | Testa de verdade os 3 serviços: STT (linha 16-41), TTS (47-81) e NLU Gemini (87-120), com latência medida e agregação `allOk`/`anyError` (linhas 144-151). Reporta explicitamente `"<SECRET> not configured"` quando o env falta (linhas 18, 49, 89). |
| 41 | Voice — log/analytics de comandos | 🟨 IMPLEMENTADO_PARCIAL | `src/hooks/voice/logVoiceCommand.ts` | — | **Nenhuma** | n/a | O nome e o docstring prometem *"Logs a voice command for analytics and debugging"* (linhas 4-5), mas o corpo só chama `logger.log("[Voice] Command:", {...})` (linha 18) — **não há `supabase.from(...)`, não há tabela `voice_commands`** (grep por `CREATE TABLE ... voice_command` nas migrations: 0 resultados). Analytics de voz é inexistente; o dado morre no console do browser. |
| 42 | Intelligence Hub — Graph / Entity 360 / Cross-Ref | ✅ IMPLEMENTADO_TOTAL | `src/pages/Intelligence.tsx:34-38` (4 abas, rota em `AppRoutes.tsx:97`) | `external-data` (via `src/lib/externalData.ts:50`) | RPC `get_instant_kpis` (`src/hooks/useInstantKpis.ts:24`); leitura de `contacts`/`companies`/`deals`/`interactions` via proxy | n/a (sem LLM; a aba Ask usa `ask-crm`, linha 2) | Fio real: `GraphTab.tsx:33` → `useInstantKpis` → `callExternalRpc('get_instant_kpis')`; `Entity360Tab.tsx:96` e `useCrossReference.ts:40,92` → `queryExternalData`. Snapshots e bookmarks são **client-side em localStorage** por design (`useIntelSnapshots.ts:14`) — é uma escolha, não uma lacuna. |
| 43 | Copywriting Enterprise (`/crm/copywriting`) | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/crm/CopywritingEnterprise.tsx:4-6` (rota em `AppRoutes.tsx:149`) | Nenhuma **nesta página** | Nenhuma | n/a nesta página | A página monta apenas 3 componentes locais — `CopyAnalyzer`, `SalesScriptGenerator`, `PersuasionFrameworks` (linhas 4-6) — e **nenhum deles chama Edge Function**. As abas que de fato usam IA (`CopywritingAiGeneratorTab` → `ai-writing-assistant`, `CopywritingObjectionTab` → `objection-handler`) vivem em `src/components/nlp/copywriting/` e **não são importadas por esta rota**. Resultado: a rota "Enterprise" é a versão sem IA; a versão com IA está noutro lugar. |
| 44 | Knowledge Base (`/knowledge-base`) | ✅ IMPLEMENTADO_TOTAL | `src/pages/KnowledgeBase.tsx:22` → `src/hooks/useKnowledgeBase.ts:33,48,59,69` (rota em `AppRoutes.tsx:143`) | — (CRUD direto) | `knowledge_base_articles` — `supabase/migrations/20260416110201_c1adf6d7-...sql:2`; presente em `types.ts:6711` | n/a — **sem IA** | CRUD completo (list/create/update/delete) com filtro por categoria e busca em memória (`KnowledgeBase.tsx:37-44`). **Ressalva:** apesar de estar no escopo "IA", esta tela não tem nenhuma integração de IA (nem RAG, nem embedding, nem ligação com `ask-crm`/`semantic-search`). |
| 45 | Suporte / tickets (`/suporte`) | ✅ IMPLEMENTADO_TOTAL | `src/pages/Suporte.tsx:55` → `src/hooks/useSupportTickets.ts:47,73,91,104,124,139` (rota em `AppRoutes.tsx:136`) | `support_tickets` (`20260416105216_a793748a-...sql:2`, em `types.ts:11976`), `ticket_comments` (`useSupportTickets.ts:124,139`) | n/a — **sem IA** | CRUD + comentários + SLA por prioridade (`Suporte.tsx:22-27`), badge de SLA e drawer de detalhe. **Ressalva:** zero IA — não há sugestão de resposta, classificação automática nem ligação com `knowledge_base_articles`. |
| 46 | NLP Analytics — métricas de conversão VAK/emocional | ✅ IMPLEMENTADO_TOTAL | `src/pages/NLPAnalytics.tsx:8` → `src/components/nlp/NLPConversionMetrics.tsx:65-83` | — (leitura direta) | `vak_analysis_history`, `emotional_states_history`, `contacts`, `interactions` (escritas reais em `src/hooks/useNLPAutoAnalysis.ts:96,276,283,290`) | n/a (heurística) | Este é o componente **honesto** do `/nlp-analytics`: consulta 4 tabelas reais (linhas 65, 71, 77, 83) e calcula taxa de conversão a partir de `relationship_stage` real (linhas 111-115, `conversions / contactCount`). Contrasta diretamente com as linhas 27/28/30 desta tabela. |
| 47 | RFM Analyzer | ✅ IMPLEMENTADO_TOTAL | `src/components/analytics/DISCConversionMetricsPanel.tsx:32` (montado por `src/components/dashboard/tabs/AnalyticsTab.tsx:101`) → `src/hooks/useEdgeFunctionActions.ts:32` | `rfm-analyzer` | `rfm_analysis`, `rfm_history` — `supabase/migrations/20260124180842_985d82f1-...sql`; lê `purchase_history` | **Sem LLM** — cálculo determinístico (`rfm-analyzer/index.ts:221-223,246-248`) | Fio completo. Não é IA generativa: é scoring RFM clássico persistido com histórico. Único env: `SUPABASE_SERVICE_ROLE_KEY`. |
| 48 | Análise de comportamento social | ✅ IMPLEMENTADO_TOTAL | `src/components/contact-detail/AIActionsPanel.tsx:61` → `src/hooks/useEdgeFunctionActions.ts:41` | `social-behavior-analyzer` | `social_behavior_analysis` (`20260124175308_b3969198-...sql`), `contact_analytical_profiles` | Lovable AI Gateway · `LOVABLE_API_KEY` | Lê `social_profiles`/`interactions`/`contacts` e grava análise + perfil analítico. |
| 49 | Detector de eventos sociais | ✅ IMPLEMENTADO_TOTAL | `src/components/contact-detail/AIActionsPanel.tsx:69` e `src/hooks/useEnrichSocialProfiles.ts:77` | `social-events-detector` | `social_life_events`, `social_scraping_schedule`, `notifications` — `20260124175308_...sql` | **Firecrawl** · `FIRECRAWL_API_KEY` (único provider externo; **não** usa o Gateway) | Dois chamadores; escreve eventos, agenda de scraping e notificação. Note que o provider aqui é Firecrawl, não LLM Gateway. |
| 50 | Sincronização de interesses sociais | ✅ IMPLEMENTADO_TOTAL | `src/components/crm/commercial/OfferSuggestionsElite.tsx:48` → `src/hooks/commercial/useSocialSync.ts:69` | `sync-social-interests` | `social_sync_queue`, `psychographic_audit_log` — `supabase/migrations/20260512151247_371fdb19-...sql` | `SUPABASE_SERVICE_ROLE_KEY` (sem LLM) | Fila lida/escrita pelo próprio frontend (`useSocialSync.ts:16,52,82,97` — retry e status `failed`), EF processa e grava auditoria psicográfica. |
| 51 | Sugestões de oferta | ✅ IMPLEMENTADO_TOTAL | `src/components/contact-detail/AIActionsPanel.tsx:45` e `src/hooks/useSocialIntelligence.ts:134` | `generate-offer-suggestions` | `offer_suggestions` — `supabase/migrations/20260111183305_a7554561-...sql` | `SUPABASE_SERVICE_ROLE_KEY` — **sem LLM**, sem `LOVABLE_API_KEY` | Agrega 7 fontes (`contact_analytical_profiles`, `purchase_history`, `social_behavior_analysis`, `social_insights`…) e persiste. Apesar do rótulo "IA" na UI (`'✨ Sugestões de oferta geradas'`, `useEdgeFunctionActions.ts:29`), é regra determinística. |
| 52 | Playbooks — geração e recomendação | ✅ IMPLEMENTADO_TOTAL | `src/hooks/usePlaybooks.ts:199` e `:226` | `playbook-generator`, `playbook-recommender` | `sales_playbooks`, `battle_cards` — `supabase/migrations/20260417005023_6d2d8ea7-...sql` | Gerador: Lovable AI Gateway · `LOVABLE_API_KEY`. Recomendador: **sem LLM** (só `SUPABASE_ANON_KEY`) | Dois fios completos e independentes; o gerador escreve `sales_playbooks`, o recomendador lê playbooks + battle cards. |
| 53 | Win/Loss Analyzer | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useWinLoss.ts:417` | `win-loss-analyzer` | `win_loss_records`, `win_loss_insights` — `supabase/migrations/20260416235533_dfd48be7-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` | Fio completo com persistência de insights agregados. |
| 54 | Forecast — análise e narrativa | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useForecasting.ts:177` e `:230` | `forecast-analyzer`, `forecast-narrative` | `deal_forecasts`, `forecast_quota_settings`, `forecast_periods` — `supabase/migrations/20260417001337_e3b9438d-...sql` | Lovable AI Gateway · `LOVABLE_API_KEY` (ambas) | Dois fios completos; ambas leem e/ou escrevem `deal_forecasts`. |
| 55 | Demand Forecast | 🟨 IMPLEMENTADO_PARCIAL | `src/hooks/useBIAdvanced.ts:18` | `demand-forecast` | **Nenhuma** — só lê `interactions` (`demand-forecast/index.ts:30-36`) | Lovable AI Gateway · `LOVABLE_API_KEY` (linha 53, `google/gemini-3-flash-preview` com tool-call estruturado, linhas 74-105) | A previsão é bem construída (tool schema com `forecast`, `insights`, `seasonality_detected`, `growth_rate_percent`) mas **o resultado só é retornado** (`return jsonOk({ historical, ...forecastData })`, linha 122) — nenhuma tabela recebe a previsão, então não há série histórica nem comparação previsto-vs-realizado. Além disso a "demanda" é proxy por contagem de `interactions`, não por deals/receita. |
| 56 | Telemetria de chamadas ao AI Gateway | ✅ IMPLEMENTADO_TOTAL | `src/components/admin/AiGatewayHealthCard.tsx` | todas via `fetchAI` | `ai_gateway_metrics` (particionada — `supabase/migrations/20260723154109_ad0a12c4-...sql:128-138`) | n/a (instrumentação) | `supabase/functions/_shared/fetch-utils.ts:42-90` registra `function_name`, `model`, `status` (`rate_limited`/`success`/`error`), latência e tokens extraídos de `usage` (linhas 61-62). Crons de manutenção existem: `ai-gateway-alerts-eval` (`20260723152932_...sql:93`), `auto_resolve_ai_gateway_alerts` (`20260723153336_...sql:178`), `ai-gateway-metrics-ensure-partition` e `-drop-old` (`20260723154109_...sql:128,134`). |
| 57 | Módulo duplicado `aiGatewayLogger.ts` | ⬛ MORTO_OU_ABANDONADO | n/a | n/a | `ai_gateway_metrics` | n/a | `supabase/functions/_shared/aiGatewayLogger.ts:20` exporta `logAiGatewayCall`. **Nenhum `index.ts` de Edge Function o importa** — grep por `aiGatewayLogger`/`logAiGatewayCall` fora do próprio arquivo retorna só `fetch-utils.ts:70,84,132` (que tem sua **própria** cópia interna, `logAiGatewayCallSafe`) e uma menção em texto na UI (`AiGatewayHealthCard.tsx:102`). Módulo morto duplicando lógica viva. |
| 58 | Componente `AIMessageGenerator` | ⬛ MORTO_OU_ABANDONADO | `src/components/ai/AIMessageGenerator.tsx` | — | — | — | **Zero referências fora do próprio arquivo** (contagem de imports/JSX em `src/`: 0). Contraste: `AIEmailComposerTrigger` tem 4 referências e `EmailThreadSummaryCard` tem 2. |
| 59 | `src/domain/` — regras de negócio puras | 🟦 SUGERIDO_OU_INICIADO (para o escopo de IA) | n/a | n/a | n/a | n/a | Os 8 arquivos (`leadScoring.ts`, `closingScore.ts`, `churnRisk.ts`, `forecastSimulation.ts`, `dealState.ts`, `nextStepLogic.ts`, `demoEntities.ts`, `validationSchemas.ts`) são lógica determinística de CRM. **Nenhum deles participa do fio de IA/DISC/voz auditado aqui** — nenhuma Edge Function de IA os importa (são módulos de front). Classificação restrita a este escopo; a avaliação plena pertence à auditoria de pipeline/vendas. |
| 60 | `/nlp-analytics` como painel de decisão | 🟦 SUGERIDO_OU_INICIADO | `src/pages/NLPAnalytics.tsx` (431 linhas, 20 componentes montados nas linhas 8-28) | — | Parcial | n/a | Dos 20 componentes montados, **apenas 5 leem o banco** (`NLPConversionMetrics`, `NLPEvolutionTimeline`, `NLPInsightsDashboard`, `SleightOfMouthPanel`, `NLPRealtimeCoach` — verificado por grep de `supabase` em cada arquivo de `src/components/nlp/`); os outros 15 são conteúdo estático/ferramentas locais sem persistência. A página *parece* um painel analítico mas é majoritariamente material de treinamento — e dois de seus cards exibem números inventados (linhas 27 e 28 desta tabela). |
| 61 | Compatibilidade de portfólio (aba de `/insights`) | 🟦 SUGERIDO_OU_INICIADO | `src/pages/Insights.tsx:134-135` → `PortfolioCompatibilityReport` + `CompatibilityAlertsList` | — | `compatibility_alerts` (lido/escrito em `src/components/triggers/CompatibilityAlertsList.tsx:60,90,109`) | n/a | Os alertas têm fio real de leitura/escrita. Já `PortfolioCompatibilityReport.tsx:33` depende de `usePortfolioCompatibility` — **nenhuma Edge Function e nenhum produtor automático de `compatibility_alerts` foi encontrado no repositório**, então quem popula a tabela permanece indeterminado (`NAO_VERIFICADO`). |
| 62 | Escuta/coach PNL em tempo real | ✅ IMPLEMENTADO_TOTAL | `src/components/nlp/NLPRealtimeCoach.tsx` montado em `src/components/contact-detail/MeetingMode.tsx:249` e `src/components/forms/InteractionForm.tsx:353` | — (heurística local) | `contacts.behavior` (leitura, linha 67); `objection_example_feedback` (escrita, linha 246) | n/a | Dois pontos de montagem reais e escrita de feedback persistida. |
| 63 | Snapshots / telemetria do Intelligence Hub | 🟨 IMPLEMENTADO_PARCIAL | `src/pages/Intelligence.tsx:26,110-116`; `src/components/intel/IntelTelemetryPanel.tsx` | — | **Apenas localStorage** (`src/hooks/useIntelSnapshots.ts:14`) | n/a | Snapshot gera hash e link compartilhável (`Intelligence.tsx:110-116`, `lib/intelSnapshot.ts`), mas o histórico vive só no navegador — **um link compartilhado não abre em outra máquina/perfil**, pois o payload depende do hash local. `useIntelTelemetry` não tem nenhum `.from(...)`. Além disso `Intelligence.tsx:52` usa `Math.random()` para gerar `sessionId` (uso legítimo, não é métrica). |

---

## Inventário das Edge Functions do escopo

`Chamador?` cita `arquivo:linha` real. `Cron?` = existe `cron.schedule` ou `net.http_post` **nas
migrations do repositório** que dispare a função. Estado real do `pg_cron` no servidor =
`NAO_VERIFICADO`.

| # | Edge Function | Tem chamador? (`arquivo:linha`) | Tem cron? | Classificação |
|---|---|---|---|---|
| 1 | `ai-assistant` | ✅ `src/hooks/useAiAssistant.ts:143` (fetch direto) | não | ✅ |
| 2 | `ai-email-refine` | ✅ `src/hooks/useEmailRefine.ts:20` | não | ✅ |
| 3 | `ai-suggest-mapping` | ✅ `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx:58` | não | ✅ |
| 4 | `ai-writing-assistant` | ✅ `src/components/nlp/copywriting/CopywritingAiGeneratorTab.tsx:46`; `src/hooks/useAIWritingAssistant.ts:72` | não | ✅ |
| 5 | `ask-crm` | ✅ `src/hooks/useAskCrm.ts:48` (fetch direto) | não | ✅ |
| 6 | `conversation-analyzer` | ✅ `src/hooks/useConversationIntel.ts:100`; `src/components/contact-detail/ContactInteractionsTab.tsx:120` | não | ✅ |
| 7 | `conversation-coaching-digest` | ❌ **nenhum** (só `docs/RUNBOOK.md:189`) | **não** | ⬛ |
| 8 | `conversational-search` | ✅ `src/hooks/useConversationalSearch.ts:206` | não | ✅ |
| 9 | `disc-analyzer` | ✅ `src/hooks/useDISCAutoAnalysis.ts:37,86`; `src/hooks/useInteractions.ts:119`; `ContactInteractionsTab.tsx:123` | não | ✅ |
| 10 | `generate-behavioral-profile` | ✅ `src/hooks/useBehavioralProfile.ts:66`; `src/pages/admin/InsightFeedbackAnalytics.tsx:205`; + interno por `process-behavioral-regen-queue/index.ts:50` | não | ✅ |
| 11 | `auto-regen-behavioral-profiles` | ❌ **nenhum** (zero refs no repo) | **não** | ⬛ |
| 12 | `auto-rebatch-behavioral` | ❌ **nenhum** (zero refs; lê `cron_secrets`, mas job inexistente) | **não** | ⬛ |
| 13 | `process-behavioral-regen-queue` | ❌ nenhum chamador de UI (por design é cron) | **não** — job `process-behavioral-regen-queue-5min` só citado em RPCs de monitoramento (`20260713104851_...sql:29`) | 🟨 |
| 14 | `retry-behavioral-profile` | ✅ `src/pages/admin/BehavioralRegenAudit.tsx:150,239` | não | ✅ |
| 15 | `generate-insights` | ✅ `src/pages/Insights.tsx:79` (fetch direto) | não | 🟨 (sem persistência) |
| 16 | `generate-offer-suggestions` | ✅ `src/hooks/useEdgeFunctionActions.ts:29`; `src/hooks/useSocialIntelligence.ts:134` | não | ✅ |
| 17 | `next-best-action` | ✅ `src/hooks/useNextBestAction.ts:57` | não | ✅ |
| 18 | `suggest-next-action` | ✅ `src/hooks/useEdgeFunctionActions.ts:35` | não | ✅ |
| 19 | `objection-handler` | ✅ `src/components/nlp/copywriting/CopywritingObjectionTab.tsx:43`; `src/components/crm/NextBestAction.tsx:113` | não | ✅ |
| 20 | `objection-context-summary` | ✅ `src/hooks/useObjectionContextSummary.ts:57` | não | ✅ |
| 21 | `meeting-summary` | ✅ `src/hooks/useMeetingSummary.ts:51` | não | ✅ |
| 22 | `email-thread-summary` | ✅ `src/hooks/useEmailThreadSummary.ts:66` | não | ✅ |
| 23 | `semantic-search` | ✅ `src/hooks/useSemanticSearch.ts:94` | não | ✅ |
| 24 | `visual-search` | ⚠️ só `src/components/search/VisualSearchButton.tsx:92` — **componente nunca montado** | não | 🟦 |
| 25 | `rfm-analyzer` | ✅ `src/hooks/useEdgeFunctionActions.ts:32` | não | ✅ |
| 26 | `social-behavior-analyzer` | ✅ `src/hooks/useEdgeFunctionActions.ts:41` | não | ✅ |
| 27 | `social-events-detector` | ✅ `src/hooks/useEdgeFunctionActions.ts:44`; `src/hooks/useEnrichSocialProfiles.ts:77` | não | ✅ |
| 28 | `sync-social-interests` | ✅ `src/hooks/commercial/useSocialSync.ts:69` | não | ✅ |
| 29 | `voice-agent` | ✅ `src/hooks/voice/processTranscript.ts:22`; `src/components/admin/VoiceAITestPanel.tsx:100` | não | ✅ |
| 30 | `voice-ai-health` | ✅ `src/hooks/useVoiceAIHealth.ts:20` | não | ✅ |
| 31 | `voice-to-text` | ✅ `src/components/voice/VoiceInput.tsx:118`; `VoiceAITestPanel.tsx:80` | não | ✅ |
| 32 | `elevenlabs-scribe-token` | ✅ `src/hooks/useVoiceAgent.ts:121` | não | ✅ |
| 33 | `elevenlabs-tts` | ✅ `src/hooks/voice/playTtsAudio.ts:33`; `VoiceAITestPanel.tsx:111` | não | ✅ |
| 34 | `mcp-server` | ⚠️ **externo por design** — UI só publica URL/config (`McpInstructionsCard.tsx:8`) | não | ✅ |
| 35 | `playbook-generator` | ✅ `src/hooks/usePlaybooks.ts:199` | não | ✅ |
| 36 | `playbook-recommender` | ✅ `src/hooks/usePlaybooks.ts:226` | não | ✅ |
| 37 | `win-loss-analyzer` | ✅ `src/hooks/useWinLoss.ts:417` | não | ✅ |
| 38 | `demand-forecast` | ✅ `src/hooks/useBIAdvanced.ts:18` | não | 🟨 (sem persistência) |
| 39 | `forecast-analyzer` | ✅ `src/hooks/useForecasting.ts:177` | não | ✅ |
| 40 | `forecast-narrative` | ✅ `src/hooks/useForecasting.ts:230` | não | ✅ |

**Resultado do inventário de cron.** Varredura completa de `cron.schedule` nas 390 migrations
(`supabase/migrations/`) encontrou **15 ocorrências em 12 arquivos**. Delas, apenas **2 disparam
Edge Functions** via `net.http_post` — `validation-queue-worker`
(`20260417120721_823eaa43-...sql:14-22`, `*/5 * * * *`) e `smart-notify`
(`20260512105729_9e0ffd45-...sql:6-14`, `0 */4 * * *`) — e **nenhuma das duas pertence a este
escopo**. As 13 restantes chamam RPCs de manutenção/alerta.
**Conclusão: nenhuma Edge Function do escopo de IA/voz tem agendamento criado por migration no
repositório.** Se `process-behavioral-regen-queue`, `auto-regen-behavioral-profiles` ou
`auto-rebatch-behavioral` executam em produção, foram agendadas fora do controle de versão →
`NAO_VERIFICADO`.

---

## Achados

### A. Dado fictício apresentado como métrica

| Achado | `arquivo:linha` | Detalhe |
|---|---|---|
| **A1 — Score de EQ sorteado** | `src/hooks/useEmotionalIntelligence.ts:53` e `:73` | `strength: 7 + Math.random() * 3` (positivo) e `strength: 3 + Math.random() * 4` (negativo). O valor entra no somatório de `calculatePillarScore` (linhas 81-95), logo **o score de Inteligência Emocional exibido varia entre renders sem mudança nos dados**. O comentário `eslint-disable ... sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness` (linhas 52 e 72) classifica erroneamente uma métrica de produto como "mock". |
| **A2 — Maestria PNL 10/10 hardcoded** | `src/components/nlp/NLPMasteryScore.tsx:10-16` e `:19` | Sete scores literais (`92`, `85`, `88`, `88`, `95`, `94`, `98`) e `const totalScore = 10; // 10/10 Total Mastery Reached!`. Renderizado com badge `animate-bounce` "10/10". Zero fontes de dados no arquivo. Montado em `/nlp-analytics` (`src/pages/NLPAnalytics.tsx:9`). |
| **A3 — Meta-programas por hash do id** | `src/components/nlp/MetaProgramsProfiler.tsx:12-19,27,36` | `getScore(seed, offset)` = `Math.abs(hash(contact.id + offset) % 100)`. Estável por contato — parece real — mas não deriva de nenhuma interação, texto ou análise. |
| **A4 — Score Carnegie de demonstração em rota de produção** | `src/components/carnegie/CarnegieDashboard.tsx:43` + `src/pages/Insights.tsx:138` | `// Calculate a sample score for demo` / `const sampleScore = calculateCarnegieScore(65);`. A aba "Carnegie" de `/insights` monta `<CarnegieDashboard />` **sem `contact`**, então `contact = null` (default, linha 38) e o motor cai nos perfis default `'S'`/`'V'` (`useCarnegieAnalysis.ts:17-18`). |
| **A5 — Sugestões de palavra sorteadas** | `src/components/nlp/CommunicationCoherencePanel.tsx:91` e `:153` | `vakWords[Math.floor(Math.random() * Math.min(5, vakWords.length))]` — a recomendação de substituição muda a cada execução. |

**Usos legítimos de `Math.random()` (não são achados):** `src/pages/Intelligence.tsx:52`
(sessionId de UI) e `src/components/voice/VoiceInput.tsx:127` (sufixo de nome de arquivo no
Storage).

### B. Fios quebrados (funcionalidade que não fecha o ciclo)

| Achado | `arquivo:linha` | Detalhe |
|---|---|---|
| **B1 — `/insights` gera e joga fora** | `supabase/functions/generate-insights/index.ts:143`; `src/pages/Insights.tsx:36,92` | A EF só faz `return jsonOk({ insights, traceId })` — **nenhum `.from(...)` no arquivo inteiro**. A UI guarda em `useState`. Cada carregamento de página dispara uma chamada de LLM nova (`Insights.tsx:57` chama `generateInsights` dentro de `fetchData`) e descarta o resultado ao sair. |
| **B2 — Tabela `insights` sem escritor** | `supabase/migrations/20260109144944_1cfd4579-...sql:203` (CREATE); leitores em `src/hooks/useYourDay.ts:78`, `src/hooks/useRealtimeNotifications.ts:185`, `src/hooks/useContactDetail.ts:41,195`, `supabase/functions/check-notifications/index.ts:58` | Cinco consumidores, **zero produtores no repositório**. Grep por `from('insights')`/`from("insights")` em `src/` e `supabase/functions/`: só leituras + um `update({dismissed:true})`. Grep por `INSERT INTO public.insights` nas migrations: 0. Combinado com B1, o "feed de insights" do dashboard provavelmente nunca recebe conteúdo — mas o estado real dos dados é `NAO_VERIFICADO`. |
| **B3 — `/intelligence/auditoria` lê tabela inexistente no repo** | `src/pages/RecommendationAudit.tsx:30,39` | `ai_recommendation_audit_logs_v2`: sem `CREATE TABLE` em nenhuma das 390 migrations (só citada numa lista de retenção em `20260723150429_f81c4021-...sql:33`), ausente de `src/integrations/supabase/types.ts` (0 ocorrências de `ai_recommendation` em 16 615 linhas) — daí o `as unknown as AuditLog[]` na linha 39. Nenhuma Edge Function escreve nela. |
| **B4 — Analytics de voz que não grava** | `src/hooks/voice/logVoiceCommand.ts:4-5,18` | Docstring promete *"Logs a voice command for analytics and debugging"*; implementação chama apenas `logger.log`. Não existe tabela `voice_commands` (grep `CREATE TABLE ... voice_command`: 0 resultados). |
| **B5 — `demand-forecast` sem série histórica** | `supabase/functions/demand-forecast/index.ts:122` | `return jsonOk({ historical, ...forecastData })` — nenhuma escrita. Impossível medir acurácia do forecast ao longo do tempo. |
| **B6 — Rota Copywriting sem as abas de IA** | `src/pages/crm/CopywritingEnterprise.tsx:4-6` vs `src/components/nlp/copywriting/` | A rota `/crm/copywriting` (`AppRoutes.tsx:149`) monta só `CopyAnalyzer`, `SalesScriptGenerator` e `PersuasionFrameworks` (todos sem Edge Function). As abas que chamam `ai-writing-assistant` (`CopywritingAiGeneratorTab.tsx:46`) e `objection-handler` (`CopywritingObjectionTab.tsx:43`) estão noutro diretório e **não são importadas por esta rota**. |
| **B7 — Índice sobre tabela inexistente** | `supabase/migrations/20260719000002_add_missing_performance_indexes.sql:62-64` | `CREATE INDEX ... ON public.behavioral_profile_queue (priority DESC, scheduled_at ASC) WHERE status = 'pending'`. A tabela correta é `behavioral_profile_regen_queue` (`20260712221610_...sql:2`) e suas colunas são `attempts`/`next_run_at`/`last_error` — **`priority`, `scheduled_at` e `status` não existem lá**. O comentário na linha 60-61 confirma a intenção ("process-behavioral-regen-queue cron queries"). |

### C. Funções órfãs (nenhum caminho de execução)

| Função | Linhas | Prova de ausência de chamador |
|---|---|---|
| `conversation-coaching-digest` | 92 | Grep por `conversation-coaching-digest` e `coachingDigest` em `src/`, `tests/`, `e2e/`, `scripts/`, `supabase/` (fora do próprio diretório) → **apenas** `docs/RUNBOOK.md:189`. Sem `cron.schedule`. |
| `auto-regen-behavioral-profiles` | 254 | Grep em `src/`, `tests/`, `e2e/`, `scripts/`, `supabase/` → **zero resultados**. Sem cron. |
| `auto-rebatch-behavioral` | 166 | Grep idem → **zero resultados**. Lê `cron_secrets` (intenção de cron), mas nenhum job criado. |
| `process-behavioral-regen-queue` | 112 | Sem chamador de UI (correto — é cron), mas **o job nunca é criado por migration**; só monitorado por `get_behavioral_regen_cron_health()` (`20260713104851_...sql:29`) e `check_behavioral_regen_cron_staleness()` (`20260713105030_...sql:20`). Ironia: existe monitoramento de "staleness" com alerta em `system_alerts` para um job que o repositório nunca agenda. |
| **Componentes órfãos** | — | `src/components/search/VisualSearchButton.tsx` (0 imports fora do próprio arquivo) e `src/components/ai/AIMessageGenerator.tsx` (0 referências). |
| **Módulo órfão** | — | `supabase/functions/_shared/aiGatewayLogger.ts` — 0 importadores; duplica `logAiGatewayCallSafe` de `fetch-utils.ts:132`, que é o realmente usado. |

### D. Provedores de IA e secrets — mapa consolidado

Verificado por `grep -oP "Deno\.env\.get\(['\"]\K[A-Z_0-9]+"` em cada `index.ts` do escopo.

| Provider | Endpoint | Secret | Funções do escopo |
|---|---|---|---|
| **Lovable AI Gateway** | `https://ai.gateway.lovable.dev/v1/chat/completions` (33 ocorrências no diretório `supabase/functions/`) | `LOVABLE_API_KEY` | 29 funções: `ai-assistant`, `ai-email-refine`, `ai-suggest-mapping`, `ai-writing-assistant`, `ask-crm`, `conversation-analyzer`, `conversation-coaching-digest`, `conversational-search`, `disc-analyzer`, `generate-behavioral-profile`, `generate-insights`, `next-best-action`, `suggest-next-action`, `objection-handler`, `objection-context-summary`, `meeting-summary`, `email-thread-summary`, `semantic-search`, `visual-search`, `social-behavior-analyzer`, `voice-agent`, `voice-ai-health`, `voice-to-text`, `playbook-generator`, `win-loss-analyzer`, `demand-forecast`, `forecast-analyzer`, `forecast-narrative` |
| **ElevenLabs** | `https://api.elevenlabs.io` (6 ocorrências) | `ELEVENLABS_API_KEY` | `elevenlabs-scribe-token` (`index.ts:24,30`), `elevenlabs-tts` (`:30,47`, `eleven_multilingual_v2` linha 56), `voice-ai-health` (`:16,47`) |
| **Firecrawl** | — | `FIRECRAWL_API_KEY` | `social-events-detector` (único no escopo) |
| **Sem LLM** (determinístico) | — | só `SUPABASE_*` | `rfm-analyzer`, `generate-offer-suggestions`, `sync-social-interests`, `playbook-recommender`, `mcp-server`, `retry-behavioral-profile`, `process-behavioral-regen-queue`, `auto-regen-behavioral-profiles`, `auto-rebatch-behavioral` |

**Modelos em uso** (todos via Gateway): `google/gemini-3-flash-preview` (conversation-analyzer,
disc-analyzer, generate-insights, voice-agent, demand-forecast, conversation-coaching-digest,
forecast-*), `google/gemini-2.5-flash` (ai-assistant, ask-crm, conversational-search, visual-search,
voice-to-text), `google/gemini-2.5-flash-lite` (semantic-search).

**Ausência de OpenAI e Gemini direto:** grep por `api.openai.com` e `generativelanguage` em
`supabase/functions/`: **0 ocorrências**. Não há `OPENAI_API_KEY` nem `GEMINI_API_KEY` em nenhuma
função do escopo. A afirmação do `HANDOFF.md:25` ("Lovable AI Gateway (Gemini/GPT)") só se sustenta
para Gemini.

**Secrets não documentados no `.env.example`:** o arquivo (18 linhas) só declara
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`. `LOVABLE_API_KEY`,
`ELEVENLABS_API_KEY` e `FIRECRAWL_API_KEY` são secrets de Edge Function (não vão para o frontend),
mas **nenhum documento do repositório lista o conjunto necessário para subir o ambiente**.
Configuração efetiva no projeto Supabase = `NAO_VERIFICADO`.

### E. Boas práticas observadas (contraponto)

- **Telemetria universal:** 28 das 29 funções que chamam LLM passam por `fetchAI()`
  (`_shared/fetch-utils.ts:42`), que extrai `usage.prompt_tokens`/`completion_tokens` (linhas 61-62)
  e grava em `ai_gateway_metrics` com particionamento e retenção automatizados
  (`20260723154109_ad0a12c4-...sql:128,134`). A única exceção é `elevenlabs-tts` — coerente, pois
  não é o Gateway.
- **Degradação graciosa quando o secret falta:** `conversation-coaching-digest/index.ts:71-72`
  devolve `{ stats, narrative: "IA indisponível." }` em vez de 500; `voice-ai-health` reporta
  `"<SECRET> not configured"` por serviço (linhas 18, 49, 89).
- **Segurança do NL→SQL:** `ask-crm/index.ts:152-161` exige que o SQL gerado contenha o predicado
  `user_id = '<uid>'` como cláusula real (regex ancorado em `where|and|on`), e a RPC
  `execute_readonly_query` teve `EXECUTE` revogado de `PUBLIC`/`anon`/`authenticated`
  (`20260509113217_ad89ac31-...sql:2-4`).
- **Concorrência correta na fila comportamental:** `claim_regen_batch` com
  `FOR UPDATE SKIP LOCKED` e lock de 15 min (`20260720000002_ef6_atomic_queue_claim.sql:45`),
  consumido em `process-behavioral-regen-queue/index.ts:29`.

---

## Contradições com a documentação existente

| # | Documento afirma | Medição no código | Gravidade |
|---|---|---|---|
| 1 | `docs/RUNBOOK.md:189` lista `conversation-coaching-digest` entre as **"Crons (`requireCronSecret`)"** | A função usa `withAuth(req)` — autenticação de **usuário JWT** — em `conversation-coaching-digest/index.ts:12-14`, e **não** `requireCronSecret`. Compare com `process-behavioral-regen-queue/index.ts:16`, que usa `requireCronSecret` de verdade. Além disso não há `cron.schedule` para ela em nenhuma migration. | **Alta** — a doc descreve um agendamento que não existe e um modo de auth que não é o implementado. |
| 2 | `HANDOFF.md:25`: "IA — Lovable AI Gateway (**Gemini/GPT**) — sem API key necessária" | (a) Nenhuma função do escopo chama `api.openai.com` (0 ocorrências); todos os `model:` são `google/gemini-*`. (b) "sem API key necessária" é falso do ponto de vista de deploy: **toda** função de IA faz `Deno.env.get("LOVABLE_API_KEY")` e aborta sem ela (ex.: `generate-insights/index.ts:34-36` → `throw new Error("LOVABLE_API_KEY is not configured")`). | **Média** — induz a crer que não há secret a configurar. |
| 3 | `HANDOFF.md:172`: "`insights` — Insights gerados por IA"; `docs/DATA_DICTIONARY.md:44` mapeia "Insight gerado por AI → `insights`" | A tabela existe (`20260109144944_...sql:203`) e é lida por 5 consumidores, mas **nenhum código do repositório escreve nela**; a função `generate-insights` não tem sequer um `.from(...)`. | **Alta** — o dicionário de dados descreve um fluxo de escrita que não existe no repo. |
| 4 | `README.md:20`: "**DISC Enterprise** — ... **métricas de conversão**" | Métricas de conversão DISC/VAK existem de verdade em `NLPConversionMetrics.tsx:111-115` (calculadas de `relationship_stage`). **Porém** o mesmo painel `/nlp-analytics` exibe, lado a lado, o "Score de Maestria PNL 10/10" hardcoded (`NLPMasteryScore.tsx:19`) e meta-programas por hash (`MetaProgramsProfiler.tsx:12`). A doc não distingue o que é medido do que é ilustrativo. | **Alta** — usuário não tem como saber qual número confiar. |
| 5 | `HANDOFF.md:10`: "análise comportamental (DISC, **IE**, Vieses Cognitivos)" | DISC ✅ (fio completo com `disc-analyzer` + 2 tabelas) e Vieses Cognitivos ✅ (determinístico com `cognitive_bias_history`). **IE (Inteligência Emocional) tem a força de cada indicador sorteada** (`useEmotionalIntelligence.ts:53,73`) — o pilar é apresentado no mesmo nível dos outros dois, mas não é comparável em confiabilidade. | **Alta** |
| 6 | `README.md:153`: "Cobertura inclui: ... e **voice AI**" | Existem testes de voz no repo (`src/hooks/voice/__tests__/voice-system-exhaustive.test.ts`, com asserts de URL nas linhas 378-386). **Não foi possível executá-los** (`node_modules` vazio) — **esta auditoria não afirma nem nega que passem**. | Não avaliável (`NAO_VERIFICADO`). |
| 7 | `docs/RUNBOOK.md:183` lista `visual-search` entre funções ativas com rate limit | A função existe e é completa, mas seu único chamador (`VisualSearchButton.tsx:92`) está num componente **nunca montado** — nenhuma rota ou tela o importa. | **Média** — doc sugere feature ativa; não há como acioná-la pela UI. |
| 8 | `src/integrations/supabase/types.ts` (tipos gerados) | Está **desatualizado**: 375 tabelas declaradas, mas faltam `conversation_analyses`, `behavioral_profile_regen_queue`, `contact_analytical_profiles` e `conversational_search_cache` — todas criadas por migrations e usadas por código em produção. Isso força casts `as unknown as` (ex.: `RecommendationAudit.tsx:39`, `ConversationIntelligence.tsx:70`), que apagam a checagem de tipo justamente nas telas de IA. | **Média** |

---

## Arquivos que inspecionei

**Rotas e composição (4):** `src/app/AppRoutes.tsx`, `src/app/lazyPages.tsx`, `supabase/config.toml`,
`.env.example`.

**Páginas (14):** `src/pages/Insights.tsx`, `Intelligence.tsx`, `NLPAnalytics.tsx`, `Assistente.tsx`,
`ConversationIntelligence.tsx`, `ConversationIntelligenceSetup.tsx`, `PerfisComportamentais.tsx`,
`KnowledgeBase.tsx`, `Suporte.tsx`, `RecommendationAudit.tsx`, `CRMRelationshipAuditPage.tsx`,
`crm/CopywritingEnterprise.tsx`, `admin/BehavioralRegenAudit.tsx`,
`admin/InsightFeedbackAnalytics.tsx`.

**Hooks (30+):** `useAiAssistant.ts`, `useAskCrm.ts`, `useConversationIntel.ts`,
`useDISCAutoAnalysis.ts`, `useBehavioralProfile.ts`, `useBehavioralProfilesList.ts`,
`useEdgeFunctionActions.ts`, `useNextBestAction.ts`, `useObjectionContextSummary.ts`,
`useMeetingSummary.ts`, `useEmailThreadSummary.ts`, `useEmailRefine.ts`,
`useAIWritingAssistant.ts`, `useSemanticSearch.ts`, `useConversationalSearch.ts`,
`useEmotionalIntelligence.ts`, `useCognitiveBiases.ts`, `useCognitiveBiasPersistence.ts`,
`useCarnegieAnalysis.ts`, `useNLPAutoAnalysis.ts`, `useVoiceAgent.ts`, `useVoiceAIHealth.ts`,
`useInstantKpis.ts`, `useCrossReference.ts`, `useIntelSnapshots.ts`, `useIntelTelemetry.ts`,
`useKnowledgeBase.ts`, `useSupportTickets.ts`, `usePlaybooks.ts`, `useWinLoss.ts`,
`useForecasting.ts`, `useBIAdvanced.ts`, `useSocialIntelligence.ts`,
`commercial/useSocialSync.ts`, `voice/voiceFetch.ts`, `voice/processTranscript.ts`,
`voice/playTtsAudio.ts`, `voice/logVoiceCommand.ts`.

**Componentes (25+):** `intelligence/AskTab.tsx`, `intelligence/GraphTab.tsx`,
`intelligence/Entity360Tab.tsx`, `intelligence/CrossRefTab.tsx`, todos os 25 arquivos de
`components/nlp/*.tsx` (varredura de `supabase`/`invoke`/`localStorage`), `nlp/NLPMasteryScore.tsx`,
`nlp/MetaProgramsProfiler.tsx`, `nlp/NLPConversionMetrics.tsx`,
`nlp/CommunicationCoherencePanel.tsx`, `nlp/copywriting/CopywritingAiGeneratorTab.tsx`,
`nlp/copywriting/CopywritingObjectionTab.tsx`, `carnegie/CarnegieDashboard.tsx`,
`analytics/CognitiveBiasesPanel.tsx`, `analytics/EmotionalIntelligencePanel.tsx`,
`voice/VoiceInput.tsx`, `search/VisualSearchButton.tsx`, `search/GlobalSearch.tsx`,
`admin/conexoes/McpInstructionsCard.tsx`, `triggers/PortfolioCompatibilityReport.tsx`,
`triggers/CompatibilityAlertsList.tsx`, `contact-detail/AIActionsPanel.tsx`.

**Edge Functions (40 do escopo, inventário de env/persistência em todas; leitura integral ou
substancial de 20):** `ai-assistant`, `ask-crm`, `conversation-analyzer`,
`conversation-coaching-digest` (integral), `conversational-search`, `disc-analyzer`,
`generate-behavioral-profile`, `process-behavioral-regen-queue` (integral), `generate-insights`,
`next-best-action`, `semantic-search`, `visual-search`, `mcp-server`, `voice-agent`,
`voice-to-text`, `voice-ai-health`, `elevenlabs-tts`, `elevenlabs-scribe-token`,
`demand-forecast` (integral), `rfm-analyzer`. Compartilhados: `_shared/fetch-utils.ts`,
`_shared/aiGatewayLogger.ts`.

**Migrations (varredura completa de 390 arquivos + leitura direcionada de 25):**
`20260109144944` (insights), `20260111162422` (cognitive_bias_history), `20260124175308` (social),
`20260124180842` (rfm), `20260124184935` (disc), `20260416010445` (execute_readonly_query),
`20260416013658` (meeting_summaries), `20260416105216` (support_tickets),
`20260416110201` (knowledge_base), `20260416181200` (semantic search), `20260416183013` (ai_chat_*),
`20260416235533` (win/loss), `20260417000551` (conversation_analyses), `20260417001337` (forecast),
`20260417005023` (playbooks), `20260417120721` (cron validation-queue), `20260417162926`,
`20260417172946` (contact_next_actions), `20260417194749`, `20260420125536` (mcp_tool_calls),
`20260509113217`, `20260509180917`, `20260512105729` (cron smart-notify), `20260512121618`,
`20260512121726`, `20260512122055`, `20260512132827`, `20260512151247`, `20260712221610`,
`20260712221944`, `20260712222427`, `20260712223208`, `20260713104851`, `20260713105030`,
`20260713105408`, `20260719000002`, `20260720000002`, `20260723150429`, `20260723152932`,
`20260723153336`, `20260723154109`.

**Tipos e docs:** `src/integrations/supabase/types.ts` (16 615 linhas — verificação de presença de
tabelas), `README.md`, `HANDOFF.md`, `docs/RUNBOOK.md`, `docs/DATA_DICTIONARY.md`.

---

## Lacunas: o que NÃO verifiquei e por quê

1. **Todo o estado de runtime — `NAO_VERIFICADO`.** Sem acesso ao banco. Não sei se
   `conversation_analyses`, `insights`, `contact_analytical_profiles` ou qualquer outra tabela tem
   uma linha sequer, se os RLS estão ativos no servidor, ou se `ai_recommendation_audit_logs_v2`
   existe fora do repositório. Onde escrevi "tabela existe", leia **"há migration que a cria"**.
2. **Jobs `pg_cron` realmente ativos — `NAO_VERIFICADO`.** Só posso afirmar o que está nas
   migrations. Um job criado manualmente pelo dashboard do Supabase (prática comum em projetos
   Lovable) seria invisível para mim. É por isso que `process-behavioral-regen-queue` ficou 🟨 e não
   ⬛: a função é boa e monitorada, apenas o agendamento não está versionado.
3. **Secrets efetivamente configurados — `NAO_VERIFICADO`.** Verifiquei quais `Deno.env.get(...)`
   cada função lê; não sei se `LOVABLE_API_KEY`, `ELEVENLABS_API_KEY` ou `FIRECRAWL_API_KEY` estão
   preenchidos no projeto. Uma função pode estar ✅ no código e falhar 100% das chamadas em produção.
4. **Compilação, lint e testes — não executados.** `node_modules` vazio; por regra, não rodei
   `build`/`test`/`lint`. **Nada neste documento afirma que o projeto compila ou que algum teste
   passa.** Notei `src/integrations/supabase/types.ts.lovable.bak` convivendo com `types.ts`, e tipos
   faltando para 4 tabelas em uso — sinais de possível erro de tipagem, mas **não confirmados**.
5. **Deploy real das Edge Functions.** `supabase/config.toml` tem 1 linha (`project_id`) — sem blocos
   `[functions.*]`, sem `verify_jwt` declarado. Não há como saber pelo repo quais das 108 funções
   estão efetivamente publicadas, nem sua configuração de JWT.
6. **Qualidade dos prompts e das saídas de LLM.** Verifiquei que a chamada é feita, com qual modelo e
   se o retorno é persistido. **Não avaliei** se os prompts produzem análises DISC/comportamentais
   corretas, nem se os `tool_choice` forçados (ex.: `voice-agent/index.ts:149`) cobrem os casos reais.
7. **Comportamento visual/UX.** Não executei a aplicação. Estados de loading, empty states,
   acessibilidade e responsividade das telas de IA não foram avaliados.
8. **Fronteiras de escopo.** Deliberadamente **não** classifiquei em profundidade: `demand-forecast`
   como parte do módulo BI (só o fio da EF), `src/domain/` além da constatação de que não participa
   do fio de IA, e as funções de forecast/RevOps do ponto de vista de pipeline comercial — esses
   pertencem a outras fatias da auditoria.
9. **Componentes DISC não montados no meu escopo de rotas.** `src/components/disc/` tem 7 arquivos
   (`DISCTrainingMode`, `DISCTemplateLibrary`, `DISCSalesScriptGenerator`…) cujos pontos de montagem
   não rastreei individualmente — apenas os que aparecem nas rotas do escopo. Podem conter dado
   fictício não detectado.
10. **Histórico do Git.** Não investiguei quando as funções órfãs foram introduzidas nem se houve
    remoção acidental de chamadores. Isso mudaria a leitura de "abandonado" vs. "ainda não conectado",
    mas não muda a classificação, que é baseada no estado atual do código.
