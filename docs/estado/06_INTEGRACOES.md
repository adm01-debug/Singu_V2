# Estado — Integrações

> **Método:** auditoria estática do repositório `/home/user/singu-v2`. **Sem acesso a banco, a logs ou ao runtime.**
> Nenhuma afirmação neste documento prova que uma integração recebe ou envia tráfego real.
> Para toda integração, **uso real = `NAO_VERIFICADO`**.
> Só entra aqui o que tem evidência em `arquivo:linha`. Sem evidência → 🟦, nunca sobe de classificação.
> **Nenhum valor de secret foi copiado** — apenas o NOME das variáveis de ambiente.

Data da varredura: 2026-08-16 · Commit auditado: working tree em `/home/user/singu-v2`

---

## Resumo

Total de integrações de terceiros identificadas: **32**

| Classificação | Qtd | % |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 12 / 32 | 37,5% |
| 🟨 IMPLEMENTADO_PARCIAL | 10 / 32 | 31,3% |
| 🟦 SUGERIDO_OU_INICIADO | 8 / 32 | 25,0% |
| ⬛ MORTO_OU_ABANDONADO | 2 / 32 | 6,3% |

Números de apoio (contados, não estimados):

| Métrica | Valor | Como foi medido |
|---|---|---|
| Edge Functions no repo | 108 | `ls supabase/functions` menos `_shared` |
| EFs que usam `LOVABLE_API_KEY` | 35 | `grep -rl LOVABLE_API_KEY supabase/functions --include=index.ts` |
| EFs que chamam `ai.gateway.lovable.dev` | 33 | idem, por host |
| Hosts externos distintos chamados por EF | 6 | `ai.gateway.lovable.dev`, `api.lovable.dev`, `connector-gateway.lovable.dev`, `api.elevenlabs.io`, `api.firecrawl.dev`, `enrichlayer.com` (+ hosts vindos de env/DB: Evolution, n8n, Supabase externo/legado, endpoints Web Push) |
| Variáveis de ambiente de backend usadas | 22 | `grep -rhoE "Deno\.env\.get\(['\"][A-Z0-9_]+['\"]\)"` + 3 nomes passados como string literal |
| Secrets de backend presentes no `.env.example` | **0 / 22** | `.env.example` só declara `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` |
| Endpoints de entrada (webhook/pixel/público) | 9 | ver seção "Webhooks de entrada" |
| `[functions.*]` em `supabase/config.toml` | **0** | `supabase/config.toml` contém somente `project_id` |

---

## Tabela mestra de integrações

