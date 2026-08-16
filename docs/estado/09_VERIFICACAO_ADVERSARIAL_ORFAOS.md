# Verificação adversarial — classificações de código morto/órfão

> **Postura.** Este documento não confirma a auditoria: tenta **derrubá-la**. Cada alvo
> classificado como ⬛ MORTO_OU_ABANDONADO ou 🟦 órfão foi tratado como **classificação errada
> até prova em contrário**. O objetivo é impedir que código vivo seja apagado.
>
> Escopo: alvos extraídos de `docs/estado/01`–`08` (⬛, "órfã/órfão", "zero chamadores",
> "sem consumidor", "nenhum importador", "código morto") — **27 alvos**.
>
> Restrições respeitadas: nenhum build/test/lint executado (`node_modules` vazio); sem runtime;
> nenhum arquivo fora deste foi editado; nenhum `git commit`/`push`.

---

## Método (os 10 testes)

Para cada alvo, todos os testes abaixo foram aplicados. **Um único acerto refuta.**

| # | Teste | Como foi executado |
|---|---|---|
| 1 | `invoke('nome'` / `invoke("nome"` / crase | `grep -rn` em `src/`, `supabase/functions/`, `tests/`, `e2e/`, `scripts/` |
| 2 | `invoke<Tipo>('nome'` (com generics) | idem — o grep foi feito pelo **nome solto**, que cobre qualquer generic |
| 3 | Nome montado por variável/template string | grep pelo nome solto em todo `.ts/.tsx`; + auditoria dos **2 únicos** pontos de despacho dinâmico do repo: `src/hooks/useEdgeFunctionActions.ts:15` e `src/lib/supabaseInvoke.ts:37`, e do único despacho dinâmico EF→EF (`supabase/functions/validation-queue-worker/index.ts:66`) |
| 4 | `functions/v1/<nome>` em qualquer arquivo, incl. migrations `.sql` (pg_net) | `grep -rn "functions/v1"` em `supabase/`, `src/`, `scripts/`, `monitoring/`; + varredura de **todos** os `cron.schedule` e `net.http_post` das migrations |
| 5 | Chamada EF→EF | grep do nome em `supabase/functions/` excluindo o diretório da própria função |
| 6 | Componentes React: import default, import nomeado, barrel `index.ts`, `lazy(() => import(...))` | grep por símbolo **e** por caminho (`@/components/...`, `@/pages/...`); inventário dos 10 `index.ts` de `src/` (nenhum re-exporta os alvos); grep de `lazyPages.tsx` e `import * as P` |
| 7 | Hooks: nome do hook em qualquer lugar, incl. re-export | grep do símbolo em todo `src/`, `tests/`, `e2e/` |
| 8 | Tabelas: `.from('x')`, `.from("x")`, RPC que a referencia no corpo SQL, trigger, view | grep em `src/` + `supabase/functions/` + 390 migrations |
| 9 | `.github/workflows`, `package.json`, `scripts/`, `e2e/`, `tests/` | grep direto (2 workflows: `ci.yml`, `monitoring-lint.yml`) |
| 10 | Documentação de runbook que implique uso operacional manual | leitura de `docs/RUNBOOK.md`, `docs/EDGE_FUNCTIONS_API.md`, `docs/MIGRATION_MASTER_RUNBOOK.md`, `.lovable/memory/` |

**Teste 11 (adicionado por mim, não pedido).** *Inversão produtor/consumidor:* mesmo sem chamador,
o artefato é **produtor exclusivo** de dado lido por código vivo? Ou o "caminho vivo" alegado pela
auditoria está **quebrado por GRANT/REVOKE** em migration posterior? Este teste produziu **3 dos 5
falsos positivos** encontrados — e é exatamente o que a bateria original de 10 testes não pega.

---

## Placar: 5 REFUTADOS / 16 CONFIRMADOS / 6 INCONCLUSIVOS de 27 alvos

- **5 refutados** = classificação original **errada**; apagar quebraria produção.
- **6 inconclusivos** = não consegui provar morte; **não apagar sem checar o painel Supabase**.
- **16 confirmados** = os 10 testes falharam em achar consumidor. Ainda assim, ver "Riscos residuais".

