# C1 — Documentos de produto, UX, QA, dívida técnica e auditorias × código real

> Repositório: `/home/user/Singu_V2` · HEAD `e616c20` (2026-10-11) · Verificação estática (grep/leitura) + consulta read-only ao GitHub (`gh run list`, `gh api .../branches/main`).
> Nenhum arquivo do repositório foi modificado.
> Legenda de status: ❌ NÃO INICIADO · 🟨 PARCIAL · 🎭 VITRINE (UI/claim sem dado real) · 🔌 DESCONECTADO (existe, mas não está ligado) · ⬛ MORTO (código sem consumidor) · 📄 DOC FALSO/DESATUALIZADO · ✅ RESOLVIDO (só agregado).
> Só os itens não-OK são detalhados; os OK aparecem agregados no início de cada seção.
> Os documentos se sobrepõem: o mesmo problema pode aparecer em mais de uma seção, e cada linha cita a origem.

---

## 0. Achados NOVOS descobertos durante a verificação (não constam como pendência em nenhum doc)

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| N-1 | Botões do front chamam functions que passaram a exigir `x-cron-secret` (regressão da correção SEC-4). Respondem 401 sempre | consequência de `docs/auditoria/01_ACHADOS_SEGURANCA.md:34` | 🔌 DESCONECTADO | `src/hooks/useSequenceProcessor.ts:9` → `supabase/functions/sequence-processor/index.ts:54`; `src/hooks/useNurturingExecutions.ts:54` → `nurturing-runner/index.ts:22`; `src/hooks/useSmartNotifications.ts:159` → `smart-notify/index.ts:10`; `src/hooks/useWeeklyReport.ts:169,198` → `weekly-digest/index.ts:31`; `src/hooks/useHealthAlerts.ts:195` → `check-health-alerts/index.ts:107`; `src/hooks/commercial/useSocialSync.ts:69` → `sync-social-interests/index.ts:9`; `src/hooks/useWebhookDlq.ts:44,59` → `process-webhook-dlq/index.ts:27`; `src/hooks/useEdgeFunctionActions.ts:44` e `useEnrichSocialProfiles.ts:77` → `social-events-detector` (requireCronSecret). `requireCronSecret` só aceita header (`_shared/auth.ts:237-247`) | Aceitar JWT de admin/dono (ex.: `withAuthOrServiceRole` + checagem de papel) nessas 8 functions **ou** remover os botões | "Processar agora" (Sequências), "Rodar nurturing", "Gerar digest", "Checar alertas", reprocessar DLQ e "Eventos sociais" falham para todo usuário | M |
| N-2 | Os únicos jobs pg_cron HTTP versionados não enviam `x-cron-secret`, e um deles aponta para outro projeto com JWT anon fixo no código | — | 🔌 DESCONECTADO | `supabase/migrations/20260512105729_…sql:10-11` (smart-notify, só Bearer) · `20260417120721_…sql:18-19` (validation-queue-worker em `rqodmqosrotmtrjnnjul`, JWT anon fixo) · functions exigem o segredo (`smart-notify/index.ts:10`, `validation-queue-worker/index.ts:24`). Nenhum `cron.schedule` versionado para nurturing-runner, sequence-processor, lead-score-cron, weekly-digest, forecast-snapshot-cron, mql-evaluator, check-notifications, client-notifications, cs-health-recalc, crm-automation-monitor, auto-regen/rebatch, process-behavioral-regen-queue | Versionar todos os agendamentos com `x-cron-secret` vindo do Vault e com a URL do projeto canônico | Automação (nurturing, sequências, lead score, digest, forecast) não roda se o agendamento remoto não existir. NÃO VERIFICADO no banco remoto | M |
| N-3 | Sequências de e-mail: o passo é gravado como `sent`, mas a function de envio não existe | `docs/ARCHITECTURE.md:84` ("Sequências multi-canal") | 🎭 VITRINE | `supabase/functions/sequence-processor/index.ts:321-333` (insert `status:'sent'` **antes** do envio) e `:337` (`invoke('send-transactional-email')`). Não existe `supabase/functions/send-transactional-email` | Criar o provedor de envio (Resend/SMTP), gravar `sent` só após 2xx e tratar `error` do invoke | Cadências reportam e-mails "enviados" que nunca saem; métricas de sequência são fictícias | M |
| N-4 | Nurturing: passos `email`/`whatsapp` só criam linhas em `interactions`; nada é enviado. Erros são engolidos | `docs/qa/surface-map.md:46` (Nurturing listado como módulo) | 🎭 VITRINE | `supabase/functions/nurturing-runner/index.ts:92-99` (só `interactionRows.push`), `:129,132` (`.catch(() => {})`) | Integrar com Evolution/e-mail e registrar falhas | Workflows de nurturing parecem rodar, mas o lead não recebe nada | M |
| N-5 | Três *project refs* Supabase divergentes no repositório | — | 📄 DOC FALSO/DESATUALIZADO | `supabase/config.toml:1` (`hjhthvzwtvwgdrochcam`) · `index.html:9` CSP `connect-src` (`pgxfvjmuubtbowutlide`) · `public/_headers:7` CSP (`rqodmqosrotmtrjnnjul`) · `20260417120721_…sql:18` (`rqodm…`) · `docs/qa/security-definer-audit.md:5` ("banco canônico pgxfv…") | Unificar no projeto canônico (config, CSP, crons) | Com `_headers` aplicado pelo host, a CSP bloquearia o projeto real; deploys e crons podem mirar o banco errado | P |
| N-6 | Whitelist de IP / bloqueio geográfico configurável na UI, mas a function que aplica a regra nunca é chamada | — | 🔌 DESCONECTADO | UI: `src/hooks/useAllowedIPs.ts`, `useGeoBlocking.ts`, `useAccessSecurity.ts`, `src/components/security/SecuritySettings.tsx`. Function `supabase/functions/validate-access/index.ts:43-80` (lê `ip_whitelist`/`geo_allowed_countries`) sem nenhum chamador em `src/`. O mesmo vale para `detect-new-device` | Chamar `validate-access` no login/guard de rota (ou mover a regra para um hook de Auth) | Admin acredita ter restringido o acesso por IP/país; a regra não tem efeito | M |

---

## 1. `docs/auditoria/01..05_ACHADOS_*` (59 achados + 2 subitens)