| # | Integração | Classificação | Direção | Implementada em | Secret (nome) | Gatilho | Persistência | Falha tratada? | Evidência / o que falta |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Lovable AI Gateway** (LLM — Gemini/GPT) | ✅ | saída | 33 EFs via `fetchAI` — `supabase/functions/_shared/fetch-utils.ts:42` | `LOVABLE_API_KEY` | UI (`supabase.functions.invoke`) + cron | Tabela por domínio (ex.: `conversation_analyses`, `win_loss_insights`) + telemetria em `ai_gateway_metrics` (`_shared/fetch-utils.ts:137`) | **Parcial** — timeout 45s (`fetch-utils.ts:15,51`), telemetria de erro/timeout/429 (`fetch-utils.ts:68-90`). **Sem retry, sem DLQ, sem circuit breaker.** | Ex.: `ask-crm/index.ts:76`, `generate-insights/index.ts:96`, `conversation-analyzer/index.ts:86`. Uso real: `NAO_VERIFICADO` |
| 2 | **Lovable AI — host divergente** `api.lovable.dev` | 🟨 | saída | `supabase/functions/meeting-summary/index.ts:128` | `LOVABLE_API_KEY` | UI — `src/hooks/useMeetingSummary.ts:51` | `meeting_summaries` (via EF) | Trata 429 (`meeting-summary/index.ts:142`) | **1 de 35 EFs aponta para host diferente** dos outros 33 (`ai.gateway.lovable.dev`). Nenhum outro arquivo usa esse host. Divergência não documentada — provável endpoint errado |
| 3 | **ElevenLabs Scribe (STT)** | ✅ | saída | `supabase/functions/elevenlabs-scribe-token/index.ts:30` | `ELEVENLABS_API_KEY` (`:24`) | UI — `src/hooks/useVoiceAgent.ts:121` | Nenhuma (token efêmero devolvido ao browser) | Erro → 500 genérico (`:40,47`); rate limit 5/min (`:10`); **sem retry** | Probe em `voice-ai-health/index.ts:22` e `system-health/index.ts:103`. Uso real: `NAO_VERIFICADO` |
| 4 | **ElevenLabs TTS** | ✅ | saída | `supabase/functions/elevenlabs-tts/index.ts:47` | `ELEVENLABS_API_KEY` (`:30`) | UI — `src/components/admin/VoiceAITestPanel.tsx:111` | Nenhuma (áudio devolvido ao caller) | Erro → 500 (`:74,87`); rate limit 10/min (`:13`); **sem retry** | Probe em `voice-ai-health/index.ts:55`. Uso real: `NAO_VERIFICADO` |
| 5 | **Evolution API (WhatsApp) — API genérica** | ⬛ | saída | `supabase/functions/evolution-api/index.ts:53-54,384` — 404 linhas, 44 ações em allowlist (`:24-34`) | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` | **NENHUM** — zero chamadores em `src/`, `tests/`, `e2e/`, `scripts/`, migrations | Nenhuma (`grep '\.from('` na função: 0 ocorrências) | Erro → 500 genérico (`:400`); timeout 30s via `fetchAPI` | Busca por `evolution-api`, `evolutionApi`, `evolution_api` em `src/` retorna **0 hits**. Só aparece em documentação (`docs/EDGE_FUNCTIONS_API.md:324`, `docs/RUNBOOK.md:198`). Código completo sem caminho de execução no repo |
| 6 | **Evolution API — envio de lembrete** | 🟨 | saída | `supabase/functions/smart-notify/index.ts:125-133` | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME` (`:129`) | pg_cron a cada 4h — `supabase/migrations/20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql:6-14` | `notification_logs` (`smart-notify/index.ts:156`) | `try/catch` com `console.error` (`:139`); **falha silenciosa — não registra o erro em tabela, não retenta, não vai para DLQ** | **O cron não envia `x-cron-secret`**, mas a EF exige (`smart-notify/index.ts:10` → `_shared/auth.ts:270-281`). Ver Achado A-1 |
| 7 | **Evolution API — webhook de entrada** | ✅ | entrada-webhook | `supabase/functions/evolution-webhook/index.ts` (606 linhas) | `EVOLUTION_API_SECRET` (string literal em `:20`) | Evolution API externa (POST) | `whatsapp_messages` (`:314`), `whatsapp_instances` (`:142`), `contacts` (`:106`), `interactions` (`:409`), `whatsapp_ingestion_logs` (`:320,338,358`) | **Autenticado** via `requireWebhookSecret(req,'EVOLUTION_API_SECRET','apikey')` (`:20`); rate limit 200/min/IP (`:5`); body ≤5MB (`:23`). **Sem DLQ e sem retry** — erro devolve 500 e o evento se perde (`:66-71`) | Roteia 7 tipos de evento (`:39-63`); eventos desconhecidos são ignorados silenciosamente (`:65`). Uso real: `NAO_VERIFICADO` |
| 8 | **Firecrawl (web scraping)** | ✅ | saída | `firecrawl-scrape/index.ts:45`, `social-profile-scraper/index.ts:159`, `social-events-detector/index.ts:113` | `FIRECRAWL_API_KEY` (`firecrawl-scrape:40`, `social-profile-scraper:137`, `social-events-detector:39`) | UI — `src/hooks/useEdgeFunctionActions.ts:50,44`; `social-events-detector` também por cron (`:35`) | `social_profiles` (`social-profile-scraper:221`), `social_life_events` (`:281`), `social_scraping_schedule` (`:169,267`), `suggested_rapport_intel` (`:275`). `firecrawl-scrape` **não persiste** | Falta de chave → 500 explícito (`firecrawl-scrape:41-42`); timeout 90s via `fetchScrape` (`_shared/fetch-utils.ts:163`). **Sem retry, sem DLQ** | Uso real: `NAO_VERIFICADO` |
| 9 | **EnrichLayer (enriquecimento LinkedIn)** | ✅ | saída | `supabase/functions/enrichlayer-linkedin/index.ts:97` | `ENRICHLAYER_API_KEY` (`:89`) | UI — `src/hooks/useEdgeFunctionActions.ts:47` | `social_profiles` (`:145`) | Falta de chave → 500 (`:90-92`); parse inválido → 500 (`:115`); rate limit 10/min (`:59`). **Upsert de persistência é fire-and-forget: erro só vai para `console.error`** (`:147`) | Uso real: `NAO_VERIFICADO` |
| 10 | **Twilio (SMS)** — via `connector-gateway.lovable.dev` | 🟨 | saída | `supabase/functions/send-sms-campaign/index.ts:7,138-146` | `TWILIO_API_KEY` (`:108`) + `LOVABLE_API_KEY` (`:107`) | UI — `src/hooks/useSmsCampaigns.ts:106` | `sms_campaign_recipients`, `sms_campaigns` (`:117,176`) | Sem provedor → marca **todos** os destinatários como `failed` (`:120-126`); erro por mensagem → linha `failed` (`:148,155`). **Sem retry, sem DLQ, sem backoff** | `TWILIO_API_KEY` **não está em `.env.example` nem no inventário de secrets do `docs/RUNBOOK.md:402-414`**. Envio é loop sequencial sem paralelismo nem rate-limit do provedor. Uso real: `NAO_VERIFICADO` |
| 11 | **Bitrix24 — webhook de entrada (chamadas)** | ✅ | entrada-webhook | `supabase/functions/bitrix24-webhook/index.ts` (187 linhas) | `BITRIX24_WEBHOOK_SECRET` (string literal em `:40`) | Bitrix24 externo (POST, JSON ou form-urlencoded — `:59-82`) | `interactions` (`:162`) | **Autenticado** via `requireWebhookSecret(...,'x-bitrix24-secret')` (`:40`); rate limit 100/min/IP (`:6`); body ≤512KB (`:52-54`). **Sem DLQ e sem retry** — erro devolve 500 e o evento se perde (`:183-186`) | Contato não encontrado → `skipped` silencioso (`:121-128`). Header no código é `x-bitrix24-secret`, doc diz `x-bitrix-secret` (ver Contradições) |
| 12 | **Bitrix24 — teste de conexão (saída)** | 🟨 | saída | `supabase/functions/connection-tester/index.ts:197-208` (`testBitrix`) | Nenhum (URL vem de `connection_configs`) | UI — `src/hooks/useConnections.ts:125` | `connection_configs`, `connection_test_logs` (`:332,338`) | Guarda SSRF: allowlist de CIDR + `redirect:"error"` (`:37,162-171`); corpo da resposta descartado (`:207`) | **Só faz `GET /profile.json` de teste.** Não existe nenhuma escrita/sincronização de dados para o Bitrix24 no repo — a integração de saída é apenas health-check |
| 13 | **n8n / Lux Intelligence** | ✅ | bidirecional | Saída: `lux-trigger/index.ts:155-171` · Entrada: `lux-webhook/index.ts` (143 linhas) | `N8N_LUX_WEBHOOK_URL` (fallback — `lux-trigger:117`), `LUX_WEBHOOK_SECRET` (`lux-webhook:18`) | Saída: UI — `src/hooks/useLuxIntelligence.ts:141` · Entrada: n8n externo | `lux_intelligence` (`lux-trigger:132`, `lux-webhook:73`); config em `lux_webhook_config` (`lux-trigger:110`) | **Melhor caso do repo:** retry com backoff exponencial até 16s (`lux-trigger:26-52`), timeout configurável (`:118`), status `error` gravado no registro após esgotar retries (`:173-179`) | Entrada autenticada por `x-lux-secret` (`lux-webhook:18`). **Ainda sem DLQ** — se o retry esgota, não há reprocessamento automático. Uso real: `NAO_VERIFICADO` |
| 14 | **Supabase externo (federação de dados)** | ✅ | saída | `external-data/index.ts:157-158,243-261,289`; `enrich-contacts/index.ts:38-39`; `territory-optimization`, `health`, `health-aggregate:33-34`, `system-health:34-35`, `email-pipeline-health` | `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`, `EXTERNAL_SUPABASE_ANON_KEY` | UI — `src/hooks/useExternalLookup.ts:9,33`; `src/components/admin/AdminQuickActions.tsx:79` | Escreve na base externa (`external-data:459,474,493,516`) | Timeout 30s via `fetchAPI` (`_shared/fetch-utils.ts:171`); optimistic locking com 409 (`external-data:493`, `_shared/auth.ts:147`). **Sem retry, sem DLQ** | 8 EFs dependem desse par de secrets. Uso real: `NAO_VERIFICADO` |
| 15 | **Supabase LEGADO (dual-write de migração)** | ⬛ | saída | `supabase/functions/dual-write-proxy/index.ts:26-34` | `LEGACY_SUPABASE_URL`, `LEGACY_SERVICE_ROLE_KEY`, `DUAL_WRITE_TABLES` (`:5-7`) | **NENHUM** — zero chamadores | Escreve tabelas whitelisted na base legada | Sem secrets → devolve `{ok:false, reason:"legacy-disabled"}` com **HTTP 200** (`:20`) — falha invisível para o chamador | **`dual-write-proxy/index.ts:2` importa `npm:@supabase/supabase-js@2/cors`, subpath que o pacote não exporta → o módulo não resolve e a função não sobe.** Sem autenticação nenhuma no handler (`:16-22`). Só citada em `docs/MIGRATION_MASTER_RUNBOOK.md:161` |
| 16 | **Webhooks genéricos de entrada** (Bitrix/n8n/Stripe/GitHub/form) | ✅ | entrada-webhook | `supabase/functions/incoming-webhook/index.ts` (274 linhas) | Segredo **por webhook**, em `incoming_webhooks.webhook_secret` (`:125`) — não é env var | Qualquer sistema externo (POST com token em path ou `x-webhook-token` — `:70-72`) | Tabela-alvo de `contacts`/`companies`/`deals`/`interactions`/`notes` (`:205-222`); logs em `incoming_webhook_logs` (`:249`); quota via RPC (`:172`) | **Melhor tratamento de falha do repo:** insere em `incoming_webhook_dlq` com `next_retry_at` (`:227-234`), drenado por `process-webhook-dlq` (cron — `:27`, backoff/abandono em `:156-159`) | **HMAC é OPCIONAL** — só valida se `webhook.require_signature` for verdadeiro (`:114`). Ver Achado A-2 |
| 17 | **MCP Server (Claude) — entrada** | ✅ | entrada-webhook | `supabase/functions/mcp-server/index.ts` (JSON-RPC 2.0) | Token em `connection_configs.mcp_claude.config.token` (`:8`), header `x-mcp-token` (`:139`) | Cliente MCP externo (Claude) | Lê/escreve `contacts`, `companies`, `deals`, `interactions` (`:47,58,67,82,87,107,113`); log em `mcp_tool_calls` (`:9`) | Rate limit 120/min/token (`:12`); payload validado com Zod (`:2`) | URL exposta na UI: `src/components/admin/conexoes/McpInstructionsCard.tsx:8`. Injeção de filtro PostgREST já reportada em `docs/auditoria/01_ACHADOS_SEGURANCA.md:43-44` |
| 18 | **MCP Claude — teste de conexão (saída)** | 🟨 | saída | `supabase/functions/connection-tester/index.ts:227-249` (`testMcpClaude`) | Nenhum (URL vem de `connection_configs`) | UI — `src/hooks/useConnections.ts:125` | `connection_test_logs` (`:338`) | SSRF guard compartilhado (`:162-171`) | Só faz `initialize` JSON-RPC. Nenhum consumo real de servidor MCP externo no repo |
| 19 | **Web Push (FCM / Mozilla autopush / WNS)** | 🟨 | saída | `supabase/functions/send-push-notification/index.ts:42-50` | **Nenhum** — não existe `VAPID_PRIVATE_KEY` em nenhum arquivo do repo | `check-notifications/index.ts:175` (fetch para `functions/v1/send-push-notification`) | `push_subscriptions` (`:117`) | 404/410 → marca assinatura como expirada (`:53-56`) | **Envia o payload como JSON puro com header `Content-Encoding: aes128gcm` sem criptografar e sem assinatura VAPID** (`:42-50`) — serviços de push rejeitam. A chave pública em `src/lib/pushNotifications.ts:6` está hard-coded no fonte. `docs/RUNBOOK.md:410` lista `VAPID_PRIVATE_KEY`/`VAPID_PUBLIC_KEY` como secrets, mas **nenhum código os lê** |
| 20 | **Nominatim / OpenStreetMap (geocoding)** | 🟨 | saída | `src/pages/mapa/geocoding.ts:8` | Nenhum (API pública) | UI (página de mapa) | Não persiste | Sem retry, sem cache visível, sem tratamento de rate limit do Nominatim | Chamada direta do browser. **Viola a política de uso do Nominatim** (exige User-Agent identificável e ≤1 req/s) — sem mitigação no código |
| 21 | **ipapi.co (geolocalização por IP)** | 🟨 | saída | `src/hooks/useIPValidation.ts:16` | Nenhum (tier gratuito) | UI (validação de acesso) | Não persiste diretamente | Timeout de 5s via `AbortSignal.timeout(5000)` (`:16`); sem retry | Chamada do browser para terceiro não declarado em nenhuma documentação de integrações |
| 22 | **cdnjs.cloudflare.com (assets Leaflet)** | 🟨 | saída | `src/pages/MapaEmpresas.tsx:29-31`, `src/pages/mapa/MapMarkerCluster.tsx:6` | Nenhum | UI (render do mapa) | N/A | Sem fallback local — CDN fora do ar quebra os marcadores | Dependência de CDN de terceiro não inventariada |
| 23 | **Lovable Cloud Auth (OAuth Google/Apple)** | ✅ | saída | `src/integrations/lovable/index.ts:14-35` (`@lovable.dev/cloud-auth-js`) | Nenhum no repo (gerido pela plataforma) | UI — `src/pages/Auth.tsx:198` | Sessão via `supabase.auth.setSession` (`index.ts:31`) | Erros do OAuth propagados ao caller (`:24-33`) | Arquivo marcado como auto-gerado (`:1`). Provider "apple" está tipado (`:14`) mas **não há botão de Apple na UI** — só Google (`Auth.tsx:198`) |
| 24 | **Intent Pixel (rastreamento de sites de terceiros)** | 🟨 | entrada-webhook | `intent-tracker/index.ts` (134 linhas) + snippet servido por `intent-pixel-snippet/index.ts:25` | Nenhum — autenticação por `pixel_key` no corpo (`intent-tracker:26`) | Sites externos que embutem o snippet (`src/components/intent/PixelSetupCard.tsx:24`) | `intent_signals` (`:95`), `intent_tracking_pixels` (`:70,120`) | Rate limit 60/min/IP (`:6`); payload validado com Zod (`:26-35`) | **Sem assinatura e sem verificação de origem** — quem descobrir um `pixel_key` (que vai no HTML público do cliente) injeta sinais falsos de intenção. Ver Achado A-3 |

