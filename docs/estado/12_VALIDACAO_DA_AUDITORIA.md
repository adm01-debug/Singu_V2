# Validação da auditoria — o que quebrou quando testei meu próprio trabalho

> **Data:** 2026-08-16 · Segunda passada sobre a auditoria publicada em `ESTADO_ATUAL.md`
> **Postura:** adversarial. O objetivo desta rodada foi **derrubar** os próprios achados, não confirmá-los.
> **Método:** remedição direta pelo autor + 3 agentes de refutação com instrução explícita de assumir cada achado como errado até prova em contrário.

---

## Veredito da validação

**A auditoria erra em dois lugares que importam, e acerta na maior parte do diagnóstico.**

1. **Os números agregados estavam errados.** O total de 342 funcionalidades foi construído somando os *resumos auto-relatados* dos agentes. Três desses resumos não batem com as próprias tabelas dos documentos. O número correto é **385**.
2. **A classificação ⬛ MORTO_OU_ABANDONADO é a menos confiável de todas.** Dos 27 alvos testados adversarialmente, **5 foram refutados** — inclusive um achado **invertido** que, se aplicado, removeria o único caminho funcional de um módulo.
3. **Uma camada inteira ficou fora de escopo** e ninguém declarou: PWA / service worker.

O erro de raiz é sempre o mesmo, e é o que o próprio método alertava: **aceitei relato de agente como evidência na camada de agregação**, exatamente o que exigi que os agentes não fizessem com a documentação.

---

## 1. Os números de capa estavam errados

Contagem feita agora lendo **linha a linha as tabelas canônicas de evidência**, não os resumos:

| Documento | Tabela canônica | Linhas | ✅ | 🟨 | 🟦 | ⬛ | Resumo publicado batia? |
|---|---|---|---|---|---|---|---|
| 01 Core CRM | Tabela de evidências | 65 | 47 | 11 | 3 | 4 | ✔ sim |
| 02 Inteligência/IA | Tabela de evidências | **63** | 39 | 14 | 4 | 5 | ✘ dizia 46 → 21/14/5/6 |
| 03 Marketing | Tabela de evidências | **51** | 7 | 27 | 5 | 12 | ✘ dizia 38 → 6/15/11/6 |
| 04 RevOps | Tabela de evidências | 59 | 34 | 11 | 8 | 6 | ✔ sim |
| 05 Admin/Segurança | Tabela de evidências | 68 | 29 | 27 | 6 | 6 | ✔ sim |
| 06 Integrações | Tabela mestra + seção "planejadas" | 24 + 8 | 12 | 10 | 8 | 2 | ✔ sim |
| 08 Infra/CI/Testes | Tabela consolidada | **47** | 13 | 7 | 6 | 21 | ✘ dizia 34 → 6/11/10/7 |

*(Uma linha em 02 carrega duas classificações e ficou fora da distribuição; 5 linhas em 08 não têm classificação e foram excluídas das 52 brutas.)*

### Correção

| | Publicado | **Correto** | Δ |
|---|---|---|---|
| Total classificado | 342 | **385** | +43 |
| ✅ IMPLEMENTADO_TOTAL | 155 (45,3%) | **181 (47,1%)** | +26 |
| 🟨 IMPLEMENTADO_PARCIAL | 99 (28,9%) | **107 (27,9%)** | +8 |
| 🟦 SUGERIDO_OU_INICIADO | 51 (14,9%) | **40 (10,4%)** | −11 |
| ⬛ MORTO_OU_ABANDONADO | 37 (10,8%) | **56 (14,6%)** | +19 |

O quadro **piora**: código morto é 35% maior que o publicado, não menor. E a leitura "Marketing é a dimensão mais frágil" se mantém — mas por **13,7% de ✅ (7 de 51)**, não 16%.

---

## 2. A classificação de código morto é a menos confiável

Placar da refutação adversarial sobre 27 alvos: **5 REFUTADOS · 6 INCONCLUSIVOS · 16 CONFIRMADOS**.

### 2.1 Achado invertido — o mais grave desta validação

**`attribution-calculator` foi classificada ⬛ MORTA. Está errado, e ao contrário.**

Linha do tempo das permissões de `compute_attribution`:

| Migration | Ação |
|---|---|
| `20260522142957_...sql:4` | `GRANT EXECUTE ... TO authenticated` |
| `20260723151654_...sql:14` | **`REVOKE EXECUTE ... FROM anon, authenticated, PUBLIC`** |
| `20260723151654_...sql:26` | `GRANT EXECUTE ... TO service_role` |

Não há re-grant posterior. Portanto:

- `src/hooks/useAttribution.ts:61` chama `supabase.rpc('compute_attribution')` sob a role `authenticated` — **caminho revogado**
- `supabase/functions/attribution-calculator/index.ts:40,43` usa `SUPABASE_SERVICE_ROLE_KEY` — **único caminho que funciona**

A auditoria apontou a Edge Function como morta e o hook como vivo. É o inverso. **Seguir a recomendação original removeria o único caminho funcional de atribuição.**

