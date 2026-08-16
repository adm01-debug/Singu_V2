# Verificação adversarial — camada de dados

> **Postura.** Este documento não confirma `ESTADO_ATUAL.md` nem `docs/estado/07_DADOS_BACKEND.md`:
> tenta **derrubá-los**. Cada afirmação foi tratada como hipótese falsa até que o número exato
> fosse reproduzido por medição independente. Onde o número não se reproduz, o achado está errado —
> e é corrigido aqui.
>
> Restrições respeitadas: sem runtime de banco; sem build/test/lint (`node_modules` vazio);
> nenhum arquivo fora deste foi editado; nenhum `git commit`/`push`.

---

## Placar: 3 confirmados / 3 corrigidos / 0 refutados de 6

| # | Afirmação | Veredito |
|---|---|---|
| A1 | 265 tabelas, 210 funções, 251 triggers, 1.063 políticas, 15 crons em 390 migrations | 🟡 **CORRIGIDO** |
| A2 | 30 policies + 35 indexes sem `CREATE TABLE`, sem guarda, em 14 arquivos; banco limpo falha | 🟢 **CONFIRMADO** |
| A3 | 2 matviews nunca criadas; 2 schemas recebem políticas sem `CREATE SCHEMA` | 🟡 **CORRIGIDO** |
| A4 | 24/265 tabelas (9,1%) e 75/210 funções (35,7%) sem consumidor | 🟡 **CORRIGIDO** |
| A5 | RLS com cobertura efetiva de 100%; única tabela sem RLS é partição | 🟢 **CONFIRMADO** |
| A6 | 15 jobs pg_cron; só 2 chamam Edge Function; ambos sem `x-cron-secret` | 🟢 **CONFIRMADO** |

Nenhuma afirmação caiu por inteiro. Três caíram em **precisão numérica**, sempre no mesmo sentido:
o método original mede sobre **texto** (grep sobre arquivo concatenado) e não sobre **SQL executável**,
o que contamina as contagens com comentários e com templates `format('CREATE ... %I')`.

---

## Método desta verificação

O ponto cego de toda a auditoria original é o achatamento (`sed 's/--.*//'` + `tr '\n' ' '`):
ele não distingue um `CREATE POLICY` real de um `CREATE POLICY` escrito dentro de uma string
passada a `format()`, nem enxerga que `--.*` também apaga hífens legítimos dentro de literais.

Construí um **normalizador recursivo** (`norm3.py`, no scratchpad) que percorre os 390 `.sql`
como autômato de estados — comentário de linha, comentário de bloco aninhado, literal
`'...'` com escape `''`, identificador `"..."`, e *dollar-quote* `$tag$...$tag$` com recursão
para dentro do corpo — preservando os offsets (substituindo por espaços) para manter
`arquivo:linha`. Isso produz **três camadas** disjuntas:

| Camada | Conteúdo | Uso |
|---|---|---|
| `top` | SQL fora de qualquer `$$…$$` | DDL de topo |
| `exec` | `top` + corpo de blocos `DO $$` e de funções — **tudo que o Postgres executa** | contagem correta |
| `dyn` | conteúdo de literais `'…'` — SQL **dinâmico** (`EXECUTE format(...)`) | separar templates |

Toda contagem abaixo é sobre `exec`, salvo indicação contrária. Comandos e scripts estão em
`/tmp/claude-0/-home-user-singu-v2/ebd3d393-e09f-52e5-bf50-427333371106/scratchpad/`
(`norm3.py`, `sets.py`, `a2b.py`, `a4b.py`).

---

## A1 — Inventário quantitativo

### Afirmação original

> `ESTADO_ATUAL.md:48` — "**265 tabelas, 210 funções, 251 triggers, 1.063 políticas RLS,
> 15 jobs `pg_cron`** declarados em 390 migrations."
> `docs/estado/07_DADOS_BACKEND.md:33-48` — mesma tabela, com os comandos `grep -ohiP … | sort -u`.

Uma medição independente apontou **268** tabelas, **211** funções e **252** triggers.

### Recontagem por camada

```
objeto              top    exec    dyn  | dist.top  dist.exec   grep cru (raw)
CREATE TABLE        279     279      4  |     265        265      304 occ / 268 dist
CREATE FUNCTION     264     264      0  |     210        210      266 occ / 211 dist
CREATE TRIGGER      249     255      1  |     245        250      260 occ / 254 dist
CREATE POLICY      1035    1061      2  |     998       1023     1063 occ
CREATE VIEW          23      23      2  |      12         12
cron.schedule         7      15      0  |       —          —       15 occ
```

### Quem está certo, e por quê