---

## Tabela de vereditos

| Alvo | Classificação original | Veredito | Prova (`arquivo:linha`) ou testes aplicados |
|---|---|---|---|
| **`attribution-calculator`** | ⬛ "órfã — substituída pela RPC `compute_attribution`" (04:100,191; 03:177) | **REFUTADO** | A RPC teve `EXECUTE` **revogado de `authenticated`** em `supabase/migrations/20260723151654_20640250-694c-4f4e-875c-69f2bcbe51a4.sql:14` e concedido **só a `service_role`** em `:26` (nenhuma migration posterior reverte). O "caminho vivo" citado pela auditoria — `src/hooks/useAttribution.ts:61` com JWT de usuário, usado em `src/pages/MarketingHub.tsx:48` — é justamente o **quebrado**. A EF usa `SUPABASE_SERVICE_ROLE_KEY` (`supabase/functions/attribution-calculator/index.ts:38-41`) e chama a RPC em `:43`: é o **único caminho de execução que ainda funciona**. A relação está invertida no doc 04. |
| **`crm-automation-monitor`** | ⬛ "Zero chamadores em `src/`" (05:96) | **REFUTADO** | É o **único escritor** de `crm_automation_logs` (`supabase/functions/crm-automation-monitor/index.ts:49` sucesso, `:63` erro — grep de `crm_automation_logs` em todo o repo não acha outro `insert`). A tabela é lida e mutada por componente vivo `src/components/crm/CRMAutomationAuditLog.tsx:52,79-80`, renderizado em **duas páginas roteadas**: `src/pages/Index.tsx:192` (home) e `src/pages/Automacoes.tsx:80`. Apagar a EF deixa um widget da home permanentemente vazio. |
| **`auto-regen-behavioral-profiles`** | ⬛ "Zero referências no repositório inteiro" (02:94,146) | **REFUTADO** | É o **único produtor** de `system_alerts` com `alert_type='behavioral_regen_error_rate'` (`supabase/functions/auto-regen-behavioral-profiles/index.ts:227`; grep do literal no repo só acha esta EF + os leitores + o CHECK do trigger em `20260713105306_…sql:16`). Esse alerta é consumido por **três componentes vivos**: `src/components/admin/BehavioralRegenAlertBanner.tsx:45`, `BehavioralRegenAlertsStats.tsx:25`, `BehavioralRegenAlertsTrend.tsx:46` — todos montados na rota `/admin/behavioral-regen-audit` (`src/pages/admin/BehavioralRegenAudit.tsx:436,457,458`). |
| **`process-behavioral-regen-queue`** | 🟨 no doc 02, mas listada como alvo "órfã/sem cron" (02:96,148,225) | **REFUTADO** | Tem superfície de monitoramento **viva e roteada**: `src/components/admin/BehavioralRegenCronHealth.tsx:48` chama a RPC `get_behavioral_regen_cron_health`, cujo corpo filtra `cron.job` pelo jobname `'process-behavioral-regen-queue-5min'` (`supabase/migrations/20260713104851_60372e3b-…sql:26-30`), renderizado em `src/pages/admin/BehavioralRegenAudit.tsx:459`. Há ainda `check_behavioral_regen_cron_staleness()` (`20260713105030_…sql:20`) que **gera alerta se o job parar**. Um job monitorado por 2 RPCs e 1 card de admin não é "código sem caminho de execução" — é um cron agendado fora do versionamento. |
| **Tabela `insights`** | ⬛/"sem escritor", tratada como órfã (02:49,83,211) | **REFUTADO** | Cinco leitores vivos: `src/hooks/useYourDay.ts:78`, `src/hooks/useRealtimeNotifications.ts:185`, `src/hooks/useContactDetail.ts:41` e `:195` (update `dismissed`), `supabase/functions/check-notifications/index.ts:58`. Publicada em realtime (`supabase/migrations/20260111220436_a5d10e89-…sql:7`), com 4 políticas RLS incl. INSERT (`20260109144944_…sql:225-227`) e 3 índices dedicados (`20260720000007_…sql:37`, `20260721000026_…sql:16`, `20260721000082_…sql:92`). O achado correto é "tabela **sem escritor**", **não** "tabela órfã" — apagá-la quebra 4 telas. |
| `evolution-api` | ⬛ (06:47,190; ESTADO_ATUAL:295 recomenda **deleção**) | **INCONCLUSIVO** | Testes 1–9: **0 hits** em `src/`, `supabase/functions/` (outros diretórios), `tests/`, `e2e/`, `scripts/`, migrations, `.github/`, `package.json`, `supabase/config.toml`. Teste 10 **acerta**: `docs/EDGE_FUNCTIONS_API.md:324-334` publica **contrato request/response** dela (`{action, phone, message}` → `{success, messageId}`) e `docs/RUNBOOK.md:198` a classifica no grupo **E — Webhooks (segredo de integração)**, ou seja, superfície para chamador **externo**. O lado de entrada da integração está vivo (`supabase/functions/evolution-webhook/index.ts:402,581`). Não consigo provar que nenhum sistema externo (n8n, Evolution, automação) a chama. |
| `dual-write-proxy` | ⬛ (05:97; 06:57; ESTADO_ATUAL:295 recomenda **deleção**) | **INCONCLUSIVO** | Testes 1–9: 0 hits. Teste 10 **acerta**: `docs/MIGRATION_MASTER_RUNBOOK.md:161` é um **checklist operacional** ("`dual-write-proxy` deployado com whitelist ativa (bake T+0..T+2h)") e `:174` agenda o monitor companheiro `verify/dual-write-diverge.ts` a cada 5 min — script que existe (`scripts/migration/verify/dual-write-diverge.ts:63,68`) e **pausa o dual-write** via `feature_flags.dual_write_enabled`. É ferramenta de janela de migração, acionada pelo **app legado**, não pelo repo. O defeito de import apontado em 06:57 (`npm:@supabase/supabase-js@2/cors`, `index.ts:2`) **é real e confirmei** — mas isso o torna *quebrado*, não *não-usado*. |
| `check-notifications` | ⬛ (01:106; 05:95) | **INCONCLUSIVO** | Testes 1–9: 0 hits (a ocorrência em `public/sw-push.js:203` é uma tag de `periodicsync` do service worker cujo handler é um stub — `checkForNotifications()` só faz `console.log`, `:208-210`; **não refuta**). Mas: a função exige `requireCronSecret` (`index.ts:15`), `docs/EDGE_FUNCTIONS_API.md:26` e `docs/RUNBOOK.md:189` a listam entre os crons, e `.lovable/plan.md:9` + `docs/TECH_DEBT.md:13` a tratam como uma das 3 EFs críticas instrumentadas com `tracedLogger`. Cron agendado no painel Supabase é invisível ao repo (a própria auditoria admite isso em 01:351). |
| `client-notifications` | ⬛ "zero chamadores executáveis" (01:107) | **INCONCLUSIVO** | Testes 1–9: 0 chamadores. Porém **insere em `alerts`** (`supabase/functions/client-notifications/index.ts:246`) e atualiza `life_events.last_reminded_at` (`:248`) — e `alerts` é lida por 5+ consumidores vivos (`src/hooks/useRealtimeNotifications.ts:184`, `useContactDetail.ts:42`, `useUnifiedNotifications.ts:31`, `useClosingScoreAlerts.ts:28`, `src/pages/AdminDashboard.tsx:134`). Além disso, `supabase/migrations/20260720000024_cron_notification_indexes.sql` cria **três índices desenhados linha a linha para as queries dela** (`:9,19,26`, incl. índice parcial `WHERE type='at_risk'`). Ninguém escreve migration de índice parcial para função que nunca roda. Alta suspeita de cron externo. |
| `auto-rebatch-behavioral` | ⬛ "Zero referências" (02:95,147) | **INCONCLUSIVO** | Testes 1–9: 0 hits. Mas a função **valida `x-cron-key` contra a tabela `cron_secrets`** (`supabase/functions/auto-rebatch-behavioral/index.ts:52`) e chama `generate-behavioral-profile` (`:125`) — desenho exclusivo de agendador externo. O próprio doc 02 reconhece a intenção de cron. Mesma classe de risco de `check-notifications`. |
| `health-aggregate` | ⬛ (05:75) | **INCONCLUSIVO** | Testes 1–9: 0 chamadores (`system-health` é o invocado — `src/components/admin/SystemHealthWidget.tsx:77`). Mas `supabase/migrations/20260720000021_query_performance_indexes.sql:26` e `:34` criam índices parciais **nomeando `health-aggregate` e reproduzindo suas queries exatas** (`.eq("status","error").gte("created_at", since)`), e ela é endpoint público por `docs/RUNBOOK.md:192`, com entrada de versão em `CHANGELOG.md:148` e ADR próprio (`docs/adr/013-connections-module-hardening.md:34`). Pode estar sendo raspada por monitor externo/uptime check. |
| `enrich-contacts` | ⬛ (01:105; 04:81,193) | **CONFIRMADO** | Testes 1,2,3,5,9: 0 hits em `src/`, `supabase/functions/` (fora do próprio dir), `tests/`, `e2e/`, `scripts/`, `.github/`, `package.json`. Teste 4: nenhum `functions/v1/enrich-contacts`; os **únicos** 2 `net.http_post` das migrations apontam para `smart-notify` (`20260512105729_…sql:10`) e `validation-queue-worker` (`20260417120721_…sql:18`). Teste 3 reforçado: variantes `enrichContacts`/`enrich_contacts` → 0. Testes 6-8 n/a. Teste 10: só inventário (`docs/EDGE_FUNCTIONS_API.md:246`, `docs/RUNBOOK.md:178`), sem procedimento. |
| `win-loss-record-deal` | ⬛ (04:58,192) | **CONFIRMADO** | Testes 1–5,9: 0. Teste 10: `docs/RUNBOOK.md:201` só a lista em "Especiais". Teste 11: **não** é produtor exclusivo — `win_loss_records` também é escrita por `src/hooks/useWinLoss.ts:125` (upsert direto). Nota: esse upsert só é chamado por `WinLossCaptureDialog` (também órfão), então **nenhum** caminho de escrita está ligado hoje. |
| `conversation-coaching-digest` | ⬛ (02:93,142) | **CONFIRMADO** | Testes 1–5,9: 0 hits fora do próprio diretório. Teste 4: nenhum `cron.schedule`/`net.http_post`. Teste 10: `docs/RUNBOOK.md:189` a lista como cron, mas o código usa `withAuth` (JWT de usuário), não `requireCronSecret` — a doc está errada, não é evidência de execução. Teste 11: **não escreve nada** (nenhum `.from(...).insert`), logo não há consumidor a jusante. |
| `audit-analytics` | ⬛ (05:84) | **CONFIRMADO** | Testes 1–5,9: 0. Teste 11: não escreve nada; a tela real lê `audit_log` direto (`src/pages/AdminAuditTrail.tsx:70`, `src/components/admin/AdminQuickActions.tsx:45`). Teste 10: só inventário (`docs/RUNBOOK.md:184`, `.lovable/memory/features/audit-trail-viewer.md:10`). |
| `validate-access` | 🟦 SUGERIDO (05:63) | **CONFIRMADO** (como *sem chamador*) | Testes 1–5,9: 0. Teste 11: escreve `access_blocked_log`, tabela **sem nenhum leitor** em `src/`. Ressalva: é endpoint público (`docs/RUNBOOK.md:192`) — a classificação 🟦 já era a correta; **não** é candidata a deleção, é feature inacabada. |
| `detect-new-device` | 🟦 SUGERIDO (05:64) | **CONFIRMADO** (como *sem chamador*) | Testes 1–5,9: 0. Teste 11: escreve `user_known_devices` e `device_login_notifications`; **nenhuma** dessas tabelas aparece em `src/`. Mesma ressalva de endpoint público. |
| `AdminObservability` (`src/pages/admin/Observability.tsx`) | ⬛ órfã (05:98,A11) | **CONFIRMADO** | Teste 6 completo: único hit do símbolo é a própria definição `src/app/lazyPages.tsx:3`; `src/app/AppRoutes.tsx:22` faz `import * as P` mas **nenhuma rota usa `P.AdminObservability`**; grep pelo caminho `pages/admin/Observability` → só o `lazy()` da linha 3; nenhum barrel `index.ts` de `src/` re-exporta páginas. |
| `src/pages/AdminConexoesLogs.tsx` | ⬛ órfã (05:A11) | **CONFIRMADO** | Teste 6: único hit do símbolo é `export default function AdminConexoesLogs()` em `:49`. Fora de `lazyPages.tsx` e de `AppRoutes.tsx`. Os demais hits são inventários gerados (`scripts/tabelas-ausentes.{md,json,csv}`), não código. Consequência confirmada: o link `/admin/conexoes/logs` em `src/pages/AdminConexoes.tsx:44` é link morto. |
| `src/pages/admin/TelemetryTable.tsx` | ⬛ órfã (05:A11) | **CONFIRMADO** | Teste 6: hits apenas nas linhas `:28` (interface) e `:33` (export) do próprio arquivo. Nenhum import por símbolo nem por caminho `admin/TelemetryTable`. |
| `src/components/admin/AccessSecurityManager.tsx` | ⬛ órfã (05:A11) | **CONFIRMADO** | Teste 6: único hit é `export function AccessSecurityManager()` em `:5`. **Sem perda funcional**: o conteúdo equivalente está vivo em `src/components/security/SecuritySettings.tsx:7,10` e `SecurityDashboard.tsx:23,26,27` (mesmos hooks `useAccessSecurity`/`useAllowedIPs`/`useGeoBlocking`). |
| `src/components/admin/PasswordResetApproval.tsx` | ⬛ órfã transitiva (05:A11) | **CONFIRMADO** | Teste 6: importado **apenas** por `AccessSecurityManager.tsx:3` (que é órfão) → morte transitiva. **Sem perda funcional**: o fluxo de aprovação está vivo na rota `/admin/seguranca` (`src/app/AppRoutes.tsx:161`) via `src/pages/admin/AdminSegurancaPage.tsx:7,10`, que usa o mesmo hook `usePasswordResetRequests`. |
| `src/components/admin/EmailPipelineStatus.tsx` | ⬛ órfã (05:A11) | **CONFIRMADO** | Teste 6: único hit é `:30` (export). Sem barrel, sem `lazy()`, sem import por caminho. Menção só em `.lovable/memory/features/email-pipeline-monitoring.md:11` (memória de design). |
| `src/hooks/useRBAC.tsx` | ⬛ órfã (05:A11); citado como consumidor em 07:78 | **CONFIRMADO** | Teste 7: único hit do símbolo é `export function useRBAC()` em `:13`. Nenhum re-export. Observação: o doc 07:78 o cita como "consumidor de `user_roles`" — é verdade que o **código** consulta (`:21`), mas ninguém consulta o hook. |
| `src/hooks/useDeviceDetection.ts` | ⬛ órfã (05:64,A11) | **CONFIRMADO** | Teste 7: único hit é `export function useDeviceDetection()` em `:49`. Hook puro de fingerprint de browser, sem consumidor. |
| `src/components/win-loss/WinLossCaptureDialog.tsx` | ⬛ órfã (ESTADO_ATUAL:181) | **CONFIRMADO** | Teste 6: único hit do símbolo é `:21` (export). Os outros 7 componentes de `src/components/win-loss/` são importados por `src/pages/WinLoss.tsx`/`WinLossSetup.tsx`; **este não**. Consequência real: `useUpsertWinLossRecord` (`src/hooks/useWinLoss.ts:118`) fica sem consumidor → **nenhum caminho de UI escreve `win_loss_records`**. |
| `enrollContact` (`src/hooks/useSequences.ts:167`) | ⬛ (03:37) | **CONFIRMADO** | Teste 7: hits apenas em `:167` (definição) e `:199` (re-export no objeto de retorno). O único consumidor de `useSequences()` é `src/pages/Sequencias.tsx:19`, que desestrutura `{ sequences, loading, createSequence, toggleStatus, deleteSequence, creating }` — **sem `enrollContact`**. Também não há `seq.enrollContact` em lugar nenhum. |

