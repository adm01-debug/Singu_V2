# Verificação adversarial — Marketing e Automação

> Reverificação hostil das afirmações publicadas em `docs/estado/03_MARKETING_AUTOMACAO.md` e
> `ESTADO_ATUAL.md:42`. Postura: cada afirmação tratada como hipótese a derrubar.
> Auditoria estática em `/home/user/singu-v2`, sem runtime, sem build, sem teste (`node_modules` vazio).
> Só vale o que foi lido em `arquivo:linha`.

## Placar: 4 confirmados / 3 corrigidos / 0 refutados de 7

| # | Afirmação | Veredito |
|---|---|---|
| B1 | Marketing é a dimensão mais frágil — 6/38 ✅ (16%) | **CORRIGIDO** |
| B2 | Não existe motor de automação consumindo `automation_rules` | **CORRIGIDO** |
| B3 | Envio de e-mail encenado em 3 lugares | **CONFIRMADO** |
| B4 | `send-transactional-email` não existe | **CONFIRMADO** |
| B5 | `enrollContact` é código morto | **CORRIGIDO** |
| B6 | `sequence-processor` retorna 401 ao chamador da UI | **CONFIRMADO** |
| B7 | CPL/CAC/LTV hardcoded em `MarketingHub.tsx` | **CONFIRMADO** |

---

## B1 — "Marketing/Automação é a dimensão mais frágil: apenas 6 de 38 funcionalidades ✅ (16%)"

**Veredito: CORRIGIDO.** O julgamento qualitativo linha a linha é, na amostra, defensável e bem
evidenciado. Mas **os números publicados não correspondem à própria tabela de evidências** e
duas linhas específicas estão erradas ou imprecisas.

### O que fiz para derrubar

1. Contei, coluna por coluna, os símbolos de classificação da tabela de evidências
   (`03_MARKETING_AUTOMACAO.md`, linhas 33–83, extraindo o campo 3 de cada linha da tabela).
2. Reavaliei por conta própria 22 das linhas, abrindo o código citado.
3. Repeti a contagem nos outros documentos de dimensão, para saber se o erro é sistêmico ou local.

### Achado 1 — a contagem publicada não bate com a tabela que ela resume

A tabela de evidências tem **51 linhas de dados**, não 38 (`03_MARKETING_AUTOMACAO.md:33` até `:83`).

| Classificação | Publicado (`:14-17` e `ESTADO_ATUAL.md:42`) | Contado na tabela |
|---|---|---|
| ✅ | 6 / 38 (16%) | **7 / 51 (13,7%)** |
| 🟨 | 15 / 38 | **27 / 51** |
| 🟦 | 11 / 38 | **5 / 51** |
| ⬛ | 6 / 38 | **12 / 51** |

Nenhuma das quatro células fecha. O erro mais grave é o ⬛: o documento publica **6 itens mortos**
quando a própria tabela lista **12** — o dobro. As 7 linhas ✅ são
`:51` (email-builder), `:54` (landing pages), `:62` (formulários públicos), `:64` (lead magnets),
`:67` (NPS), `:76` (EFs de enriquecimento), `:79` (`email-pipeline-health`) — sete, não seis.

O erro é **local a este documento**. Rodando a mesma contagem em `01_CORE_CRM.md` obtém-se
exatamente 47 ✅ / 11 🟨 / 3 🟦 / 4 ⬛ = 65, idêntico ao publicado em `ESTADO_ATUAL.md:39`.

**Consequência para a tese:** com os números corretos, Marketing cai de 16% para **13,7% de ✅** —
continua sendo a dimensão com menor proporção de ✅ (a seguinte é Infra/CI, 6/34 = 17,6%,
`ESTADO_ATUAL.md:47`). **A tese "dimensão mais frágil" sobrevive; a aritmética que a sustenta, não.**

### Achado 2 — duas linhas classificadas de forma errada ou injusta

**(a) `03_MARKETING_AUTOMACAO.md:61` — Funil de Marketing, 🟨 com ressalva "não localizei a definição da RPC".**
A RPC **existe e está definida**, com assinatura idêntica à chamada do frontend:
- Definição: `supabase/migrations/20260512175533_60e5a2d8-6ef2-428b-8a15-4a3c550f2003.sql:64` —
  `CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id UUID, _start_date DATE, _end_date DATE)`