**A medição rival (268 / 211 / 252) está REFUTADA — é contaminação por comentário.**
Os nomes que aparecem só no texto cru e desaparecem no SQL executável são:

| Objeto | Falsos positivos exclusivos do texto cru | Origem |
|---|---|---|
| `CREATE TABLE` | `public.for`, `public.to`, `public.%I` | comentários `-- Create table **for** emotional anchors`, `-- Create table **to** …`; template `format('CREATE TABLE public.%I …')` |
| `CREATE FUNCTION` | `public.to` | `20260111130846_…sql:154` `-- Create function **to** update timestamps`; `20260511191057_…sql:7` `-- Create function **to** sync NLP data to contacts` |
| `CREATE TRIGGER` | `create`, `drop`, `for`, `update_` | comentários; `update_` vem do template `format('CREATE TRIGGER update_%I …')` |

Removendo comentários e templates, os números convergem para os do documento: **265 e 210**.

### Itens em divergência — nominalmente

**1. `265` tabelas — ✅ CONFIRMADO.**
279 statements `CREATE TABLE` executados, 265 nomes distintos, todos em `public`.
Nenhuma tabela temporária, nenhum `CREATE TABLE … AS`, uma única `PARTITION OF`
(`audit_log_default`, `20260711152812_…sql:75`). As "304 ocorrências" do documento são grep cru:
304 = 279 executadas + 21 em comentário + 4 dinâmicas (`format('CREATE TABLE … %I')` em
`20260711152812_…sql:54`, `20260711152838_…sql:31`, `20260723154109_…sql:64`, `20260723154140_…sql:40`).

**2. `210` funções — ✅ CONFIRMADO.**
264 statements, 210 nomes distintos, todos em `public`, nenhum nome repetido em dois schemas.
Zero `CREATE PROCEDURE`, zero `CREATE AGGREGATE`.

**3. `251` triggers — 🟡 CORRIGIDO.**
O comando declarado no documento (`grep … trigger\s+"?[a-z_0-9]+` + `sort -u`) conta **nomes**,
e produz **250** no SQL executável (254 no texto cru). O valor 251 só se obtém contando
**pares `(nome, tabela)`** — que é, aliás, a unidade correta em PostgreSQL, onde nome de trigger
é único por tabela. A diferença é exatamente **um** par: `set_updated_at` existe duas vezes,
em `public.contact_predictive_roadmap` e em `public.life_events`.
Números corretos: **255 statements / 250 nomes distintos / 251 pares (nome,tabela)**.
Seis triggers só existem dentro de blocos `DO $$` e escapariam a um grep de topo:
`tg_intent_signals_enqueue_score`, `tg_lead_score_rules_updated`, `tg_lead_score_thresholds_updated`,
`tg_lead_scores_audit`, `tg_lead_scores_updated`. Um trigger tem alvo fora de `public`: `auth.users`.

**4. `1.063` políticas — 🟡 CORRIGIDO para 1.061.**
Statements reais executados: **1.061** (1.035 de topo + 26 dentro de blocos `DO $$`).
Os 2 restantes do grep cru são **templates de SQL dinâmico**, não statements:

| Local | Trecho |
|---|---|
| `20260721000054_dormant_explicit_deny_all_policies.sql:35` | `EXECUTE format('CREATE POLICY %I ON _dormant.%I AS RESTRICTIVE FOR ALL USING (false)', …)` |
| `20260711145839_f975d6cc-…sql` (4 blocos `format($f$ CREATE POLICY … ON public.%1$I $f$)`) | contados como statement pelo grep achatado |

O número de **alvos distintos, 296, está ✅ CONFIRMADO** — dos quais 293 em `public` e 3 fora:
`realtime.messages`, `storage.objects`, `zapp_history.phone_to_contact`.

**5. `15` jobs `pg_cron` — ✅ CONFIRMADO.** 15 ocorrências de `cron.schedule`, 15 jobs nomeados
distintos (só 7 no topo; 8 dentro de blocos `DO $$`). Ver A6.

**6. `390` migrations — ✅ CONFIRMADO.** `ls supabase/migrations/*.sql | wc -l` → 390.

**7. Achados colaterais fora do escopo das 6 hipóteses**, mas que compartilham a mesma causa:

| Item | Documento diz | Medição | Causa da divergência |
|---|---:|---:|---|
| Views normais | 14 | **12** | 2 são `EXECUTE 'CREATE OR REPLACE VIEW public.mv_daily_kpis …'` dinâmicas (`20260721000055_…sql:39,48`) |
| Índices distintos | 541 | **540** | template dinâmico |
| Tabelas com `ENABLE ROW LEVEL SECURITY` | 267 | **268** total / **267** em `public` | a 268ª é `realtime.messages` |
| `CREATE TYPE` | 7 | **7** ✅ | 3 no topo + 4 dentro de `DO $$` |
| `CREATE SCHEMA` | 2 | **2** ✅ | `extensions`, `reporting` |