---

## Falsos positivos encontrados (o que **NÃO** pode ser apagado)

> **Cinco itens foram classificados como mortos/órfãos e não são.** Apagar qualquer um deles
> quebra funcionalidade em produção.

### 🔴 1. `attribution-calculator` — a auditoria inverteu produtor e substituto

O doc 04 (`:100`, `:191`) e o doc 03 (`:177`) afirmam que a EF foi "substituída pela RPC
`compute_attribution`, usada em `src/hooks/useAttribution.ts:59-61`". **É o contrário.**

```
20260723151654_20640250-…sql:14  REVOKE EXECUTE ON FUNCTION public.compute_attribution(text,text,numeric)
                                   FROM anon, authenticated, PUBLIC;
20260723151654_20640250-…sql:26  GRANT  EXECUTE ON FUNCTION public.compute_attribution(text,text,numeric)
                                   TO service_role;
```

Nenhuma migration posterior reverte (a última do repo é `20260726154947`). Logo:

- `src/hooks/useAttribution.ts:61` → chamada com JWT `authenticated` → **permission denied**.
  Isso quebra o painel de atribuição em `src/pages/MarketingHub.tsx:48`.
- `supabase/functions/attribution-calculator/index.ts:38-46` → cliente com
  `SUPABASE_SERVICE_ROLE_KEY` → **único chamador com privilégio**.