- Redefinida em `supabase/migrations/20260723120839_8d1857f8-929d-453c-9f9b-9ede9fef5d41.sql:90`
- `GRANT EXECUTE` em `supabase/migrations/20260522142957_beb532ac-a0b4-4e84-9ccc-1ddd68b9c080.sql:15`
- Chamada casando parâmetro a parâmetro em `src/hooks/useMarketingInsights.ts:39-43`

O auditor original não fez a varredura e rebaixou por ausência de busca, não por ausência de código.
**Esta linha deveria ser ✅.**

**(b) `03_MARKETING_AUTOMACAO.md:82` — `bitrix24-webhook`, 🟦, com a afirmação
*"Nenhuma tela de configuração, nenhuma URL exposta ao usuário, nenhuma documentação de integração no código"*.**
Essa frase é **falsa**. Existe uma integração Bitrix24 completa na UI, roteada por `incoming-webhook`:
- Template pronto `bitrix24-lead` com `field_mapping` de `data.FIELDS.*` — `src/components/admin/conexoes/webhookTemplates.ts:21-31`
- Snippet de configuração com Handler URL e lista de eventos (`ONCRMLEADADD`) — `src/components/admin/conexoes/WebhookSnippetsSheet.tsx:80-84`, exibido em `:101`
- Campo `portal_url` do conector `bitrix24` — `src/components/admin/conexoes/ConnectionFormDialog.tsx:31-32`

A EF `bitrix24-webhook` é de fato órfã (0 referências fora do próprio diretório, confirmado),
mas por **redundância** com `incoming-webhook`, não por falta de porta de entrada. E, sendo código
completo e sem chamador, deveria ser ⬛ pelo mesmo critério aplicado a `sequence-track` (`:40`, ⬛) —
a calibragem entre as duas linhas é inconsistente.

### Achado 3 — o terceiro "achado que domina o módulo" está errado

`03_MARKETING_AUTOMACAO.md:25` afirma: *"Não existe caminho de UI para inscrever contatos… os motores
de sequência e nurturing nunca têm o que processar."* **Falso para sequências.** Ver B5 abaixo.

### Linhas que reverifiquei e considero corretas (amostra de 22, ≥ 12 exigidas)