**Veredito A1: 🟡 CORRIGIDO.** Três dos cinco números se reproduzem exatamente (265, 210, 15).
Dois precisam de ajuste (251→250 nomes/251 pares; 1.063→1.061). A medição rival de 268/211/252
está **refutada**: é o número do documento acrescido de ruído de comentário.

---

## A2 — Statements sem `CREATE TABLE` correspondente

### Afirmação original

> `ESTADO_ATUAL.md:122` / `07_DADOS_BACKEND.md:274-320` — "**30 tabelas** recebem `CREATE POLICY`
> e **35** recebem `CREATE INDEX` sem nenhum `CREATE TABLE` correspondente, sem guarda `IF EXISTS`,
> em **14 arquivos**. Aplicar as migrations num banco limpo falha."

### Recontagem

Critério A (o do documento): alvo que **nunca** recebe `CREATE TABLE` em nenhuma das 390 migrations.

| Statement | Alvos órfãos | Detalhe |
|---|---:|---|
| `CREATE POLICY` | **31** | 28 em `public` + `realtime.messages` + `storage.objects` + `zapp_history.phone_to_contact` |
| `CREATE INDEX` | **35** | 34 em `public` + `zapp_history.messages` |
| `ALTER TABLE … ENABLE RLS` | **4** | `asia_upload_mapping`, `sm_upload_mapping`, `xbz_upload_mapping`, `realtime.messages` |

**O `35` do documento está ✅ EXATO.**
**O `30` está 🟡 impreciso**: as tabelas `public` são **28** — exatamente as 28 listadas na tabela de
`07_DADOS_BACKEND.md:287-314`. O documento chegou a 30 somando `realtime` e `zapp_history`
(`:316`), mas omitiu `storage.objects` e, sobretudo, `realtime.messages` e `storage.objects`
**existem em qualquer projeto Supabase** — não são falhas de replay. O único alvo não-`public`
que de fato quebra é `zapp_history.phone_to_contact`, cujo schema nunca é criado (ver A3).
Número honesto: **28 tabelas `public` + 1 objeto em schema inexistente = 29 alvos que quebram**.

### Teste de falsos positivos — cada caso sobreviveu ao escrutínio

O prompt levantou cinco hipóteses de falso positivo. Todas testadas, todas negativas:

| Hipótese de falso positivo | Resultado |
|---|---|
| Tabela criada com `CREATE TABLE IF NOT EXISTS` / aspas / schema-qualificado | ❌ o regex já cobre as três formas; nenhuma das 28+35 aparece sob qualquer variante |
| `CREATE TABLE … PARTITION OF` ou herança | ❌ existe **uma** `PARTITION OF` no repo inteiro (`audit_log_default`), e ela **é** criada |
| Bloco dentro de `DO $$ … IF EXISTS … END $$` | ❌ dos 127 `CREATE POLICY` órfãos, **zero** estão sob guarda; os únicos 5 dentro de `DO $$` são os `format('… %1$I')` de `20260711145839`, cujos alvos reais **existem** |
| Guarda no topo do arquivo (`to_regclass`, `IF EXISTS (SELECT …)`) | ❌ nenhum dos 14 arquivos tem guarda; `20260721000028_fix_rls_user_private_tables.sql` começa direto no comentário e emite `CREATE POLICY contact_notes_select ON public.contact_notes` na linha 15 |
| Criada mais tarde na cadeia (ordem, não ausência) | parcialmente: `notifications` e `tasks` recebem `CREATE INDEX` em `20260720000007` e só são criadas em `20260720000023_create_phantom_tables.sql` — **agrava**, não atenua |

**"14 arquivos" está ✅ CONFIRMADO** sob o critério do documento (policy + index):
`20260711145839`, `20260719000002`, `20260720000006`, `20260720000007`, `20260720000011`,
`20260721000028`, `20260721000039`, `20260721000065`, `20260721000082`, `20260721000085`,
`20260721000086`, `20260721000087`, `20260721000088`, `20260722000092`.

### Correção material: o ponto de falha está errado

`07_DADOS_BACKEND.md:356` afirma que `supabase db reset` "falha em
`20260721000028_fix_rls_user_private_tables.sql:15`, **no mais tardar**".
Um replay cronológico completo — incluindo `ALTER TABLE`, `CREATE TRIGGER` e `GRANT/REVOKE`,
com tabelas **e** views rastreadas — mostra que a cadeia quebra **antes**:

| Ordem | Migration:linha | Statement | Alvo |
|---|---|---|---|
| **1ª falha** | `20260719000002_add_missing_performance_indexes.sql:62` | `CREATE INDEX IF NOT EXISTS idx_behavioral_profile_queue_pending ON public.behavioral_profile_queue (…)` | `behavioral_profile_queue` — nunca criada |
| 2ª | `20260720000006_db_perf_indexes_rls_cleanup.sql:14` | `ALTER TABLE public.asia_upload_mapping ENABLE ROW LEVEL SECURITY;` | nunca criada |
| 3ª | `20260720000006_…sql:15-16` | idem `sm_upload_mapping`, `xbz_upload_mapping` | nunca criadas |
| … | `20260721000028_…sql:15` | primeiro `CREATE POLICY` órfão | (o ponto que o documento cita) |

Note que `IF NOT EXISTS` no `CREATE INDEX` **não protege**: ele testa a existência do índice,
não a da tabela. O replay total acusa **204 statements quebrados, 55 tabelas, 16 arquivos**
(a mais que os 14: `20260720000008_check_constraints_status_columns.sql`,
`20260720000009_not_null_user_id_owned_tables.sql`, `20260721000064_fix_default_privileges.sql`).

**Veredito A2: 🟢 CONFIRMADO.** O achado **não** está superdimensionado — está *sub*dimensionado.
Ajustes: `30 → 28` tabelas `public`; ponto de falha `20260721000028:15 → 20260719000002:62`;
escala real do replay 16 arquivos / 55 tabelas / 204 statements.

---

## A3 — Materialized views e schemas nunca criados

### Afirmação original

> `ESTADO_ATUAL.md:122` — "Duas materialized views são movidas, refrescadas e revogadas sem nunca
> serem criadas; dois schemas (`zapp_history`, `_dormant`) recebem políticas sem `CREATE SCHEMA`."

### Parte 1 — materialized views: ✅ CONFIRMADO, com precisão sobre o que falha

`grep -rniP "CREATE\s+MATERIALIZED\s+VIEW" supabase/migrations/` → **0**, em todas as três camadas
(`top`, `exec`, `dyn`). Confirmado: nada no repositório cria `mv_daily_kpis` ou `mv_daily_stats`.

| Operação | Migration:linha | Guardada? | Quebra em banco limpo? |
|---|---|---|---|
| `REVOKE SELECT ON public.mv_daily_kpis FROM anon` | `20260721000042_revoke_anon_materialized_views.sql:10` | **não** | **sim** ← o statement que de fato aborta |
| `REVOKE SELECT ON public.mv_daily_stats FROM anon` | `20260721000042_…sql:11` | **não** | **sim** |
| `GRANT SELECT ON public.mv_daily_kpis TO authenticated` | `20260721000042_…sql:14-15` | não | sim |
| `ALTER MATERIALIZED VIEW **IF EXISTS** public.mv_daily_kpis SET SCHEMA reporting` | `20260721000055_…sql:25-26` | **sim (`IF EXISTS`)** | não |
| `REFRESH MATERIALIZED VIEW CONCURRENTLY reporting.mv_daily_kpis` | `20260721000061_fix_mv_refresh_functions.sql:21,32` | n/a — está **dentro do corpo** de `refresh_daily_kpis()`/`refresh_daily_stats()` | não na migration; só se a função for chamada (e nada a chama — ver A4) |

Ou seja: das três operações citadas, **"movidas" é guardada** por `IF EXISTS` e
**"refrescadas" não executa em tempo de migration** — é código dentro de função. Apenas
**"revogadas"** quebra. A substância do achado está de pé; a caracterização é frouxa.

### Parte 2 — schemas: 🟡 PARCIALMENTE REFUTADO

`CREATE SCHEMA` existe apenas duas vezes no repositório:
`20260513175048_…sql:2` (`extensions`) e `20260721000055_…sql:22` (`reporting`).
Nem `zapp_history` nem `_dormant` são criados. Isso está ✅ confirmado.

Mas **"os dois recebem políticas" é falso para `_dormant`**:

| Schema | Recebe `CREATE POLICY`? | Evidência |
|---|---|---|
| `zapp_history` | **Sim, literal e sem guarda** | `20260721000057_zapp_history_phone_to_contact_rls.sql:14` — `CREATE POLICY phone_to_contact_select ON zapp_history.phone_to_contact FOR SELECT TO authenticated USING (true);` **Quebra em banco limpo.** |
| `_dormant` | **Não.** Só via `EXECUTE format()` num `DO $$` dirigido por catálogo | `20260721000054_dormant_explicit_deny_all_policies.sql:20-40` — o `FOR t IN SELECT … FROM pg_class JOIN pg_namespace WHERE n.nspname = '_dormant'` **itera zero linhas** num banco sem o schema, e o corpo ainda está envolto em `EXCEPTION WHEN OTHERS THEN RAISE WARNING`. **Não quebra, e não emite política alguma.** |