**✅ Resolvidos (23):** SEC-1 (`20261006120000_least_privilege_canonical.sql:94-108` derruba as policies por token; RPCs `get_public_csat_survey`/`submit_public_csat_survey`, `:161-241`; `src/pages/PublicSurvey.tsx:35,59`), SEC-2/2b/2c (`external-data/index.ts:485-527`: client com escopo do usuário + `eq('user_id')` + allowlist de filtros), SEC-3 (`bitrix24-webhook/index.ts:40`, `evolution-webhook/index.ts:20`, `lux-webhook/index.ts:18`), SEC-4 (requireCronSecret nos 10 crons, mas ver N-1/N-2), SEC-6 (`connection-tester/index.ts:35-170`: guarda SSRF; risco residual de DNS rebinding documentado em `:16-20`), SEC-7 (`mcp-server/index.ts:43-46`), EF-1 (`evolution-webhook/index.ts:75`), EF-2 (`whatsapp-import/index.ts:3`), EF-9 (achado era falso positivo: `contact_id` é PK em `20260712221610_…sql:2`), EF-13 (guardas `if (!toolCall…)` nas 8 functions), FE-4 (`src/app/queryClient.ts:10` com staleTime global de 5 min), FE-5, FE-7 (resta 1, em `useUnifiedTimeline.ts:19`), FE-8, FE-11 (`package.json:58`), BD-3 (`20260513182841_…sql:4-5` e afins), TQ-1/TQ-9/TQ-10 (CI do `main` verde em 2026-10-11 15:23Z, `gh run list`; `ci.yml:13,16`), TQ-5, TQ-8 (`vite.config.ts:64` com `runtimeCaching: []`). Informativos não contados: BD-11 (NÃO VERIFICADO: depende de prod) e TQ-13.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| SEC-5 | CORS reflete qualquer `*.lovable.app` / `*.lovableproject.com` | 01_ACHADOS_SEGURANCA.md:37 | 🟨 PARCIAL | `*` literal eliminado; os sufixos continuam em `supabase/functions/_shared/auth.ts:77-80,86` | Trocar sufixo por lista exata de origins de produção/preview | Apps de terceiros hospedados na Lovable são origin válida | P |
| EF-3 | Timeout em chamadas externas | 02_ACHADOS_EDGE_FUNCTIONS.md:24 | 🟨 PARCIAL | `_shared/fetch-utils.ts` adotado por 52 functions; ainda há 7 `fetch` crus em `evolution-bitrix-connector/index.ts:144,155,166,266,277,298,338` | Migrar o conector para `fetchWithTimeout` | O conector WhatsApp↔Bitrix pode travar isolates | P |
| EF-4 | evolution-webhook atribui a mensagem ao "primeiro usuário de `profiles`" | 02:27 | 🟨 PARCIAL | Autenticação corrigida (`:20`), mas o fallback continua em `evolution-webhook/index.ts:150-155` e `:178-183` (`profiles.select('id').limit(1)`) | Mapear instância→usuário de forma obrigatória e rejeitar quando não houver dono | Mensagens/contatos de um tenant caem na carteira de outro usuário | P |
| EF-5 | `completed_count` do nurturing | 02:30 | ❌ NÃO INICIADO | `nurturing-runner/index.ts:145` chama `rpc("increment_workflow_completed")`, que **não existe** em nenhuma migration (grep vazio); erro engolido por `.catch(() => {})` | Criar a RPC ou fazer update atômico | Métrica de workflows concluídos fica sempre 0 | P |
| EF-6 | Claim atômico em filas/crons | 02:33 | 🟨 PARCIAL | Feito só para validation e regen (`20260720000002_ef6_atomic_queue_claim.sql`). Continuam SELECT→UPDATE sem lock: `nurturing-runner/index.ts:33-38`, `sequence-processor/index.ts:67-72`, `process-webhook-dlq/index.ts:43-45,73` | RPC `FOR UPDATE SKIP LOCKED` para as 3 filas restantes | Execuções sobrepostas duplicam tarefas, eventos de sequência e inserts da DLQ | M |
| EF-7 | send-sms-campaign sem atomicidade/paginação | 02:36 | 🟨 PARCIAL | Timeout via `fetchAPI` ok. Continuam: checagem de status não atômica (`send-sms-campaign/index.ts:67` × `:101`), `contacts` sem paginação (`:73`, teto PostgREST de 1000), loop síncrono (`:135`) | `UPDATE … WHERE status='draft' RETURNING`, paginação e envio em fila | SMS duplicados ou campanhas truncadas em 1000 contatos | M |
| EF-8 | DLQ marca sucesso sem inserir | 02:39 | ❌ NÃO INICIADO | `process-webhook-dlq/index.ts:117-120` (`succeededRows.push` quando não há `targetTable`) | Marcar como `abandoned` com erro explícito | Perda silenciosa de payloads de webhook | P |
| EF-10 | Itens presos em `processing` | 02:45 | ❌ NÃO INICIADO | `claim_validation_batch` só seleciona `status='pending'` (`20260720000002_…sql:26`); não há reclaim por tempo (o regen tem `p_lock_minutes`) | Visibility timeout (`processing` há mais de N min volta a `pending`) | Validações de e-mail/telefone ficam paradas para sempre após um crash | P |
| EF-11 | external-data devolve 200 em erro de RPC | 02:48 | 🟨 PARCIAL | Fallback `SERVICE_UNAVAILABLE` removido, mas `external-data/index.ts:471` ainda retorna `jsonOk({data:null,error})` | Retornar 502/500 | O front trata falha como sucesso vazio | P |
| EF-12 | lead-score-cron com teto silencioso | 02:51 | 🟨 PARCIAL | `lead-score-cron/index.ts:23` (`.limit(5000)`); forecast usa `Number()` sem guarda (`forecast-snapshot-cron/index.ts:38-41`) | Paginação (helper `_shared/pagination.ts` já existe) | Scores desatualizados em bases grandes | P |
| EF-14 | Filtro de avatar invertido | 02:57 | ❌ NÃO INICIADO | `evolution-webhook/index.ts:532,536` (`.not('avatar_url','is',null)` + `|| undefined`) | `.is('avatar_url', null)` | Foto do WhatsApp nunca é aplicada a quem não tem avatar | P |
| EF-15 | Padrão de cron auth inconsistente | 02:60 | 🟨 PARCIAL | `auto-rebatch-behavioral/index.ts:44` usa `x-cron-key`; `connection-anomaly-detector/index.ts:47` faz checagem manual; o resto usa `x-cron-secret` | Padronizar em `requireCronSecret` | Configuração de cron frágil, uma chave diferente por function | P |
| EF-16 | bulk-revalidate com teto de 5000 | 02:63 | ❌ NÃO INICIADO | `bulk-revalidate/index.ts:76` | Paginar | Revalidação incompleta sem aviso | P |
| EF-17 | Fire-and-forget sem `waitUntil` | 02:66 | ❌ NÃO INICIADO | `evolution-webhook/index.ts:348-370` (`invoke('voice-to-text').then(...)`); `EdgeRuntime.waitUntil` não é usado em lugar nenhum | Usar `EdgeRuntime.waitUntil` | Transcrição de áudio do WhatsApp pode ser descartada | P |
| FE-1 / TQ-2 | "Zero any" e casts | 03_ACHADOS_FRONTEND.md:20 / 05:24 | 🟨 PARCIAL | `any` caiu de 119 para ~32 ocorrências; `as unknown as` **subiu** para 210 (era 183); 3 `eslint-disable no-explicit-any` | Plano para erradicar os casts duplos | A tipagem não protege os fluxos críticos | G |
| FE-2 | Fetch dentro de `useEffect` | 03:23 | 🟨 PARCIAL | ~53 arquivos com `useEffect` + `.from/.rpc/.invoke` sem React Query. Os 6 citados continuam: `useHealthAlerts.ts:63,82`, `useDISCConversionData.ts:26-36`, `usePurchasePatterns.ts`, `useWeeklyReport.ts`, `useStakeholderAlerts.ts`, `trigger-analytics/useTriggerAnalyticsData.ts` | Migrar para `useQuery` | Sem cache/dedup/retry; condições de corrida | G |
| FE-3 | Arquivos > 400 linhas | 03:26 | ❌ NÃO INICIADO (piorou) | 91 arquivos > 400 e 20 > 600 (eram 65 e 13); maior: `ObjectionExamplesModal.tsx` com 967 | Quebrar os 20 maiores | Manutenção cara e regressões | G |
| FE-6 | Mutations sem invalidação | 03:35 | 🟨 PARCIAL | `useSequenceProcessor.ts:7-18`, `useEnrichmentExport.ts`, `useEmailRefine.ts` sem invalidate (o primeiro ainda cai em N-1) | Invalidar `['sequences']` | UI desatualizada após processar | P |
| FE-9 | `setInterval` sem clear | 03:44 | ❌ NÃO INICIADO | `src/lib/errorReporting.ts:194` | Guardar o handle e limpá-lo | Vazamento leve | P |
| FE-10 | NaN com lista vazia | 03:47 | ❌ NÃO INICIADO | `src/hooks/useStakeholderAnalysis.ts:366` | Guarda `length>0` | Risco latente | P |
| BD-1 | `DROP TABLE deals CASCADE` sem recriar | 04_ACHADOS_BANCO.md:28 | ❌ NÃO INICIADO | `20260317213904_…sql:1` intacto; não há job de replay em banco vazio na CI (`.github/workflows/ci.yml` não tem) | Squash/baseline das migrations e replay em CI | Reprovisionamento/DR pode falhar | M |
| BD-2 | `social_insights` | 04:31 | 🎭 VITRINE | Tabela criada (`20260720000023_create_phantom_tables.sql:95`), mas **nada grava nela** (só `generate-offer-suggestions/index.ts:82` lê) e o hook mantém dados **mockados** no `catch`: `src/hooks/useSocialInsights.ts:56-90` ("Recém promovida a Diretora…") | Remover o mock e criar um produtor (scraper → insert) | Painel social mostra insights fictícios como reais em caso de erro e fica vazio no resto | M |
| BD-4 | Migrations não idempotentes | 04:37 | ❌ NÃO INICIADO | Replay em banco vazio continua listado como pendência (`06_REAUDITORIA…:63`); não há job de CI | Job de replay em banco limpo | DR/ambientes novos frágeis | M |
| BD-5 | Índice em `contacts.email` | 04:40 | ❌ NÃO INICIADO | Nenhum `CREATE INDEX … contacts(email)`; o trigram foi **removido** (`20260721000052_…sql:20`) | Índice btree(lower(email)) | Seq scan na deduplicação/busca por e-mail | P |
| BD-6 | Unicidade de e-mail | 04:43 | ❌ NÃO INICIADO | Só `campaign_recipients(campaign_id,email)` (`20260720000011_…sql:14`) | `UNIQUE(user_id, lower(email))` parcial | Contatos duplicados | M |
| BD-7 | FKs sem `ON DELETE` | 04:46 | ❌ NÃO INICIADO | Ex.: `20260511200945_…sql:18-20` sem migration de correção | ALTER das ~17 FKs | Exclusão de usuário/contato bloqueada | P |
| BD-8 | Índices redundantes | 04:49 | 🟨 PARCIAL | `system_alerts(alert_type,created_at)` ×3 (`20260420211439:16`, `20260712230802:16`, `20260713124016:6`); `idx_interactions_contact_id` ×3. Ondas de drop em `20260721000047/52` | Confirmar com `get_advisors` e remover | Overhead de escrita | P |
| BD-9 | JSONB sem CHECK | 04:52 | ❌ NÃO INICIADO | 0 `CHECK (jsonb_typeof…)` nas migrations | CHECKs nas colunas JSONB críticas | Formato livre quebra os leitores | M |
| BD-10 | `NUMERIC` sem precisão | 04:55 | ❌ NÃO INICIADO | Nenhuma migration de padronização | `NUMERIC(15,2)` | Inconsistência monetária | P |
| TQ-3 | Compilador em modo permissivo | 05_ACHADOS_TESTES_BUILD_DOCS.md:27 | ❌ NÃO INICIADO | `tsconfig.app.json:17-19` (`strict:false`, `noImplicitAny:false`, `strictNullChecks:false`) | Endurecimento incremental | "0 erros TS" não garante segurança de tipos | G |
| TQ-4 | Docs com números fabricados | 05:30 | 🟨 PARCIAL | Avisos de "documento histórico" adicionados, mas `README.md:151` ainda diz "4.470 testes", `docs/ONBOARDING.md:89` também, e `CHANGELOG.md:229,238` mantém os números | Corrigir os números | Onboarding enganoso | P |
| TQ-6 | Testes de edge vazios/fora da CI | 05:40 | 🟨 PARCIAL | Stubs foram preenchidos (`external-data/index.test.ts` com 32 linhas…) e há 16 `*_test.ts`, mas **nenhum `deno test` roda na CI** (grep vazio em `.github/workflows`); `vitest.config.ts:19` só cobre `src/` e `tests/` | Step `deno test supabase/functions` | Backend sem teste automatizado no pipeline | P |
| TQ-7 | CSP real | 05:43 | 🟨 PARCIAL | CSP existe em `index.html:9` e `public/_headers:7`, mas com `script-src 'unsafe-inline'` e **projetos diferentes** (ver N-5); `vercel.json:12` só tem `frame-ancestors` | Uma CSP única por header HTTP, sem `unsafe-inline` | CSP inconsistente: bloqueia o app ou não protege | P |
| TQ-11 | 3 lockfiles e deps mal classificadas | 05:55 | ❌ NÃO INICIADO | `bun.lock`, `bun.lockb` e `package-lock.json` coexistem; `@types/*` em `dependencies` (`package.json:54-61`) | Ficar com um lockfile e mover para devDeps | Divergência entre CI e máquina local | P |
| TQ-12 | DOMPurify permite override | 05:58 | ❌ NÃO INICIADO | `src/lib/sanitize.ts:8` (eslint-disable) e `:18` (`...options` por último) | Aplicar a allowlist **depois** de `options` | Quem chama pode reabrir XSS | P |