| Linha do doc | Item | Classificação | Veredito da reverificação |
|---|---|---|---|
| `:33` | `/automacoes` | 🟨 | **justa** — CRUD real, zero consumidor (ver B2) |
| `:35` | Cadências CRM | 🟦 | **justa** — `crm_cadence_rules` só em DDL/RLS/trigger `updated_at`; único consumidor é a UI (`src/components/crm/CadenceRulesConfig.tsx:71-117`) |
| `:37` | Inscrição em sequência | ⬛ | **justa quanto ao objeto** (ver B5) |
| `:39` | Envio de e-mail de step | ⬛ | **justa** (ver B3/B4) |
| `:40` | `sequence-track` | ⬛ | **justa** — 0 referências fora de `supabase/functions/sequence-track/` em `src/`, `supabase/`, `e2e/`, `tests/`, `scripts/` |
| `:42` | RPC `increment` | ⬛ | **justa** — nenhuma `CREATE FUNCTION public.increment(` bare; só `increment_form_view`, `increment_magnet_view`, `increment_landing_page_view`, `increment_webhook_quota`, `increment_playbook_usage`, `increment_version_column`, `increment_contact_version` |
| `:44` | `useEnrollContact` | ⬛ | **justa** — só a definição em `src/hooks/useNurturingExecutions.ts:38` |
| `:46` | Steps e-mail/WhatsApp do nurturing | ⬛ | **justa** (ver B3) |
| `:47` | `increment_workflow_completed` | ⬛ | **justa** — única ocorrência no repositório é a chamada em `supabase/functions/nurturing-runner/index.ts:145` |
| `:49` | Disparo de campanha de e-mail | ⬛ | **justa** (ver B3) |
| `:51` | email-builder | ✅ | **justa** |
| `:54` | Landing pages | ✅ | **justa** |
| `:57` | Painel DISC/VAK | ⬛ | **justa e verificada** — bloco JSX abre em `src/pages/MarketingHub.tsx:51` (hook em `:50`), fecha em `:140`, `const copyUrl` em `:143`, `return` em `:150`. Nunca renderiza |
| `:58` | Aba Segmentação | 🟨 | **justa e verificada** — `<TabsList>` abre em `:191`, fecha em `:203`; `<TabsContent value="segmentation">` está em `:199-201`, entre os `<TabsTrigger>` |
| `:59` | CPL/CAC/LTV | ⬛ | **justa** (ver B7) |
| `:61` | Funil de Marketing | 🟨 | **INJUSTA → ✅** (Achado 2a) |
| `:62` | Formulários públicos | ✅ | **justa** |
| `:68` | `/report-builder` | 🟦 | **justa** — comentário literal *"Placeholder widget rendering"* em `src/pages/ReportBuilder.tsx:45`; `WidgetRenderer` (`:40-64`) só renderiza ícone e rótulo |
| `:71` | Dashboards embeddable | ⬛ | **justa** — `grep -n "embed" src/app/AppRoutes.tsx` → 0; snippet aponta para `/embed/dashboard/${id}` (`src/components/bi/EmbeddableDashboards.tsx:37`); rodapé afirma token inexistente (`:128`) |
| `:73` | `weekly-digest` | 🟨 | **justa** — `generateEmailHtml` definido em `supabase/functions/weekly-digest/index.ts:226` e nunca chamado (grep no arquivo: 1 ocorrência) |
| `:78` | `validation-queue-worker` | 🟨 | **justa e verificada** — URL do cron `https://rqodmqosrotmtrjnnjul.supabase.co/…` (`supabase/migrations/20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql:18`) vs `project_id = "hjhthvzwtvwgdrochcam"` (`supabase/config.toml:1`); JWT anon literal em `:19`; nenhum `x-cron-secret` |
| `:82` | `bitrix24-webhook` | 🟦 | **INJUSTA** (Achado 2b) |

### Observação de método

A tabela mistura granularidades: linhas como `:42` (RPC `increment`) e `:47`
(`increment_workflow_completed`) são **detalhes de implementação**, não "funcionalidades", e infl(am)
tanto o denominador quanto a contagem de ⬛. Isso não invalida os achados, mas explica parte da
distância entre o denominador declarado (38) e a tabela (51).

---

## B2 — "Não existe motor de automação: nenhum trigger, EF ou cron consome `automation_rules`"

**Veredito: CORRIGIDO.** A afirmação **literal sobre `automation_rules` é verdadeira e reproduzi-a
integralmente**. Mas a generalização implícita ("não existe motor de automação" no sistema) é falsa.

### O que fiz para derrubar

Varredura de `automation_rules`, `automation_logs` e `execute_automation` em
`supabase/migrations/`, `supabase/functions/`, `src/`, `scripts/`, `e2e/`, `tests/`, `monitoring/`.

### Evidência — nenhum consumidor de `automation_rules`

| Onde aparece | Natureza |
|---|---|
| `supabase/migrations/20260317195052_91a69f5c-0ce8-4b32-be8d-cf6d9ccb9151.sql:3` | `CREATE TABLE` |
| idem `:29-49` | RLS + 4 policies |
| idem `:52` | `CREATE TABLE automation_logs` |
| idem `:82-83` | trigger apenas de `updated_at` |
| `supabase/migrations/20260720000025_missing_user_fk_indexes.sql:52` | índice |
| `supabase/functions/external-data/index.ts:109` | apenas **allowlist de nomes de tabela** do proxy genérico — não é motor |
| `src/hooks/useAutomationRules.ts:105,148,189,213` | CRUD do frontend |
| `src/hooks/useAutomationRules.ts:124` | leitura de `automation_logs` |
| `src/pages/AdminAuditTrail.tsx:46` | rótulo de exibição |
| `scripts/migration/ddl/09_triggers.sql:13` | de novo, só `updated_at` |

