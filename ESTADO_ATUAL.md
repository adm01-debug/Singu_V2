# ESTADO ATUAL DO SISTEMA — SINGU CRM v2

> **Data:** 2026-08-16 · **Branch:** `claude/system-status-roadmap-q30hin` · **Commit base:** `0fa6177`
> **Natureza:** auditoria **estática** de estado. Sem acesso ao banco de dados em runtime.
> **Exceção:** o estado do CI foi obtido da API real do GitHub e está marcado `VERIFICADO`.
>
> Detalhamento por dimensão em [`docs/estado/`](docs/estado/). Este documento é o resumo para decisão.

---

## 1. Veredito em uma tela

O SINGU CRM v2 tem **um front-end grande e maduro assentado sobre uma base que não sustenta o que ele mostra**.

As telas existem, são numerosas (130 rotas) e em geral bem construídas — o CRUD do núcleo (contatos, empresas, interações, tarefas) é sólido e o RBAC é real. O problema não é falta de código: é que **três camadas de fundação estão rompidas**, e cada uma delas invalida silenciosamente funcionalidades que a interface apresenta como prontas.

1. **A camada de tipos descreve outro sistema.** O `types.ts` contra o qual todo o front-end compila veio de um banco diferente.
2. **A camada de automação agendada não roda.** 24 Edge Functions foram escritas para cron; o repositório agenda 2, e ambas com o contrato de autenticação errado.
3. **O portão de qualidade não existe.** 30 dos últimos 30 runs de CI falharam; o mais recente sequer criou um job.

Nenhuma dessas falhas produz erro visível para o usuário. Elas produzem **telas que carregam com dados incompletos, métricas que sobem sem evento real e automações que nunca disparam** — exatamente o padrão de falha que não vira chamado de suporte.

---

## 2. Contagem honesta

**342 funcionalidades classificadas** em 7 dimensões, cada linha com evidência `arquivo:linha`.

| Classificação | Quantidade | % |
|---|---|---|
| ✅ **IMPLEMENTADO_TOTAL** | **155 de 342** | **45,3%** |
| 🟨 **IMPLEMENTADO_PARCIAL** | **99 de 342** | **28,9%** |
| 🟦 **SUGERIDO_OU_INICIADO** | **51 de 342** | **14,9%** |
| ⬛ **MORTO_OU_ABANDONADO** | **37 de 342** | **10,8%** |

### Por dimensão

| Dimensão | Total | ✅ | 🟨 | 🟦 | ⬛ | Leitura |
|---|---|---|---|---|---|---|
| [Core CRM](docs/estado/01_CORE_CRM.md) | 65 | 47 | 11 | 3 | 4 | **A parte mais saudável do sistema** |
| [Inteligência / IA / Voz](docs/estado/02_INTELIGENCIA_IA.md) | 46 | 21 | 14 | 5 | 6 | Provider único e telemetria boa; persistência falha |
| [Marketing e Automação](docs/estado/03_MARKETING_AUTOMACAO.md) | 38 | **6** | 15 | 11 | 6 | **A dimensão mais frágil — 16% completa** |
| [RevOps e Vendas](docs/estado/04_REVOPS_VENDAS.md) | 59 | 34 | 11 | 8 | 6 | Telas maduras, camada de automação com **zero** ✅ |
| [Admin / Segurança / Observabilidade](docs/estado/05_ADMIN_SEGURANCA_OBSERVABILIDADE.md) | 68 | 29 | 27 | 6 | 6 | RBAC real; observabilidade é metade vitrine |
| [Integrações](docs/estado/06_INTEGRACOES.md) | 32 | 12 | 10 | 8 | 2 | 8 integrações prometidas em doc sem código |
| [Infra / CI / Testes / Docs](docs/estado/08_INFRA_CI_TESTES_DOCS.md) | 34 | 6 | 11 | 10 | 7 | Sem pipeline de deploy; CI inoperante |

A [camada de dados](docs/estado/07_DADOS_BACKEND.md) é contabilizada à parte, por domínio de dados e não por funcionalidade: **265 tabelas, 210 funções, 251 triggers, 1.063 políticas RLS, 15 jobs `pg_cron`** declarados em 390 migrations.