---

## 2. `docs/auditoria/00_PLANO_MESTRE_AUDITORIA.md` — Fase V (etapas 37-50)

**✅ (2):** 37 (priorização, `99_MATRIZ`), 38 (críticos de segurança: SEC-1..4).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| PM-39 | Integridade (constraints/migrations) | 00:131 | 🟨 PARCIAL | CHECKs de status (`20260720000008_…`); sem unicidade de e-mail (BD-6) nem CHECK JSONB (BD-9) | BD-5/6/7/9 | Dados duplicados/inconsistentes | M |
| PM-40 | Endurecer o compilador | 00:132 | ❌ NÃO INICIADO | `tsconfig.app.json:17-19` | `strictNullChecks` por pasta | Bugs de null em runtime | G |
| PM-41 | Bugs de null-safety | 00:133 | ❌ NÃO INICIADO | Depende de PM-40 | — | idem | G |
| PM-42 | Hardening de Edge Functions | 00:134 | 🟨 PARCIAL | EF-3/4/7/11/12/17 pendentes (seção 1) | idem | Falhas silenciosas | M |
| PM-43 | Jobs/cron/filas idempotentes | 00:135 | 🟨 PARCIAL | EF-6/8/10 pendentes; N-1/N-2 | idem | Duplicação/perda | M |
| PM-44 | Índices/constraints faltantes | 00:136 | 🟨 PARCIAL | BD-5/6 | idem | Performance/dedup | P |
| PM-45 | Drift schema × código | 00:137 | ❌ NÃO INICIADO | `scripts/tabelas-ausentes.md:3` (**119** tabelas/views usadas pelo front ausentes no banco canônico `pgxfv…`) | Criar as tabelas ou remover os consumidores | Telas inteiras falham no banco de produção | G |
| PM-46 | Código morto / arquivos gigantes | 00:138 | ❌ NÃO INICIADO | FE-3 (91 arquivos); componentes mortos (seções 6 e 9) | Remover e quebrar | Custo de manutenção | M |
| PM-47 | Cobertura de testes real | 00:139 | ❌ NÃO INICIADO | `06_REAUDITORIA…:17` mostra 9,16%; `vitest.config.ts` sem `thresholds` | Thresholds por domínio | Regressões não detectadas | G |
| PM-48 | Gates de CI que bloqueiam merge | 00:140 | ❌ NÃO INICIADO | `gh api repos/adm01-debug/Singu_V2/branches/main` → `"protected":false`, `required_status_checks.contexts: []`; rulesets `[]`; houve CI vermelho no `main` em 2026-10-06 e 2026-10-07 | Branch protection com checks obrigatórios | Código quebrado chega ao `main` | P |
| PM-49 | Corrigir a documentação | 00:141 | 🟨 PARCIAL | Avisos adicionados (`SYSTEM_EXCELLENCE_10_10.md:3`, `audit_report.md:2`, `QA_ANALYSIS_REPORT.md:3`), mas ARCHITECTURE/ONBOARDING/EDGE_FUNCTIONS_API/DocsPage continuam falsos (seções 13-15 e 22) | Reescrever | Decisões tomadas sobre doc falsa | M |
| PM-50 | Reauditoria com certificação honesta | 00:142 | 🟨 PARCIAL | `06_REAUDITORIA_IMPLEMENTACAO_20261002.md:5-8` declara "não certifica" | Fechar as pendências da seção 4 | Sem selo verificável | M |

---

## 3. `docs/auditoria/99_MATRIZ_DE_RISCO.md`

**✅ mitigados (7 dos 10 do Top 10):** #1 SEC-1, #2 SEC-2, #3 SEC-3, #4 SEC-4 (com a regressão N-1/N-2), #5 EF-1, #7 EF-2, #9 TQ-10+TQ-1.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| MR-6 | EF-6 claim atômico | 99:24 | 🟨 PARCIAL | ver EF-6 | 3 filas | E-mails/tarefas duplicados | M |
| MR-8 | EF-3 timeouts | 99:26 | 🟨 PARCIAL | ver EF-3 | conector Bitrix | Isolates presos | P |
| MR-10 | BD-1 saga de `deals` | 99:28 | ❌ NÃO INICIADO | ver BD-1 | baseline/replay | DR falha | M |
| MR-O3 | Onda 3: endurecer TS (`strict`) | 99:54 | ❌ NÃO INICIADO | `tsconfig.app.json:17-19` | — | — | G |
| MR-O4 | Onda 4: gates de CI que bloqueiam merge | 99:56 | ❌ NÃO INICIADO | `main` sem proteção (PM-48) | branch protection | `main` aceita CI vermelho | P |

---

## 4. `docs/auditoria/06_REAUDITORIA_IMPLEMENTACAO_20261002.md` (pendências e alegações)

**✅ (3):** RLS remoto e E2E com credenciais rodando na CI (`ci.yml:39-52,96-101,126`; CI do `main` verde) e chunks > 600 kB (`scripts/check-bundle-size.mjs:17` com limite de 500 kB, executado em `ci.yml:138`).
**NÃO VERIFICADO (4):** rotação das credenciais Evolution/Bitrix (`:64-65`), migration de webhook aplicada no banco correto (`:66`), MFA/HIBP/backups/retenção (`:70-71`, exceto branch protection), vulnerabilidades moderate (`:75-76`).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| RA-1 | "Métricas aleatórias… removidas" | 06:40-41 | 🎭 VITRINE (alegação falsa) | `src/hooks/useDealVelocity.ts:67` (`averageDays: Math.random()*15+3`, exibido em `DealVelocityPanel` montado em `src/pages/Analytics.tsx` e nas tabs do dashboard); `src/hooks/useHiddenObjections.ts:30` (probabilidade 60-90% aleatória); `src/hooks/useEmotionalIntelligence.ts:53,73` (força aleatória, exibida em `EmotionalIntelligencePanel` → `ContactIntelligenceTab.tsx`). Escapou do lint graças a 49 `eslint-disable sonarjs/pseudo-random` | Calcular a velocidade por `deal_stage_history`/transições; remover o random | Gestor vê velocidade de funil e objeções inventadas e decide em cima disso | M |
| RA-2 | Replay da cadeia de migrations em banco vazio | 06:67 | ❌ NÃO INICIADO | Não há job no `main` (`ci.yml`); o workflow "Teste de restauração lógica" existe só no branch `devin/1791735331-restore-drill` (gh run list) | Mergear e rodar o drill no `main` | DR não comprovado | M |
| RA-3 | Branch protection | 06:70-71 | ❌ NÃO INICIADO | `protected:false` (gh api) | Ativar | ver PM-48 | P |
| RA-4 | Auditar RPCs externos fora das migrations | 06:72 | 🟨 PARCIAL | `docs/qa/security-definer-audit.md` cobre o canônico; `scripts/tabelas-ausentes.md` lista 119 ausências | Inventário completo | Contratos quebrados | M |
| RA-5 | Elevar a cobertura por domínio | 06:73-74 | ❌ NÃO INICIADO | `vitest.config.ts` sem thresholds; 9,16% medido em `:17` | Metas por domínio | Regressão sem detecção | G |

---

## 5. `docs/TECH_DEBT.md`