**Zero** `CREATE FUNCTION`, `CREATE TRIGGER … EXECUTE`, `cron.schedule` ou `net.http_post` que leia
a tabela. Nenhuma edge function a consulta. **`execute_automation_v2`**: única ocorrência em todo o
repositório é como *string* numa lista de hardening —
`supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:499`. A função nunca é definida.
`crm_automation_logs` (`supabase/functions/crm-automation-monitor/index.ts:49,63`) é **outra tabela**,
escrita por uma EF que só recalcula score (`:44`, RPC `calculate_relationship_metrics_for_contact`) —
não lê `automation_rules`.

**→ Regras criadas em `/automacoes` nunca executam. CONFIRMADO.**

### A correção: existe, sim, um motor de automação — noutro lugar

O sistema tem um mecanismo de regras **funcional, alcançável pela UI e sem barreira de `x-cron-secret`**,
baseado em outra tabela:

- Tabela `lead_score_threshold_automations`, com CRUD em `src/hooks/useScoreAutomations.ts:51,85,89,108,122`
- Assistente de criação de regra na UI: `src/components/lead-scoring/AutomationWizard.tsx:121`
  (`<SelectItem value="enroll_sequence">Inscrever em sequência</SelectItem>`) e `:159`
- Ações suportadas: `notify | create_task | enroll_sequence | webhook | tag`
  (`supabase/functions/lead-score-threshold-runner/index.ts:18`)
- Executor: `supabase/functions/lead-score-threshold-runner/index.ts:193-208` (avaliação) e `:270-280`
  (flush em `lead_score_threshold_log`, `alerts`, `sequence_enrollments`, `contacts.tags`)
- **Autenticação**: `withAuthOrServiceRole` (`:5`) — **não** `requireCronSecret`. Não há 401.
- **Chamador real**: `supabase/functions/lead-scorer/index.ts:157` e `:401`
- **Chamador do chamador, na UI**: `src/hooks/useLeadScoring.ts:146` e `:165`

Ou seja: **o motor de automação existe e é acionável por clique do usuário** — apenas não é o
que está por trás da tela `/automacoes`. O documento publicado registra `lead-score-threshold-runner`
como *"🟦 — sem cron e sem chamador em `src/`"* (`03_MARKETING_AUTOMACAO.md:114`). A ressalva
"em `src/`" salva a frase da falsidade literal, mas o critério é inconsistente com o próprio
documento, que credita `lux-webhook` como *"não é órfã"* por ser referenciada por outra EF
(`03_MARKETING_AUTOMACAO.md:183`). Aplicado o mesmo critério, `lead-score-threshold-runner` **tem
chamador e tem caminho de UI**.

---

## B3 — "Envio de e-mail é encenado em 3 lugares"

**Veredito: CONFIRMADO** — e mais forte do que o publicado.

### O que fiz para derrubar

Li os três trechos com contexto amplo e depois procurei **qualquer** provedor de e-mail em todo o
código: `resend|sendgrid|mailgun|postmark|nodemailer|smtp|brevo|mailersend|ses.amazonaws|sendEmail`
em `src/` e `supabase/functions/`.

### Evidência — não existe caminho alternativo de envio

O grep retorna **zero implementações**. Os únicos hits são:
- `supabase/functions/sequence-processor/index.ts:235,293,364` — a própria função fake `sendEmailStep`
- `src/components/bulk-actions/BulkActionsBar.tsx:45,79,256` — prop de callback de UI
- `src/hooks/useWeeklyReport.ts:199` — envia `sendEmail: true` no body, e `:206` mostra um toast
  *"Verifique se o Resend está configurado"* — **Resend não aparece em nenhum outro ponto do repositório**

Nenhum trigger de banco, webhook ou EF envia e-mail. Nenhuma migration contém `net.http_post` para
provedor de e-mail.

### Sítio 1 — `src/hooks/useEmailCampaigns.ts`
Comentário no próprio código (`:85`): *"Simula o envio (não dispara emails reais…)"*.
Fluxo: marca `status:'sending'` (`:112`) → insere `campaign_recipients` com `status:'sent'` e
`sent_at` (`:124`) → marca a campanha `status:'sent'` (`:136`) → toast
*"Campanha enviada para N destinatários"* (`:147`). Nenhuma chamada de rede a provedor. **CONFIRMADO.**