> **O que significa um ✅ aqui:** o fio está completo e correto **no código**, e o objeto de banco está declarado no repositório. **Não** significa "funciona em produção" — isso exigiria runtime, que não tivemos. Pela regra de ouro do método (*pronto = em produção com uso real*), todo ✅ deste documento é um ✅ condicional.

---

## 3. Riscos estruturais, por gravidade

### R1 — O `types.ts` em uso descreve um sistema diferente `CRÍTICO`

O arquivo contra o qual todo o front-end tipa suas queries não corresponde ao banco deste produto.

| Comparação | Tabelas em comum |
|---|---|
| 390 migrations ∩ `src/integrations/supabase/types.ts` (em uso) | **120** |
| 390 migrations ∩ `src/integrations/supabase/types.ts.lovable.bak` | **262** |

O arquivo em uso declara `carriers`, `carrier_evaluations`, `carrier_homologations`, `carrier_score_history`, `cidades`, `asia_upload_mapping` — vocabulário de sistema de transportadoras, **ausente do backup**.

`git log -- src/integrations/supabase/types.ts` retorna **um único commit**: `c9b22b5 feat: Migração Banco Lovable para Supabase Singu v2` — o mesmo que criou o `.bak`. A migração salvou os tipos corretos como backup e instalou no lugar tipos gerados de outro banco.

**Impacto medido:** 134 dos 248 alvos de `.from()` no código não existem no `types.ts`; 127 desses existem nas migrations. Inversamente, 144 das 145 tabelas exclusivas do `types.ts` nunca são consultadas por ninguém, e 0 das 111 views.

### R2 — A camada de automação agendada não pode rodar `CRÍTICO`

**24 Edge Functions** exigem `x-cron-secret` via `requireCronSecret` (`supabase/functions/_shared/auth.ts:264-276`): `forecast-snapshot-cron`, `lead-score-cron`, `nurturing-runner`, `sequence-processor`, `weekly-digest`, `cs-health-recalc`, `revops-snapshot-builder`, `mql-evaluator`, `lead-routing`, `send-sms-campaign`, `process-webhook-dlq`, `check-health-alerts`, entre outras.

Contra isso, o repositório versiona **15 jobs `pg_cron`**, dos quais apenas **2** chamam uma Edge Function — e **os dois omitem o header exigido**:

| Job | Alvo | Header enviado | Migration |
|---|---|---|---|
| `smart-notify-automation` | `smart-notify` | só `Content-Type` + `Authorization` | `20260512105729_...sql:11` |
| `validation-queue-drain` | `validation-queue-worker` | idem | `20260417120721_...sql:18` |

As outras **22 funções cron-gated não têm agendador algum** no repositório.

E o disparo manual também não resolve: nenhum hook do front-end envia `x-cron-secret`, e o cliente Supabase não injeta header global (`src/integrations/supabase/client.ts:12-23`). Botões como "Atualizar Snapshot" (`src/hooks/useRevOps.ts:193`) e "Resetar Contadores Diários" (`src/hooks/useLeadRoutingServer.ts:96`) retornam 401.

**Agravante — três project refs coexistem, e os dois arquivos de configuração se contradizem:**

| Ref | Onde aparece | O que é |
|---|---|---|
| `hjhthvzwtvwgdrochcam` | `supabase/config.toml:1`; cron `smart-notify-automation` (`20260512105729_...sql:10`) | Identificado como `OLD_REF` — **projeto antigo** — em `docs/MIGRATION_EDGE_FUNCTIONS.md:20` |
| `rqodmqosrotmtrjnnjul` | Cron `validation-queue-drain` (`20260417120721_...sql:18`), com JWT embutido | Não documentado em lugar nenhum |
| `pgxfvjmuubtbowutlide` | `supabase/.temp/linked-project.json`; CSP em `vite.config.ts:19`; `HANDOFF.md:24` | O projeto **linkado**, de nome `"Singu - V2 | Cadastro de Empresas / Contatos"` — que a documentação chama de **"Banco Externo"** |

Ou seja: `config.toml` aponta para o projeto que a própria documentação de migração chama de antigo, enquanto o projeto efetivamente linkado é aquele que os documentos descrevem como "externo, acessado via proxy". Os dois crons versionados apontam para os dois refs que **não** são o linkado.