As contagens de referência do documento também estão baixas:
`zapp_history` tem **49** referências em 9 arquivos (documento: 24);
`_dormant` tem **35** referências em 9 arquivos (documento: 10).

**Veredito A3: 🟡 CORRIGIDO.** As duas matviews são reais e o achado se sustenta, mas só o
`REVOKE` quebra. Dos dois schemas, apenas **`zapp_history`** recebe política — `_dormant`
recebe apenas um laço dinâmico, guardado por catálogo e por `EXCEPTION`, que é *no-op*.

---

## A4 — Órfãos

### Afirmação original

> `ESTADO_ATUAL.md:183` — "**24 de 265 tabelas (9,1%)** e **75 de 210 funções (35,7%)** sem
> qualquer consumidor."
> `07_DADOS_BACKEND.md:116` e `:159` — mesmos números; lista de 24 tabelas e de 56 funções
> "que não aparecem em lugar nenhum".

Corpus de consumo reconstruído: **1.895 arquivos** `.ts/.tsx/.js/.jsx/.mjs/.cjs` em
`src/`, `supabase/functions/`, `tests/`, `e2e/`, `scripts/`, `monitoring/`
(excluídos `types.ts` e `types.ts.lovable.bak`), mais as camadas `exec` + `dyn` das 390 migrations.

### Tabelas — 24 reproduz, mas o rótulo "sem qualquer consumidor" não

Sob o critério declarado pelo documento (sem `.from('x')`, sem literal `'x'`/`"x"`/`` `x` ``),
a lista reproduz **exatamente, item por item: 24 tabelas**, sem uma diferença sequer. ✅

O problema é o próximo passo. O documento afirma "sem **qualquer** consumidor", mas
**15 das 24 são lidas ou escritas por SQL dentro das próprias migrations** — trigger,
função ou chave estrangeira:

| Tabela | Como é consumida no SQL |
|---|---|
| `pipelines` | `REFERENCES public.pipelines(id)` ×3 + `FROM` ×2 |
| `pipeline_stages` | `REFERENCES` ×3 + `FROM` + `JOIN` |
| `pipeline_stage_transitions` | `INSERT INTO` ×2 + `FROM` ×3 |
| `life_events_history` | `INSERT INTO` ×6 + `FROM` ×2 |
| `data_retention_policies` | `FROM` + `INSERT INTO` + `UPDATE … SET` ×2 (função `apply_retention_policies()`) |
| `contact_relatives_audit` | `INSERT INTO` ×3 + `FROM` |
| `contact_cadence_audit`, `contact_preferences_audit`, `contact_time_analysis_audit`, `disc_analysis_history_audit`, `interactions_audit`, `reframing_analysis_audit` | `INSERT INTO` ×3 cada (triggers de auditoria) |
| `search_products_cache` | `FROM` ×2 |
| `attribution_models_cache`, `forecast_categories_history` | `INSERT INTO` ×1 cada |

**Órfãs de verdade — nem app, nem SQL, nem FK: 9 de 265 = 3,4%** (não 9,1%):

`ai_recommendation_audit_logs`, `audit_log_default`, `city_whitelist`, `interaction_summaries`,
`login_attempts`, `marketing_roi_data`, `neuro_pnl_sessions`, `nlp_feedback`, `nurturing_enrollments`.

Para estas nove, a **única** ocorrência em SQL é `ON public.<tabela>` vinda do próprio
`CREATE POLICY`/`CREATE INDEX`/`ALTER TABLE` — nenhum `FROM`, `JOIN`, `INSERT`, `UPDATE`,
`DELETE` ou `REFERENCES`. (`audit_log_default` é a partição técnica, deveria sair da lista.)

### Funções — 75 é 70; 56 é 52

Aplicando os quatro testes declarados em `07_DADOS_BACKEND.md:157`, em cascata:

| Filtro | Restam |
|---|---:|
| 210 funções criadas | 210 |
| − chamadas por `.rpc('x')` no app (55 nomes distintos) | 160 |
| − referenciadas por `EXECUTE FUNCTION x()` em `CREATE TRIGGER` | **109** |
| − chamadas de dentro de outro SQL (função, policy, cron) | **70** ← equivalente a "sem referência estrutural" |
| − com literal `'x'` no código do app | 54 |
| − com qualquer substring no código do app | **52** ← equivalente a "sem menção nenhuma" |

**A hipótese do prompt de que as funções de trigger inflaram o número está REFUTADA.**
O repositório tem **51 funções de trigger** entre as 210, e o método original **as tratou
corretamente** (160 → 109). Não é aí que está o erro.