### Sítio 2 — `supabase/functions/sequence-processor/index.ts`
`sequence_send_log` é inserido com `status: 'sent'` em `:320-333`, **antes** do `invoke` em `:337`.
**Refinamento que o achado original não capturou:** `supabase.functions.invoke` **não lança exceção**
quando a função de destino não existe — devolve `{ data: null, error }`. Logo o `try/catch` de
`:336-347` **nunca dispara**, e o `console.warn('send-transactional-email indisponível, log apenas')`
de `:346` é ele próprio código morto. O erro não é apenas engolido: **nem sequer é observado**.
O achado é mais grave do que o publicado. **CONFIRMADO.**

### Sítio 3 — `supabase/functions/nurturing-runner/index.ts`
`:90-98`: para `step.type === "email" || step.type === "whatsapp"`, o runner só acumula uma linha em
`interactionRows` com `initiated_by: "user"`. Em `:103-113` o step avança
(`status: "active"|"completed"`, `next_action_at`) como se a mensagem tivesse sido entregue.
Nenhuma chamada a provedor. **CONFIRMADO.**

### Quarto sítio, não listado no achado original
`supabase/functions/weekly-digest/index.ts:194` grava `sent_via: ['system']` e `:206` atualiza
`weekly_report_settings.last_sent_at` — sem entrega. `generateEmailHtml` (`:226`) nunca é chamado.
*(Nota: `:206` escreve em `weekly_report_settings`, não em `weekly_reports` como diz
`03_MARKETING_AUTOMACAO.md:73` — imprecisão menor de tabela.)*

---

## B4 — "`send-transactional-email` é invocada mas não existe entre as 109 Edge Functions"

**Veredito: CONFIRMADO.**

### O que fiz para derrubar

1. `ls supabase/functions | wc -l` → **109**; `ls supabase/functions | grep -i transactional` → **vazio**.
2. Grep pela string em **todo** o repositório (incluindo `scripts/`, `.github/`, `docs/`, `monitoring/`,
   migrations e qualquer lista versionada de funções).

### Evidência

A string `send-transactional-email` aparece em exatamente **7 lugares**, e nenhum é uma definição,
um deploy ou um manifesto:

| Local | Natureza |
|---|---|
| `supabase/functions/sequence-processor/index.ts:337` | a chamada |
| `supabase/functions/sequence-processor/index.ts:346` | o `console.warn` (morto, ver B3) |
| `ESTADO_ATUAL.md:146` | o próprio achado |
| `docs/estado/03_MARKETING_AUTOMACAO.md:39,130,233` | o próprio achado |
| `docs/estado/06_INTEGRACOES.md:74,168,257` | o próprio achado |

Não há `supabase/functions/send-transactional-email/`, nenhuma referência em
`.github/workflows/`, nenhum script de deploy, nenhuma migration que a registre.

**Ressalva metodológica mantida:** a função pode ter sido publicada direto no painel Supabase, fora do
versionamento — cenário que o próprio documento já declara como `NAO_VERIFICADO`
(`03_MARKETING_AUTOMACAO.md:233`) e que, se verdadeiro, é em si um defeito de governança.
Para o repositório, o achado está **CONFIRMADO**.

---

## B5 — "`enrollContact` (`useSequences.ts:167-190`) é código morto: nenhum .tsx chama"

**Veredito: CORRIGIDO.** A afirmação sobre o objeto está **confirmada**. A conclusão que o documento
tira dela (`03_MARKETING_AUTOMACAO.md:25` — *"Sem inscrição, os motores… nunca têm o que processar"*)
está **refutada**.

### O que fiz para derrubar

Testei todas as formas pedidas: import nomeado, desestruturação do retorno do hook, re-export,
uso em teste e em e2e — grep de `enrollContact`, `useSequences`, `enroll_contact` e
`sequence_enrollments` em `src/`, `e2e/`, `tests/`, `supabase/`, `scripts/`.