**Ação correta:** não deletar a EF. Ligar `useAttribution` nela (`invoke('attribution-calculator')`)
ou re-conceder o `EXECUTE`. A auditoria recomendaria apagar exatamente a peça que ainda funciona.

### 🔴 2. `crm-automation-monitor` — produtor exclusivo de widget da home

`supabase/functions/crm-automation-monitor/index.ts:49` (sucesso) e `:63` (erro) são os **únicos
`insert` de `crm_automation_logs` em todo o repositório**. A tabela alimenta
`src/components/crm/CRMAutomationAuditLog.tsx:52`, montado em `src/pages/Index.tsx:192`
(página inicial) e `src/pages/Automacoes.tsx:80`. Deletar = dois cards vazios para sempre,
sem erro visível.

### 🔴 3. `auto-regen-behavioral-profiles` — produtor exclusivo de alerta de admin

`index.ts:227` é a única origem de `system_alerts.alert_type='behavioral_regen_error_rate'`.
Consumido por `BehavioralRegenAlertBanner.tsx:45`, `BehavioralRegenAlertsStats.tsx:25` e
`BehavioralRegenAlertsTrend.tsx:46`, todos renderizados em
`src/pages/admin/BehavioralRegenAudit.tsx:436,457,458` (rota registrada). O doc 02 chamou de
"254 linhas sem nenhum caminho de execução conhecido" — mas há três telas esperando o output dela.