---

## Integrações apenas PLANEJADAS ou SUGERIDAS (sem código)

| # | Integração | Onde foi prometida (`doc:linha`) | O que existe hoje | Veredito |
|---|---|---|---|---|
| 25 | **Resend (e-mail transacional)** | `src/hooks/useWeeklyReport.ts:206` — toast diz "Verifique se o **Resend** está configurado" | **Zero código.** `grep -rn "resend\|Resend\|smtp\|nodemailer" supabase/functions/ src/` retorna apenas esse toast. `supabase/functions/sequence-processor/index.ts:337` chama `supabase.functions.invoke('send-transactional-email', ...)` — **essa Edge Function não existe** em `supabase/functions/` (`ls` confirma). O catch em `:346` engole o erro com `console.warn` | 🟦 **A UI promete envio de e-mail que o backend não faz.** Ver Achado A-4 |
| 26 | **Proxycurl (`PROXYCURL_API_KEY`)** | `HANDOFF.md:127` — tabela "Integrações Externas", linha `Proxycurl · PROXYCURL_API_KEY · Social profile scraping` | **Zero código.** `grep -rn PROXYCURL .` retorna só essa linha do HANDOFF. `social-profile-scraper` usa **Firecrawl**, não Proxycurl | 🟦 Documentação desatualizada ou integração abandonada antes de existir |
| 27 | **Google AI Studio direto (`GEMINI_API_KEY`)** | `docs/RUNBOOK.md:405` — "`GEMINI_API_KEY` (legado) · Google AI Studio · Anual" | **Zero código.** Nenhuma EF lê `GEMINI_API_KEY`. Todo acesso a Gemini passa pelo Lovable AI Gateway | 🟦 Secret fantasma no inventário de rotação |
| 28 | **Stripe** | `CHANGELOG.md:99`; `src/components/admin/conexoes/webhookTemplates.ts:62-74` (`stripe-customer-created`) | Apenas um **template de mapeamento de campos** para o `incoming-webhook` genérico. Nenhum SDK, nenhuma chave, nenhuma validação de assinatura Stripe (`Stripe-Signature`) | 🟦 É preset de UI, não integração |
| 29 | **GitHub** | `CHANGELOG.md:99`; `src/components/admin/conexoes/webhookTemplates.ts:78` (`github-issue-opened`) | Idem — só template de mapeamento. Sem validação de `X-Hub-Signature-256` | 🟦 É preset de UI, não integração |
| 30 | **Slack (alertas)** | `monitoring/alertmanager/alertmanager.yml:29-31,36-38`; `.lovable/memory/index.md:18` | Config do Alertmanager com `api_url: 'https://hooks.slack.com/services/REPLACE_ME'` — **placeholder literal**. Fora do runtime da aplicação (infra separada, não versionada como deploy) | 🟦 Não configurado |
| 31 | **PagerDuty (alertas)** | `monitoring/alertmanager/alertmanager.yml:42-43`; `docs/adr/019-external-observability-alerting.md` | Receiver `pagerduty-db` declarado, sem `service_key` real | 🟦 Não configurado |
| 32 | **Bitrix24 — sincronização de saída (CRM ↔ CRM)** | `docs/HARDENING_PHASE3_FINAL.md:82` — "update: Bitrix24 outbound webhook"; `.lovable/memory/features/connections-module.md:19` | Só o health-check `testBitrix` (item 12). Não existe código que **escreva** leads/deals no Bitrix24 | 🟦 Prometido pela narrativa do módulo de conexões, inexistente |