**✅ (10):** #3 (`src/lib/externalData.ts`, `useContacts.ts`), #4 (`ci.yml:140`), #5 (`tracedLogger` em 16 functions), #6 (`useContactTimeline.ts` → `get_contact_timeline`), #8 (`src/app/AppChrome.tsx`), #9 e #15 (`SmartBackButton` em 7 páginas), #12, #14 (`src/types/__tests__/rfm.test.ts`), e o pendente "Glassmorphism" (`Header.tsx:62`, `AppSidebar.tsx:152` com `backdrop-blur-xl`).
**NÃO VERIFICADO (4):** #1 HIBP (config remota), #2 (11 views `security_invoker`), revogação do PAT `ghp_f9Hr…` (`:31`), "Global Search AI sair de Beta" (`:39`; não há selo "Beta" em `src/`).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| TD-7 | Particionamento mensal do `audit_log` | TECH_DEBT.md:15 | 🟨 PARCIAL | `20260711152812_…sql:70` cria só 6 partições (jul a dez/2026); não há `cron.schedule` de `ensure_audit_log_partition` em nenhuma migration | Agendar a criação mensal de partições | A partir de jan/2027 tudo vai para a partição DEFAULT: retenção e performance da auditoria degradam | P |
| TD-10 | `ProgressStepper` "entregue" | :18 | ⬛ MORTO | `src/components/feedback/ProgressStepper.tsx` sem nenhum import | Usar no import/onboarding ou remover | Esforço sem valor | P |
| TD-11 | Composition Root `composeProviders` | :19 | ⬛ MORTO | `src/app/composeProviders.tsx` sem import | Adotar ou remover | — | P |
| TD-13 | `MFAEnrollmentBanner` | :21 | ⬛ MORTO | `src/components/security/MFAEnrollmentBanner.tsx` sem import | Montar no `AppChrome` | O incentivo a MFA não aparece | P |
| TD-16 | "0 ocorrências de no-explicit-any" | :24 | 📄 DOC FALSO | 3 `eslint-disable … no-explicit-any` e ~32 `any` em `src/` | Corrigir a doc | — | P |
| TD-P1 | MFA obrigatório para não-admins | :30 | ❌ NÃO INICIADO | `src/hooks/useMFAGuard.ts:18` exige AAL2 **só de admin** e só no front; nenhuma policy RLS checa `aal2` | Exigir AAL2 por papel, também no backend | Conta comum comprometida sem 2º fator acessa toda a carteira | M |
| TD-P3 | Isolar o worker `generate-insights` | :32 | ❌ NÃO INICIADO | Sem worker/fila dedicada | Decisão de infra | Latência da IA | M |
| TD-P4 | Replicação cross-region | :33 | ❌ NÃO INICIADO | — (infra) | — | DR regional | G |
| TD-P5 | `<picture>` + AVIF | :34 | ❌ NÃO INICIADO | `vite-imagetools` ausente do `package.json`; 0 `srcSet` em `src/` | Pipeline de imagens | Peso de página | M |
| TD-P6 | RSC parcial (condicional) | :35 | ❌ NÃO INICIADO | condicional ao bundle > 400 kB | — | — | G |
| TD-P7 | Erradicar ~240 `any` | :36 | 🟨 PARCIAL | ver FE-1 (210 `as unknown as`) | — | — | G |
| TD-P9 | BI Avançado com drag-and-drop | :38 | ❌ NÃO INICIADO | `src/pages/BIAvancado.tsx` sem dnd (0 ocorrências de `dnd`/`drag`) | Grid arrastável persistido | Dashboards não personalizáveis | G |

---

## 6. `docs/SYSTEM_EXCELLENCE_10_10.md`

**✅ (4):** schema `extensions` (`20260513175048_…sql:2-8`), `search_path` (BD-3), `.maybeSingle()` (148 usos contra 2 `.single()`), testes Vitest. **NÃO VERIFICADO (1):** HIBP.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| SE-1 | Validação de *magic bytes* nos uploads | SYSTEM_EXCELLENCE_10_10.md:18 | 🟨 PARCIAL | `src/lib/fileValidation.ts` usado só em `src/hooks/useDealRooms.ts`; uploads sem validação: `CompanyLogoUpload.tsx:42`, `ContactAvatarUpload.tsx:42`, `InteractionForm.tsx:167`, `useDocuments.ts:61`, `useWhatsAppImport.ts:62`, `VoiceInput.tsx:130` | Aplicar em todos os uploads | Arquivos mascarados no storage | P |
| SE-2 | Smoke contínuo de Edge Functions | :22 | 🟨 PARCIAL | Testes Deno existem, mas não rodam na CI (TQ-6) | Step na CI | — | P |
| SE-3 | Dicionário de dados "real e automático" | :25 | 📄 DESATUALIZADO | ver seção 17 (19 tabelas ausentes do dicionário) | Regerar na CI | Doc de dados não confiável | P |
| SE-4 | Diagrama ER "detalhado a partir das FKs" | :26 | 📄 DOC FALSO | `docs/er-diagram.md:5-7` tem um bloco `erDiagram` **vazio** | Regerar (`scripts/generate_real_er.py`) | Sem modelo de dados visual | P |
| SE-5 | "Funcionalidades Core 100% / 10/10" | :32-36 | 📄 DOC FALSO | Contradito por N-3, N-4, RA-1, PM-45 | Remover o selo | Expectativa falsa | P |

---

## 7. `docs/AUDIT_VALIDATION_23_10.md`

**✅ (10):** patches F1 (`scripts/migration/verify/idle-in-transaction-guard.sql:10`), F2 (`function-search-path-reset-audit.sql:20,36`), F3 (`checksum-failures-guard.sql:8`), F4 (`archive-command-health.sql:8`), e os 6 guards novos (arquivos presentes em `scripts/migration/verify/`). **NÃO VERIFICADO (1):** resultados de chaos (`:128-134`).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| AV-F5 | amcheck: logar `skipped_count` acima de 100 | AUDIT_VALIDATION_23_10.md:167 | 📄 DOC FALSO (patch não aplicado) | `scripts/migration/verify/index-corruption-amcheck.sql:20` ainda `LIMIT 100`, sem log | Aplicar o patch | Corrupção de índice não detectada em bases grandes | P |
| AV-F6 | invalid-indexes cobrir todos os schemas | :168 | 📄 DOC FALSO | `invalid-indexes-guard.sql:12,24` (`nspname = 'public'`); é o guard usado na CI (`ci.yml:67`) | Iterar schemas de usuário | Índice inválido fora do `public` passa | P |
| AV-F7 | deadlock monitor: janela < 24 h | :169 | 📄 DOC FALSO | `deadlock-frequency-monitor.sql:4` sem filtro de janela | Aplicar | Alarme falso pós-reset | P |
| AV-S | Suíte de 30 cenários (`run-all.sh`) | :84-87,120 | 🟨 PARCIAL | `scripts/migration/verify/tests/scenarios/` tem 21 scripts; da numeração original só 01,04,11,14,17,21,24 | Completar os cenários 02-30 | Cobertura alegada sem lastro | M |
| AV-CI | Suíte rodando de forma contínua | :173-180 | ❌ NÃO INICIADO | `run-all.sh` não é chamado em nenhum workflow | Job agendado | Guards regridem sem aviso | P |

---

## 8. `docs/audit_report.md`

**✅ (7):** Empresas, Contatos, DISC, Pipeline, RFM, Audit Trail (arquivos existem) e o risco "schema drift" (`src/pages/AdminSchemaDrift.tsx`). **NÃO VERIFICADO (1):** Global Search AI "Beta".

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| AR-1 | Evidência NLP `src/lib/nlp.ts` | audit_report.md:41 | 📄 DOC FALSO | Arquivo inexistente (o feature vive em `useNLPAutoAnalysis.ts`) | Corrigir | — | P |
| AR-2 | Neuromarketing `NeuroScore.tsx` | :42 | ⬛ MORTO | Está em `src/components/neuromarketing/NeuroScore.tsx` (não em `analytics/`) e **nunca é importado** | Montar na ficha ou remover | Score neuro anunciado não aparece | P |
| AR-3 | Telemetria `SystemHealthWidget` | :46 | ⬛ MORTO | `src/components/admin/SystemHealthWidget.tsx` sem import | Montar em `/admin/telemetria` | — | P |
| AR-4 | "Auto-testes: 1000+ cenários, 100% sucesso" | :52 | 📄 DOC FALSO | O próprio `AUDIT_VALIDATION_23_10.md:21-22` registra 7 falhas; F5-F7 continuam abertos | Corrigir | — | P |
| AR-5 | BI Avançado drag & drop | :53 | ❌ NÃO INICIADO | ver TD-P9 | — | — | G |
| AR-6 | Mitigação "MFA configurado" | :73 | 🟨 PARCIAL | ver TD-P1 (só admin, só front) | — | — | M |
| AR-7 | Dívida de testes | :75 | 🟨 PARCIAL | cobertura de 9,16% | ver RA-5 | — | G |

---

## 9. `docs/QA_ANALYSIS_REPORT.md` (legado, com aviso)

**✅ (15):** os 14 arquivos "não utilizados" (`:219-235`) foram removidos; "Extension in public" (`:142`) corrigido. **NÃO VERIFICADO (1):** HIBP (`:143`).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| QA-1..7 | Alegações: produto "RelateIQ" (`:1`), "as any: 1" (`:27`), "ZERO arquivos de teste" (`:28`), "Memory leaks ZERO" (`:37`), "RLS 34 tabelas" (`:40`), "12 Edge Functions" (`:41`), "TODO ZERO" (`:53`) | QA_ANALYSIS_REPORT.md | 📄 DOC FALSO (7 alegações) | 108 functions; ~258 tabelas com RLS; 87+ arquivos de teste; FE-9 (`errorReporting.ts:194`) | Arquivar em `docs/legacy/` | Confunde auditorias | P |

