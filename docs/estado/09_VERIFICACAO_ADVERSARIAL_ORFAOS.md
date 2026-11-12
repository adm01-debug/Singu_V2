# VerificaÃ§Ã£o adversarial â€” classificaÃ§Ãµes de cÃ³digo morto/Ã³rfÃ£o

> **Postura.** Este documento nÃ£o confirma a auditoria: tenta **derrubÃ¡-la**. Cada alvo
> classificado como â¬› MORTO_OU_ABANDONADO ou ðŸŸ¦ Ã³rfÃ£o foi tratado como **classificaÃ§Ã£o errada
> atÃ© prova em contrÃ¡rio**. O objetivo Ã© impedir que cÃ³digo vivo seja apagado.
>
> Escopo: alvos extraÃ­dos de `docs/estado/01`â€“`08` (â¬›, "Ã³rfÃ£/Ã³rfÃ£o", "zero chamadores",
> "sem consumidor", "nenhum importador", "cÃ³digo morto") â€” **27 alvos**.
>
> RestriÃ§Ãµes respeitadas: nenhum build/test/lint executado (`node_modules` vazio); sem runtime;
> nenhum arquivo fora deste foi editado; nenhum `git commit`/`push`.

---

## MÃ©todo (os 10 testes)

Para cada alvo, todos os testes abaixo foram aplicados. **Um Ãºnico acerto refuta.**

| # | Teste | Como foi executado |
|---|---|---|
| 1 | `invoke('nome'` / `invoke("nome"` / crase | `grep -rn` em `src/`, `supabase/functions/`, `tests/`, `e2e/`, `scripts/` |
| 2 | `invoke<Tipo>('nome'` (com generics) | idem â€” o grep foi feito pelo **nome solto**, que cobre qualquer generic |
| 3 | Nome montado por variÃ¡vel/template string | grep pelo nome solto em todo `.ts/.tsx`; + auditoria dos **2 Ãºnicos** pontos de despacho dinÃ¢mico do repo: `src/hooks/useEdgeFunctionActions.ts:15` e `src/lib/supabaseInvoke.ts:37`, e do Ãºnico despacho dinÃ¢mico EFâ†’EF (`supabase/functions/validation-queue-worker/index.ts:66`) |
| 4 | `functions/v1/<nome>` em qualquer arquivo, incl. migrations `.sql` (pg_net) | `grep -rn "functions/v1"` em `supabase/`, `src/`, `scripts/`, `monitoring/`; + varredura de **todos** os `cron.schedule` e `net.http_post` das migrations |
| 5 | Chamada EFâ†’EF | grep do nome em `supabase/functions/` excluindo o diretÃ³rio da prÃ³pria funÃ§Ã£o |
| 6 | Componentes React: import default, import nomeado, barrel `index.ts`, `lazy(() => import(...))` | grep por sÃ­mbolo **e** por caminho (`@/components/...`, `@/pages/...`); inventÃ¡rio dos 10 `index.ts` de `src/` (nenhum re-exporta os alvos); grep de `lazyPages.tsx` e `import * as P` |
| 7 | Hooks: nome do hook em qualquer lugar, incl. re-export | grep do sÃ­mbolo em todo `src/`, `tests/`, `e2e/` |
| 8 | Tabelas: `.from('x')`, `.from("x")`, RPC que a referencia no corpo SQL, trigger, view | grep em `src/` + `supabase/functions/` + 390 migrations |
| 9 | `.github/workflows`, `package.json`, `scripts/`, `e2e/`, `tests/` | grep direto (2 workflows: `ci.yml`, `monitoring-lint.yml`) |
| 10 | DocumentaÃ§Ã£o de runbook que implique uso operacional manual | leitura de `docs/RUNBOOK.md`, `docs/EDGE_FUNCTIONS_API.md`, `docs/MIGRATION_MASTER_RUNBOOK.md`, `.lovable/memory/` |

**Teste 11 (adicionado por mim, nÃ£o pedido).** *InversÃ£o produtor/consumidor:* mesmo sem chamador,
o artefato Ã© **produtor exclusivo** de dado lido por cÃ³digo vivo? Ou o "caminho vivo" alegado pela
auditoria estÃ¡ **quebrado por GRANT/REVOKE** em migration posterior? Este teste produziu **3 dos 5
falsos positivos** encontrados â€” e Ã© exatamente o que a bateria original de 10 testes nÃ£o pega.