### Parte confirmada — o objeto é morto

- Definição: `src/hooks/useSequences.ts:167`
- Re-export no retorno do hook: `src/hooks/useSequences.ts:199` (`enrollContact: enrollContact.mutateAsync`)
- **Único consumidor do hook em todo o repositório**: `src/pages/Sequencias.tsx:19` —
  `const { sequences, loading, createSequence, toggleStatus, deleteSequence, creating } = useSequences();`
  — **não desestrutura `enrollContact`**.
- Os três componentes que citam `useSequences` importam **apenas tipos**:
  `src/components/sequences/SequenceDetailDrawer.tsx:7`, `SequenceFormDialog.tsx:10`, `SequenceCard.tsx:6`.
- Zero ocorrências em `e2e/` e `tests/`.

**`enrollContact` é código morto. CONFIRMADO.**

### Parte refutada — existe outro caminho de inscrição, e ele é alcançável pela UI

`grep` por escritas em `sequence_enrollments` revela um segundo inserter:

```
supabase/functions/lead-score-threshold-runner/index.ts:274
  pendingEnrollments.length > 0 ? supabase.from('sequence_enrollments').insert(pendingEnrollments) : …
```

A cadeia completa, toda verificável:

1. Usuário cria uma regra "Inscrever em sequência" no assistente —
   `src/components/lead-scoring/AutomationWizard.tsx:121,159`; persistida em
   `lead_score_threshold_automations` (`src/hooks/useScoreAutomations.ts:89`)
2. Usuário dispara o recálculo de score pela UI — `src/hooks/useLeadScoring.ts:146`
   (`invoke('lead-scorer', { body: { contact_id } })`) ou `:165` (modo batch)
3. `lead-scorer` invoca o runner — `supabase/functions/lead-scorer/index.ts:157` e `:401`
4. O runner avalia a ação `enroll_sequence` (`lead-score-threshold-runner/index.ts:193-208`),
   deduplica contra inscrições ativas (`:124-126`) e insere em `sequence_enrollments` (`:274`)
5. **Sem barreira de autenticação**: o runner usa `withAuthOrServiceRole` (`:5`), não `requireCronSecret`

**Logo: o motor de sequências pode, sim, receber inscrições sem nenhuma intervenção manual no banco.**
O que continua verdadeiro é que (a) a tela `/sequencias` não oferece botão de inscrição, e (b) mesmo
com enrollments, o processador não roda sem cron e o step de e-mail não envia nada (B3/B6).
Mas o "achado que domina o módulo" nº 3 (`:25`), como redigido, é falso e precisa ser reescrito.

---

## B6 — "`sequence-processor` tem chamador que não envia `x-cron-secret`, então retorna 401"

**Veredito: CONFIRMADO**, com uma precisão sobre o código de status.

### O que fiz para derrubar

Procurei injeção de header em **toda** a cadeia: cliente Supabase, `resilientFetch`, wrapper de
invoke, e grep de `x-cron-secret` / `CRON_SECRET` em `src/`, `supabase/migrations/`, `e2e/`,
`tests/`, `scripts/`, `.github/`.

### Evidência — nenhuma camada injeta o header

1. **Cliente Supabase** (`src/integrations/supabase/client.ts:12-23`): o bloco `global` contém
   **apenas** `fetch: resilientFetch`. Não há `global.headers`.
2. **`resilientFetch`** (`src/lib/resilientFetch.ts:36-39`): repassa `init` intacto —
   `fetch(input, { ...init, signal: … })`. **Não adiciona, remove ou reescreve header algum.**
   O arquivo inteiro (79 linhas) não contém a palavra `headers` fora da leitura de `Retry-After` (`:47`).
3. **Wrapper `invokeWithTrace`** (`src/lib/supabaseInvoke.ts:31-34`): injeta **apenas** `X-Trace-Id`
   (`TRACE_HEADER_NAME`). E `useSequenceProcessor` **nem usa esse wrapper** —
   `src/hooks/useSequenceProcessor.ts:9` chama `supabase.functions.invoke('sequence-processor', { body: {} })` direto.