### 2.2 Outras quatro refutações

| Alvo | Classificação original | Por que está errada |
|---|---|---|
| `crm-automation-monitor` | ⬛ sem chamador | É o **único escritor** de `crm_automation_logs` (`index.ts:49,63`), lido por `CRMAutomationAuditLog.tsx:52`, montado em `src/pages/Index.tsx:192` (**home**) e `src/pages/Automacoes.tsx:80` |
| `auto-regen-behavioral-profiles` | ⬛ zero referências | Único produtor de `system_alerts.alert_type='behavioral_regen_error_rate'` (`index.ts:227`), consumido por 3 componentes em `src/pages/admin/BehavioralRegenAudit.tsx:436,457,458` |
| `process-behavioral-regen-queue` | ⬛ cron nunca criado | Tem UI viva de monitoramento: `BehavioralRegenCronHealth.tsx:48` → RPC que filtra `cron.job` por esse job (`20260713104851_...sql:26-30`) |
| tabela `insights` | descrita como sem produtor | Tem **5 leitores vivos** + realtime (`20260111220436_...sql:7`). O achado correto é "**sem escritor**", não "órfã" — e esse continua de pé |

### 2.3 Seis inconclusivos — não apagar sem checar runtime

`client-notifications`, `health-aggregate`, `check-notifications`, `auto-rebatch-behavioral`, `dual-write-proxy`, `evolution-api`.

Casos como `client-notifications` têm **3 índices criados especificamente para as queries dela** (`20260720000024_...sql:9,19,26`) — sinal forte de uso pretendido que a análise estática não fecha. `evolution-api` tem contrato público documentado em `docs/EDGE_FUNCTIONS_API.md:324`.

> **Consequência prática:** o item **E** da lista "toca produção" do `ESTADO_ATUAL.md` — *"Remover `evolution-api` e `dual-write-proxy`"* — **não deve ser executado** com base nesta auditoria. Rebaixado a "investigar com acesso a runtime".

---

## 3. Lacuna de escopo: a camada PWA nunca foi auditada

Varredura por tema nos 8 documentos: `service worker`, `offline`, `error boundary` e `i18n` aparecem em **zero** deles. `src/contexts/` idem. Fui olhar, e há três contradições ativas:

| # | Contradição | Evidência |
|---|---|---|
| 1 | `main.tsx` declara a invariante *"pushNotifications.ts must use `navigator.serviceWorker.ready` instead of re-registering `/sw-push.js`"* — e `pushNotifications.ts` faz exatamente o proibido | `src/main.tsx:22-24` × `src/lib/pushNotifications.ts:30` (chamado por `subscribeToPush()` em `:42`) |
| 2 | `main.tsx` afirma `registerType is "prompt"`; a config diz `autoUpdate`. Todo o argumento de segurança do comentário repousa nessa premissa | `src/main.tsx:19` × `vite.config.ts:26` |
| 3 | `main.tsx` descreve injeção via `injectManifest` em `src/sw.ts` — **o arquivo não existe** e a config não usa `injectManifest` | `src/main.tsx:25-26`; `src/sw.ts` ausente |

O efeito da nº 1: `migrateLegacyPushSW()` existe para remover o registro legado de `/sw-push.js`, e o fluxo de push o recria a cada inscrição. **A migração nunca converge.**

**Achado colateral, favorável ao sistema:** `AUDITORIA_COMPLETA_SISTEMA.md` afirma que o bootstrap do PWA "destrói seus próprios service workers a cada carregamento". **Falso hoje** — `src/main.tsx:45-75` só toca registros cujo `scriptURL` contém `sw-push.js`, captura o endpoint de push antes de desinscrever e o persiste em `sessionStorage`. Esse trecho é bem construído.

**Achado adicional:** `supabase/config.toml` tem **uma única linha** (`project_id`). Não existe nenhuma declaração `[functions.*] verify_jwt` para as 109 Edge Functions — a política de JWT de todas elas vive fora do repositório e é `NAO_VERIFICADO`.

---

## 4. Números que eu publiquei sem ter medido

Todos remedidos agora. A direção dos achados se manteve; a precisão, não.

| Onde | Publiquei | Correto | Causa do erro |
|---|---|---|---|
| R1 · migrations ∩ `types.ts` em uso | 120 | **119** | Minha varredura ia do primeiro `Tables: {` até o fim do arquivo, incluindo as seções `Views` e `Functions` |
| R1 · migrations ∩ `.bak` | 262 | **261** | idem |
| R1 · alvos de `.from()` ausentes do `types.ts` | 134 de 248 | **135 de 248** | idem |
| R1 · desses, presentes nas migrations | 127 | **124** | idem |
| R1 · tabelas exclusivas nunca consultadas | 144 de 145 | **145 de 146** | idem |
| R1 · views nunca consultadas | 0 de 111 | **0 de 110** | idem |
| R11 · testes de Edge Function | 6 arquivos | **14 arquivos / 84 casos** | Amostra, não contagem |
| R11 · arquivos sem runner | 11 arquivos / 55 casos | **18 arquivos / 95 casos** | idem |
| Cobertura de rotas | 106 de 113 | **104 de 111** | `grep -qF` com a rota `/` na lista, que casa com qualquer linha |