---

## Placar: 5 REFUTADOS / 16 CONFIRMADOS / 6 INCONCLUSIVOS de 27 alvos

- **5 refutados** = classificaÃ§Ã£o original **errada**; apagar quebraria produÃ§Ã£o.
- **6 inconclusivos** = nÃ£o consegui provar morte; **nÃ£o apagar sem checar o painel Supabase**.
- **16 confirmados** = os 10 testes falharam em achar consumidor. Ainda assim, ver "Riscos residuais".

---

## Tabela de vereditos

| Alvo | ClassificaÃ§Ã£o original | Veredito | Prova (`arquivo:linha`) ou testes aplicados |
|---|---|---|---|
| **`attribution-calculator`** | â¬› "Ã³rfÃ£ â€” substituÃ­da pela RPC `compute_attribution`" (04:100,191; 03:177) | **REFUTADO** | A RPC teve `EXECUTE` **revogado de `authenticated`** em `supabase/migrations/20260723151654_20640250-694c-4f4e-875c-69f2bcbe51a4.sql:14` e concedido **sÃ³ a `service_role`** em `:26` (nenhuma migration posterior reverte). O "caminho vivo" citado pela auditoria â€” `src/hooks/useAttribution.ts:61` com JWT de usuÃ¡rio, usado em `src/pages/MarketingHub.tsx:48` â€” Ã© justamente o **quebrado**. A EF usa `SUPABASE_SERVICE_ROLE_KEY` (`supabase/functions/attribution-calculator/index.ts:38-41`) e chama a RPC em `:43`: Ã© o **Ãºnico caminho de execuÃ§Ã£o que ainda funciona**. A relaÃ§Ã£o estÃ¡ invertida no doc 04. |
| **`crm-automation-monitor`** | â¬› "Zero chamadores em `src/`" (05:96) | **REFUTADO** | Ã‰ o **Ãºnico escritor** de `crm_automation_logs` (`supabase/functions/crm-automation-monitor/index.ts:49` sucesso, `:63` erro â€” grep de `crm_automation_logs` em todo o repo nÃ£o acha outro `insert`). A tabela Ã© lida e mutada por componente vivo `src/components/crm/CRMAutomationAuditLog.tsx:52,79-80`, renderizado em **duas pÃ¡ginas roteadas**: `src/pages/Index.tsx:192` (home) e `src/pages/Automacoes.tsx:80`. Apagar a EF deixa um widget da home permanentemente vazio. |
| **`auto-regen-behavioral-profiles`** | â¬› "Zero referÃªncias no repositÃ³rio inteiro" (02:94,146) | **REFUTADO** | Ã‰ o **Ãºnico produtor** de `system_alerts` com `alert_type='behavioral_regen_error_rate'` (`supabase/functions/auto-regen-behavioral-profiles/index.ts:227`; grep do literal no repo sÃ³ acha esta EF + os leitores + o CHECK do trigger em `20260713105306_â€¦sql:16`). Esse alerta Ã© consumido por **trÃªs componentes vivos**: `src/components/admin/BehavioralRegenAlertBanner.tsx:45`, `BehavioralRegenAlertsStats.tsx:25`, `BehavioralRegenAlertsTrend.tsx:46` â€” todos montados na rota `/admin/behavioral-regen-audit` (`src/pages/admin/BehavioralRegenAudit.tsx:436,457,458`). |
| **`process-behavioral-regen-queue`** | ðŸŸ¨ no doc 02, mas listada como alvo "Ã³rfÃ£/sem cron" (02:96,148,225) | **REFUTADO** | Tem superfÃ­cie de monitoramento **viva e roteada**: `src/components/admin/BehavioralRegenCronHealth.tsx:48` chama a RPC `get_behavioral_regen_cron_health`, cujo corpo filtra `cron.job` pelo jobname `'process-behavioral-regen-queue-5min'` (`supabase/migrations/20260713104851_60372e3b-â€¦sql:26-30`), renderizado em `src/pages/admin/BehavioralRegenAudit.tsx:459`. HÃ¡ ainda `check_behavioral_regen_cron_staleness()` (`20260713105030_â€¦sql:20`) que **gera alerta se o job parar**. Um job monitorado por 2 RPCs e 1 card de admin nÃ£o Ã© "cÃ³digo sem caminho de execuÃ§Ã£o" â€” Ã© um cron agendado fora do versionamento. |
| **Tabela `insights`** | â¬›/"sem escritor", tratada como Ã³rfÃ£ (02:49,83,211) | **REFUTADO** | Cinco leitores vivos: `src/hooks/useYourDay.ts:78`, `src/hooks/useRealtimeNotifications.ts:185`, `src/hooks/useContactDetail.ts:41` e `:195` (update `dismissed`), `supabase/functions/check-notifications/index.ts:58`. Publicada em realtime (`supabase/migrations/20260111220436_a5d10e89-â€¦sql:7`), com 4 polÃ­ticas RLS incl. INSERT (`20260109144944_â€¦sql:225-227`) e 3 Ã­ndices dedicados (`20260720000007_â€¦sql:37`, `20260721000026_â€¦sql:16`, `20260721000082_â€¦sql:92`). O achado correto Ã© "tabela **sem escritor**", **nÃ£o** "tabela Ã³rfÃ£" â€” apagÃ¡-la quebra 4 telas. |
| `evolution-api` | â¬› (06:47,190; ESTADO_ATUAL:295 recomenda **deleÃ§Ã£o**) | **INCONCLUSIVO** | Testes 1â€“9: **0 hits** em `src/`, `supabase/functions/` (outros diretÃ³rios), `tests/`, `e2e/`, `scripts/`, migrations, `.github/`, `package.json`, `supabase/config.toml`. Teste 10 **acerta**: `docs/EDGE_FUNCTIONS_API.md:324-334` publica **contrato request/response** dela (`{action, phone, message}` â†’ `{success, messageId}`) e `docs/RUNBOOK.md:198` a classifica no grupo **E â€” Webhooks (segredo de integraÃ§Ã£o)**, ou seja, superfÃ­cie para chamador **externo**. O lado de entrada da integraÃ§Ã£o estÃ¡ vivo (`supabase/functions/evolution-webhook/index.ts:13`). NÃ£o consigo provar que nenhum sistema externo (n8n, Evolution, automaÃ§Ã£o) a chama. |
| `dual-write-proxy` | â¬› (05:97; 06:57; ESTADO_ATUAL:295 recomenda **deleÃ§Ã£o**) | **INCONCLUSIVO** | Testes 1â€“9: 0 hits. Teste 10 **acerta**: `docs/MIGRATION_MASTER_RUNBOOK.md:161` Ã© um **checklist operacional** ("`dual-write-proxy` deployado com whitelist ativa (bake T+0..T+2h)") e `:174` agenda o monitor companheiro `verify/dual-write-diverge.ts` a cada 5 min â€” script que existe (`scripts/migration/verify/dual-write-diverge.ts:63,68`) e **pausa o dual-write** via `feature_flags.dual_write_enabled`. Ã‰ ferramenta de janela de migraÃ§Ã£o, acionada pelo **app legado**, nÃ£o pelo repo. O defeito de import apontado em 06:57 (`npm:@supabase/supabase-js@2/cors`, `index.ts:2`) **Ã© real e confirmei** â€” mas isso o torna *quebrado*, nÃ£o *nÃ£o-usado*. |
| `check-notifications` | â¬› (01:106; 05:95) | **INCONCLUSIVO** | Testes 1â€“9: 0 hits (a ocorrÃªncia em `public/sw-push.js:203` Ã© uma tag de `periodicsync` do service worker cujo handler Ã© um stub â€” `checkForNotifications()` sÃ³ faz `console.log`, `:208-210`; **nÃ£o refuta**). Mas: a funÃ§Ã£o exige `requireCronSecret` (`index.ts:15`), `docs/EDGE_FUNCTIONS_API.md:26` e `docs/RUNBOOK.md:189` a listam entre os crons, e `.lovable/plan.md:9` + `docs/TECH_DEBT.md:13` a tratam como uma das 3 EFs crÃ­ticas instrumentadas com `tracedLogger`. Cron agendado no painel Supabase Ã© invisÃ­vel ao repo (a prÃ³pria auditoria admite isso em 01:351). |
| `client-notifications` | â¬› "zero chamadores executÃ¡veis" (01:107) | **INCONCLUSIVO** | Testes 1â€“9: 0 chamadores. PorÃ©m **insere em `alerts`** (`supabase/functions/client-notifications/index.ts:246`) e atualiza `life_events.last_reminded_at` (`:248`) â€” e `alerts` Ã© lida por 5+ consumidores vivos (`src/hooks/useRealtimeNotifications.ts:184`, `useContactDetail.ts:42`, `useUnifiedNotifications.ts:31`, `useClosingScoreAlerts.ts:28`, `src/pages/AdminDashboard.tsx:134`). AlÃ©m disso, `supabase/migrations/20260720000024_cron_notification_indexes.sql` cria **trÃªs Ã­ndices desenhados linha a linha para as queries dela** (`:9,19,26`, incl. Ã­ndice parcial `WHERE type='at_risk'`). NinguÃ©m escreve migration de Ã­ndice parcial para funÃ§Ã£o que nunca roda. Alta suspeita de cron externo. |
| `auto-rebatch-behavioral` | â¬› "Zero referÃªncias" (02:95,147) | **INCONCLUSIVO** | Testes 1â€“9: 0 hits. Mas a funÃ§Ã£o **valida `x-cron-key` contra a tabela `cron_secrets`** (`supabase/functions/auto-rebatch-behavioral/index.ts:52`) e chama `generate-behavioral-profile` (`:125`) â€” desenho exclusivo de agendador externo. O prÃ³prio doc 02 reconhece a intenÃ§Ã£o de cron. Mesma classe de risco de `check-notifications`. |
| `health-aggregate` | â¬› (05:75) | **INCONCLUSIVO** | Testes 1â€“9: 0 chamadores (`system-health` Ã© o invocado â€” `src/components/admin/SystemHealthWidget.tsx:77`). Mas `supabase/migrations/20260720000021_query_performance_indexes.sql:26` e `:34` criam Ã­ndices parciais **nomeando `health-aggregate` e reproduzindo suas queries exatas** (`.eq("status","error").gte("created_at", since)`), e ela Ã© endpoint pÃºblico por `docs/RUNBOOK.md:192`, com entrada de versÃ£o em `CHANGELOG.md:148` e ADR prÃ³prio (`docs/adr/013-connections-module-hardening.md:34`). Pode estar sendo raspada por monitor externo/uptime check. |
| `enrich-contacts` | â¬› (01:105; 04:81,193) | **CONFIRMADO** | Testes 1,2,3,5,9: 0 hits em `src/`, `supabase/functions/` (fora do prÃ³prio dir), `tests/`, `e2e/`, `scripts/`, `.github/`, `package.json`. Teste 4: nenhum `functions/v1/enrich-contacts`; os **Ãºnicos** 2 `net.http_post` das migrations apontam para `smart-notify` (`20260512105729_â€¦sql:10`) e `validation-queue-worker` (`20260417120721_â€¦sql:18`). Teste 3 reforÃ§ado: variantes `enrichContacts`/`enrich_contacts` â†’ 0. Testes 6-8 n/a. Teste 10: sÃ³ inventÃ¡rio (`docs/EDGE_FUNCTIONS_API.md:246`, `docs/RUNBOOK.md:178`), sem procedimento. |
| `win-loss-record-deal` | â¬› (04:58,192) | **CONFIRMADO** | Testes 1â€“5,9: 0. Teste 10: `docs/RUNBOOK.md:201` sÃ³ a lista em "Especiais". Teste 11: **nÃ£o** Ã© produtor exclusivo â€” `win_loss_records` tambÃ©m Ã© escrita por `src/hooks/useWinLoss.ts:125` (upsert direto). Nota: esse upsert sÃ³ Ã© chamado por `WinLossCaptureDialog` (tambÃ©m Ã³rfÃ£o), entÃ£o **nenhum** caminho de escrita estÃ¡ ligado hoje. |
| `conversation-coaching-digest` | â¬› (02:93,142) | **CONFIRMADO** | Testes 1â€“5,9: 0 hits fora do prÃ³prio diretÃ³rio. Teste 4: nenhum `cron.schedule`/`net.http_post`. Teste 10: `docs/RUNBOOK.md:189` a lista como cron, mas o cÃ³digo usa `withAuth` (JWT de usuÃ¡rio), nÃ£o `requireCronSecret` â€” a doc estÃ¡ errada, nÃ£o Ã© evidÃªncia de execuÃ§Ã£o. Teste 11: **nÃ£o escreve nada** (nenhum `.from(...).insert`), logo nÃ£o hÃ¡ consumidor a jusante. |
| `audit-analytics` | â¬› (05:84) | **CONFIRMADO** | Testes 1â€“5,9: 0. Teste 11: nÃ£o escreve nada; a tela real lÃª `audit_log` direto (`src/pages/AdminAuditTrail.tsx:70`, `src/components/admin/AdminQuickActions.tsx:45`). Teste 10: sÃ³ inventÃ¡rio (`docs/RUNBOOK.md:184`, `.lovable/memory/features/audit-trail-viewer.md:10`). |
| `validate-access` | ðŸŸ¦ SUGERIDO (05:63) | **CONFIRMADO** (como *sem chamador*) | Testes 1â€“5,9: 0. Teste 11: escreve `access_blocked_log`, tabela **sem nenhum leitor** em `src/`. Ressalva: Ã© endpoint pÃºblico (`docs/RUNBOOK.md:192`) â€” a classificaÃ§Ã£o ðŸŸ¦ jÃ¡ era a correta; **nÃ£o** Ã© candidata a deleÃ§Ã£o, Ã© feature inacabada. |
| `detect-new-device` | ðŸŸ¦ SUGERIDO (05:64) | **CONFIRMADO** (como *sem chamador*) | Testes 1â€“5,9: 0. Teste 11: escreve `user_known_devices` e `device_login_notifications`; **nenhuma** dessas tabelas aparece em `src/`. Mesma ressalva de endpoint pÃºblico. |
| `AdminObservability` (`src/pages/admin/Observability.tsx`) | â¬› Ã³rfÃ£ (05:98,A11) | **CONFIRMADO** | Teste 6 completo: Ãºnico hit do sÃ­mbolo Ã© a prÃ³pria definiÃ§Ã£o `src/app/lazyPages.tsx:3`; `src/app/AppRoutes.tsx:22` faz `import * as P` mas **nenhuma rota usa `P.AdminObservability`**; grep pelo caminho `pages/admin/Observability` â†’ sÃ³ o `lazy()` da linha 3; nenhum barrel `index.ts` de `src/` re-exporta pÃ¡ginas. |
| `src/pages/AdminConexoesLogs.tsx` | â¬› Ã³rfÃ£ (05:A11) | **CONFIRMADO** | Teste 6: Ãºnico hit do sÃ­mbolo Ã© `export default function AdminConexoesLogs()` em `:49`. Fora de `lazyPages.tsx` e de `AppRoutes.tsx`. Os demais hits sÃ£o inventÃ¡rios gerados (`scripts/tabelas-ausentes.{md,json,csv}`), nÃ£o cÃ³digo. ConsequÃªncia confirmada: o link `/admin/conexoes/logs` em `src/pages/AdminConexoes.tsx:44` Ã© link morto. |
| `src/pages/admin/TelemetryTable.tsx` | â¬› Ã³rfÃ£ (05:A11) | **CONFIRMADO** | Teste 6: hits apenas nas linhas `:28` (interface) e `:33` (export) do prÃ³prio arquivo. Nenhum import por sÃ­mbolo nem por caminho `admin/TelemetryTable`. |
| `src/components/admin/AccessSecurityManager.tsx` | â¬› Ã³rfÃ£ (05:A11) | **CONFIRMADO** | Teste 6: Ãºnico hit Ã© `export function AccessSecurityManager()` em `:5`. **Sem perda funcional**: o conteÃºdo equivalente estÃ¡ vivo em `src/components/security/SecuritySettings.tsx:7,10` e `SecurityDashboard.tsx:23,26,27` (mesmos hooks `useAccessSecurity`/`useAllowedIPs`/`useGeoBlocking`). |
| `src/components/admin/PasswordResetApproval.tsx` | â¬› Ã³rfÃ£ transitiva (05:A11) | **CONFIRMADO** | Teste 6: importado **apenas** por `AccessSecurityManager.tsx:3` (que Ã© Ã³rfÃ£o) â†’ morte transitiva. **Sem perda funcional**: o fluxo de aprovaÃ§Ã£o estÃ¡ vivo na rota `/admin/seguranca` (`src/app/AppRoutes.tsx:161`) via `src/pages/admin/AdminSegurancaPage.tsx:7,10`, que usa o mesmo hook `usePasswordResetRequests`. |
| `src/components/admin/EmailPipelineStatus.tsx` | â¬› Ã³rfÃ£ (05:A11) | **CONFIRMADO** | Teste 6: Ãºnico hit Ã© `:30` (export). Sem barrel, sem `lazy()`, sem import por caminho. MenÃ§Ã£o sÃ³ em `.lovable/memory/features/email-pipeline-monitoring.md:11` (memÃ³ria de design). |
| `src/hooks/useRBAC.tsx` | â¬› Ã³rfÃ£ (05:A11); citado como consumidor em 07:78 | **CONFIRMADO** | Teste 7: Ãºnico hit do sÃ­mbolo Ã© `export function useRBAC()` em `:13`. Nenhum re-export. ObservaÃ§Ã£o: o doc 07:78 o cita como "consumidor de `user_roles`" â€” Ã© verdade que o **cÃ³digo** consulta (`:21`), mas ninguÃ©m consulta o hook. |
| `src/hooks/useDeviceDetection.ts` | â¬› Ã³rfÃ£ (05:64,A11) | **CONFIRMADO** | Teste 7: Ãºnico hit Ã© `export function useDeviceDetection()` em `:49`. Hook puro de fingerprint de browser, sem consumidor. |
| `src/components/win-loss/WinLossCaptureDialog.tsx` | â¬› Ã³rfÃ£ (ESTADO_ATUAL:181) | **CONFIRMADO** | Teste 6: Ãºnico hit do sÃ­mbolo Ã© `:21` (export). Os outros 7 componentes de `src/components/win-loss/` sÃ£o importados por `src/pages/WinLoss.tsx`/`WinLossSetup.tsx`; **este nÃ£o**. ConsequÃªncia real: `useUpsertWinLossRecord` (`src/hooks/useWinLoss.ts:118`) fica sem consumidor â†’ **nenhum caminho de UI escreve `win_loss_records`**. |
| `enrollContact` (`src/hooks/useSequences.ts:167`) | â¬› (03:37) | **CONFIRMADO** | Teste 7: hits apenas em `:167` (definiÃ§Ã£o) e `:199` (re-export no objeto de retorno). O Ãºnico consumidor de `useSequences()` Ã© `src/pages/Sequencias.tsx:19`, que desestrutura `{ sequences, loading, createSequence, toggleStatus, deleteSequence, creating }` â€” **sem `enrollContact`**. TambÃ©m nÃ£o hÃ¡ `seq.enrollContact` em lugar nenhum. |