4. **Grep de `x-cron-secret` em `src/`**: **zero ocorrências.** As únicas menções a `CRON_SECRET` no
   repositório fora das EFs são `src/hooks/useSecretRotation.ts:22` (item de checklist de rotação de
   segredos, texto) e `scripts/migration/functions/secrets.template.env:18` (linha vazia de template).
5. **Guarda na EF**: `supabase/functions/sequence-processor/index.ts:54-55` chama
   `requireCronSecret(req)` antes de qualquer trabalho.

### Precisão sobre o status devolvido

`supabase/functions/_shared/auth.ts:270-281`:
- se `CRON_SECRET` **não** estiver provisionado → **500 "Server misconfigured"** (`:272-275`)
- se estiver provisionado e o header vier vazio → **401 "Unauthorized"** (`:277-280`)

Portanto "retorna 401" vale **quando o segredo está configurado**; sem ele, o botão falha com 500.
Em ambos os casos o processador nunca executa. O documento já registra essa nuance em
`03_MARKETING_AUTOMACAO.md:195`, mas a linha `:38` da tabela afirma "→ 401" sem a ressalva.

**Nenhum caminho de injeção de header foi encontrado. CONFIRMADO.**

---

## B7 — "Métricas hardcoded em `MarketingHub.tsx:254,258,262` (CPL/CAC/LTV)"

**Veredito: CONFIRMADO.** Linhas exatas.

### Evidência (`src/pages/MarketingHub.tsx:244-265`)

| Linha | Conteúdo |
|---|---|
| `:252` | `<p …>Custo por Lead (CPL)</p>` |
| **`:254`** | `<p className="text-2xl font-bold">R$ 14,30</p>` |
| `:256` | `<p …>CAC Estimado</p>` |
| **`:258`** | `<p className="text-2xl font-bold">R$ 452,00</p>` |
| `:260` | `<p …>LTV Sugerido</p>` |
| **`:262`** | `<p className="text-2xl font-bold">R$ 8.900,00</p>` |

São literais de string no JSX, dentro do card `Investimento & ROI` (`:246`). Nenhum hook, nenhuma
query, nenhuma prop, nenhuma constante importada alimenta esses três valores. Os hooks declarados no
componente (`:33-50`) não produzem nenhum deles.

**Correção menor:** o achado B1 da seção "Métricas hardcoded" (`03_MARKETING_AUTOMACAO.md:139`)
afirma *"sem nota de que são estimativas"*. Dois dos três rótulos **dizem** ser estimativa —
"CAC **Estimado**" (`:256`) e "LTV **Sugerido**" (`:260`). Só o CPL (`:252`) é apresentado sem
qualquer qualificador. A crítica continua válida (rótulo de "estimado" não justifica um número
inventado sem base), mas a redação deve ser corrigida.

Confirmei também o achado irmão `B2` da mesma seção: `src/pages/MarketingHub.tsx:302` —
`<div className="h-full bg-primary" style={{ width: '65%' }} />`, dentro do `map` de `workflows`
(`:295`), enquanto o contador ao lado (`:299`) é calculado de verdade a partir de `executions`.

---

## Correções que devem entrar no `ESTADO_ATUAL.md`

1. **`ESTADO_ATUAL.md:42` — recontar a linha de Marketing.** Os números publicados
   (`38 | 6 | 15 | 11 | 6`) não correspondem à tabela de `03_MARKETING_AUTOMACAO.md:33-83`.
   Valores corretos pela contagem direta: **`51 | 7 | 27 | 5 | 12`**, ou seja **13,7% de ✅**.
   Isso muda também os totais globais da tabela de `ESTADO_ATUAL.md:30-33` e o denominador de 342.
   A leitura *"A dimensão mais frágil"* permanece correta — Marketing continua com a menor proporção
   de ✅ (13,7% contra 17,6% de Infra/CI).

2. **Corrigir o número de itens mortos.** O documento publica 6 ⬛; a tabela lista **12**. Qualquer
   frase de `ESTADO_ATUAL.md` que dimensione "código morto em Marketing" pelo número 6 está pela
   metade.