O erro está no teste (c), "chamada `PERFORM/SELECT public.nome(` dentro do próprio SQL".
Ele só reconhece a chamada quando ela abre o statement. **Cinco funções escapam** por serem
chamadas dentro de expressões aninhadas — e são exatamente as 5 unidades da diferença 75 − 70:

| Função | Chamadas em SQL | Por que o teste original não viu |
|---|---:|---|
| `_connection_encryption_key` | 4 | usada como argumento: `pgp_sym_decrypt(…, public._connection_encryption_key())` |
| `capture_rpc_plan` | 3 | invocada de dentro de outra função, não em início de statement |
| `create_deal` | 1 | idem |
| `decrypt_connection_config` | 1 | invocada no corpo de outra função |
| `get_top_slow_rpcs` | 2 | idem |

Os quatro primeiros (menos `create_deal`, que não constava) são também os **4 falsos positivos
da lista de 56** — `07_DADOS_BACKEND.md:161` lista `_connection_encryption_key`,
`capture_rpc_plan`, `decrypt_connection_config` e `get_top_slow_rpcs` como "não aparecem em
lugar nenhum", quando as quatro são chamadas dentro do SQL do próprio repositório.
Removidas, a lista fecha em **52**, sem nenhum item adicional em relação à publicada.

Os outros dois destaques do documento **sobrevivem**: `refresh_daily_kpis` e `refresh_daily_stats`
seguem sem `.rpc()`, sem trigger, sem cron e sem chamada em SQL — funções de refresh sem
agendador, sobre objetos que não existem (A3). Idem a quádrupla
`singu_query`/`singu_insert`/`singu_update`/`singu_delete`.

**Veredito A4: 🟡 CORRIGIDO.**
Tabelas: 24/265 (9,1%) → **9/265 (3,4%)** de órfãs reais; as outras 15 têm consumidor em SQL.
Funções: 75/210 (35,7%) → **70/210 (33,3%)**; "56 sem menção" → **52**.

---

## A5 — Cobertura de RLS

### Afirmação original

> `ESTADO_ATUAL.md:222` — "**RLS tem cobertura efetiva de 100%** do que o repositório cria:
> 1.063 políticas sobre 296 alvos; a única tabela sem RLS é uma partição (falso positivo)."

### Tentativas de refutação — todas falharam

| Ataque | Resultado |
|---|---|
| Existe tabela `public` criada sem `ENABLE ROW LEVEL SECURITY`? | **1**: `audit_log_default` (`20260711152812_…sql:75`) |
| Existe tabela `public` criada sem nenhuma `CREATE POLICY`? | **1**: a mesma |
| `audit_log_default` é mesmo partição? | **Sim** — `PARTITION OF public.audit_log DEFAULT`, única `PARTITION OF` do repositório |
| A tabela-mãe `audit_log` tem RLS? | **Sim** — `ENABLE RLS` em `20260411212046_…sql:18` e `20260711152812_…sql:29`, **+ 4 políticas**. Em PostgreSQL a RLS da mãe governa a partição → falso positivo confirmado |
| Alguma `ENABLE RLS` vem **antes** do `CREATE TABLE` (falharia)? | **0 casos** |
| Alguma tabela com RLS mas política `TO anon`/`TO public` com `USING (true)` — cobertura formal, exposição real? | **0 casos.** 25 políticas concedem a `anon`/`public`, em 18 tabelas, e **nenhuma** delas usa `USING (true)` |
| Sobra alguma tabela com RLS ligada e zero políticas (deny-all acidental)? | **0 casos** |

Números de suporte: **268** objetos recebem `ENABLE ROW LEVEL SECURITY` (267 em `public` +
`realtime.messages`), **296** alvos distintos de `CREATE POLICY`, **264 de 265** tabelas criadas
têm `ENABLE` **e** ≥1 política.

**Veredito A5: 🟢 CONFIRMADO.** Não consegui derrubar. A ressalva do próprio documento
(`07_DADOS_BACKEND.md:433`) continua válida e é a única brecha honesta: cobertura ≠ correção —
os predicados `USING`/`WITH CHECK` não foram avaliados um a um, e isso permanece
`NAO_VERIFICADO`. A afirmação, porém, é sobre **cobertura**, e a cobertura é 100%.
(Único ajuste de arrasto: "1.063 políticas" → **1.061**, por A1.)

---

## A6 — Jobs pg_cron

### Afirmação original

> `ESTADO_ATUAL.md:75` — "o repositório versiona **15 jobs `pg_cron`**, dos quais apenas **2**
> chamam uma Edge Function — e **os dois omitem o header exigido**."