O `DEST_REF` do runbook de migração (`docs/MIGRATION_EDGE_FUNCTIONS.md:20`) continua como placeholder literal `"xxxxxxxxxxxxxxxxxxxx"` — a migração está documentada, mas o repositório não registra para onde ela foi.

### R3 — O CI não roda há meses `CRÍTICO` · `VERIFICADO em runtime`

Consultei os runs reais via API do GitHub, não o YAML:

| Métrica | Valor |
|---|---|
| Runs de `ci.yml` analisados | 30 mais recentes |
| Conclusão `failure` | **30 de 30** |
| Run mais recente (#592, `main`, `0fa6177`) | `failure` com **0 jobs criados** |

Zero jobs criados significa falha **antes de qualquer step executar**. Todos os gates descritos no `ci.yml` — ESLint 0/0, typecheck, `npm audit`, build, E2E, bundle-size — estão hoje inoperantes. O merge para `main` e o commit da migração de banco foram feitos nesse estado.

Somam-se defeitos de projeto no próprio workflow: os 3 gates de banco usam `if: ${{ secrets.PGHOST != '' }}` (`ci.yml:35,84,97`), e o Lighthouse é neutralizado por `|| echo` (`ci.yml:113`) mais 7 assertions em `"warn"`.

**Não existe pipeline de deploy versionado** — nenhum workflow de deploy, nenhum Dockerfile, nenhum `vercel.json`. Há indício de que a publicação passa por uma integração Vercel configurada fora do repositório (`supabase/.temp/linked-project.json` registra `organization_id: "vercel_icfg_..."`), mas essa configuração não é versionada e seu estado é `NAO_VERIFICADO`. Na prática: o repositório não descreve como o sistema vai para produção.

### R4 — Segredo real versionado `CRÍTICO`

`supabase/migrations/20260417120721_...sql:18` embute um **JWT `anon` completo e válido** (`exp` em 2036), apontando para o ref `rqodmqosrotmtrjnnjul`.

Além disso: **0 dos 22 secrets de backend** aparecem no `.env.example`.

### R5 — O ambiente não nasce do repositório `ALTO`

Provado estaticamente: **30 tabelas recebem `CREATE POLICY`** e **35 recebem `CREATE INDEX`** sem nenhum `CREATE TABLE` correspondente, sem guarda `IF EXISTS`, em 14 arquivos (ex.: `supabase/migrations/20260721000028_fix_rls_user_private_tables.sql:15`). Duas materialized views são movidas, refrescadas e revogadas sem nunca serem criadas; dois schemas (`zapp_history`, `_dormant`) recebem políticas sem `CREATE SCHEMA`.

Aplicar as migrations num banco limpo falha.

### R6 — Split-brain de persistência `ALTO`

Parte do sistema lê de um banco Supabase **externo** via proxy `external-data`; outra parte escreve no banco **local**. O caso mais visível:

| Operação | Destino | Evidência |
|---|---|---|
| Ler os deals do Pipeline | Banco **externo** | `src/hooks/usePipeline.ts:79` — `callExternalRpc('get_deals_pipeline')` |
| Mover o card | Banco **local** | `src/hooks/usePipeline.ts:189` — `supabase.rpc('move_deal_atomic')` |

O RPC local faz `SELECT ... FROM public.deals WHERE id = p_deal_id` e, não achando, dispara `RAISE EXCEPTION 'Deal não encontrado'` (`supabase/migrations/20260513164309_...sql:45-49`). Como o deal veio do outro banco, o id nunca existe localmente. **Arrastar card no Pipeline não persiste.** O update otimista esconde a falha na tela.

Mesma família: `/erp` nunca retorna dados (7 tabelas fora da allowlist do proxy, erro engolido), e `/mapa-empresas` lê `companies` do banco local (`src/pages/MapaEmpresas.tsx:50`) enquanto o resto do CRM lê do externo.

### R7 — Envio de e-mail é encenado `ALTO`

Três camadas independentes registram envio sem enviar:

| Onde | O que faz |
|---|---|
| `src/hooks/useEmailCampaigns.ts:83-87` | Comentário no próprio código: *"Simula o envio (não dispara emails reais)"* — grava `status:'sent'` e a UI exibe "Campanha enviada" |
| `supabase/functions/sequence-processor/index.ts:331` | Grava `sent` **antes** de tentar enviar; invoca `send-transactional-email` (`:337`), que **não existe** entre as 109 functions; o `catch` em `:346` engole |
| `supabase/functions/nurturing-runner/index.ts:91-100` | Steps de email/whatsapp só inserem linha em `interactions` e avançam o step |

`check-health-alerts/index.ts:224` faz o mesmo com o e-mail de alerta.

### R8 — Lockout de administrador `ALTO`

Todo admin fora de `aal2` fica sem acesso, **inclusive quem nunca cadastrou MFA**:

1. `src/hooks/useMFAGuard.ts:18-21` — não-admin recebe `mfaVerified = true` e passa. O guard só age sobre admins.
2. `src/hooks/useMFAGuard.ts:33` — exige `currentLevel === 'aal2'`. Admin sem MFA está em `aal1`.
3. `src/hooks/useMFAGuard.ts:36-43` — redireciona para `/seguranca`, com guarda anti-loop.
4. `src/app/AppRoutes.tsx:154` — mas `/seguranca` **também** está sob `Protected` → `MFAGuard`.
5. `src/components/auth/MFAGuard.tsx:13-15` — com `isMfaRequired`, retorna `null`.

Em `/seguranca` o redirect é suprimido, o guard continua reprovando, e a página de remediação renderiza **vazia**.

### R9 — Painéis que informam o oposto da realidade `MÉDIO`

- **Página pública de status é fail-open.** `src/pages/StatusPage.tsx:68`: `const overall = data?.status || 'healthy'`. A rota `/status` é pública, mas invoca `system-health`, que chama `withAuth(req)` (`supabase/functions/system-health/index.ts:139`). Visitante anônimo → erro → `data` indefinido → **"todos os sistemas operacionais"**, exatamente quando nada foi medido.
- **Dado fictício em métrica de negócio**, com a supressão de lint mentindo sobre o motivo (todas marcadas `-- non-security UI/animation/mock/test randomness`, o que é falso):

| Onde | O que é aleatório |
|---|---|
| `src/hooks/useEmotionalIntelligence.ts:53,73` | Força da âncora emocional (7–10 / 3–7) |
| `src/hooks/useCognitiveBiases.ts:80` | Confiança da detecção de viés (60–90%) |
| `src/hooks/useDealVelocity.ts:67` | Dias médios por estágio do pipeline (3–18) |
| `supabase/functions/suggest-next-action/index.ts:192` | `predicted_need` — **sorteado e persistido no banco** |

- Somam-se: `src/data/analyticsData.ts:27-213` (toda a aba Overview de `/analytics`, com ranking de nomes inventados em `:171-177`), `src/pages/admin/Observability.tsx:59,70,81` (`99.9%` / `142ms` / `0.02%` fixos), `NLPMasteryScore.tsx:19` ("10/10" fixo), `MarketingHub.tsx:254,258,262` (CPL/CAC/LTV fixos).

### R10 — Tabelas e painéis sem produtor de dados `MÉDIO`

- `insights`: **nenhum INSERT em todo o repositório**. `supabase/functions/generate-insights/index.ts` não tem uma única chamada `.from(` — só retorna JSON. O único escritor é um `UPDATE ... dismissed: true` (`src/hooks/useContactDetail.ts:195`), que atua sobre linhas que nada cria.
- `ai_recommendation_audit_logs_v2`: consultada em `src/hooks/useRecommendationAudit.ts:25` e `src/pages/RecommendationAudit.tsx:30`; nas 390 migrations o nome aparece **uma vez**, dentro de um literal de lista (`20260723150429_...sql:33`), nunca num `CREATE TABLE`.
- `win_loss_records`: o único escritor pela UI é `WinLossCaptureDialog.tsx`, que tem **0 importadores**.
- `query_telemetry`, `schema_drift_alerts`, `password_reset_requests`: só leitores.
- **Órfãos na base:** 24 de 265 tabelas (9,1%) e 75 de 210 funções (35,7%) sem qualquer consumidor — incluindo o núcleo `pipelines`/`pipeline_stages`.

### R11 — Testes que não protegem `MÉDIO`

100 arquivos / 1.892 casos. Mas:

- **11 arquivos / 55 casos não são executados por runner nenhum** — inclusive os 4 specs de `e2e/` (fora do `testDir:'./tests'`, `playwright.config.ts:4`) e os **6 testes de Edge Function** com `Deno.test`, já que nenhum step roda `deno test`. **As 109 Edge Functions têm zero teste executado.**
- ~437 dos 1.892 casos (23%) são testes-espelho ou grep-tests que não exercitam produção.
- E, com o CI vermelho (R3), **nenhum dos 1.892 é executado como gate**.

### R12 — Feature flags que não gateiam nada `BAIXO`

Tabela com `DEFAULT false` (`supabase/migrations/20260420163323_...sql:32`), sem seed, e `src/hooks/useFeatureFlag.ts:16` tem **zero consumidores**. A coluna `roles[]` nunca é lida. A página `/admin/feature-flags` administra um mecanismo que não protege nenhuma funcionalidade.

---

## 4. Integrações — estado consolidado

**32 integrações mapeadas.** Detalhe em [`docs/estado/06_INTEGRACOES.md`](docs/estado/06_INTEGRACOES.md).

| Estado | Integrações |
|---|---|
| ✅ **12** | Lovable AI Gateway (33 EFs, provider único de LLM), ElevenLabs STT, ElevenLabs TTS, Evolution/WhatsApp (webhook de entrada), Firecrawl, EnrichLayer, Bitrix24 (entrada), n8n/Lux (bidirecional — **única com retry**), Supabase externo, `incoming-webhook` genérico (**único com DLQ**), MCP Server, Lovable Cloud Auth |
| 🟨 **10** | Twilio (secret fora de todo inventário), Web Push (sem VAPID nem criptografia), Nominatim, ipapi.co, cdnjs, Intent Pixel (sem assinatura), Evolution via `smart-notify` (cron sem o header), Bitrix24 saída, MCP saída, host divergente `api.lovable.dev` em `meeting-summary:128` |
| 🟦 **8 — prometidas em documento, sem código** | **Resend** (`src/hooks/useWeeklyReport.ts:206`), **Proxycurl** (`HANDOFF.md:127`), **GEMINI_API_KEY** (`docs/RUNBOOK.md:405`), **Stripe** e **GitHub** (só templates de UI), **Slack** e **PagerDuty** (`monitoring/alertmanager/alertmanager.yml` com `REPLACE_ME`), **Bitrix24 outbound** (`docs/HARDENING_PHASE3_FINAL.md:82`) |
| ⬛ **2** | `evolution-api` (404 linhas, 44 ações destrutivas, **zero chamadores**) e `dual-write-proxy` (import quebrado + handler **sem autenticação alguma**) |

**Achado de segurança:** `incoming-webhook` só valida HMAC se a flag `require_signature` da linha estiver ligada; sem ela, o token na URL basta para inserir contatos e deals arbitrários.

**Resiliência:** apenas `lux-trigger` tem retry, apenas `incoming-webhook` tem DLQ, e **nenhuma integração tem circuit breaker** — apesar de `docs/adr/003-circuit-breaker-pattern.md`.

---

## 5. O que está bom

Não distorço o quadro para parecer rigoroso. Há trabalho sério aqui:

- **O Core CRM é sólido.** 47 de 65 funcionalidades ✅. As 25 rotas do escopo estão registradas, quase não há mocks nem TODOs, e a paginação, filtros e detalhamento de contatos/empresas são maduros.
- **RBAC é real e completo.** `user_roles` + enum `app_role` + RPC `has_role` (`supabase/migrations/20260323155106_...sql:2-25`), e **todas as 22 rotas `/admin/*` passam por `RequireAdmin`** — nenhuma rota administrativa desprotegida.
- **RLS tem cobertura efetiva de 100%** do que o repositório cria: 1.063 políticas sobre 296 alvos; a única tabela sem RLS é uma partição (falso positivo).
- **Telemetria de IA é consistente:** 28 das 29 funções que usam LLM passam por `fetchAI()`, com logging centralizado.
- **A fila comportamental é bem construída:** claim atômico com `FOR UPDATE SKIP LOCKED`.
- **O `ask-crm` tem guarda de `user_id`** no caminho NL→SQL.
- **A documentação de migração é boa** — `docs/MIGRATION_*.md` é um runbook real e detalhado. O problema é que o repositório não reflete sua execução.

O sistema não é um esqueleto. É um produto grande cujo alicerce se deslocou num único commit e cujo portão de qualidade parou de avisar.

---

## 6. O que esta auditoria NÃO cobriu

Declarado aqui, não escondido no rodapé.

| Não coberto | Por quê |
|---|---|
| **Todo o runtime do banco** | Nenhum MCP desta sessão aponta para o projeto Supabase do sistema. Não sei se uma tabela tem linhas, se um cron rodou ou falhou, se um webhook tem tráfego, nem quais migrations foram aplicadas |
| **Crons criados fora do repositório** | Podem existir jobs criados pelo painel Supabase. Se existirem, o repositório deixa de ser fonte da verdade — o que é, por si, o achado R5 |
| **Build, testes e lint** | `node_modules` vazio, sem Supabase CLI. **Nada foi executado.** Nenhuma afirmação deste documento diz que algo compila ou que teste passa |
| **O schema do banco externo** | Não existe no repositório. Toda funcionalidade servida pelo proxy `external-data` tem existência real `NAO_VERIFICADO` |
| **A causa exata da falha do CI** | Sei que 30/30 falharam e que o último não criou jobs. A anotação bruta do run não foi acessível |
| **Leitura linha a linha de `src/components` (146k linhas), `supabase/migrations` (28k) e `scripts` (22k)** | Acima do teto de contexto. Cobertos por inventário de altitude, não por leitura integral |
| **7 sub-rotas** | `/mapa-empresas` (que auditei diretamente ao fechar a costura), `/lead-scoring/config`, `/lead-scoring/automations`, `/customer-success/account/:id`, `/deal-rooms/:id`, `/playbooks/:id`, `/playbooks/battle-cards/:id` |

### Recontagem de cobertura (Fase D)

| Métrica | Resultado |
|---|---|
| Caminhos de arquivo distintos citados nas 8 saídas | 577 |
| Citados que **não existem** no repositório | **0** — as 25 aparentes ausências são elisões de nome (`..._...sql`); todos os 25 prefixos de timestamp foram confirmados |
| Edge Functions mencionadas por nome | **108 de 108** |
| Rotas citadas | **106 de 113** |

**Não declaro "100% dos arquivos inventariados".** Não é verdade: 92 de 958 arquivos em `src/components` e 144 de 389 em `src/hooks` foram citados nominalmente. A auditoria é exaustiva **por funcionalidade e por objeto**, não por arquivo.

---

## 7. Correções feitas durante o trabalho

Registradas porque erro repassado como verdade contamina o resto.

1. **Contagem de crons: eu disse 2, são 15.** Meu primeiro regex só casava `cron.schedule('nome'` na mesma linha, e a maioria das chamadas quebra linha. Se eu tivesse repassado "2" aos agentes, o número se multiplicaria por todos eles.
2. **Duvidei indevidamente do achado do `x-cron-secret`.** Meu grep em `smart-notify/index.ts` não retornou nada porque o símbolo é `requireCronSecret`, em camelCase. O relato estava certo; minha checagem é que falhou.
3. **"`insights` tem zero escritores" estava impreciso.** Há 1 escritor — um `UPDATE` de dispensa em `src/hooks/useContactDetail.ts:195`. A conclusão fica mais forte, não mais fraca: não há **nenhum INSERT**, então o "dispensar" atua sobre linhas que nada cria.
4. **Minha própria recontagem de cobertura acusou 247 evidências fabricadas — falso.** A alternação `(ts|tsx|...)` casava `ts` antes de `tsx` e truncava toda extensão `.tsx`. Corrigido, o número real de citações inexistentes é **0**. É a mesma armadilha que um critério ruim de detecção de código morto produz.
5. **Um agente corrigiu a si mesmo, corretamente:** `lead-score-threshold-runner` **não** é órfã — é chamada EF→EF em `lead-scorer/index.ts:157,401`.
6. **Refinamento após a primeira versão deste documento.** Eu havia escrito que os crons apontam para "dois refs antigos". Medindo melhor, são **três refs coexistindo**, e o projeto efetivamente linkado (`supabase/.temp/linked-project.json`) é justamente o que a documentação chama de "Banco Externo" — enquanto o `config.toml` aponta para o projeto que o runbook de migração chama de antigo. Ver R2. Também suavizei "não existe pipeline de deploy" para "não existe pipeline de deploy **versionado**": há sinal de integração Vercel fora do repositório, que não pude verificar.

---

## 8. Próximos passos

### Barato e seguro — não toca produção

| # | Ação | Esforço |
|---|---|---|
| 1 | **Restaurar o `types.ts`** a partir do `.bak` ou regerar do banco correto. Destrava R1 e provavelmente parte do CI | Horas |
| 2 | **Corrigir o `ci.yml`** para voltar a criar jobs, e trocar os 3 gates `if: secrets.*` por uma condição válida | Horas |
| 3 | **Adicionar `x-cron-secret`** aos 2 crons versionados e parametrizar o project-ref (hoje hardcoded em 2 refs diferentes) | Horas |
| 4 | **Criar as migrations faltantes** para as 30 tabelas que só recebem `CREATE POLICY` e as 35 que só recebem `CREATE INDEX` | Dias |
| 5 | **Remover as 4 fontes de dado fictício em métrica de negócio** e a supressão de lint que as encobre | Horas |
| 6 | **Corrigir o `MFAGuard`** para liberar `/seguranca` mesmo em `aal1` | Horas |
| 7 | **Corrigir o fail-open** de `StatusPage.tsx:68` e tornar `system-health` público ou criar endpoint anônimo | Horas |
| 8 | **Atualizar a documentação canônica** — `HANDOFF.md:4` diz "30 Edge Functions / 40+ tabelas" contra 109/268; `README.md:106` diz "~50 migrations" contra 390; `README.md:149` manda rodar `npm run test`, script que não existe | Horas |

### Toca produção ou é decisão sua

| # | Decisão | Por que é sua |
|---|---|---|
| A | **Rotacionar o JWT `anon` versionado** em `20260417120721_...sql:18` e auditar o projeto `rqodmqosrotmtrjnnjul` | Invalida chaves em uso; precisa de janela |
| B | **Decidir o destino da camada de automação agendada** (22 funções sem cron): criar os jobs, ou assumir que o produto não tem automação e remover as telas que a prometem | Muda o escopo do produto |
| C | **Resolver o split-brain** externo × local — unificar num banco ou tornar o proxy o único caminho de escrita | Arquitetural; afeta dados vivos |
| D | **Fechar ou autenticar `incoming-webhook`** para exigir HMAC sempre | Pode quebrar integrações que já postam |
| E | **Remover `evolution-api` e `dual-write-proxy`** (código morto; o segundo sem autenticação) | Deleção — confirmar que nada externo os chama |
| F | **Definir um pipeline de deploy** — hoje a publicação acontece fora do Git | Processo, não código |
| G | **Decidir sobre o envio de e-mail encenado**: implementar de fato (Resend está prometido em `useWeeklyReport.ts:206` sem código) ou remover a UI que diz "Campanha enviada" | Usuários podem estar confiando nessa métrica |

**Recomendação de ordem:** 1 → 2 antes de tudo. Com o `types.ts` correto e o CI voltando a criar jobs, os itens seguintes passam a ter rede de proteção — hoje não têm.

---

## 9. Critério de pronto — autoavaliação honesta

- [x] Toda funcionalidade auditada tem uma das 4 classificações, com evidência `arquivo:linha`
- [x] Achados graves verificados de forma independente (R1, R2, R3, R6, R8, R9, R10 reproduzidos por mim, fora do relato dos agentes)
- [x] Runtime marcado `VERIFICADO` (só o CI) ou `NAO_VERIFICADO` (todo o resto), sem meio-termo
- [x] Lacunas declaradas no próprio documento (§6)
- [x] Erros próprios corrigidos em voz alta (§7)
- [x] **Nada foi alterado em produção** — nem havia acesso para isso
- [ ] **100% dos arquivos de código inventariados** — **NÃO atingido.** Cobertura é por funcionalidade e por objeto (108/108 Edge Functions, 106/113 rotas, 265 tabelas), não por arquivo

Uma auditoria honesta sobre os próprios limites vale mais que uma completa e não confiável.