---

## 10. `docs/ux_improvement_strategy.md`

**✅ (6):** 1.1 (`SmartBackButton` + `NavigationStackContext`), 1.2 (`BackButton.tsx:118-129` com menu de histórico), 1.3 (`PageTransition.tsx`), 2.2 (Header/Sidebar com blur), 3.1 (`useKeyboardShortcutsEnhanced.ts:76-82` com Alt+← ligado a `NavigationStackContext.tsx:126`), 5.1 (`useRageClickDetector` em `AppLayout.tsx`). **NÃO VERIFICADO (2):** 2.1 e 3.2.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| UX-4.1 | Indicador de progresso em multi-etapas (importação) | ux_improvement_strategy.md:47-51 | 🟨 PARCIAL | Onboarding tem progresso (`OnboardingWizard.tsx:262`), mas `src/components/import/BulkImportDialog.tsx` não tem nenhum `Progress`/step; `ProgressStepper` está morto (TD-10) | Stepper + barra no import | Abandono de importações longas | P |
| UX-4.2 | Guarda de alterações não salvas | :53-57 | 🟨 PARCIAL | `useUnsavedChangesGuard` só em `CompanyForm.tsx` e `Configuracoes.tsx`; ausente em `ContactForm.tsx`, `InteractionForm.tsx`, `pipeline/DealDialog.tsx` | Aplicar nos 3 formulários | Perda de dados digitados | P |

---

## 11. `docs/PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md` (76 itens: 66 numerados + 9 subproblemas do pilar 12 + métricas)

**✅ (28):** 1.2 (`src/index.css:183-189`), 1.3 (`:195-200`), 2.1 (`MobileBottomNav` com `layoutId`), 3.1 (`ui/loading-button.tsx`), 3.4, 4.1 (`index.css:78` muted 35%), 4.2 (aria-live em 26 arquivos), 4.3 (`ui/form.tsx`), 4.5 (15 arquivos), 5.5 (`ui/drawer.tsx`), 6.1 (onMutate em useMoveDeal etc.), 6.3 (`PrefetchLink.tsx`), 6.4 (`src/app/lazyPages.tsx`), 7.4 (`ui/stat-card.tsx`), 8.1 (`useFormDraft` em 7 formulários, ex.: `ContactForm.tsx:92`), 8.3 (`ui/masked-input.tsx`), 9.2, 9.3 (`NotificationCenter.tsx:13,126`), 10.1 (`useFuzzySearch.ts`), 10.5 (presets da Ficha 360/Interações), 11.5 (`DateRangePopover.tsx`), 12.2a (filtros na URL em `Empresas.tsx:43-75`), 13.2 (`ui/module-help.tsx`, `help/ContextualHelpTooltip.tsx`), 13.3 (`features/WhatsNewModal.tsx`), 13.4 (`dashboard/OnboardingChecklist.tsx`), 14.2, 14.4 (`session/SessionExpiryHandler.tsx`), 14.5 (`ConcurrentEditError`).
**NÃO VERIFICADO (21):** 1.5, 2.4, 2.5, 3.5, 4.4, 5.3, 5.4, 7.1, 7.2, 7.3, 7.5, 8.4, 8.5, 10.4, 12.1 (3 subitens), 12.2b, 12.3a, 13.1, 14.3.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| PD-1.1 | Spacing tokens semânticos | PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md:43 | ❌ NÃO INICIADO | 0 `--space-*` em `src/index.css` | Criar tokens + mapear no Tailwind | Espaçamento inconsistente | P |
| PD-1.4 | Radius semânticos (button/card/modal) | :87 | 🟨 PARCIAL | Só `--radius-card` (`index.css:215`), sem consumidor | Tokens + uso | — | P |
| PD-2.2 | Mega menu Recentes/Favoritos (Empresas/Contatos) | :121 | ❌ NÃO INICIADO | Nada em `src/components/layout`/`navigation` | Dropdown na sidebar | Acesso lento a registros frequentes | M |
| PD-2.3 | Busca: sugestões, categorização e atalhos `@empresa` | :125-132 | 🟨 PARCIAL | Recentes no command palette (`GlobalSearch.tsx:37,69-72`); sem atalho `@` nem sugestão enquanto digita | Prefixos de filtro + autocomplete | Busca menos eficiente | M |
| PD-3.2 | Haptic universal | :167 | 🟨 PARCIAL | `useHapticFeedback` em só 2 componentes | Toggles e destrutivos | — | P |
| PD-3.3 | ProgressToast em operações longas | :171-183 | ❌ NÃO INICIADO | 0 ocorrências; import sem progresso | Componente + uso no import/upload | Usuário não sabe se o import travou | P |
| PD-4.6 | Touch targets ≥ 44 px | :262 | 🟨 PARCIAL | `min-h-[44px]` em 11 arquivos | Auditoria mobile | Toques errados no celular | M |
| PD-5.1 | Formulários mobile (`inputMode`, `enterKeyHint`, `autoComplete`) | :277-286 | 🟨 PARCIAL | `inputMode` em 3 arquivos, `enterKeyHint` em 0 | Aplicar nos formulários de contato/empresa | Digitação lenta no celular | P |
| PD-5.2 | Gestos (swipe, pull-to-refresh, long-press) | :288-291 | 🟨 PARCIAL | Só em `pages/contatos/ContatosContent.tsx`; long-press só no hook | Empresas/Interações | — | M |
| PD-6.2 | Virtualização de listas longas | :343 | 🟨 PARCIAL | `react-window` só em `ContatosContent.tsx`; Empresas/Interações sem virtualização | Virtualizar | Lentidão com 500+ itens | M |
| PD-6.5 | `srcset`/LQIP | :374-378 | ❌ NÃO INICIADO | 0 `srcSet` | Pipeline de imagens | — | M |
| PD-8.2 | Validação inline `onBlur` | :455 | 🟨 PARCIAL | `mode: 'onBlur'` só em `CompanyForm.tsx` e `InteractionForm.tsx` | ContactForm/DealDialog | Erros só aparecem no submit | P |
| PD-9.1 | Preferências granulares de notificação | :501 | 🔌 DESCONECTADO | UI e tabela existem (`src/hooks/useNotificationPreferences.ts:43`, `pages/NotificacoesConfig.tsx`), mas **nenhuma Edge Function ou SQL lê `notification_preferences`** (grep em `supabase/functions` vazio; migrations só com policies) | Aplicar canais/urgência mínima em smart-notify/check-notifications/push | O usuário configura e nada muda | M |
| PD-9.4 | Sons de notificação | :535 | ❌ NÃO INICIADO | Só TTS em `voice/playTtsAudio.ts` | — | — | P |
| PD-9.5 | Entrega agendada / silêncio | :539 | 🔌 DESCONECTADO | `quiet_hours_start/end` e `digest_mode` só no front (`useNotificationPreferences.ts:13-24`), sem leitura no backend | Respeitar a janela nos envios | Notificações fora de hora | M |
| PD-10.2 | Search analytics | :566 | ❌ NÃO INICIADO | 0 ocorrências | Logar termos | Sem insight do que o usuário procura | P |
| PD-10.3 | Buscas/filtros salvos (contatos/empresas) | :570 | ⬛ MORTO | `src/hooks/useSavedFilters.ts:19` sem nenhum consumidor | Botão "Salvar filtro" nas listas | Usuário recria filtros sempre | P |
| PD-11.1 | Gráficos acessíveis (tabela sr-only) | :600 | 🟨 PARCIAL | 6 arquivos | Wrapper padrão | WCAG | M |
| PD-11.2 | Drill-down em gráficos | :620 | 🟨 PARCIAL | Pontual (`EvidenceDrillDownSheet.tsx`, `InterestsCloud.tsx`) | Gráficos do dashboard | Análise rasa | M |
| PD-11.3 | Comparativo YoY/MoM | :624 | ❌ NÃO INICIADO | 0 ocorrências de `YoY`/`MoM`/`previousPeriod` em `src/` | Período anterior nos KPIs | Sem tendência comparativa | M |
| PD-11.4 | Exportar gráfico PNG/PDF | :630 | ❌ NÃO INICIADO | sem `html2canvas`/`toPng` | Export | — | P |
| PD-12.2c | Presets de filtros salvos (AdvancedFilters) | :665-681 | ⬛ MORTO | idem PD-10.3 | — | — | P |
| PD-12.3b | Badges de notificação por seção na sidebar | :683-707 | ❌ NÃO INICIADO | `src/components/layout/AppSidebar.tsx` sem badge/count | Contadores | Pendências invisíveis | P |
| PD-12.3c | Quick-add a partir da sidebar | idem | ❌ NÃO INICIADO | idem | Botão "+" | — | P |
| PD-13.5 | Vídeos tutoriais | :750 | ❌ NÃO INICIADO | ocorrências de youtube são de redes sociais (`SocialsCard.tsx`) | Conteúdo | Adoção | M |
| PD-14.1 | Offline-first | :765-779 | 🟨 PARCIAL | Banner existe (`pwa/NetworkComponents.tsx`), mas sem fila offline e com `runtimeCaching: []` (`vite.config.ts:64`) | Fila de mutações offline (sem PII em cache) | App inútil sem rede | G |
| PD-MET | Instrumentar métricas UX (TTFMI, Task Completion, SUS, NPS do produto, adoção) | :847-866 | ❌ NÃO INICIADO | Nenhum SDK de product analytics (0 `posthog`/`mixpanel`/`trackEvent` em `src/`) | Telemetria de eventos de produto | Metas de UX não mensuráveis | M |