---

## Webhooks de entrada

| Endpoint | Autenticado? | Mecanismo | Evidência `arquivo:linha` |
|---|---|---|---|
| `evolution-webhook` | ✅ Sim | Segredo compartilhado no header `apikey`, comparação timing-safe | `evolution-webhook/index.ts:20` → `_shared/auth.ts:333-348` |
| `bitrix24-webhook` | ✅ Sim | Segredo no header `x-bitrix24-secret`, timing-safe | `bitrix24-webhook/index.ts:40` |
| `lux-webhook` | ✅ Sim | Segredo no header `x-lux-secret`, timing-safe | `lux-webhook/index.ts:18` |
| `mcp-server` | ✅ Sim | Token `x-mcp-token` resolvido em `connection_configs` | `mcp-server/index.ts:139` |
| `incoming-webhook` | 🟨 **Condicional** | Token obrigatório (`:92`) + HMAC SHA-256 com anti-replay **apenas se `require_signature` = true** (`:114-144`) | `incoming-webhook/index.ts:92,114,125` |
| `intent-tracker` | ❌ **Não** | Só `pixel_key` no corpo — chave pública, embutida no HTML do site do cliente | `intent-tracker/index.ts:26,70`; `src/components/intent/PixelSetupCard.tsx:24` |
| `form-submit-handler` | ❌ **Não** (por desenho) | Público. Rate limit 5/min/IP + `slug` resolvido via RPC `submit_public_form` | `form-submit-handler/index.ts:5,45-52` |
| `sequence-track` | ❌ **Não** (por desenho) | Pixel/redirect por `tracking_token` de uso único na query string | `sequence-track/index.ts:25,39-41` |
| `get-signature` / `deal-room-buyer-view` | ❌ **Não** (por desenho) | Token opaco (≥16 chars) na query/body | `get-signature/index.ts:32-34`; `deal-room-buyer-view/index.ts:21,30` |
| `dual-write-proxy` | ❌ **Não** | **Nenhuma verificação de identidade no handler** — qualquer POST é aceito | `dual-write-proxy/index.ts:16-22` (mitigado só porque o módulo não sobe — ver item 15) |