---

## Falsos positivos encontrados (o que **NÃƒO** pode ser apagado)

> **Cinco itens foram classificados como mortos/Ã³rfÃ£os e nÃ£o sÃ£o.** Apagar qualquer um deles
> quebra funcionalidade em produÃ§Ã£o.

### ðŸ”´ 1. `attribution-calculator` â€” a auditoria inverteu produtor e substituto

O doc 04 (`:100`, `:191`) e o doc 03 (`:177`) afirmam que a EF foi "substituÃ­da pela RPC
`compute_attribution`, usada em `src/hooks/useAttribution.ts:59-61`". **Ã‰ o contrÃ¡rio.**

```
20260723151654_20640250-â€¦sql:14  REVOKE EXECUTE ON FUNCTION public.compute_attribution(text,text,numeric)
                                   FROM anon, authenticated, PUBLIC;
20260723151654_20640250-â€¦sql:26  GRANT  EXECUTE ON FUNCTION public.compute_attribution(text,text,numeric)
                                   TO service_role;
```

Nenhuma migration posterior reverte (a Ãºltima do repo Ã© `20260726154947`). Logo:

- `src/hooks/useAttribution.ts:61` â†’ chamada com JWT `authenticated` â†’ **permission denied**.
  Isso quebra o painel de atribuiÃ§Ã£o em `src/pages/MarketingHub.tsx:48`.