---

## 12. `docs/COMPLETE_SYSTEM_ANALYSIS.md` (95 referências a arquivos/hooks + 8 alegações funcionais)

**✅ (73):** 71 das 95 referências existem; atalhos de teclado (`useKeyboardShortcutsEnhanced.ts:52-200`); ofertas personalizadas via `generate-offer-suggestions` (`useEdgeFunctionActions.ts:29`).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| CS-REF | 24 referências inexistentes: `ClientTriggerPanel`, `MetaprogramProfileCard`, `MetaprogramTemplateLibrary`, `PersuasionTemplates`, `SleightOfMouthLibrary`, `VAKProfileCard`, `VAKTemplateLibrary`, `useClientValuesPersistence`, `useClosingScore`, `useContactPreferences`, `useEQPersistence`, `useEmotionalStatesPersistence`, `useFormAutosave`, `useHiddenObjectionsPersistence`, `useKeyboardNavigation`, `useMobile`, `useNegotiationSimulator`, `usePersonalizedOffers`, `usePersuasionScore`, `useSalesScript`, `useSatisfactionScore`, `useScrollEffects`, `useSidebarState`, `useVAKTemplates` | COMPLETE_SYSTEM_ANALYSIS.md:245-487 | 📄 DOC FALSO (24 itens) | Nenhum arquivo/símbolo com esses nomes em `src/` | Regerar o inventário | Inventário de funcionalidades enganoso | P |
| CS-1 | Simulador de negociação | :470 | ❌ NÃO INICIADO/removido | 0 ocorrências de `NegotiationSimulator`/"simulador" em `src/` | Implementar ou retirar da doc | Feature vendida inexistente | G |
| CS-2 | Score de satisfação | :438 | 📄 DOC FALSO | hook removido; existe CSAT/NPS (`useCSATSurveys.ts`) | Atualizar a doc | — | P |
| CS-3 | PWA Push Notifications | :795 | 🎭 VITRINE | (a) chave VAPID de exemplo/placeholder em `src/lib/pushNotifications.ts:4-6`; (b) `send-push-notification/index.ts:44-51` faz POST com `Content-Encoding: aes128gcm`, mas **sem criptografar o payload e sem header VAPID**; (c) o SW gerado pelo VitePWA (`vite.config.ts:24-66`, `generateSW`) não tem handler `push`; `src/sw.ts` citado em `src/main.tsx:21-26` não existe, e `main.tsx:63-80` desregistra o `sw-push.js` legado | VAPID real em secret, lib web-push (RFC 8291) e `injectManifest` com handler | Lembretes/alertas push nunca chegam ao celular | M |
| CS-4 | PWA "Offline support" | :796 | 🟨 PARCIAL | ver PD-14.1 | — | — | G |
| CS-5 | Long press actions | :836 | 🟨 PARCIAL | só em `useHapticFeedback.ts` | — | — | P |
| CS-6 | Rate limiting (preparado) | :879 | 🟨 PARCIAL | `_shared/rate-limit.ts:2-5`, in-memory por isolate | Rate limit persistente (Postgres/KV) | Limite contornável escalando isolates | M |

---

## 13. `docs/ONBOARDING.md`

**✅ (4):** os 3 arquivos-chave existem (`src/lib/externalData.ts`, `src/hooks/voice/useTranscriptProcessor.ts`, `_shared/auth.ts`); `queryExternalData` (`externalData.ts:102`), `callExternalRpc` (`:255`); pastas de teste.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ON-1 | Porta do dev server | ONBOARDING.md:28 | 📄 DESATUALIZADO | `vite.config.ts:10` usa 8080, não 5173 | Corrigir | Onboarding trava | P |
| ON-2 | "10 ADRs" | :39 | 📄 DESATUALIZADO | `docs/adr/` tem 24 arquivos | Corrigir | — | P |
| ON-3 | `npm test` com 4.470 testes / `npm run test:watch` | :89-90 | 📄 DESATUALIZADO | `test:watch` não existe (`package.json:16-21`) | Corrigir | Comando falha | P |
| ON-4 | Primeira contribuição em `src/pages/Dashboard.tsx` | :108 | 📄 DOC FALSO | Arquivo inexistente (`DashboardStatsGrid` está em `src/components/dashboard/`) | Corrigir | — | P |
| ON-5 | "Toda Edge Function usa `withAuth()` ou `requireCronSecret()`" | :80 | 📄 DESATUALIZADO | `lux-trigger/index.ts:74-90` faz auth manual; webhooks usam `requireWebhookSecret` | Corrigir | — | P |

---

## 14. `docs/ARCHITECTURE.md`

**✅ (10):** circuit breaker (`src/lib/externalData.ts:3,55`), snapshot/restore otimista, `ExternalDataCard`, RBAC `has_role`, rate limit in-memory (descrição correta), audit trail, observabilidade (`useWebVitals`, `useSlowQueryDetector`, `/admin/error-logs`), rotas críticas, Help Desk (`/suporte`, `AppRoutes.tsx:136`), linter baseline.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| AQ-1 | Stack "Vite 5" | ARCHITECTURE.md:16 | 📄 DESATUALIZADO | `package.json:127` (`vite 6.4.3`) | Atualizar | — | P |
| AQ-2 | "TanStack Query exclusivo, sem `useEffect`" | :18 | 📄 DOC FALSO | FE-2 (~53 arquivos) | — | — | — |
| AQ-3 | Edge runtime "esm.sh" | :21 | 📄 DESATUALIZADO | `scripts/check-edge-imports.mjs` proíbe; 0 ocorrências | Atualizar | — | P |
| AQ-4 | Proteção contra força bruta "5 tentativas / 15 min" | :51 | 🎭 VITRINE | `src/lib/rateLimiter.ts:21` usa `Map` em memória **no navegador** (zera no F5); tabela `login_attempts` sem uso em `src/`/`supabase/functions` | Lockout no servidor (Auth Hook/edge + `login_attempts`) | Força bruta de senha sem bloqueio real | M |
| AQ-5 | "Máximo 400 linhas" | :97 | 📄 DOC FALSO | FE-3 (91 arquivos) | — | — | — |
| AQ-6 | "Zero any, zero `dangerouslySetInnerHTML`" | :98 | 📄 DOC FALSO | ~32 `any`; 2 `dangerouslySetInnerHTML` | — | — | — |

---

## 15. `docs/EDGE_FUNCTIONS_API.md`

**✅ (30):** os 30 endpoints documentados existem em `supabase/functions/`.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| EA-1 | "30 endpoints": 78 functions não documentadas | EDGE_FUNCTIONS_API.md:3 | 📄 DESATUALIZADO | 108 functions, 78 ausentes da doc (ex.: `ask-crm`, `incoming-webhook`, `send-sms-campaign`, `sequence-processor`, `nurturing-runner`, `submit-signature`, `get-signature`, `deal-room-*`, `intent-*`, `mcp-server`, `dual-write-proxy`, `whatsapp-import`…) | Gerar a referência a partir do código | Integradores sem contrato | M |
| EA-2 | `health` "público (anon key)" | :28 | 📄 DOC FALSO | `supabase/functions/health/index.ts:11` exige `withAuth`; `scripts/migration/monitoring/post-cutover-watch.sh:33` usa a anon key → 401 | Liberar um health público mínimo ou corrigir os probes | Monitor externo acusa queda falsa | P |
| EA-3 | `social-events-detector` listado como Frontend/JWT | :25 | 📄 DOC FALSO + 🔌 | Exige cron (ver N-1) | Ver N-1 | Botão falha | P |
| EA-4 | `smart-reminders` listado como cron com `x-cron-secret` | :26,346 | 📄 DESATUALIZADO | Usa `withAuthOrServiceRole` | Corrigir | — | P |
| EA-5 | Headers dos webhooks | :356-357 | 📄 DOC FALSO | Evolution usa `apikey` (`evolution-webhook/index.ts:20`), não `x-evolution-secret`; Bitrix usa `x-bitrix24-secret` (`bitrix24-webhook/index.ts:40`), não `x-bitrix-secret` | Corrigir | Quem configurar pela doc recebe 401 e perde mensagens/eventos | P |
| EA-6 | Limites de rate | :366-368 | 📄 DESATUALIZADO | `external-data` 100/min, `generate-insights` 30/min (código) | Corrigir | — | P |
| EA-7 | external-data "5 ações" | :54 | 📄 DESATUALIZADO | Também há `update_with_version`, `schema`, `list_tables`, `distinct`… | Documentar | — | P |
| EA-8 | Functions sem nenhum chamador no repositório | — | ⬛ MORTO/🔌 | `enrich-contacts`, `audit-analytics`, `attribution-calculator`, `win-loss-record-deal`, `validate-access`, `detect-new-device` (0 referências em `src/`, functions, migrations, scripts, `.github`) | Ligar ou remover do deploy | Custo e superfície de ataque sem valor | P |