### 🔴 4. `process-behavioral-regen-queue` — cron monitorado por UI viva

`src/components/admin/BehavioralRegenCronHealth.tsx:48` → RPC `get_behavioral_regen_cron_health`
→ `cron.job WHERE jobname = 'process-behavioral-regen-queue-5min'`
(`20260713104851_60372e3b-…sql:26-30`). Há ainda alerta automático de *staleness*
(`20260713105030_f26185f4-…sql:20`). O job é real e agendado fora do versionamento.

### 🔴 5. Tabela `insights` — 5 leitores vivos

Não é órfã: `useYourDay.ts:78`, `useRealtimeNotifications.ts:185`, `useContactDetail.ts:41,195`,
`check-notifications/index.ts:58`, mais realtime (`20260111220436_…sql:7`), 4 RLS e 3 índices.
O achado legítimo é **"tabela sem escritor"** — problema de *escrita ausente*, não de tabela morta.
Dropar a tabela quebraria 4 superfícies de leitura.

### 🟠 E mais seis que **não devem ser apagados sem checar o painel Supabase**

`client-notifications`, `check-notifications`, `auto-rebatch-behavioral`, `health-aggregate`,
`evolution-api`, `dual-write-proxy`.

O padrão comum: **investimento de infraestrutura que ninguém faz para código morto.**