- `supabase/functions/attribution-calculator/index.ts:38-46` â†’ cliente com
  `SUPABASE_SERVICE_ROLE_KEY` â†’ **Ãºnico chamador com privilÃ©gio**.

**AÃ§Ã£o correta:** nÃ£o deletar a EF. Ligar `useAttribution` nela (`invoke('attribution-calculator')`)
ou re-conceder o `EXECUTE`. A auditoria recomendaria apagar exatamente a peÃ§a que ainda funciona.

### ðŸ”´ 2. `crm-automation-monitor` â€” produtor exclusivo de widget da home

`supabase/functions/crm-automation-monitor/index.ts:49` (sucesso) e `:63` (erro) sÃ£o os **Ãºnicos
`insert` de `crm_automation_logs` em todo o repositÃ³rio**. A tabela alimenta
`src/components/crm/CRMAutomationAuditLog.tsx:52`, montado em `src/pages/Index.tsx:192`
(pÃ¡gina inicial) e `src/pages/Automacoes.tsx:80`. Deletar = dois cards vazios para sempre,
sem erro visÃ­vel.

### ðŸ”´ 3. `auto-regen-behavioral-profiles` â€” produtor exclusivo de alerta de admin

`index.ts:227` Ã© a Ãºnica origem de `system_alerts.alert_type='behavioral_regen_error_rate'`.
Consumido por `BehavioralRegenAlertBanner.tsx:45`, `BehavioralRegenAlertsStats.tsx:25` e
`BehavioralRegenAlertsTrend.tsx:46`, todos renderizados em
`src/pages/admin/BehavioralRegenAudit.tsx:436,457,458` (rota registrada). O doc 02 chamou de
"254 linhas sem nenhum caminho de execuÃ§Ã£o conhecido" â€” mas hÃ¡ trÃªs telas esperando o output dela.