---

## 16. `docs/DATA_DICTIONARY.md` (37 tabelas de negócio)

**✅ (33)** existem nas migrations.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| DD-1 | `scoring_models`, `scoring_results`, `message_templates`, `search_presets` | DATA_DICTIONARY.md:73-77 | 📄 DOC FALSO (4 tabelas) | 0 `CREATE TABLE` nas migrations (`message_templates` só aparece numa lista de triggers, em `20260720000007_…sql:75`) | Criar as tabelas ou remover da doc | Modelos de scoring/templates documentados não existem | P |

---

## 17. `docs/data-dictionary.md` (auto-gerado em 2026-05-13, 262 tabelas)

**✅ (261)** tabelas documentadas existem nas migrations.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| DG-1 | Tabela fantasma `ai_recommendation_audit_logs_v2` | data-dictionary.md (seção da tabela) | 📄 DOC FALSO | Só aparece em `to_regclass(...)` (`20260926195756_…sql:33`), sem CREATE | Regerar | — | P |
| DG-2 | 19 tabelas reais ausentes do dicionário | — | 📄 DESATUALIZADO (19) | `ai_gateway_metrics`, `ai_tone_preferences`, `behavioral_insight_feedback`, `behavioral_profile_regen_queue`, `contact_analytical_profile_versions`, `cron_secrets`, `customer_purchases`, `customer_rotation_state`, `data_retention_policies`, `entity_relationships`, `incoming_webhook_nonces`, `notifications`, `rodizio_distribuicao_staging`, `rodizio_execucoes`, `rpc_perf_samples`, `rpc_plan_snapshots`, `social_insights`, `system_config`, `tasks` | Regerar na CI | Doc de dados incompleta | P |
| DG-3 | Tabelas documentadas sem nenhum uso no código | — | ⬛ MORTO/🔌 | 0 referências em `src/` e functions: `pipelines`, `pipeline_stages`, `pipeline_stage_transitions`, `nurturing_enrollments`, `interaction_summaries`, `marketing_roi_data`, `neuro_pnl_sessions`, `nlp_feedback`, `login_attempts`, `city_whitelist`, `attribution_models_cache`, `forecast_categories_history`. Estágios de pipeline **hardcoded** em `pipeline/DealDialog.tsx:42`, `DealDetailDrawer.tsx:38`, `revops/RevenueFunnelChart.tsx:6`, `useChannelPerformanceMatrix.ts:9` | Ligar o Pipeline a `pipelines`/`pipeline_stages` (funil configurável) ou remover | Funil não customizável apesar de existir modelo para isso | M |
| DG-4 | O dicionário descreve o banco local, não o canônico | — | 📄 DESATUALIZADO | `scripts/tabelas-ausentes.md:3-5`: 119 tabelas usadas pelo front ausentes no canônico `pgxfv…` (ex.: `system_alerts`, `contact_analytical_profiles`, `forms`, `lead_magnets`) | Gerar a partir do banco canônico | Equipe trabalha sobre um esquema que não é o de produção | M |

---

## 18. `docs/er-diagram.md`

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| ER-1 | Diagrama ER | er-diagram.md:1-7 | ❌ NÃO INICIADO / 📄 | Bloco `erDiagram` vazio (`:5-7`) | Rodar `scripts/generate_real_er.py` contra o canônico | Sem visão do modelo de dados | P |

---

## 19. `docs/DATABASE_ANALYSIS.md` (gaps e recomendações, `:1144-1234`)

**✅ (6):** triggers de `updated_at` (116 `BEFORE UPDATE`), FKs, seed de `disc_profile_config` (1 migration), extensões fora do `public`, índices adicionais (ondas `20260720000013`, `20260721000058`…), soft delete (RPCs `soft_delete_contact`/`company`). **NÃO VERIFICADO (2):** HIBP e dados demo.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| DA-1 | Popular `rfm_segment_config` | DATABASE_ANALYSIS.md:1153,1197 | 🔌 DESCONECTADO | 0 `INSERT INTO rfm_segment_config`; nenhum produtor de `rfm_metrics`; `RFMSegmentDashboard` (`src/components/dashboard/tabs/AnalyticsTab.tsx:107`) retorna `null` sem dados (`RFMSegmentDashboard.tsx:9`, `useRFMSegmentConfig.ts:13-14`) | Seed por usuário + `rfm-analyzer` gravando `rfm_metrics` | O painel de segmentação RFM nunca aparece | M |
| DA-2 | "Constraints de validação" | :1233 | 🟨 PARCIAL | CHECK de status existe (`20260720000008_…`); JSONB sem CHECK (BD-9) | — | — | M |

---

## 20. `docs/qa/*.md`

**findings.md ✅ (6):** #1, #2, #3 (lint 0/0), #5 (46 WARN de baseline), #6 (`e2e/gap-modules-smoke.spec.ts`), #7 (`ci.yml:87` build antes de `:138`). **NV (1):** fixtures `no-hardcoded-passwords`.
**static-audit.md ✅ (6)** · **CERTIFICATION_10_10.md ✅ (12 dimensões)** · **security-definer-audit.md ✅ (4 invariantes, `tests/rls/security_definer_hardening.sql` rodando na CI via `tests/rls/run.sh`)** · **functions-authenticated-allowlist.md ✅ (22 funções existem)** · **ficha360 ✅ (5 comportamentos do hook: `useFicha360Filters.ts:11-12,36,43,54,64-81,127-128`)** · **surface-map ✅ (2: Ask CRM e fallback de LP, com teste funcional)**.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| QF-4 | 101 órfãos no depcruise | qa/findings.md:17 | ❌ NÃO INICIADO | `.dependency-cruiser.cjs:12-15` continua `severity:'warn'` (baseline) | Remover os órfãos e promover a `error` | Código morto acumulando | M |
| QF-5b | Bucket B (DEFINER → INVOKER) | qa/findings.md:18 | ❌ NÃO INICIADO | 73 DEFINERs só para service_role (`security-definer-audit.md:9`); dívida declarada | Converter onde possível | Superfície privilegiada maior que o necessário | M |
| QF-P1 | `Math.random()` → crypto | qa/findings.md:24 | ❌ NÃO INICIADO (suprimido) | 49 `eslint-disable sonarjs/pseudo-random` em `src/`, inclusive em métricas de negócio (RA-1) | Remover o random de métricas | Ver RA-1 | P |
| QF-P3 | Regex/escape em `formatters.ts` | qa/findings.md:26 | 🟨 PARCIAL (suprimido) | 6 `eslint-disable` em `src/lib/formatters.ts` | Corrigir as regex | — | P |
| SM-1 | E2E dos módulos gap (ABM, Intent, Enrichment, Territórios, Nurturing, NPS, Reports, Deal Rooms) | qa/surface-map.md:24-26 | 🟨 PARCIAL (8) | `e2e/gap-modules-smoke.spec.ts:57-70` só verifica "renderiza sem erro de runtime"; Deal Room **público** (`/deal-room/:token`) e enrichment sem teste funcional | Jornadas com asserções | Regressões funcionais passam no CI | M |
| SA-1 | `no-orphans` e linter WARN "aceitos pelo baseline" | qa/static-audit.md:13,17 | 🟨 PARCIAL | = QF-4/QF-5b | — | — | — |
| CE-1 | Certificação omite cobertura e proteção de branch | qa/CERTIFICATION_10_10.md:9-24 | 📄 DESATUALIZADO | Sem a dimensão "coverage" (9,16%) e com `main` desprotegido | Incluir no dashboard | Selo incompleto | P |
| AL-1 | Allowlist se contradiz ("exatamente 33" × "anon 12, sem lista de 33") | qa/functions-authenticated-allowlist.md:9,13,86 vs :5 | 📄 DESATUALIZADO | Corpo e governança ainda falam em 33 | Reescrever o doc | Revisores aplicam a regra errada | P |
| AL-2 | `search_products_semantic` consumida por `useProductSearch` | qa/functions-authenticated-allowlist.md:45 | 📄 DOC FALSO | `useProductSearch` não existe (0 ocorrências em `src/`); só uso por functions | Corrigir | — | P |
| FX-1 | Deep link `/ficha-360/<contactId>?...` | qa/ficha360-deep-link-filtros.md:28 | 📄 DOC FALSO | A rota real é `/contatos/:id/ficha-360` (`src/app/AppRoutes.tsx:85`); não há rota `/ficha-360/:id` | Corrigir o roteiro ou criar alias | Links compartilhados dão 404 | P |
| FX-2 | Checklist manual de 12 itens sem automação | qa/ficha360-deep-link-filtros.md:144-159 | 🟨 PARCIAL | 0 testes que referenciem `useFicha360Filters`/`periodo=` | Teste de unidade do hook + E2E | Regressão de filtros sem detecção | P |

---

## 21. `docs/GET_CONTACT_SIDEBAR_BY_PHONE.md`