> ⚠️ **`supabase/config.toml` contém apenas `project_id`** — nenhuma seção `[functions.*]`, portanto **nenhum flag `verify_jwt` está versionado**. Se a proteção desses endpoints públicos depende de `verify_jwt = false/true` configurado fora do repo, isso não é auditável aqui e é ponto de deriva de configuração.

---

## Inventário completo de secrets usados

Backend (Edge Functions):

| Variável de ambiente | Funções que a usam | Está no `.env.example`? |
|---|---|---|
| `SUPABASE_URL` | 112 ocorrências, quase todas as EFs | ❌ Não (injetada pela plataforma) |
| `SUPABASE_SERVICE_ROLE_KEY` | 88 ocorrências | ❌ Não (injetada pela plataforma) |
| `SUPABASE_ANON_KEY` | 29 ocorrências | ❌ Não (injetada pela plataforma) |
| `SUPABASE_DB_URL` | `email-pipeline-health` | ❌ Não |
| `LOVABLE_API_KEY` | **35 EFs** (`ask-crm`, `ai-assistant`, `generate-insights`, `conversation-analyzer`, `send-sms-campaign`, `meeting-summary`, … ) | ❌ **Não** |
| `ELEVENLABS_API_KEY` | `elevenlabs-tts`, `elevenlabs-scribe-token`, `voice-ai-health`, `health-aggregate`, `system-health` | ❌ **Não** |
| `EVOLUTION_API_URL` | `evolution-api`, `smart-notify`, `health-aggregate`, `system-health` | ❌ **Não** |
| `EVOLUTION_API_KEY` | `evolution-api`, `smart-notify`, `health-aggregate`, `system-health` | ❌ **Não** |
| `EVOLUTION_INSTANCE_NAME` | `smart-notify` | ❌ **Não** |
| `EVOLUTION_API_SECRET` *(literal em `evolution-webhook/index.ts:20`)* | `evolution-webhook` | ❌ **Não** |
| `FIRECRAWL_API_KEY` | `firecrawl-scrape`, `social-profile-scraper`, `social-events-detector` | ❌ **Não** |
| `ENRICHLAYER_API_KEY` | `enrichlayer-linkedin` | ❌ **Não** |
| `TWILIO_API_KEY` | `send-sms-campaign` | ❌ **Não** |
| `N8N_LUX_WEBHOOK_URL` | `lux-trigger` (fallback de `lux_webhook_config`) | ❌ **Não** |
| `LUX_WEBHOOK_SECRET` *(literal em `lux-webhook/index.ts:18`)* | `lux-webhook` | ❌ **Não** |
| `BITRIX24_WEBHOOK_SECRET` *(literal em `bitrix24-webhook/index.ts:40`)* | `bitrix24-webhook` | ❌ **Não** |
| `CRON_SECRET` | `_shared/auth.ts:271` → 28 EFs de cron; `connection-anomaly-detector` | ❌ **Não** |
| `EXTERNAL_SUPABASE_URL` | `external-data`, `enrich-contacts`, `territory-optimization`, `evolution-webhook`, `health`, `health-aggregate`, `email-pipeline-health`, `system-health` | ❌ **Não** |
| `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | as mesmas 8 EFs acima | ❌ **Não** |
| `EXTERNAL_SUPABASE_ANON_KEY` | `external-data` | ❌ **Não** |
| `LEGACY_SUPABASE_URL` | `dual-write-proxy` | ❌ **Não** |
| `LEGACY_SERVICE_ROLE_KEY` | `dual-write-proxy` | ❌ **Não** |
| `DUAL_WRITE_TABLES` | `dual-write-proxy` | ❌ **Não** |
| `TEST_USER_JWT` | `external-data/optimistic-locking_test.ts` (só teste) | ❌ **Não** |

Frontend (build-time):

| Variável | Onde | Está no `.env.example`? |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts`, hooks com `fetch` direto | ✅ Sim (`.env.example:12`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/client.ts` | ✅ Sim (`.env.example:16`) |
| `VITE_SUPABASE_PROJECT_ID` | `src/components/admin/conexoes/McpInstructionsCard.tsx:8` | ✅ Sim (`.env.example:19`) |
| `VITE_SUPABASE_ANON_KEY` | usado no CI (`.github/workflows/ci.yml:68`) | ❌ **Não** — nome divergente de `VITE_SUPABASE_PUBLISHABLE_KEY` |

**Resultado: 0 dos 22 secrets de backend estão declarados no `.env.example`.** Um novo integrador não tem como saber, a partir do repo, quais chaves precisa provisionar — precisa fazer engenharia reversa de 108 Edge Functions.

---

## Achados

### A-1 · 🔴 CRÍTICO — Cron chama Edge Functions sem o header que elas exigem
`supabase/migrations/20260512105729_...sql:6-14` agenda `smart-notify` a cada 4h e envia **apenas** `Authorization: Bearer <service_role>`.
`supabase/migrations/20260417120721_...sql:14-22` agenda `validation-queue-worker` a cada 5min, idem.
Mas ambas as funções abortam com 401 se faltar `x-cron-secret`:
- `supabase/functions/smart-notify/index.ts:10` → `_shared/auth.ts:270-281`
- `supabase/functions/validation-queue-worker/index.ts:24`

Nenhuma migration em `supabase/migrations/` injeta `x-cron-secret` (`grep -rn "x-cron-secret" supabase/migrations/` → 0 hits). Consequência provável: **os dois jobs falham em todo disparo, silenciosamente** — o `net.http_post` do pg_net não propaga erro. Impacto de negócio: notificações WhatsApp de lembrete e a fila de validação de e-mail/telefone nunca rodam. Existe tabela `cron_secrets` (`supabase/migrations/20260712223208_...sql:1-23`), mas apenas com a chave `behavioral_rebatch` — nenhum cron a consulta nos SQLs versionados. **Runtime: `NAO_VERIFICADO`.**

### A-2 · 🔴 CRÍTICO — Webhook de entrada genérico aceita payload sem assinatura por padrão
`supabase/functions/incoming-webhook/index.ts:114` — a verificação HMAC só ocorre `if (webhook.require_signature)`. Se a flag da linha em `incoming_webhooks` for falsa/nula, **basta conhecer o token** (que trafega na URL, aparece em logs de proxy, histórico de browser e no snippet gerado por `WebhookSnippetsSheet`) para inserir linhas arbitrárias em `contacts`, `companies`, `deals`, `interactions` ou `notes` (`:205-222`), com `user_id` forçado para o criador do webhook (`:221`). Não há default seguro no código nem constraint no schema que force `require_signature = true`. Não posso verificar quantos webhooks reais estão com a flag desligada (sem acesso ao banco).

### A-3 · 🟠 ALTO — Pixel de intent aceita sinais forjados
`supabase/functions/intent-tracker/index.ts:26,70` autentica só pelo `pixel_key`, que por definição é público (embutido no `<script src=...?k=...>` gerado em `src/components/intent/PixelSetupCard.tsx:24`). Qualquer pessoa que veja o HTML do site do cliente pode injetar `intent_signals` com peso alto (`demand_signal: 10` em `intent-tracker/index.ts:15-24`), envenenando o scoring de MQL e as decisões comerciais derivadas. Sem assinatura, sem verificação de `Origin`/`Referer`, sem nonce.

### A-4 · 🟠 ALTO — Envio de e-mail é encenado, não executado
Três lugares fingem enviar e-mail:
1. `supabase/functions/smart-notify/index.ts:142-146` — grava `channel: 'email'` em `notification_logs`, incrementa `stats.notificationsSent++` e loga `"Email notification sent to ..."`. **Não existe nenhuma chamada de rede.** A telemetria fica falsa.
2. `supabase/functions/sequence-processor/index.ts:322-333,337` — grava `sequence_send_log` com `status: 'sent'` **antes** de tentar enviar, e depois invoca `send-transactional-email` — **Edge Function que não existe no repositório**. O catch em `:346` degrada para `console.warn`. Métricas de sequência reportam entregas que nunca saíram.
3. `supabase/functions/weekly-digest/index.ts:226` — a função `generateEmailHtml` é definida e **nunca chamada** (grep: 1 hit, a própria definição). O registro é gravado com `sent_via: ['system']` (`:194`). A UI em `src/hooks/useWeeklyReport.ts:191-206` oferece "Enviar email de teste" e sugere ao usuário conferir "se o **Resend** está configurado" — provedor sem uma linha de código no repo.

### A-5 · 🟠 ALTO — Segredo de terceiro real hard-coded em migration versionada
`supabase/migrations/20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql:18` embute um JWT `anon` completo dentro do corpo do `cron.schedule`, em texto claro, no git. *(Valor não reproduzido aqui, conforme regra.)* A mesma linha aponta para um **project ref diferente** do declarado em `supabase/config.toml` (`project_id = "hjhthvzwtvwgdrochcam"` vs. o host da migration) — indício de migration copiada de outro ambiente e nunca corrigida. Rotacionar a anon key desse projeto e reescrever a migration.

### A-6 · 🟠 ALTO — `dual-write-proxy` não sobe e não autentica
`supabase/functions/dual-write-proxy/index.ts:2` importa `npm:@supabase/supabase-js@2/cors`, subpath inexistente no pacote → o módulo não resolve. O mesmo import quebrado está em `supabase/functions/clear-must-reset-flag/index.ts:16`. Além disso, o handler de `dual-write-proxy` (`:16-22`) **não valida JWT, nem cron secret, nem webhook secret** — se o import fosse corrigido, viraria um endpoint público que escreve na base legada. E `:20` devolve HTTP 200 quando os secrets faltam, tornando a desativação indistinguível de sucesso.

### A-7 · 🟡 MÉDIO — Nenhuma integração de saída tem retry, exceto `lux-trigger`
| Padrão | Onde |
|---|---|
| Retry com backoff | **Só** `lux-trigger/index.ts:26-52` |
| DLQ | **Só** `incoming-webhook/index.ts:227` → `process-webhook-dlq` |
| Circuit breaker | **Nenhum** — `grep -rn "circuitBreaker\|CircuitBreaker" supabase/functions/` → 0 hits, apesar de `docs/adr/003-circuit-breaker-pattern.md` existir |
| Timeout | ✅ Universal via `_shared/fetch-utils.ts:15-18,30-36` |

Ou seja: uma indisponibilidade de 30s no Lovable AI Gateway, ElevenLabs, Firecrawl, EnrichLayer, Twilio ou Evolution API **perde a operação em definitivo**, sem reprocessamento. O único amortecedor é o timeout, que apenas evita travar o isolate.

### A-8 · 🟡 MÉDIO — Web Push implementado sem VAPID nem criptografia
`supabase/functions/send-push-notification/index.ts:42-50` declara `Content-Encoding: aes128gcm` e envia o corpo **em JSON claro, sem cifrar e sem header `Authorization: vapid t=..., k=...`**. Nenhum arquivo do repo lê `VAPID_PRIVATE_KEY`. A chave pública está hard-coded em `src/lib/pushNotifications.ts:6`. Serviços de push (FCM, Mozilla autopush) rejeitam requisições nesse formato — a integração está sintaticamente presente e funcionalmente inerte.

### A-9 · 🟡 MÉDIO — `evolution-api` é código morto com superfície de ataque
404 linhas, 44 ações incluindo `delete-instance`, `create-group`, `set-webhook` (`evolution-api/index.ts:24-34`), autenticada só por JWT de usuário comum (`:46`, `withAuth`) — **sem checagem de papel/admin**. Zero chamadores no repositório. Ou remove-se, ou adiciona-se autorização por papel antes de expor essas ações destrutivas a qualquer usuário autenticado.

### A-10 · 🟡 MÉDIO — Zero secrets de backend documentados no `.env.example`
Ver inventário acima. 22 variáveis exigidas em runtime, 0 declaradas. Onboarding e disaster recovery dependem de conhecimento tácito.

### A-11 · 🔵 BAIXO — Host divergente no gateway de IA
`meeting-summary/index.ts:128` usa `api.lovable.dev` enquanto as outras 33 EFs usam `ai.gateway.lovable.dev`. Se o host correto for o segundo, essa função retorna erro em 100% das chamadas — e o usuário vê a mensagem genérica de `:142`.

### A-12 · 🔵 BAIXO — Terceiros no frontend fora de qualquer inventário
`ipapi.co` (`src/hooks/useIPValidation.ts:16`), `nominatim.openstreetmap.org` (`src/pages/mapa/geocoding.ts:8`) e `cdnjs.cloudflare.com` (`src/pages/MapaEmpresas.tsx:29-31`) recebem tráfego direto do browser do usuário. Nenhum aparece em `HANDOFF.md`, `ARCHITECTURE.md` ou `docs/RUNBOOK.md`. Implicação de LGPD: o IP do usuário vai para `ipapi.co` sem menção em política de privacidade encontrável no repo.

---

## Contradições com a documentação existente

| # | Documentação diz | Código diz | Evidência |
|---|---|---|---|
| C-1 | `BITRIX24_WEBHOOK_SECRET` usa o header **`x-bitrix-secret`** | Header é **`x-bitrix24-secret`** | `docs/HARDENING_PHASE3_FINAL.md:75` vs `supabase/functions/bitrix24-webhook/index.ts:40` |
| C-2 | Existe secret **`EVOLUTION_WEBHOOK_SECRET`** com header `x-evolution-secret` | A EF usa **`EVOLUTION_API_SECRET`** no header **`apikey`**. `EVOLUTION_WEBHOOK_SECRET` não aparece em nenhum arquivo `.ts` | `docs/HARDENING_PHASE3_FINAL.md:76` e `docs/HARDENING_PHASE2_20260410.md:43` vs `supabase/functions/evolution-webhook/index.ts:20` |
| C-3 | **Proxycurl** é uma integração ativa com `PROXYCURL_API_KEY` | Zero código; scraping social usa Firecrawl | `HANDOFF.md:127` vs `supabase/functions/social-profile-scraper/index.ts:137,159` |
| C-4 | `GEMINI_API_KEY` está no inventário de rotação de secrets | Nenhuma EF lê essa variável | `docs/RUNBOOK.md:405` vs busca vazia em `supabase/functions/` |
| C-5 | `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` são secrets a rotacionar a cada 2 anos | Nenhum código lê `VAPID_*`; a pública está hard-coded no fonte do frontend | `docs/RUNBOOK.md:410` vs `src/lib/pushNotifications.ts:6` |
| C-6 | Inventário de secrets do RUNBOOK é a fonte de verdade | **Faltam** `TWILIO_API_KEY`, `LEGACY_SUPABASE_URL`, `LEGACY_SERVICE_ROLE_KEY`, `DUAL_WRITE_TABLES`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_API_SECRET`, `N8N_LUX_WEBHOOK_URL`, `SUPABASE_DB_URL` | `docs/RUNBOOK.md:402-414` vs inventário acima |
| C-7 | `evolution-api` é integração de produção, com rate limit documentado | Sem nenhum chamador no repositório | `docs/EDGE_FUNCTIONS_API.md:25,324` e `docs/RUNBOOK.md:198` vs busca vazia em `src/` |
| C-8 | `AUDITORIA_COMPLETA_SISTEMA.md` recomenda "implementar `requireWebhookSecret` com `EVOLUTION_API_SECRET`" no `evolution-webhook` | **Já está implementado** — documento de auditoria desatualizado | `AUDITORIA_COMPLETA_SISTEMA.md:73` vs `supabase/functions/evolution-webhook/index.ts:20` |
| C-9 | `docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md:21-22` afirma que `whatsapp-import` não sobe por importar `.../cors` | `whatsapp-import` **já foi corrigido** (importa de `_shared/auth.ts`). O import quebrado persiste em `dual-write-proxy:2` e `clear-must-reset-flag:16` — que o documento não menciona | `supabase/functions/whatsapp-import/index.ts:3` |
| C-10 | `ARCHITECTURE.md:48-52` desenha as integrações como 5 caixas (external-data, n8n, AI Gateway, Evolution, ElevenLabs) | São **24** integrações com código, incluindo Twilio, Firecrawl, EnrichLayer, MCP, Web Push, Nominatim, ipapi, Bitrix24 | `ARCHITECTURE.md:46-53` vs tabela mestra |
| C-11 | `README.md:133` — "webhooks com secret, cron com `CRON_SECRET`" | Verdadeiro para 4 dos 9 endpoints de entrada; **o cron versionado não envia `CRON_SECRET`** (Achado A-1) | `README.md:133` vs `supabase/migrations/20260512105729_...sql:11` |

---

## Arquivos que inspecionei

**Configuração e ambiente**
`.env.example` · `supabase/config.toml` · `.github/workflows/ci.yml` · `package.json` (listagem)

**Módulo compartilhado das Edge Functions**
`supabase/functions/_shared/fetch-utils.ts` (integral) · `_shared/auth.ts` (integral) · `_shared/aiGatewayLogger.ts` (integral) · `_shared/email-verify.ts` · `_shared/rate-limit.ts` (referências) · `_shared/tracing.ts` (referências) · `_shared/email-templates/` (listagem)

**Edge Functions lidas integral ou parcialmente**
`bitrix24-webhook` · `incoming-webhook` · `evolution-webhook` · `evolution-api` · `lux-trigger` · `lux-webhook` · `form-submit-handler` · `process-webhook-dlq` · `send-sms-campaign` · `send-push-notification` · `smart-notify` · `sequence-processor` · `sequence-track` · `weekly-digest` · `intent-tracker` · `intent-pixel-snippet` · `mcp-server` · `connection-tester` · `connection-introspect` · `dual-write-proxy` · `whatsapp-import` · `elevenlabs-tts` · `elevenlabs-scribe-token` · `voice-ai-health` · `voice-to-text` · `firecrawl-scrape` · `social-profile-scraper` · `social-events-detector` · `enrichlayer-linkedin` · `enrich-contacts` · `external-data` · `email-verifier` · `email-finder` · `phone-validator` · `health-aggregate` · `system-health` · `email-pipeline-health` · `meeting-summary` · `check-notifications` · `client-notifications` · `nurturing-runner` · `get-signature` · `deal-room-buyer-view` · `validate-access` · `detect-new-device` · `audit-analytics` · `clear-must-reset-flag`

**Frontend**
`src/integrations/lovable/index.ts` · `src/integrations/supabase/` (listagem) · `src/hooks/useWeeklyReport.ts` · `src/hooks/useIPValidation.ts` · `src/hooks/useEdgeFunctionActions.ts` · `src/hooks/useLuxIntelligence.ts` · `src/hooks/useSmsCampaigns.ts` · `src/hooks/useConnections.ts` · `src/hooks/useVoiceAgent.ts` · `src/hooks/useExternalLookup.ts` · `src/hooks/useWhatsAppImport.ts` · `src/hooks/useMeetingSummary.ts` · `src/lib/pushNotifications.ts` · `src/pages/Auth.tsx` · `src/pages/mapa/geocoding.ts` · `src/pages/MapaEmpresas.tsx` · `src/pages/mapa/MapMarkerCluster.tsx` · `src/components/admin/conexoes/webhookTemplates.ts` · `src/components/admin/conexoes/McpInstructionsCard.tsx` · `src/components/intent/PixelSetupCard.tsx` · `src/components/admin/VoiceAITestPanel.tsx`

**Migrations**
`20260512105729_9e0ffd45-...sql` · `20260417120721_823eaa43-...sql` · `20260712223208_00845b35-...sql` · `20260726144422_a6bd4ac3-...sql` · `20260723152932_9ebcb761-...sql` · varredura de `cron.schedule` e `net.http_post` em todo `supabase/migrations/`

**Documentação**
`HANDOFF.md` · `README.md` · `ARCHITECTURE.md` · `CHANGELOG.md` · `FUNCIONALIDADES_SISTEMA.md` · `AUDITORIA_COMPLETA_SISTEMA.md` · `docs/RUNBOOK.md` · `docs/EDGE_FUNCTIONS_API.md` · `docs/HARDENING_PHASE2_20260410.md` · `docs/HARDENING_PHASE3_FINAL.md` · `docs/MIGRATION_EDGE_FUNCTIONS.md` · `docs/MIGRATION_MASTER_RUNBOOK.md` · `docs/auditoria/01_ACHADOS_SEGURANCA.md` · `docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md` · `docs/adr/013`, `docs/adr/019` (referências) · `.lovable/memory/index.md` · `.lovable/memory/features/*.md`

**Infraestrutura**
`monitoring/alertmanager/alertmanager.yml` · `monitoring/prometheus/rules/*.yml` (listagem)

---

## Lacunas: o que NÃO verifiquei e por quê

| # | Não verificado | Por quê | Como fechar |
|---|---|---|---|
| L-1 | **Se qualquer integração tem tráfego real** | Sem acesso a banco, logs ou runtime. Toda linha deste documento descreve *código*, não *comportamento observado*. | Consultar `ai_gateway_metrics`, `incoming_webhook_logs`, `whatsapp_ingestion_logs`, `connection_test_logs`, `sms_campaign_recipients`, `notification_logs` e os logs das Edge Functions |
| L-2 | **Quais secrets estão de fato provisionados** | Secrets vivem no painel da plataforma, fora do repo. Uma EF pode estar deployada com a chave ausente e falhar sempre. | Comparar o inventário desta página com Dashboard → Edge Functions → Secrets |
| L-3 | **Flags `verify_jwt` por função** | `supabase/config.toml` tem só `project_id`; nenhum `[functions.*]` versionado (ver nota na seção de webhooks). | Exportar a config de deploy e versioná-la |
| L-4 | **Se os cron jobs do A-1 ainda existem em `cron.job`** | Migrations mostram o `schedule`, mas outra migration ou operação manual pode ter feito `unschedule`. Nenhuma migration posterior versiona essa correção. | `SELECT jobname, schedule, command FROM cron.job` |
| L-5 | **Se `webhook.require_signature` está ligado nos webhooks reais** (A-2) | Depende de linhas em `incoming_webhooks`. | `SELECT id, name, require_signature, is_active FROM incoming_webhooks` |
| L-6 | **Se `evolution-api` e `dual-write-proxy` estão deployadas** | O repo prova que não têm chamador *no repo*; não prova que estão desativadas na plataforma. | Listar as Edge Functions deployadas e comparar com `ls supabase/functions/` |
| L-7 | **Se `send-transactional-email` existe fora do repo** (A-4) | `sequence-processor:337` a invoca; ela não está versionada. Pode ter sido criada direto no painel. | Listar Edge Functions deployadas |
| L-8 | **Comportamento real dos endpoints de terceiros** | Sem rede de teste; não posso confirmar se `api.lovable.dev` (A-11) responde, se o formato do Web Push (A-8) é aceito, ou se o gateway Twilio está ativo. | Teste ponta-a-ponta em ambiente de staging |
| L-9 | **Build, lint e testes** | `node_modules` está vazio — proibido rodar por instrução. Não pude confirmar erros de tipo nem executar os testes de `_shared/*_test.ts`. | `npm ci && npm run lint && npm test` em ambiente com dependências |
| L-10 | **Integrações citadas apenas em memória do Lovable ou fora do repo** | Varri `.lovable/memory/`, mas conversas de produto e o painel do Lovable podem conter promessas não versionadas. | Revisar o backlog de produto com o dono do sistema |
| L-11 | **Dependências de runtime de CDN** (`deno.land`, `esm.sh`, `npm:`) | São 21 referências a `deno.land` e 1 a `esm.sh` nas EFs. Tratei como cadeia de suprimentos, não como integração de negócio. | Auditoria de supply chain separada (pinagem de versão, lockfile de Deno) |