### ðŸ”´ 4. `process-behavioral-regen-queue` â€” cron monitorado por UI viva

`src/components/admin/BehavioralRegenCronHealth.tsx:48` â†’ RPC `get_behavioral_regen_cron_health`
â†’ `cron.job WHERE jobname = 'process-behavioral-regen-queue-5min'`
(`20260713104851_60372e3b-â€¦sql:26-30`). HÃ¡ ainda alerta automÃ¡tico de *staleness*
(`20260713105030_f26185f4-â€¦sql:20`). O job Ã© real e agendado fora do versionamento.

### ðŸ”´ 5. Tabela `insights` â€” 5 leitores vivos

NÃ£o Ã© Ã³rfÃ£: `useYourDay.ts:78`, `useRealtimeNotifications.ts:185`, `useContactDetail.ts:41,195`,
`check-notifications/index.ts:58`, mais realtime (`20260111220436_â€¦sql:7`), 4 RLS e 3 Ã­ndices.
O achado legÃ­timo Ã© **"tabela sem escritor"** â€” problema de *escrita ausente*, nÃ£o de tabela morta.
Dropar a tabela quebraria 4 superfÃ­cies de leitura.

### ðŸŸ  E mais seis que **nÃ£o devem ser apagados sem checar o painel Supabase**