### Lista completa reproduzida — 15/15

| # | jobname | schedule | comando | migration:linha |
|---|---|---|---|---|
| 1 | `validation-queue-drain` | `*/5 * * * *` | **`net.http_post` → `https://rqodmqosrotmtrjnnjul.supabase.co/functions/v1/validation-queue-worker`** | `20260417120721_823eaa43-…sql:14` |
| 2 | `revalidate-stale-emails` | `0 4 * * *` | `INSERT INTO public.validation_queue … FROM public.email_verifications` | `20260417120721_…sql:24` |
| 3 | `revalidate-stale-phones` | `30 4 * * *` | `INSERT INTO public.validation_queue … FROM public.phone_validations` | `20260417120721_…sql:41` |
| 4 | `check-contact-health-daily` | `0 0 * * *` | `SELECT public.check_contact_health_alerts()` | `20260509173046_0804c068-…sql:7` |
| 5 | `smart-notify-automation` | `0 */4 * * *` | **`net.http_post` → `https://hjhthvzwtvwgdrochcam.supabase.co/functions/v1/smart-notify`** | `20260512105729_9e0ffd45-…sql:6` |
| 6 | `cleanup-simulated-alerts-weekly` | `0 3 * * 0` | `SELECT public.cleanup_simulated_alerts()` | `20260713124628_449b2996-…sql:28` |
| 7 | `mtta-sla-breach-auto-ack-hourly` | `7 * * * *` | `SELECT public.auto_ack_stale_mtta_sla_breaches()` | `20260715184735_158ce47d-…sql:31` |
| 8 | `mtta-auto-ack-heartbeat-watchdog` | `*/30 * * * *` | `SELECT public.check_mtta_auto_ack_heartbeat()` | `20260717142132_7f20a3a3-…sql:69` |
| 9 | `apply-data-retention-daily` | `15 3 * * *` | `SELECT public.apply_retention_policies()` | `20260723112943_04c3b77d-…sql:125` |
| 10 | `ai-gateway-alerts-eval` | `*/5 * * * *` | `SELECT public.evaluate_ai_gateway_alerts()` | `20260723152932_9ebcb761-…sql:93` |
| 11 | `auto_resolve_ai_gateway_alerts` | `2-59/5 * * * *` | `SELECT public.auto_resolve_ai_gateway_alerts()` | `20260723153336_b3712da2-…sql:178` |
| 12 | `ai-gateway-metrics-ensure-partition` | `15 3 * * *` | `SELECT public.ensure_ai_gateway_metrics_partition()` | `20260723154109_ad0a12c4-…sql:128` |
| 13 | `ai-gateway-metrics-drop-old` | `0 4 * * 0` | `SELECT public.drop_old_ai_gateway_metrics_partitions(90)` | `20260723154109_ad0a12c4-…sql:134` |
| 14 | `cleanup_rpc_perf_samples_daily` | `15 3 * * *` | `SELECT public.cleanup_rpc_perf_samples()` | `20260723154748_e54bdf5c-…sql:254` |
| 15 | `capture-degraded-rpc-plans` | `*/15 * * * *` | `SELECT public.capture_degraded_rpc_plans()` | `20260726144422_a6bd4ac3-…sql:3` |