| Alvo | Investimento que contradiz "morto" |
|---|---|
| `client-notifications` | 3 índices compostos/parciais escritos **para as queries dela**, com o SQL replicado nos comentários (`20260720000024_cron_notification_indexes.sql:9,19,26`) |
| `health-aggregate` | 2 índices parciais idem (`20260720000021_query_performance_indexes.sql:26,34`) + ADR-013 + entrada de versão no `CHANGELOG.md:148` |
| `check-notifications` | `requireCronSecret` (`:15`) + instrumentação `tracedLogger` tratada como crítica (`.lovable/plan.md:9`, `docs/TECH_DEBT.md:13`) |
| `auto-rebatch-behavioral` | valida `x-cron-key` contra a tabela `cron_secrets` (`:52`) — desenho exclusivo de agendador externo |
| `dual-write-proxy` | item de checklist operacional (`docs/MIGRATION_MASTER_RUNBOOK.md:161`) + monitor companheiro agendado a cada 5 min (`:174` → `scripts/migration/verify/dual-write-diverge.ts`) |
| `evolution-api` | contrato request/response publicado (`docs/EDGE_FUNCTIONS_API.md:324-334`) e classificação como **webhook de integração externa** (`docs/RUNBOOK.md:198`) |

**`ESTADO_ATUAL.md:295` recomenda "Remover `evolution-api` e `dual-write-proxy`". Essa
recomendação não está sustentada:** ambos são superfícies para chamadores **externos** ao
repositório, e o critério da auditoria ("nenhum chamador no repo") não os alcança. O problema real
de `evolution-api` é o apontado em `06:190` — 44 ações destrutivas atrás de JWT de usuário comum,
**sem checagem de papel**. Isso se corrige com autorização, não com `rm -rf`.