`client-notifications`, `check-notifications`, `auto-rebatch-behavioral`, `health-aggregate`,
`evolution-api`, `dual-write-proxy`.

O padrÃ£o comum: **investimento de infraestrutura que ninguÃ©m faz para cÃ³digo morto.**

| Alvo | Investimento que contradiz "morto" |
|---|---|
| `client-notifications` | 3 Ã­ndices compostos/parciais escritos **para as queries dela**, com o SQL replicado nos comentÃ¡rios (`20260720000024_cron_notification_indexes.sql:9,19,26`) |
| `health-aggregate` | 2 Ã­ndices parciais idem (`20260720000021_query_performance_indexes.sql:26,34`) + ADR-013 + entrada de versÃ£o no `CHANGELOG.md:148` |
| `check-notifications` | `requireCronSecret` (`:15`) + instrumentaÃ§Ã£o `tracedLogger` tratada como crÃ­tica (`.lovable/plan.md:9`, `docs/TECH_DEBT.md:13`) |
| `auto-rebatch-behavioral` | valida `x-cron-key` contra a tabela `cron_secrets` (`:52`) â€” desenho exclusivo de agendador externo |
| `dual-write-proxy` | item de checklist operacional (`docs/MIGRATION_MASTER_RUNBOOK.md:161`) + monitor companheiro agendado a cada 5 min (`:174` â†’ `scripts/migration/verify/dual-write-diverge.ts`) |
| `evolution-api` | contrato request/response publicado (`docs/EDGE_FUNCTIONS_API.md:324-334`) e classificaÃ§Ã£o como **webhook de integraÃ§Ã£o externa** (`docs/RUNBOOK.md:198`) |