### O fato mais forte de R1, que eu tinha perdido

O `types.ts` em uso declara **zero RPCs** — só `_postgrest_anon_placeholder` (`src/integrations/supabase/types.ts:16609`). O `.bak` declara **83**. O código faz **54 chamadas `.rpc()` distintas**. Nenhuma tem tipo no contrato atual.

### Erro de precisão em R9

`src/pages/admin/Observability.tsx:59,70,81` tem `99.9%` / `142ms` / `0.02%` fixos — mas o componente é referenciado **apenas** em `lazyPages.tsx:3`, sem rota que o monte. Não engana ninguém hoje: pertence a ⬛, não à lista de painéis enganosos.

Os demais itens de R9 tiveram a alcançabilidade verificada um a um e **todos são atingíveis por rotas vivas**: `useEmotionalIntelligence`, `useCognitiveBiases` e `useDealVelocity` são importados por painéis de `/analytics` e do detalhe de contato; `NLPMasteryScore`, `MetaProgramsProfiler` e `CommunicationCoherencePanel` por `src/pages/NLPAnalytics.tsx`; `CarnegieDashboard` por `src/pages/Insights.tsx`.

---

## 5. O que a validação CONFIRMOU

Nem tudo caiu. Estes sobreviveram a tentativa deliberada de derrubá-los:

| Achado | Como foi confirmado |
|---|---|
| **R1 — `types.ts` de outro banco** | Remedido do zero: 119 × 261. O vocabulário `carriers`, `cidades`, `carrier_homologations` existe **só** no arquivo em uso, com 0 ocorrências no `.bak` |
| **R2 — automação agendada não roda** | `client.ts:12-23` não injeta header global; `resilientFetch:36-39` repassa `init` intacto; `supabaseInvoke.ts:31-34` só injeta `X-Trace-Id`; **zero** ocorrências de `x-cron-secret` em `src/`. *Precisão:* sem `CRON_SECRET` configurado o retorno é **500**, não 401 (`_shared/auth.ts:272-275`) |
| **R3 — CI inoperante** | 30/30 runs `failure` em `main`; 5/5 na branch do PR; run mais recente com **0 jobs criados** |
| **R6 — split-brain do Pipeline** | `usePipeline.ts:79` lê do externo, `:189` grava no local via RPC que faz `RAISE EXCEPTION 'Deal não encontrado'` |
| **R7 — e-mail encenado** | Zero provedores de e-mail no repositório (nenhum `resend`/`sendgrid`/`smtp`). *Agravante:* `functions.invoke` não lança, então o `catch` de `sequence-processor:345-347` **nunca executa** — o erro é invisível, não "engolido". Quarto sítio encontrado: `weekly-digest:194` |
| **R8 — lockout de admin** | Fio completo reproduzido, incluindo `MFAGuard.tsx:13-15` retornando `null` na própria página de remediação |
| **`send-transactional-email` inexistente** | 109 diretórios, nenhum match |
| **`dual-write-proxy` sem autenticação** | 49 linhas, sem `withAuth`, sem checagem de `Authorization` |
| **`incoming-webhook` com HMAC condicional** | `index.ts:114` — `if (webhook.require_signature)`. *Justiça:* quando ligado, a comparação é timing-safe (`:39-42`) |
| **Cobertura de Edge Functions** | 108/108 sobreviveu a teste com âncora forte (crase, aspas ou célula de tabela) |
| **Aritmética das 7 sub-somas** | Todas fecham; os percentuais publicados estavam certos **para os números errados** |

---

## 6. Correções que devem entrar no `ESTADO_ATUAL.md`

1. Substituir a tabela de contagem de §2 pelos números de §1 desta validação (385 / 181 / 107 / 40 / 56)
2. Corrigir os 9 números de §4
3. Mover `Observability.tsx` de R9 para a lista de código morto
4. Acrescentar R13 (camada PWA) e o achado do `config.toml` sem `verify_jwt`
5. **Rebaixar o item E** da lista "toca produção": não remover `evolution-api` nem `dual-write-proxy` com base nesta auditoria
6. Marcar a classificação ⬛ como **limite superior**, com 5 falsos positivos nomeados
7. Declarar a lacuna de PWA/service worker/contexts em §6

---

## 7. O que esta validação ainda NÃO fecha

- **Os 6 inconclusivos** exigem `SELECT * FROM cron.job` e logs do gateway — impossível sem runtime
- **Não reauditei linha a linha** as 385 classificações; verifiquei as tabelas de agregação, os achados graves e uma amostra
- **`docs/estado/07_DADOS_BACKEND.md`** (camada de dados) tem números próprios ainda sob refutação em `10_VERIFICACAO_ADVERSARIAL_DADOS.md`
- **Continua tudo estático.** Nada foi compilado, testado ou consultado em banco