---

## Riscos residuais

1. **Crons do painel Supabase são invisíveis.** Só existem **2** `net.http_post` para Edge Functions
   em 390 migrations (`smart-notify`, `validation-queue-worker`). Todos os demais agendamentos, se
   existirem, foram criados fora do Git. Enquanto não se rodar
   `SELECT jobname, schedule, command FROM cron.job` no banco de produção, **nenhuma** EF com
   `requireCronSecret` pode ser declarada morta com segurança. Isso afeta os 6 INCONCLUSIVOS.

2. **Chamadores externos são invisíveis.** `evolution-api`, `dual-write-proxy`, `validate-access`,
   `detect-new-device`, `health-aggregate`, `incoming-webhook` são endpoints projetados para tráfego
   de fora do repositório. A prova de morte exigiria logs do gateway (invocações por função, 30/90
   dias), não `grep`.

3. **A bateria de 10 testes tem um ponto cego estrutural.** Ela procura *chamadores*. Três dos cinco
   falsos positivos (`crm-automation-monitor`, `auto-regen-behavioral-profiles`, `insights`) só
   apareceram pelo **teste 11 (produtor/consumidor)**, e o mais grave
   (`attribution-calculator`) só apareceu ao **cruzar GRANT/REVOKE de migrations com o caminho de
   chamada do front**. Recomendo que qualquer varredura futura de "código morto" inclua:
   (a) quem escreve cada tabela lida por UI viva; (b) o estado final de privilégio de cada RPC.

4. **Não usei histórico Git.** Não distingo "nunca ligado" de "desligado depois". Um `git log -S`
   por `invoke('<nome>'` diria se cada órfão já teve chamador — informação que muda a decisão entre
   *apagar* e *religar*.

5. **`node_modules` vazio; nada foi executado.** Todas as afirmações são de leitura estática.
   Comportamento em runtime (ex.: se a RLS de `win_loss_records` de fato permite o upsert direto, ou
   se o import quebrado de `dual-write-proxy/index.ts:2` realmente impede o deploy) permanece
   `NAO_VERIFICADO`.

6. **Os 16 CONFIRMADOS não são automaticamente deletáveis.** Sete deles
   (`validate-access`, `detect-new-device`, `WinLossCaptureDialog`, `enrollContact`,
   `EmailPipelineStatus`, `AdminConexoesLogs`, `TelemetryTable`) são **features inacabadas com
   backend pronto**, não lixo: o custo de religar (uma rota, um import) é muito menor que o de
   reescrever. Apenas `AccessSecurityManager` + `PasswordResetApproval` são comprovadamente
   **duplicatas** de superfícies vivas (`/admin/seguranca`, `SecuritySettings`) e podem ser
   removidas sem perda funcional.