3. **Retirar/reescrever o achado "não existe caminho de UI para inscrever contatos"**
   (`03_MARKETING_AUTOMACAO.md:25`, replicado como leitura de dimensão). Existe caminho automatizado
   e alcançável: `AutomationWizard` (`enroll_sequence`) → `useLeadScoring.ts:146` → `lead-scorer:157/401`
   → `lead-score-threshold-runner:274` → `sequence_enrollments`. Redação correta: *"a tela
   `/sequencias` não oferece inscrição manual; a única via de inscrição é a automação de threshold de
   score, e `enrollContact` é código morto"*.

4. **Registrar que existe um motor de automação funcional no sistema** — `lead_score_threshold_automations`
   + `lead-score-threshold-runner` (sem `requireCronSecret`, com chamador de UI). O que não tem motor
   é especificamente a tabela `automation_rules` da tela `/automacoes`. A frase "não existe motor de
   automação" precisa desse recorte.

5. **`03_MARKETING_AUTOMACAO.md:61` deve subir de 🟨 para ✅** — `get_marketing_funnel_stats` existe
   (`20260512175533_…sql:64`, redefinida em `20260723120839_…sql:90`, `GRANT` em `20260522142957_…sql:15`)
   com assinatura idêntica à chamada de `useMarketingInsights.ts:39-43`. O `NAO_VERIFICADO` era falta de
   busca, não falta de código.

6. **`03_MARKETING_AUTOMACAO.md:82` — remover a frase falsa sobre `bitrix24-webhook`.** Existe UI de
   integração Bitrix24 (`webhookTemplates.ts:21-31`, `WebhookSnippetsSheet.tsx:80-84,101`,
   `ConnectionFormDialog.tsx:31-32`), apenas roteada por `incoming-webhook`. E a linha deveria ser ⬛
   (EF completa, redundante, zero chamadores), pelo mesmo critério de `sequence-track`.

7. **Reforçar o achado A2** (`03_MARKETING_AUTOMACAO.md:130` e `ESTADO_ATUAL.md:146`): o `catch` em
   `sequence-processor/index.ts:345-347` **nunca executa**, porque `supabase.functions.invoke` retorna
   `{ data, error }` em vez de lançar. O erro não é "engolido pelo catch" — é **inteiramente
   invisível**, e o `console.warn` de `:346` é código morto adicional.

8. **Corrigir `03_MARKETING_AUTOMACAO.md:139`**: dois dos três valores hardcoded **têm** rótulo de
   estimativa ("CAC Estimado" `:256`, "LTV Sugerido" `:260`). Só o CPL não tem.

9. **Corrigir `03_MARKETING_AUTOMACAO.md:73`**: `weekly-digest/index.ts:206` atualiza
   `weekly_report_settings.last_sent_at`, não `weekly_reports`.

10. **Corrigir a redação de `:38`**: sem `CRON_SECRET` provisionado o retorno é **500**, não 401
    (`_shared/auth.ts:272-275`). A ressalva já consta em `:195` e deve ser espelhada na tabela.

---

## O que NÃO verifiquei

- **Runtime.** Nada foi executado: sem `node_modules`, sem build, sem `tsc`, sem teste. Não afirmo que
  o projeto compila, nem que os crons existem em `cron.job`, nem que os secrets estão provisionados.
- **As 29 linhas restantes** da tabela de evidências (reavaliei 22 das 51). A contagem agregada da
  seção B1 vale para todas as 51; o juízo de mérito, só para as 22 listadas.
- **Existência das EFs no projeto Supabase remoto.** Toda a análise de "não existe" refere-se ao
  repositório versionado.
- **Se `email_logs`** — lido por `email-pipeline-health` via `external-data` — é populado. Segundo
  `src/pages/AdminKnowledgeExport.tsx:74`, vive num **banco externo**, fora deste repositório; a RPC
  `get_email_pipeline_stats` que a EF tenta chamar (`email-pipeline-health/index.ts:64`) não tem
  definição em nenhuma migration, e a função depende do fallback de `:74-80`. O ✅ dessa linha
  (`03_MARKETING_AUTOMACAO.md:79`) é defensável como sonda read-only, mas merece ressalva de
  dependência externa.