**`ESTADO_ATUAL.md:295` recomenda "Remover `evolution-api` e `dual-write-proxy`". Essa
recomendaÃ§Ã£o nÃ£o estÃ¡ sustentada:** ambos sÃ£o superfÃ­cies para chamadores **externos** ao
repositÃ³rio, e o critÃ©rio da auditoria ("nenhum chamador no repo") nÃ£o os alcanÃ§a. O problema real
de `evolution-api` Ã© o apontado em `06:190` â€” 44 aÃ§Ãµes destrutivas atrÃ¡s de JWT de usuÃ¡rio comum,
**sem checagem de papel**. Isso se corrige com autorizaÃ§Ã£o, nÃ£o com `rm -rf`.

---

## Riscos residuais

1. **Crons do painel Supabase sÃ£o invisÃ­veis.** SÃ³ existem **2** `net.http_post` para Edge Functions
   em 390 migrations (`smart-notify`, `validation-queue-worker`). Todos os demais agendamentos, se
   existirem, foram criados fora do Git. Enquanto nÃ£o se rodar
   `SELECT jobname, schedule, command FROM cron.job` no banco de produÃ§Ã£o, **nenhuma** EF com
   `requireCronSecret` pode ser declarada morta com seguranÃ§a. Isso afeta os 6 INCONCLUSIVOS.