**✅ (3):** RPC criada (`20261002154500_get_contact_sidebar_by_phone.sql:14-20`), grants só para service_role (`:392-395`), teste em `supabase/tests/get_contact_sidebar_by_phone.sql`. **NV (1):** consumidor `crm-integration` no repo Zapp_Web_V2 (fora deste repositório).

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| GS-1 | Teste da RPC | GET_CONTACT_SIDEBAR_BY_PHONE.md:3,80-84 | 🟨 PARCIAL | `supabase/tests/` não é executado por nenhum workflow (o `ci.yml` roda `tests/rls/run.sh`) | Incluir na CI | Contrato com o Zapp pode quebrar sem aviso | P |
| GS-2 | Tabelas-fonte da RPC | :47-55 | 🟨 PARCIAL | `contact_phones`, `contact_emails`, `contact_social_media`, `contact_rapport`, `objection_scripts` não são criadas por nenhuma migration local (só existem no banco canônico) | Versionar o DDL | Replay/branch de banco quebra a sidebar | M |

---

## 22. `docs/PR3_CLOSED_REFERENCE.md` e DocsPage (`/admin/docs`)

**PR3 ✅ (3):** `docs/SECURITY.md`; helpers em `_shared/auth.ts` (`withAuth`, `requireWebhookSecret`, `requireCronSecret`, `withAuthOrServiceRole`); testes `_shared/auth_test.ts`. **NV (1):** "3 migrations" do PR.

| ID | Funcionalidade/plano/achado | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|---|
| PR3-1 | Dashboards Operacional / Tático / Estratégico | PR3_CLOSED_REFERENCE.md:17 | ❌ NÃO INICIADO | `src/pages/Dashboard{Operacional,Tatico,Estrategico}.tsx` inexistentes | Recuperar do branch `security/hardening-20260409-225244` | Visões gerenciais por nível ausentes | M |
| PR3-2 | `cloudflare-rate-limiter/` (rate limit persistente) | :16 | ❌ NÃO INICIADO | Diretório inexistente; rate limit segue in-memory (`_shared/rate-limit.ts:2-5`) | Worker ou rate limit em banco | Limite contornável | M |
| PR3-3 | CI com gitleaks + deno lint | :15 | ❌ NÃO INICIADO | 0 ocorrências em `.github/workflows/*.yml` | Adicionar | Segredos podem vazar no git sem alarme | P |
| PR3-4 | Docs `AUDIT_REPORT_2026-04-09`, `ARQUITETURA`, `POPs_PROCESSOS`, `KPIs_GESTAO`, `SCHEMA` | :10-11 | ❌ NÃO INICIADO | Ausentes em `docs/` | Recuperar POPs/KPIs | Processos e KPIs de gestão não documentados | P |
| PR3-5 | Plano "edge functions controladas pela API, não pelo git" | :21-24 | 📄 DESATUALIZADO | Hoje há deploy versionado (`scripts/migration/functions/deploy-all.sh`) e `06_REAUDITORIA…:21` | Arquivar | Duas fontes da verdade | P |
| DP-1 | DocsPage ensina template de Edge com esm.sh e CORS `*` | src/pages/DocsPage.tsx:93-104 | 📄 DOC FALSO | Contradiz `scripts/check-edge-imports.mjs`/`check-edge-cors.mjs` (gates de CI) | Atualizar para `npm:` + `scopedCorsHeaders` | Dev copia um padrão que a CI rejeita, ou um padrão inseguro | P |
| DP-2 | DocsPage: "Limite de 400 linhas" e "nunca `useEffect` para fetch" | src/pages/DocsPage.tsx:36-39,115-116 | 📄 DOC FALSO | FE-2/FE-3 | Marcar como meta, não como regra cumprida | — | P |

DocsPage: os outros 8 tópicos (`:59-166`) não foram verificados um a um (NÃO VERIFICADO).

---

## Resumo numérico

Contagem por documento. Um mesmo problema pode aparecer em mais de um documento. "Itens" = recomendações, achados, alegações ou referências verificados contra o código.

| Documento/seção | Itens verificados | ✅ OK | Não-OK | NÃO VERIFICADO |
|---|---|---|---|---|
| Achados novos (seção 0) | 6 | 0 | 6 | 0 |
| auditoria 01-05 | 61 | 23 | 36 | 2 (informativos) |
| auditoria 00 (Fase V) | 14 | 2 | 12 | 0 |
| auditoria 99 (matriz) | 12 | 7 | 5 | 0 |
| auditoria 06 (reauditoria) | 12 | 3 | 5 | 4 |
| TECH_DEBT | 26 | 10 | 12 | 4 |
| SYSTEM_EXCELLENCE_10_10 | 10 | 4 | 5 | 1 |
| AUDIT_VALIDATION_23_10 | 16 | 10 | 5 | 1 |
| audit_report | 15 | 7 | 7 | 1 |
| QA_ANALYSIS_REPORT | 23 | 15 | 7 | 1 |
| ux_improvement_strategy | 10 | 6 | 2 | 2 |
| PRODUCT_DESIGN_STRATEGY_V6 | 76 | 28 | 27 | 21 |
| COMPLETE_SYSTEM_ANALYSIS | 103 | 73 | 30 | 0 |
| ONBOARDING | 9 | 4 | 5 | 0 |
| ARCHITECTURE | 16 | 10 | 6 | 0 |
| EDGE_FUNCTIONS_API | 39 | 30 | 9 | 0 |
| DATA_DICTIONARY | 37 | 33 | 4 | 0 |
| data-dictionary | 283 | 261 | 22 | 0 |
| er-diagram | 1 | 0 | 1 | 0 |
| DATABASE_ANALYSIS | 10 | 6 | 2 | 2 |
| docs/qa/* (7 docs) | 77 | 57 | 19 | 1 |
| GET_CONTACT_SIDEBAR_BY_PHONE | 6 | 3 | 2 | 1 |
| PR3_CLOSED_REFERENCE | 9 | 3 | 5 | 1 |
| DocsPage (/admin/docs) | 11 | 0 | 3 | 8 |
| **TOTAL** | **882** | **595** | **237** | **50** |

Linhas de lacuna detalhadas nas tabelas: **176**. Uma linha pode agregar vários itens, como os 24 hooks inexistentes. Por status (contagem por `grep` na coluna Status; as linhas com status combinado, como "📄 + 🔌", contam nos dois): ❌ 60 · 🟨 54 · 🎭 6 · 🔌 9 · ⬛ 9 · 📄 42.

**Observação de método:** o CI do `main` (verde em 2026-10-11) e a proteção de branch foram consultados no GitHub em modo leitura. Tudo o que depende do banco remoto (crons agendados, HIBP, backups, migrations aplicadas) está marcado como NÃO VERIFICADO.

---

## Top 10 lacunas de maior impacto

| # | ID | Lacuna | Por que importa |
|---|---|---|---|
| 1 | N-3 + N-4 | Sequências e nurturing não enviam nada: `send-transactional-email` não existe, mas o passo é gravado como `sent` (`sequence-processor/index.ts:321-337`); nurturing só cria `interactions` (`nurturing-runner/index.ts:92-99`) | O coração da automação comercial é vitrine; as métricas de cadência são falsas |
| 2 | N-1 + N-2 | Regressão do SEC-4: 8 funcionalidades do front dão 401 (functions agora exigem `x-cron-secret`), e os crons versionados não mandam o segredo (um aponta para outro projeto com JWT fixo) | Botões e automações agendadas parados sem erro visível |
| 3 | PM-45 / DG-4 | 119 tabelas usadas pelo front não existem no banco canônico (`scripts/tabelas-ausentes.md:3`); dicionário, ER e migrations descrevem outro banco | Telas inteiras falham em produção; documentação inútil para decisões |
| 4 | RA-1 | Métricas aleatórias ainda em produção (velocidade de deal, probabilidade de objeção, força emocional) apesar de a reauditoria declarar que foram removidas | Gestor decide sobre números inventados |
| 5 | PM-48 / RA-3 | `main` sem proteção e sem checks obrigatórios; CI vermelho já entrou no `main` | Nenhum gate impede regressão; "10/10" não é aplicado por máquina |
| 6 | CS-3 | Push notifications quebrado ponta a ponta: VAPID placeholder, payload sem criptografia/VAPID, SW sem handler `push` | Lembretes e alertas nunca chegam ao celular |
| 7 | N-6 + AQ-4 + TD-P1 | Segurança de acesso de vitrine: whitelist IP/geo configurável sem enforcement (`validate-access` nunca chamada), força bruta só no navegador, MFA só para admin e só no front | Controles que o admin acredita ativos não protegem a conta |
| 8 | EF-6 / EF-7 / EF-8 / EF-10 | Filas sem claim atômico (nurturing, sequence, DLQ), SMS sem atomicidade e truncado em 1000 contatos, DLQ que "sucede" sem inserir, validação presa em `processing` | Duplicação e perda silenciosa de dados e mensagens (custo real) |
| 9 | PD-9.1 / PD-9.5 / DA-1 | Configurações sem efeito: preferências de notificação (canais, urgência, horário de silêncio) nunca lidas no backend; segmentação RFM sem produtor de dados (painel nunca aparece) | O usuário configura e nada muda; analytics RFM é vitrine |
| 10 | TD-7 / BD-4 / RA-2 | `audit_log` com partições só até dez/2026 e sem rotação; migrations não idempotentes sem replay em banco vazio (DR não comprovado) | Em ~2,5 meses a trilha de auditoria degrada; restauração de desastre incerta |