**Exatamente 2 fazem `net.http_post` para `/functions/v1/`** (#1 e #5). Os outros 13 são
`SELECT`/`INSERT` puros. ✅

### Headers — ✅ CONFIRMADO

```
-- 20260417120721_…sql:19
headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIs…"}'::jsonb

-- 20260512105729_…sql:11
headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
```

Nenhum dos dois envia `x-cron-secret`. `grep -rni "x-cron-secret" supabase/migrations/` → **0**.
E o header **é** exigido pelo próprio repositório: `supabase/functions/_shared/auth.ts:264-276`
define `requireCronSecret` validando `req.headers.get("x-cron-secret")` contra `CRON_SECRET`;
`supabase/functions/connection-anomaly-detector/index.ts:47-48` o consome;
`supabase/functions/lead-score-cron/index.ts:2` documenta "Aciona-se via cron (header `x-cron-secret`)".

Confirmado de quebra o achado G-4: o JWT de #1 tem payload `"ref":"rqodmqosrotmtrjnnjul"`,
terceiro project ref, diferente de `hjhthvzwtvwgdrochcam` (`supabase/config.toml:1` e job #5).

**Veredito A6: 🟢 CONFIRMADO integralmente** — 15 jobs, 2 HTTP, 0 com `x-cron-secret`.
Ajuste de citação: `ESTADO_ATUAL.md:79` aponta `20260512105729_…sql:11` para o job
`smart-notify-automation`; :11 é a linha do `headers`, o `cron.schedule` está em `:6`.

---

## Números que devem ser corrigidos no `ESTADO_ATUAL.md`

| Onde | Está | Deveria ser |
|---|---|---|
| `ESTADO_ATUAL.md:48` | "251 triggers" | **250 nomes distintos** (ou "251 pares nome+tabela"; 255 statements) |
| `ESTADO_ATUAL.md:48` | "1.063 políticas RLS" | **1.061 políticas** (1.063 inclui 2 templates `format()` dinâmicos) |
| `ESTADO_ATUAL.md:48` | "265 tabelas, 210 funções, 15 jobs, 390 migrations" | ✅ manter — reproduzidos exatamente |
| `ESTADO_ATUAL.md:122` | "30 tabelas recebem `CREATE POLICY`" | **28 tabelas em `public`** (+ `zapp_history.phone_to_contact`; `realtime.messages` e `storage.objects` existem em qualquer projeto Supabase) |
| `ESTADO_ATUAL.md:122` | "35 recebem `CREATE INDEX`" | ✅ manter — **35** exato |
| `ESTADO_ATUAL.md:122` | "em 14 arquivos" | ✅ manter para policy+index; **16 arquivos / 204 statements / 55 tabelas** no replay completo |
| `ESTADO_ATUAL.md:122` | "dois schemas (`zapp_history`, `_dormant`) recebem políticas" | **apenas `zapp_history`**; `_dormant` só recebe laço dinâmico guardado por catálogo + `EXCEPTION` (no-op em banco limpo) |
| `ESTADO_ATUAL.md:183` | "24 de 265 tabelas (9,1%)" | **9 de 265 (3,4%)** sem consumidor algum; 15 das 24 são usadas em DML/FK dentro das migrations |
| `ESTADO_ATUAL.md:183` | "75 de 210 funções (35,7%)" | **70 de 210 (33,3%)** |
| `ESTADO_ATUAL.md:222` | "1.063 políticas sobre 296 alvos" | **1.061 políticas sobre 296 alvos** (296 ✅) |
| `ESTADO_ATUAL.md:222` | "cobertura efetiva de 100% … única tabela sem RLS é uma partição" | ✅ manter — não foi possível derrubar |
| `ESTADO_ATUAL.md:75,79` | "15 jobs, 2 chamam Edge Function, ambos sem header" | ✅ manter — reproduzido integralmente |
| `ESTADO_ATUAL.md:79` | `smart-notify-automation` … `20260512105729_…sql:11` | `…sql:6` (`:11` é a linha do `headers`) |
| `07_DADOS_BACKEND.md:37` | "Views (normais): 14" | **12** (2 são `EXECUTE 'CREATE OR REPLACE VIEW …'` dinâmicas) |
| `07_DADOS_BACKEND.md:40` | "Tabelas com `ENABLE RLS`: 267" | **268** no total (267 em `public` + `realtime.messages`) |
| `07_DADOS_BACKEND.md:41` | "541 índices distintos (587 ocorrências)" | **540 distintos / 584 statements executados** |
| `07_DADOS_BACKEND.md:161` | lista de 56 funções "sem menção nenhuma" | **52** — remover `_connection_encryption_key`, `capture_rpc_plan`, `decrypt_connection_config`, `get_top_slow_rpcs` (todas chamadas dentro de SQL) |
| `07_DADOS_BACKEND.md:356` | "falha em `20260721000028_…sql:15`, no mais tardar" | falha antes: **`20260719000002_add_missing_performance_indexes.sql:62`** (`CREATE INDEX … ON public.behavioral_profile_queue`) |
| `07_DADOS_BACKEND.md:326-327` | matviews "movidas, refrescadas e revogadas" | só o **`REVOKE`** (`20260721000042_…sql:10-11`) quebra; `SET SCHEMA` tem `IF EXISTS`; `REFRESH` está dentro de corpo de função |
| `07_DADOS_BACKEND.md:328-329` | `zapp_history` 24 refs / `_dormant` 10 refs | **49** e **35** referências, em 9 arquivos cada |

---

## Ressalva metodológica

Tudo acima é análise **estática de texto SQL**. Continua `NAO_VERIFICADO`, como no documento
original: se alguma migration foi aplicada, o que existe de fato no banco
`hjhthvzwtvwgdrochcam`, se os jobs de cron estão registrados, e se os predicados `USING`/
`WITH CHECK` das 1.061 políticas são corretos. Corrigir os números acima não muda nenhum
veredito qualitativo de `ESTADO_ATUAL.md`: a cadeia de migrations continua não replayável,
o drift `types.ts` × migrations continua total, e os dois crons HTTP continuam sem autenticação
de origem.