2. **Chamadores externos sÃ£o invisÃ­veis.** `evolution-api`, `dual-write-proxy`, `validate-access`,
   `detect-new-device`, `health-aggregate`, `incoming-webhook` sÃ£o endpoints projetados para trÃ¡fego
   de fora do repositÃ³rio. A prova de morte exigiria logs do gateway (invocaÃ§Ãµes por funÃ§Ã£o, 30/90
   dias), nÃ£o `grep`.

3. **A bateria de 10 testes tem um ponto cego estrutural.** Ela procura *chamadores*. TrÃªs dos cinco
   falsos positivos (`crm-automation-monitor`, `auto-regen-behavioral-profiles`, `insights`) sÃ³
   apareceram pelo **teste 11 (produtor/consumidor)**, e o mais grave
   (`attribution-calculator`) sÃ³ apareceu ao **cruzar GRANT/REVOKE de migrations com o caminho de
   chamada do front**. Recomendo que qualquer varredura futura de "cÃ³digo morto" inclua:
   (a) quem escreve cada tabela lida por UI viva; (b) o estado final de privilÃ©gio de cada RPC.

4. **NÃ£o usei histÃ³rico Git.** NÃ£o distingo "nunca ligado" de "desligado depois". Um `git log -S`
   por `invoke('<nome>'` diria se cada Ã³rfÃ£o jÃ¡ teve chamador â€” informaÃ§Ã£o que muda a decisÃ£o entre
   *apagar* e *religar*.

5. **`node_modules` vazio; nada foi executado.** Todas as afirmaÃ§Ãµes sÃ£o de leitura estÃ¡tica.
   Comportamento em runtime (ex.: se a RLS de `win_loss_records` de fato permite o upsert direto, ou
   se o import quebrado de `dual-write-proxy/index.ts:2` realmente impede o deploy) permanece
   `NAO_VERIFICADO`.

6. **Os 16 CONFIRMADOS nÃ£o sÃ£o automaticamente deletÃ¡veis.** Sete deles
   (`validate-access`, `detect-new-device`, `WinLossCaptureDialog`, `enrollContact`,
   `EmailPipelineStatus`, `AdminConexoesLogs`, `TelemetryTable`) sÃ£o **features inacabadas com
   backend pronto**, nÃ£o lixo: o custo de religar (uma rota, um import) Ã© muito menor que o de
   reescrever. Apenas `AccessSecurityManager` + `PasswordResetApproval` sÃ£o comprovadamente
   **duplicatas** de superfÃ­cies vivas (`/admin/seguranca`, `SecuritySettings`) e podem ser
   removidas sem perda funcional.
