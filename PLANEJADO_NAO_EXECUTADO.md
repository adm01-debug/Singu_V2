# PLANEJADO × EXECUTADO — SINGU CRM v2

> **O que é:** levantamento exaustivo de tudo o que foi **planejado, prometido ou documentado** para o SINGU e que **não foi executado** (nem iniciado), **foi executado pela metade**, ou **existe no código mas não funciona de ponta a ponta**.
> **Base auditada:** `main` @ `e616c20` (2026-10-11) · 447 migrations · 108 Edge Functions · 113 rotas · ~1.720 arquivos em `src/` · 95 documentos em `docs/` + 14 na raiz + 98 memórias do Lovable.
> **Data do levantamento:** 2026-10-11/12. **Reconferência dos itens críticos** em `main` @ `36dfc19` (2026-10-12), 11 commits depois da base — ver [§0](#0-atualização-de-12102026-o-que-mudou-durante-a-auditoria).
> **Natureza:** auditoria **estática** do repositório, com checagens pontuais **somente leitura** em runtime (API do GitHub, `OPTIONS` nas Edge Functions, `GET /auth/v1/settings`, API da Vercel). **Não houve acesso SQL ao banco de produção.** Tudo que depende do estado real do banco, de secrets ou de painéis externos está marcado como **NÃO VERIFICADO**.
> **Anexos com a evidência completa (arquivo:linha de cada item):** [`docs/lacunas/`](docs/lacunas/README.md) — 10 relatórios, ~1.050 itens verificados um a um.

---

## Sumário

0. [Atualização de 12/10/2026 (o que mudou durante a auditoria)](#0-atualização-de-12102026-o-que-mudou-durante-a-auditoria)
1. [Veredito em uma tela](#1-veredito-em-uma-tela)
2. [Como ler (legenda)](#2-como-ler-legenda)
3. [Números consolidados](#3-números-consolidados)
4. [🚨 Alertas que não podem esperar](#4--alertas-que-não-podem-esperar)
5. [As 14 causas-raiz](#5-as-14-causas-raiz)
6. [Catálogo por módulo de negócio](#6-catálogo-por-módulo-de-negócio)
7. [Funcionalidades prontas, mas escondidas](#7-funcionalidades-prontas-mas-escondidas)
8. [Documentos que afirmam o que não existe](#8-documentos-que-afirmam-o-que-não-existe)
9. [O que foi resolvido desde a auditoria de 16/08](#9-o-que-foi-resolvido-desde-a-auditoria-de-1608)
10. [Fora de escopo deliberado](#10-fora-de-escopo-deliberado)
11. [Trabalho em andamento e abandonado](#11-trabalho-em-andamento-e-abandonado)
12. [Plano de ataque recomendado](#12-plano-de-ataque-recomendado)
13. [O que não foi possível verificar](#13-o-que-não-foi-possível-verificar)
14. [Anexos e método](#14-anexos-e-método)

---

## 0. Atualização de 12/10/2026 (o que mudou durante a auditoria)

Enquanto a varredura rodava sobre `e616c20`, `main` recebeu 11 commits (até `36dfc19`). Os itens críticos deste documento foram **reconferidos no novo HEAD**. Os anexos (`docs/lacunas/`) continuam sendo a fotografia de `e616c20`; quando houver divergência, **vale esta seção**.

| Item | Antes (`e616c20`) | Agora (`36dfc19`) | Evidência |
|---|---|---|---|
| **A1** Token administrativo do Supabase nos scripts | Em 11 arquivos | ✅ **Removido dos arquivos** (agora lido de `SUPABASE_ACCESS_TOKEN`). ⚠️ **Continua no histórico do Git** — a revogação no painel do Supabase **NÃO É VERIFICÁVEL** daqui e segue obrigatória | `56c9ec2` |
| **A5** CORS bloqueando o front da Vercel | Só `*.lovable.app` | ✅ **Resolvido** — `https://singu-v2.vercel.app` incluído | `supabase/functions/_shared/auth.ts` (`10361d0`) |
| **CR7** `types.ts` de outro banco + typecheck vazio | 16.615 linhas, 0 funções tipadas; `tsc` sobre 0 arquivos | ✅ **Resolvido em grande parte** — `types.ts` regerado do canônico (69.312 linhas, 1.234 funções tipadas); CI roda `npm run typecheck` (`-p tsconfig.app.json` e `tsconfig.node.json`). Resta: `strict: false` e `strictNullChecks: false` (`tsconfig.app.json:17,19`) | `81926b3` (#99) |
| **R6** Mapa de empresas em banco divergente | Lia/gravava `companies` local | 🟨 **Melhorou** — geocodificação grava em `company_addresses` do modelo canônico | `src/pages/MapaEmpresas.tsx:139-140` (`49d30bb`) |
| Restore de DR | Só documentado | 🟨 **Teste de restauração lógica existe** (`.github/workflows/restore-drill.yml`), mas roda **só em PR que toca os scripts ou manualmente** — não há restore periódico | `2854848` (#97) |
| Contratos de NPS/CSAT/CES e RFM | Quebrados | ✅ Restaurados (envio pelo canal continua 🟨) | `828813e` (#95) |
| **CR4** `.catch()` em consulta do Supabase | 42 ocorrências / 30 funções | ❌ **Continua** — só 1 removida (`next-best-action`). **PR [adm01-debug/Singu_V2#103](https://github.com/adm01-debug/Singu_V2/pull/103) aberto** trata o padrão | `git diff e616c20 36dfc19 -- supabase/functions` |
| **A7** "Supabase Preview" falhando | 8 commits seguidos | ❌ **Continua falhando nos 13 últimos commits de `main`**, inclusive depois de `49d30bb` ("reconstrução do Supabase Preview") | API GitHub, check-runs de `36dfc19` |
| **A6** `main` sem proteção | Sem regra | ❌ **Continua** — `branchProtectionRule: null`, 0 rulesets | API GitHub |
| **CR8** "Registrar interação" da Ficha 360 | `p_contact_id` × `p_company_id` | ❌ **Continua — e agora confirmado pelo schema canônico**: `types.ts:61950-61957` tipa `create_quick_interaction(p_company_id, …)` e `ProximaAcaoCTA.tsx:106` envia `p_contact_id` | reconferido |
| **CR1** guarda de cron / **CR2** agendamentos | — | ❌ Sem mudança (`grep x-cron-secret src supabase/migrations` = 0) | reconferido |
| **CR12** dado fictício | — | ❌ Sem mudança (`useDealVelocity.ts:67`, `useEmotionalIntelligence.ts:53,73`, `useHiddenObjections.ts:30`, `suggest-next-action:192`, `MarketingHub.tsx:254-262`) | reconferido |
| Erros de produção (`VITE_SUPABASE_ANON_KEY`) | — | ❌ Sem mudança (`src/lib/errorReporting.ts:114,200`) | reconferido |
| **A9** lockout de MFA | — | ❌ Sem mudança | reconferido |
| Novo PR em voo | — | [adm01-debug/Singu_V2#106](https://github.com/adm01-debug/Singu_V2/pull/106) "isola atividades pelo vendedor autenticado" (toca §6.1/§6.4) | API GitHub |

---

## 1. Veredito em uma tela

O SINGU tem **muita tela pronta e pouca engrenagem ligada**. O núcleo de cadastro (contatos, empresas, interações, tarefas, Pipeline) funciona; o RBAC é real; o CI voltou a ser portão de qualidade em outubro. Mas quase tudo que o sistema promete fazer **sozinho** ou **para fora** não acontece:

| O sistema promete… | O que acontece de fato |
|---|---|
| Cadências, nutrição, campanhas e resumos por **e-mail** | **Nenhum e-mail sai.** Não existe provedor de e-mail no repositório. Campanhas e sequências gravam "enviado" mesmo assim. |
| **Automação agendada** (lembretes, forecast, RevOps, lead score, saúde do cliente, MQL, digest) | **21 de 23 rotinas automáticas não têm agendamento.** As 2 agendadas apontam para projetos Supabase errados e são recusadas (401). |
| **Botões** "processar agora", "atualizar snapshot", "enviar SMS", "gerar perfil" | **14 botões recebem 401 sempre**: as funções exigem um segredo de cron que a tela nunca envia. |
| **Inteligência comportamental por IA** (perfil DISC/VAK, EQ, objeções, meta-programas) | **Geração de perfil bloqueada em todos os caminhos.** Vários painéis mostram números **sorteados** (`Math.random`) ou **fixos de demonstração**. |
| **WhatsApp** integrado ao CRM | O CRM **não envia** WhatsApp (função órfã). A mensagem recebida é gravada, mas a análise (transcrição, DISC, interação) **aborta com erro 500**. |
| **Assistente IA, DISC, busca semântica, assinatura eletrônica, objeções, next-best-action** | **Respondem erro 500** no caminho principal por um mesmo defeito de código repetido em 30 funções (`.catch()` em consulta do Supabase). |
| **Painéis de decisão** (Analytics, Marketing Hub, BI) | Parte relevante é **dado fictício**: ranking com vendedores inventados, CPL/CAC/LTV fixos, velocidade de deal aleatória. |
| **Banco reproduzível e versionado** | Produção **muda fora do Git** (o check "Supabase Preview" falha em todo commit). 146 tabelas e 109 views usadas não têm DDL no repositório. *(Os tipos foram regerados do banco real em 12/10 — §0.)* |
| **Observabilidade 10/10** (SLO 99,5%, Prometheus, alertas) | **Só configuração.** Nada roda, nenhum alerta chega a ninguém, o SLO mede só quem abre `/status`. |
| **Segurança** | Um **token administrativo do Supabase ficou gravado no repositório** de 04/08 a 12/10 (saiu dos arquivos, segue no histórico — revogação obrigatória). Admin que ativar 2FA **perde o acesso**. Controles de IP/país/dispositivo **não são aplicados**. `main` não tem proteção. |

**Dos 260 itens que a auditoria de 16/08/2026 deixou abertos, só 20 foram resolvidos em 97 commits.** Esta varredura encontrou ainda lacunas que **nenhum documento registrava** — entre elas o `.catch()` que derruba 30 funções, o token administrativo versionado, o CORS que bloqueia o front da Vercel, as chamadas com parâmetros errados e as 26 tabelas lidas sem nenhum produtor (detalhe em §3–§6).

**Leitura para decisão:** o problema **não é falta de tela** — é que **6 consertos de fundação** (§12, Onda 1) destravam sozinhos mais de 60 funcionalidades que já estão escritas. Construir tela nova antes disso aumenta a vitrine sem aumentar o sistema.

---

## 2. Como ler (legenda)

| Símbolo | Significado | Em linguagem de negócio |
|---|---|---|
| ❌ | **NÃO INICIADO** | Foi prometido/planejado e não há código. |
| 🟨 | **PARCIAL** | Existe pedaço; falta parte essencial para funcionar. |
| 🎭 | **VITRINE** | A tela existe e parece funcionar, mas o dado é fictício, simulado ou nunca é gravado. |
| 🔌 | **DESCONECTADO** | Backend pronto, mas sem tela, sem botão ou sem gatilho/agendamento. |
| ⏰ | **SEM AGENDAMENTO** | Rotina escrita para rodar sozinha que nunca é disparada. |
| 💥 | **QUEBRADO** | Tem gatilho, mas falha no caminho principal (erro 500/401, coluna/tabela inexistente, parâmetro errado). |
| ⬛ | **MORTO** | Código que nada usa (custo de manutenção sem valor). |
| 📜 | **SCRIPT ÓRFÃO** | Script/guard escrito que nenhum CI, cron ou pessoa executa. |
| 📄 | **DOC FALSO** | Documento afirma algo que o código não tem. |
| ⚠️ | **REGREDIU** | Funcionava e deixou de funcionar. |
| ✅ | **RESOLVIDO** | Estava pendente e foi entregue (citado só quando relevante). |

**Esforço:** **P** = até 1 dia · **M** = alguns dias · **G** = uma semana ou mais.
**IDs entre colchetes** (ex.: `[B1:M17]`, `[F:F31]`) apontam para a linha do anexo com a evidência `arquivo:linha` completa — ver §14.

---

## 3. Números consolidados

### 3.1 Por fatia auditada

> As fatias se sobrepõem de propósito (a mesma causa aparece no doc, na tela, na função e no banco). Os totais **não devem ser somados**; a visão deduplicada está nas §5 e §6.

| Fatia | Escopo | Itens verificados | Lacunas | Distribuição das lacunas |
|---|---|---|---|---|
| **A** | Docs da raiz + `.lovable/plan.md` + 98 memórias Lovable | 353 | **97** | 🔌30 · 📄22 · ❌14 · 🟨13 · 🎭11 · ⬛6 · 🚫1 |
| **B1** | Reverificação da auditoria 08/2026 — Core, IA, Marketing, RevOps | 111 pendências | **105 abertas** | ❌5 · 🟨39 · 🎭18 · 🔌25 · ⬛14 · ⚠️1 (+6 ✅) · +4 ✅ falsos |
| **B2** | Reverificação 08/2026 — Riscos, Admin/Seg, Integrações, Dados, Infra | 149 | **135 abertas** | ❌34 · 🟨42 · 🎭8 · 🔌22 · ⬛29 (+14 ✅) |
| **C1** | Docs de produto, UX, QA, dívida técnica, auditorias 01–06 | 882 | **237** | ❌60 · 🟨54 · 📄42 · 🔌9 · ⬛9 · 🎭6 (176 detalhadas) |
| **C2** | 22 ADRs, migração, DR, hardening, runbooks, monitoring | 194 | **111** | 📄27 · 🟨27 · ❌26 · 📜14 · 🔌12 · ⬛5 |
| **D** | UI: rotas, páginas, componentes, navegação | 113 rotas | **89** | 🎭27 · 🔌22 · 🟨19 · ⬛15 · ❌6 |
| **E** | Contratos front × backend (tabelas, RPCs, colunas, hooks) | 498 contratos | **101** | 💥26 · 🟨24 · 🔌23 · ⬛19 · 🎭9 |
| **F** | 108 Edge Functions, uma a uma | 108 | **68 (63%)** | 💥28 · ⏰18 · 🔌13 · 🟨7 · 🎭2 |
| **G** | Banco: 447 migrations, tabelas, funções, cron, filas | 271 tabelas · 277 funções | **38 (agregadas)** | 🟨11 · 🔌8 · ⏰7 · 💥6 · ⬛5 · ❌1 |
| **H** | CI/CD, testes, deploy, PWA, monitoring, scripts | 21 steps · 111 scripts | **58** | 🟨25 · 📜9 · ⬛9 · ❌8 · 📄7 |

### 3.2 Fotografia do sistema (HEAD)

| Indicador | Valor | Fonte |
|---|---|---|
| Edge Functions funcionando de ponta a ponta | **40 de 108 (37%)** | [F] |
| Rotinas automáticas (cron) com agendamento válido | **0 de 23** (2 agendadas, ambas quebradas) | [B2 §8], [G:G01–G03] |
| Jobs `pg_cron` versionados | 19 (17 SQL internos OK; 2 HTTP quebrados) | [G] |
| Filas com worker funcional | **4 de 15** | [G:G23] |
| Tabelas lidas pelo front e **sem nenhum produtor** | 26 | [G] |
| Tabelas escritas e **nunca lidas** | 29 | [G] |
| Funções SQL sem nenhum chamador | 57 (+36 só na allowlist do proxy) | [G:G26] |
| Tabelas/views usadas sem DDL no repositório | 146 tabelas + 109 views | [G:G07] |
| RPCs tipadas no `types.ts` | 0 em `e616c20` → **1.234 em `36dfc19`** (✅ regerado, §0) | [B2:R1], `81926b3` |
| Arquivos de `src/` inalcançáveis (código morto) | 132 (20.882 linhas) | [D] |
| Rotas sem entrada na navegação / só via Ctrl+K | 15 / 18 | [D] |
| Links internos quebrados | 9 destinos (12 ocorrências) | [D] |
| Páginas autenticadas renderizando **sem layout** (sem sidebar/header) | 43 | [D:ROT-13] |
| Testes unitários (CI do HEAD) | 5.602 passando · **cobertura 9,51%** · sem piso | [A], [H] |
| E2E (Playwright) | 69 passam · **29 pulados (30%)** — jornadas de escrita sempre puladas | [H:H-18/19] |
| Testes que **nunca rodam** | 90 casos Deno · 4 k6 · 1 `node --test` · 21 cenários shell | [H] |
| Testes SQL: tabelas cobertas | 56 de 271 (20,7%) | [G:G31] |
| Scripts executados pelo CI | 5 de 111 (+2 de 79 guards SQL) | [H] |

---

## 4. 🚨 Alertas que não podem esperar

Itens de **segurança ou risco de produção** encontrados durante a varredura. Não são "funcionalidades não executadas", mas bloqueiam qualquer plano.

| # | Alerta | Evidência (reconferida) | Risco | Ação | Esforço |
|---|---|---|---|---|---|
| **A1** | **Token administrativo do Supabase (PAT `sbp_5bf0…`) gravado em 11 arquivos versionados** de 04/08/2026 (`c9b22b5`) a 12/10/2026. Dá acesso à **Management API** (todos os projetos da conta). Secret scanning do GitHub desligado. **Em 12/10 saiu dos arquivos (`56c9ec2`), mas permanece no histórico do Git.** | `scripts/apply-all.js`, `apply-functions.js`, `apply-migrations.js`, `apply-missing.js`, `apply-remaining.js`, `apply-rls.js`, `apply-triggers-views.js`, `chunk-apply.js`, `fix-enums.js`, `retry-failed.js`, `tmp_view_check.js` (versões até `e616c20`) | Quem tem ou teve acesso de leitura ao repositório pode controlar os bancos até o token ser revogado | **Revogar o token no painel do Supabase** (NÃO VERIFICÁVEL daqui), ligar secret scanning; os 11 scripts seguem ⬛ mortos | P |
| **A2** | **JWT de outro projeto Supabase** (`rqodmqosrotmtrjnnjul`) embutido em migration | `supabase/migrations/20260417120721_823eaa43-…sql:19` | Chave exposta para sempre no histórico | Migration que desagenda/recria o job sem segredo; rotacionar a chave daquele projeto | P |
| **A3** | **Chave de criptografia das credenciais de Conexões com fallback fixo no código** | `supabase/migrations/20260420120250_19397a25-…sql:29-31` (se `app.connection_encryption_key` não estiver definida, usa hash de uma string literal versionada) | Credenciais de terceiros podem estar cifradas com chave que qualquer leitor do repo deriva. NÃO VERIFICADO se o GUC está configurado | Confirmar o GUC; remover o fallback (falhar fechado); re-cifrar | P |
| **A4** | **Dois "fronts de produção" divergentes**: Vercel (`singu-v2.vercel.app` → banco `pgxfvjmu…`) e Lovable (`dialogue-diamond.lovable.app`, marcado como canônico em `index.html:15`, servindo build antigo ligado ao banco antigo `rqodmqos…`, sem headers de segurança) | [H:H-29], [C2] (API Vercel, leitura) | Usuário pode estar operando no sistema/banco errado | Decidir o domínio oficial e desligar o outro | P |
| **A5** | ✅ **Resolvido em 12/10** (`10361d0`). Na base, o CORS das Edge Functions só aceitava `*.lovable.app` e o front da Vercel era bloqueado em 106 de 108 funções | `supabase/functions/_shared/auth.ts:70-93` (base) × allowlist atual com `https://singu-v2.vercel.app` | — | Confirmar o deploy das 108 funções com o `_shared` novo (o deploy é manual — CR14) | P |
| **A6** | **`main` sem proteção de branch** e a Vercel **publica sem esperar o CI** (`ef7eea3` foi ao ar com CI vermelho; `e616c20` 15 min antes do CI terminar) | [H:H-02/H-03] (API GitHub) | Código quebrado vai direto para produção | Branch protection + checks obrigatórios + deploy condicionado ao CI | P |
| **A7** | **Produção muda fora do Git**: o check "Supabase Preview" **falha em todos os 13 últimos commits** de `main` (até `36dfc19`) com *"Remote migration versions not found in local migrations directory"* | API GitHub, check-run do app Supabase (reconferido em 12/10) | Ninguém sabe exatamente que schema está em produção; DR/homologação impossíveis | Baseline do schema canônico + reconciliação do ledger (§12) | M |
| **A8** | **Cadastro público aberto** (`disable_signup: false`) e um usuário **sem papel** lê fornecedores (754), transportadoras (114) e a matriz de permissões | `GET /auth/v1/settings` [C2]; `scripts/rls-matrix/rls-baseline.json` (`_meta.alvo_fase_3`) | Qualquer pessoa cria conta e lê dados internos | Fechar signup (convite) e concluir RLS Fase 3 | P–M |
| **A9** | **Admin que ativar 2FA perde acesso** ao painel e ao rodízio (guard exige AAL2 e não há tela de desafio TOTP) | `src/hooks/useMFAGuard.ts:30-34` (reconferido); `src/pages/Auth.tsx` sem `mfa/challenge` | Bloqueio do próprio dono | Tela de desafio TOTP + liberar `/seguranca` | P |
| **A10** | **`evolution-api`: qualquer usuário logado pode executar 44 ações no WhatsApp** (apagar instância, grupos, webhook) — só exige login, não papel | `supabase/functions/evolution-api/index.ts:46` (reconferido) | Derrubada do canal de WhatsApp por qualquer vendedor | Exigir `has_role('admin')` | P |
| **A11** | **`bitrix24-webhook` busca contato de qualquer usuário** por `ilike` | [F:F07] | Vazamento entre carteiras se a função for ligada | Escopo por dono antes de ligar | P |
| **A12** | **Pixel de intenção forjável** (sem assinatura nem allowlist de domínio) | [B2:I24] | Score de intenção manipulável por terceiros | Allowlist + assinatura | M |
| **A13** | **Partições do `audit_log` só até dez/2026** e nada agenda a criação das próximas | `ensure_audit_log_partition` sem cron (reconferido); partição `audit_log_default` existe | A partir de jan/2027 tudo cai na partição default: degrada e trava a criação futura de partições | Cron mensal de partição | P |

---

## 5. As 14 causas-raiz

Cada linha abaixo é **um único defeito** que derruba **várias** funcionalidades planejadas. É aqui que o esforço rende mais.

| # | Causa-raiz | Evidência | O que derruba | Esforço |
|---|---|---|---|---|
| **CR1** | **Guarda de cron incondicional.** `requireCronSecret` exige `x-cron-secret` e nada envia: nem a tela, nem os 2 crons, nem as chamadas entre funções. | `supabase/functions/_shared/auth.ts:237-248`; `grep x-cron-secret src supabase/migrations` = 0 (reconferido); 23 funções usam a guarda | 14 botões (SMS, sequência, nurturing, snapshot RevOps, DLQ, eventos/interesses sociais, digest, alertas de saúde, smart-notify, templates, validação, perfil comportamental, retry de perfil) | P |
| **CR2** | **Camada de agendamento inexistente.** 21 rotinas sem `cron.schedule`; as 2 existentes apontam para refs errados, sem o header, e uma monta JSON inválido. | [B2 §8], [G:G01–G03] | Sequências, nutrição, forecast, RevOps, lead score diário, MQL, saúde de CS, digest semanal, reprocessamento de webhooks, eventos sociais, notificações de clientes, regeneração de perfis | M |
| **CR3** | **Não existe canal de e-mail.** Nenhum provedor; `send-transactional-email` é chamada mas não existe; vários fluxos gravam "enviado" mesmo assim. | `sequence-processor/index.ts:331-346` (reconferido); `src/hooks/useEmailCampaigns.ts:85-147`; `check-health-alerts:226`; `smart-notify:144`; `weekly-digest:194,226` | Campanhas, cadências, nutrição, digest semanal, alertas, documentos para assinatura, envio de NPS por e-mail | M |
| **CR4** | **`.catch()` encadeado direto em consulta do Supabase** (o builder não tem `.catch` → `TypeError` → HTTP 500). **42 ocorrências em 30 funções** na base; 41 em `36dfc19`. PR [adm01-debug/Singu_V2#103](https://github.com/adm01-debug/Singu_V2/pull/103) aberto trata o padrão. | Reproduzido por mim com `@supabase/supabase-js@2.117.3`: `typeof builder.catch === 'undefined'`. Ex.: `get-signature/index.ts:89`, `disc-analyzer:289`, `mcp-server:220,230`, `phone-validator:102` | Assistente IA, DISC, busca semântica/conversacional, resumo da Ficha 360, assinatura eletrônica, objeções, next-best-action, validação de e-mail/telefone, WhatsApp de entrada, MCP, deal room health | P |
| **CR5** | **"Upsert parcial" em tabela com NOT NULL** (12 funções) — falha antes do `ON CONFLICT`; o status nunca muda. | [F padrão P3] (reproduzido pelo agente em Postgres) | Sequências, nutrição, SMS, DLQ, fila de validação, fila comportamental, ABM scorer, CS health | M |
| **CR6** | **Proxy `external-data` força `user_id` em views que não têm essa coluna** (33 views/tabelas). | `supabase/functions/external-data/index.ts:526-528` (reconferido); lista em [E:E-T05–T12] | Ficha 360 (interações, prontidão, timeline), busca global, widgets do dashboard, abas Comercial/Comportamental/Dados de contato e empresa, churn. **NÃO VERIFICADO** se as views do canônico ganharam a coluna fora do repo | M |
| **CR7** | ✅ **Resolvido em grande parte em 12/10** (`81926b3`, #99): `types.ts` regerado do canônico e typecheck real no CI. Na base: `types.ts` de 04/08, 0 RPCs tipadas, `tsc --noEmit` sobre `tsconfig.json` com `"files": []` (0 arquivos). **Resta:** `strict: false` / `strictNullChecks: false`, e chamadas via proxy `callExternalRpc` seguem sem tipo (por isso o CR8 não foi pego) | `tsconfig.app.json:17,19`; `package.json` script `typecheck` | Erros de null/undefined e de RPC via proxy continuam passando | M |
| **CR8** | **Chamadas com parâmetros/colunas errados**, que nenhum gate pega. | Ficha 360 "Registrar interação" envia `p_contact_id`, função só aceita `p_company_id` (`ProximaAcaoCTA.tsx:106` × `20261008120000_…sql:758` × `types.ts:61950-61957` do canônico, reconferido em `36dfc19`); "Mesclar empresas" e "Criar deal rápido" [E:E-R02/R04]; `conversation-analyzer` usa `interactions.duration_seconds`; `mql-evaluator` usa `contacts.lead_score`; `mcp-server` 4/8 tools | Registrar interação, mesclar, criar deal, Conversation Intelligence, MCP, MQL em lote | P |
| **CR9** | **Banco não reproduzível a partir do Git.** Duas linhagens de schema; 146 tabelas + 109 views sem DDL; 28 tabelas só com `POLICY/INDEX`; produção alterada fora do Git (A7). | [G:G07], [B2:R5], [E:E-D03] | Homologação, DR, `supabase db reset`, testes de banco efêmero; schema de `deals` não roda o Pipeline num ambiente novo | G |
| **CR10** | **`REVOKE ALL` de `authenticated` em 66 tabelas** (32–36 lidas direto pelo front) sem re-grant posterior. | `supabase/migrations/20260723150429_…sql:22-100` [G:G06], [E:E-T13–T17] | Admin (alertas, SLA, drift), Conexões/Webhooks/DLQ, lead score, sequências, auditorias. Em produção pode haver grant manual (NÃO VERIFICADO) — num ambiente novo, quebra | P |
| **CR11** | **Tabelas sem produtor.** Telas leem tabelas que nada grava. | 26 tabelas [G]; ex.: `insights` (0 INSERT), `win_loss_records` (diálogo não montado), `query_telemetry`, `schema_drift_alerts`, `password_reset_requests`, 13 tabelas comportamentais/neuro | Feed "Seu dia", Win/Loss, telemetria, drift, reset de senha, abas de inteligência | M |
| **CR12** | **Dado fictício em tela de decisão.** | `src/data/analyticsData.ts:171-177` em `/analytics`; `MarketingHub.tsx:254-262` (CPL/CAC/LTV fixos); `useDealVelocity.ts:67`, `useEmotionalIntelligence.ts:53,73`, `useHiddenObjections.ts:30` (`Math.random`); `suggest-next-action:192` (sorteado **e gravado**); `MetaProgramsProfiler.tsx:12-19` (hash do ID); `CarnegieDashboard.tsx:42` (demo) | Gestor decide com número inventado | P |
| **CR13** | **Identidade do projeto incoerente.** 3–4 project refs diferentes. | `supabase/config.toml:1` = `hjhthvz…`; `supabase/.temp/linked-project.json` = `pgxfvjmu…`; crons → `rqodmqos…` e `hjhthvz…`; CSP `index.html` = `pgxfvjmu…`; `public/_headers:7` = `rqodmqos…` | Crons, CSP e deploys podem mirar o banco errado | P |
| **CR14** | **Sem esteira de deploy nem ambiente de teste.** Edge Functions publicadas por script manual com `verify_jwt` fixo no script (`config.toml` sem nenhum bloco `[functions.*]`); migrations aplicadas à mão; E2E e testes RLS rodam **contra produção**. | `scripts/migration/functions/deploy-all.sh:66-100`; `supabase/config.toml` (1 linha) | Nada é reproduzível nem reversível; "pronto" não é verificável | M |

---

## 6. Catálogo por módulo de negócio

> Cada linha é uma funcionalidade **planejada/prometida** (em doc, memória Lovable, ADR, auditoria ou na própria tela) que **não está executada de ponta a ponta**. Coluna "Ref" = ID no anexo.

### 6.1 Núcleo do CRM (contatos, empresas, interações, tarefas, Pipeline)

| Funcionalidade planejada | Status | O que falta (concreto) | Ref | Esf. |
|---|---|---|---|---|
| Painel de performance do time no dashboard | ⚠️ REGREDIU | Lê `sales_team_members` (perdeu o escritor na reescrita do rodízio) e pede colunas `value/stage` que o schema não tem → equipe desatualizada e pipeline zerado | B1:C01 | P |
| Registrar interação pela Ficha 360 (CTA "próxima ação") | 💥 | Envia `p_contact_id`; RPC só aceita `p_company_id` | E:E-R03 | P |
| Ficha 360: últimas interações, prontidão, timeline, churn | 💥 provável | Proxy força `user_id` em view sem a coluna (CR6) — confirmar no banco | E:E-T05 | M |
| Busca global (Ctrl+K) → contatos | 💥 provável | Mesmo CR6 | E:E-T06 | M |
| Widgets do dashboard (alertas, follow-ups, saúde e qualidade de dados) | 💥 provável | Mesmo CR6 | E:E-T07 | M |
| Abas Comercial, Comportamental e Dados do contato; detalhe de empresa | 💥 provável | Mesmo CR6 | E:E-T08–T11 | M |
| Mesclar empresas | 💥 | Nomes de parâmetro errados | E:E-R02 | P |
| Merge de contatos/empresas atômico | 🟨 | Hook faz 4 operações soltas; as RPCs atômicas `merge_contacts/merge_companies` existem e não são usadas | B1:C06 | P |
| Detecção de duplicados no servidor | 🟨 | Detecção só no navegador, teto de 2.000 registros; `get_duplicate_contacts` sem DDL | B1:C05 | M |
| Criar deal rápido (widget do Pipeline) | 💥 | Parâmetros errados | E:E-R04 | P |
| Filtros do Pipeline | 🎭 | Estado de filtro não é aplicado aos deals | D:HF-11 | P |
| Captura de motivo de ganho/perda ao fechar deal | 🔌 | `WinLossCaptureDialog` existe e não está montado; `mark_deal_lost` não grava win/loss | D:CMP-02, B1:R06-R07 | P |
| Reabrir tarefa ("Desfazer") | 🟨 | RPC `reopen_task` criada, mas fora da allowlist do proxy (só funciona pelo fallback) | B1:C07 | P |
| Central de notificações persistida | 🔌 | Tabela `notifications` sem leitor; único escritor bloqueado pelo CR1; dedupe em `localStorage` | B1:C08/C17 | M |
| Preferências de notificação (Configurações) | 🎭 | Toggles só mudam estado em memória; nada é gravado; nenhuma função lê as preferências | B1:C09, D:HF-13, C1:PD-9.1 | P |
| Envio de documento para assinatura | 🟨 | Toast "enviado" sem envio (CR3) | B1:C10 | M |
| Página pública de assinatura | 💥 | `get-signature` dá 500 em toda abertura válida (CR4) | F:F32 | P |
| ERP (`/erp`): produtos, propostas, KPIs | 🎭 | 7 tabelas fora da allowlist; erro engolido → sempre vazio | B1:C11/C16, E:E-T01 | M |
| Mapa de empresas no mesmo banco do CRM | 🟨 (melhorou em 12/10) | Geocodificação passou a gravar em `company_addresses` canônico (`49d30bb`); reconferir a leitura contra o proxy | B2:R6 | P |
| Auditoria LGPD de acesso/exclusão e log de atividades | 💥 | Insert com colunas inexistentes (`metadata`, `reason`), sem `entity_id` NOT NULL, `type` fora do CHECK; ninguém lê | E:E-C01, E:E-N01 | P |
| Heatmap de atividade inbound; cross-reference; duplicatas de empresa; cadências do contato | 💥 | Colunas erradas | E:E-C02–C09 | P |
| Vínculos entre entidades validados | 🟨 | Sem tipo e sem validação de existência dos IDs | B1:C04 | P |
| Esquema de `deals` versionado | 🟨 | 2 `CREATE TABLE deals` conflitantes; faltam `pipeline_stage`, `probabilidade`, `titulo` | B1:C15 | M |
| "Esqueci minha senha" (autoatendimento) | 🔌 | `ForgotPasswordForm` existe e não está no `Auth` | D:CMP-01 | P |
| Alterar senha, sessões ativas, excluir conta | 🎭 | Botões sem ação | D:HF-12 | M |
| Alterar foto de perfil | ❌ | Upload + `avatar_url` | D:HF-14 | P |
| Tag em lote nas interações | ❌ | Diálogo + update em lote | D:PH-02 | P |
| Ações "Novo contato/interação/empresa" pelo Ctrl+K | 🎭 | Formulário não abre com `?new=1` | D:ROT-16 | P |
| 14 atalhos de teclado (busca, quick-add…) | 🎭 | Eventos disparados sem ouvinte | D:ROT-18 | P |
| Navegação consistente | 🟨 | **43 páginas** sem `AppLayout` (inclui Marketing, Tarefas, Territórios, Lead Scoring, Enriquecimento, Copywriting, Segurança) | D:ROT-13 | M |
| Links internos | 💥 | Destinos inexistentes: `/contato/:id` (4×, Dashboard), `/contatos/:id/relatorio`, `/relatorio-contato/:id`, `/sequences`, `/configuracoes/seguranca`, `/admin/conexoes/logs`, `/embed/dashboard/:id` | D:ROT-03–08 | P |
| Enriquecimento de contatos (`enrich-contacts`) | ⬛ | Sem chamador; persistência quebrada (CR5) | B1:C12, F:F23 | P |
| Override manual de métricas do contato | 🔌 | Overrides gravados e nunca aplicados | E:E-N02 | P |
| Preferências de horário do contato | 🔌 | Inputs não renderizados no formulário | D:HF-30 | P |
| Edição de eventos na Ficha 360 | 🟨 | Edição inline | D:PH-09 | P |
| Índice/unicidade em `contacts(email)` | ❌ | Índice e decisão de unicidade | B2:D13 | P |

### 6.2 Inteligência comportamental, IA e voz

| Funcionalidade planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| **Geração de perfil comportamental por IA** (tela, fila, regeneração automática, rebatch por feedback) | 💥 | `generate-behavioral-profile/index.ts:54` exige `x-cron-secret` antes de tudo (reconferido); os 6 chamadores (2 telas + 4 funções) não enviam | B1:X01, B2:N01, F:F31 | P |
| Retry manual de perfil (admin) | 💥 | Mesmo CR1 | B1:X02, F:F47 | P |
| Regeneração automática / drenagem da fila / rebatch | ⏰ | Sem cron + chamada interna recusada | B1:I12–I14 | P |
| Detecção de eventos sociais / sincronização de interesses | 🔌 | CR1 + sem cron | B1:X03/X04 | P |
| Insights com IA persistidos (feed "Seu dia") | 🟨 | `generate-insights` só devolve; tabela `insights` sem escritor | B1:I01 | P |
| Auditoria de recomendações de IA | 💥 | Tabela `ai_recommendation_audit_logs_v2` sem DDL; RPC nova lê a v1 | B1:I02, E:E-T02, G:G34 | P |
| Score de inteligência emocional (EQ) | 🎭 | `Math.random` (`useEmotionalIntelligence.ts:53,73`) — contradiz a reauditoria de 02/10 | B1:I04 | M |
| Meta-programas por contato | 🎭 | Score = hash do ID; tabela/colunas erradas | B1:I07, E:E-C05 | M |
| Dashboard Carnegie | 🎭 | `calculateCarnegieScore(65)` "for demo" | B1:I08 | P |
| Coerência de comunicação VAK/DISC | 🟨 | Sugestões sorteadas, sem persistência | B1:I09 | P |
| Objeções ocultas; Closing Score; probabilidade NLP no Pipeline | 🎭 | Valores aleatórios/sem modelo | E:E-H02/H05/H06 | M |
| Score de Maestria PNL | ❌ | Fake removido; métrica real nunca construída | B1:I06 | M |
| Vieses cognitivos | 🟨 | Só palavra-chave; painel anunciado no "O que há de novo" não montado | B1:I05, D:CMP-06 | M |
| `/nlp-analytics` como painel de gestão | 🎭 | 4 de 20 componentes usam dado real | B1:I22 | G |
| Analytics abas Neuro e PNL (12 ferramentas) | 🎭 | Sem dado do portfólio / sem contato selecionado | D:HF-03/04 | M |
| Inteligência social do contato | 🎭 | Mock fixo exibido como real; select falha; tabela sem produtor | E:E-H01, E:E-P16 | M |
| Big Five / MBTI / Eneagrama | 🟨 | Viraram formulário manual; modelos tipados não usados | D:CMP-20, A | M |
| Painel "Recomendação de Abordagem", saúde do cliente, logs DISC, dominância cerebral, templates por perfil, neuromarketing avançado | ⬛ | Componentes prontos e **não montados** | D:CMP-05–12, E:E-M01/M02 | P–M |
| 13 tabelas comportamentais/neuro (EQ, objeções, valores, critérios de decisão, análise temporal, conversão DISC, evolução neuro…) | 🔌 | Lidas pelas telas e **nunca escritas** | G:G16/G17, E:E-P03–P08 | M |
| Assistente IA (`ai-assistant`) | 💥 | Salva a mensagem e responde 500 (CR4) | F:F02 | P |
| Ask CRM (perguntar ao CRM em linguagem natural) | 💥 | Executa `execute_readonly_query` com service role; a RPC exige `auth.uid()` → sempre falha; validação de SQL por regex; atalho Ctrl+K sem ouvinte | A, D:ROT-17 | M |
| DISC analyzer; objeções; next-best-action; busca semântica e conversacional; resumo da Ficha 360; análise social; win/loss analyzer | 💥 | CR4 (500 no caminho principal) | F:F14/F19/F29/F41/F43/F49/F55/F67 | P |
| Conversation Intelligence | 💥 | `conversation-analyzer` usa coluna inexistente → sempre "not found"; tela de detalhe da análise inexistente | F:F12, D:HF-15 | M |
| Roadmap preditivo (`suggest-next-action`) | 🎭 | Resultado sorteado **e persistido** | B2:R9, F:F58 | P |
| Digest de coaching de conversas | 🔌 | Sem tela e sem cron | B1:I11 | P |
| Analytics de comandos de voz | ❌ | Só `logger.log`; sem tabela | B1:I16 | P |
| Copywriting Enterprise com IA | 🟨 | Rota sem as abas de IA; analisador de copy sem IA | B1:I17, D:PH-10 | P |
| Demand forecast com histórico | 🟨 | Não persiste; usa contagem de interações | B1:I18 | M |
| Compatibilidade de portfólio (alertas) | 🟨 | Só gerados ao abrir o dashboard; sem job | B1:I23 | M |
| Snapshots do Intelligence Hub compartilháveis | 🟨 | `localStorage`/`sessionStorage` | B1:I24 | M |
| Busca visual por imagem | ⬛/🚫 | Botão não montado; busca **produto** (escopo proibido, §10) | B1:I10 | P |
| Gerador de mensagens por IA | ⬛ | Não montado | B1:I20, D:CMP-15 | P |

### 6.3 Marketing e automação

| Funcionalidade planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| **Motor de regras de `/automacoes`** (+ templates, cadências CRM, log de execuções) | 🎭 | Só CRUD; nenhum worker/trigger executa `automation_rules`; `execute_automation_v2` não existe | B1:M01–M03, E:E-P01 | G |
| **Disparo de campanha de e-mail** | 🎭 | "Simula o envio" e grava `sent`; ignora segmento; abertura/clique nunca registrados | B1:M17/M18, D:FLX-01, G:G09 | G |
| **Sequências multicanal** | 🎭/🔌 | Botão 401 (CR1); sem cron (CR2); passo de e-mail gravado `sent` sem envio (CR3); sem UI de inscrição; pixel `sequence-track` desconectado; RPC `increment` inexistente; WhatsApp/LinkedIn/ligação não geram tarefa | B1:M04–M10, F:F52/F53 | M |
| **Nurturing** | 🎭/🔌 | Sem inscrição pela UI (RPC pronta); runner sem cron e 401; passos só criam linha em `interactions`; RPC `increment_workflow_completed` inexistente; sem editor de conteúdo/gatilhos | B1:M11–M15, D:FLX-03 | M |
| **SMS marketing** | 💥 | Twilio implementado, mas CR1 bloqueia; truncado em 1.000; upsert parcial; sem segmento/agendamento/opt-out | B1:M19/M20, D:PH-05, G:G10 | M |
| Lead de **landing page** vira contato | ❌ | Submissões nunca viram contato; `submission_count` nunca incrementa (página mostra "0 leads") | B1:M21, D:FLX-05 | M |
| **Formulário público** cria contato e inscreve no nurturing | ❌ | Nenhuma versão de `submit_public_form` usa `nurturing_workflow_id` | B1:M28, D:FLX-04 | P |
| **Lead magnet** com arquivo e contato | 🟨 | Upload em storage + URL assinada + criação de contato | D:FLX-06 | M |
| **MQL → SQL** | 🔌 | RPC `evaluate_mql` pronta e liberada, sem botão nem cron; `mql-evaluator` usa coluna inexistente | B1:M29/R14 | P |
| Marketing Hub: segmentação DISC/VAK | ⬛ | Bloco JSX **fora do `return`** (`MarketingHub.tsx:51-140`) | B1:M23 | P |
| Marketing Hub: aba Segmentação | 🟨 | `TabsContent` dentro de `TabsList` | B1:M24 | P |
| Marketing Hub: CPL/CAC/LTV/ROI | 🎭 | Literais fixos | B1:M25, D:HF-09 | M |
| Marketing Hub: barra de status de nutrição | 🎭 | `width: 65%` fixo | B1:M26 | P |
| Atribuição multi-touch | 🟨 | Exige colar UUID do deal; touchpoints de sequência não gravados | B1:M30 | M |
| Report Builder | 🎭 | "Placeholder widget rendering"; layout em `localStorage` | B1:M31, D:PH-03 | G |
| Relatórios customizáveis | 🟨 | Definições só em `localStorage` (sem compartilhar/agendar) | B1:M32 | M |
| BI — rentabilidade | 🟨 | `deals_count`/`total_value` = 0 constantes | B1:M33 | P |
| Dashboards embeddable (iframe) | ❌ | Rota `/embed/dashboard/:id` e token não existem | B1:M34, D:ROT-08 | M |
| Recalcular intenção automaticamente | 🟨 | Só manual | B1:M35 | P |
| Card de score de intenção em conta/contato | 🔌 | Componente não montado | D:CMP-04 | P |
| Captura de sinais de intenção de sites externos | 💥 | `intent-tracker` responde 500 após inserir | F:F34 | P |
| Resumo semanal (weekly digest) | 🔌/🎭 | CR1 + CR2 + `generateEmailHtml` nunca chamada | B1:M36 | M |
| Notificações de sucesso de templates | 🔌 | CR1 + CR2 | B1:M37 | P |
| Lembretes inteligentes via WhatsApp (`smart-notify`) | 💥 | Cron sem header, ref errado, JSON inválido; escalonamento vai ao próprio usuário | B1:M38, F:F54, G:G02 | P |
| Revalidação automática de e-mail/telefone | 💥 | Cron no projeto errado; fila presa em `processing`; worker 401 | B1:M40, F:F64, G:G01 | P |
| Insights/estatísticas de campanha e ROI de marketing | 🔌 | Sem agregador | E:E-P07, G:G20 | M |
| Segmentação comportamental → "Criar campanha"/"Automação" | 🎭 | Botões sem ligação | D:HF-16 | M |
| "Ver modelos recomendados" (isca digital) | ❌ | Galeria de templates | D:HF-18 | P |
| Ver todos os MQLs | 🟨 | Listagem completa | D:HF-17 | P |
| Buscas/filtros salvos | ⬛ | Botão "Salvar filtro" não montado | C1:PD-10.3 | P |

### 6.4 Vendas, RevOps e Customer Success

| Funcionalidade planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| Histórico de forecast (acurácia) | ⏰ | `forecast-snapshot-cron` sem cron | B1:R01, G:G22 | P |
| Funil RevOps ponta a ponta | 🟨 | Topo (MQL/SQL) zerado (depende de MQL) | B1:R02 | P |
| Alertas de queda de conversão | ⏰ | Produtor atrás do CR1, sem cron | B1:R03 | P |
| Botão "Atualizar snapshot" RevOps | 💥 | 401 (CR1) | B1:R04 | P |
| Série histórica de RevOps | ⬛ | Hook sem tela | B1:R05 | P |
| **Win/Loss** (dashboard e captura) | 🔌 | Sem produtor alcançável; EF `win-loss-record-deal` órfã; seed de motivos falha (permissão revogada) | B1:R06–R08, A | P |
| Métricas de campanhas ABM | 🟨 | Coletar e exibir; `abm-account-scorer` não persiste (CR5) | B1:R09, F:F01 | M |
| Lead scoring — grades coerentes | 🟨 | Dois vocabulários (A–D × cold/warm/hot) na mesma tabela | B1:R11 | M |
| Lead score diário e fila de recálculo | ⏰ | `lead-score-cron` sem cron; fila só consumida manualmente | B1:R12/R13 | P |
| Automação por limiar de score "criar tarefa" | 🟨 | Não cria tarefa real | F:F36 | P |
| **Rodízio de carteira — fonte de compras ERP** | 🔌 | `registrar_pedido_erp` sem chamador; `customer_purchases` vazia, mas os crons do rodízio rodam. Com o kill switch ligado, todo cliente apareceria "não ativado" | G:G05 (reconferido) | M |
| Distribuição imediata de lead avulso | ⚠️ removido | EF `lead-routing` removida; só ondas — **decisão de negócio pendente** | B1:X05 | M |
| Sugestão de playbook no deal | ⬛ | Drawer pronto não montado | B1:R17, D:CMP-03 | P |
| Recalcular saúde de CS em lote | ⏰ | Sem cron; upsert falha (CR5) | B1:R18, F:F16 | P |
| Territórios | 🟨 | RPCs de leitura sem DDL; erro vira lista vazia | B1:R19, G:G35 | M |
| Otimização de território por IA | 🟨/❌ | Não persiste; **"Aplicar recomendação" não implementado** | B1:R20, D:PH-01 | M |
| Metas e gamificação | 🟨 | 6 RPCs sem DDL; erro vira vazio | B1:R21 | M |
| `/analytics` visão geral | 🎭 | Dados de `src/data/analyticsData.ts` com vendedores inventados; "Exportar"/"Atualizar" sem ação | B1:R23, D:HF-01/02 | M |
| Velocidade de deal | 🎭 | `Math.random` | D:HF-05 | M |
| Benchmark do setor (empresa) | 🎭 | RPC de benchmark | D:HF-08 | M |
| Predição de churn — executar ação recomendada | 🎭 | Botão sem handler; views sem `user_id` (CR6) | D:HF-22, E:E-T12 | P |
| Próximos passos estratégicos ("Avançar", "Ver lista") | 🎭 | Handlers | D:HF-21 | P |
| Aprovação de follow-ups por IA / próximos passos | 🔌 | RPCs prontas sem tela | E:E-R12, E:E-N04 | P |
| Deal Room — saúde | 💥 | `deal-room-health` 500 (CR4) | F:F17 | P |
| Envio de pesquisa NPS/CSAT pelo canal escolhido | 🟨 | Só gera link; não envia (PR #95 em andamento trata o contrato) | D:HF-26 | M |
| Histórico de compras / RFM monetário / sugestões de oferta | 🔌 | `purchase_history` sem produtor e fora da allowlist; segmentos RFM sem seed | E:E-T04/E-P09/E-P12, G:G19 | M |
| Pipelines configuráveis (`pipelines`, `pipeline_stages`) | ⬛ | Tabelas sem uso — decidir modelo ou drop | B2:D02, G:G36 | M |

### 6.5 Canais e integrações

| Integração planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| **E-mail transacional (Resend)** | ❌ | Provedor + `send-transactional-email` + marcar `sent` só após aceite (CR3) | B2:R7/I25 | M |
| **WhatsApp — envio pelo CRM** | 🔌 | `evolution-api` (44 ações) sem chamador; 3 caminhos paralelos para o mesmo canal | B1:M44, F:F26 | M |
| **WhatsApp — mensagem recebida** | 💥 | `evolution-webhook` grava a mensagem e aborta com 500 (`:320-327`); transcrição, interação, DISC e perfil nunca rodam; segredo/header diverge do doc | F:F28 | M |
| Transcrição de áudio do WhatsApp | 💥 | `voice-to-text` 500 | F:F65 | P |
| Conector Evolution ↔ Bitrix24 | 🟨 | Tabelas `connector_log`/`oauth_tokens` sem DDL; `LINE_ID = 44` fixo; sem tela/doc | B2:N03, F:F27 | M |
| **Bitrix24 — sincronizar leads/deals** | 🟨 | Só envia mensagens de WhatsApp; não sincroniza lead/deal/atividade | B2:I12/I32 | G |
| Bitrix24 → CRM (entrada) | 💥/⬛ | `incoming-webhook` exige HMAC que o Bitrix não envia; `bitrix24-webhook` órfão e com busca sem escopo | B1:M42/M43, F:F07 | M |
| Stripe e GitHub (webhooks de entrada) | 🎭 | Presets oferecidos na tela são rejeitados pelo HMAC próprio | B2:I28/I29 | M |
| **Web Push** | 🎭 | Chave VAPID placeholder, payload sem criptografia, service worker sem handler `push` e contraditório | B2:I19, F:F50, H:H-42 | M |
| Slack e PagerDuty (alertas) | ❌ | Prometidos; receivers `REPLACE_ME` | B2:I30/I31 | P |
| Proxycurl; `GEMINI_API_KEY` direta | ❌ | Prometidos em doc/tela; sem código | B2:I26/I27 | P |
| Cliente MCP (consumir MCP externo) | 🟨 | Tipo de conexão sem cliente real | B2:I18 | M |
| Servidor MCP do SINGU | 💥 | Nenhuma tool retorna sucesso; 4/8 com schema errado; efeitos de escrita ocorrem → risco de duplicação | F:F39 | M |
| Lux Intelligence (n8n) | 🟨 | Falha do n8n vira 500 + registro órfão; criação de stakeholders 500; webhook externo NÃO VERIFICADO | F:F37/F38 | P |
| Enriquecimento (Firecrawl, EnrichLayer/LinkedIn, e-mail finder/verifier, telefone) | 💥 | 500 por CR4; secrets NÃO VERIFICADOS | F:F21/F22/F24/F44 | P |
| Telefonia / VoIP (chamadas no histórico) | ❌ | Integração inexistente; tabelas esperando dados | E:E-P02, G:G21 | G |
| KPIs e índice de WhatsApp | 🔌 | Job de agregação | E:E-P13, G:G18 | M |
| Retry/DLQ/circuit breaker nas integrações de saída | ❌ | Circuit breaker em 0–1 de 4 serviços previstos; DLQ marca sucesso sem inserir | B2:IA7, C2 | M |
| Geocoding (Nominatim), ipapi, Leaflet via CDN | 🟨 | Proxy/cache, LGPD, assets locais | B2:I20–I22 | P |

### 6.6 Segurança, acesso, LGPD e administração

| Funcionalidade planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| MFA exigindo AAL2 com tela de desafio | ❌ | Ver A9 | B2:S01/S02 | P |
| Login por Passkey/WebAuthn | 🟨 | Verificação de challenge no servidor | B2:S03 | M |
| SSO (SAML/OIDC) | ❌ | Fluxo inteiro (rota `/sso/callback` existe sem backend) | B2:S08 | M |
| Login com Google | 💥 | Botão existe (`src/pages/Auth.tsx:198`), mas o provedor está desligado no projeto canônico (`"google": false` em `/auth/v1/settings`) | C2 | P |
| Restrição por IP, geo-blocking, novo dispositivo | 🔌 | Configuráveis na tela; `validate-access` e `detect-new-device` **nunca chamadas** | B2:S04–S07, D:FLX-16 | P |
| Bloqueio de força bruta | 🟨 | Só no navegador; `login_attempts` sem uso | C1, B2:D12 | P |
| RBAC granular por permissão | 🔌 | `useRBAC/hasPermission` não protege telas; `role_permissions` sem seed | B2:S09, E:E-P10 | M |
| Telas de papéis, permissões e matriz | 🟨 | CRUD real de `user_roles`; itens fora do menu admin | B2:S10–S12, D:ROT-10 | P |
| **Feature flags** | 🔌 | `useFeatureFlag` com **0 consumidores**; sem seed; painel não controla nada | B2:S13/S14, D:FF-01 | P |
| Kill switch do dual-write | ❌ | Script grava coluna `key`; PK é `name` | B2:N04 | P |
| Aprovação de reset de senha pelo admin | 🎭 | Nada cria o pedido; aprovar não reseta | B2:S25, D:HF-27 | P |
| Política de senha forte / HIBP | ❌/🟨 | Regras de complexidade; HIBP NÃO VERIFICADO | B2:S45, G:G29 | P |
| Gestão/rotação de segredos | 🟨 | Sem integração com Vault/API | B2:S24 | M |
| Trilha de auditoria organizacional | 🟨 | Admin não lê tudo (policy); filtro EXTERNAL_SYNC sem fonte | B2:S21, D:PH-08 | P |
| Retenção de dados LGPD (job diário) | 🟨 | Job agendado, mas grava no `audit_log` com colunas inexistentes (`operation`, `changed_by`, `changed_at`) → falha e **nada é apagado**; se só o log for corrigido, passa a apagar interações > 3 anos e WhatsApp > 2 anos **sem tela, dry-run nem teste** | G:G30, C2 (reconferido) | M |
| Log de consentimento LGPD no contato | ⬛ | Componente não montado | D:CMP-08 | P |
| Área Admin acessível pela navegação | 🔌 | Sem item "Administração"; rotas de RBAC fora do sidebar | D:ROT-09/10 | P |
| `/design-system` restrito | 🟨 | Fora de `Protected` | B2:S39 | P |
| Docs internas dinâmicas (`/admin/docs`, knowledge export, field mapping) | 🟨 | Conteúdo estático; não gerado do schema | B2:S36–S38 | P |
| `clear-must-reset-flag` com import correto | ❌ | Import de `/cors` inexistente | B2:S47 | P |

### 6.7 Observabilidade, SRE e recuperação de desastre

| Funcionalidade planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| **SLO 99,5% medido continuamente** | 🎭 | Snapshots de saúde só quando alguém abre `/status`; dias sem dado contam 100%; widget de saúde não montado; sem cron de 5 min | B2:S17/S18, A:PLAN-02 | P |
| Alertas automáticos de error budget 50/75/100% | 🟨 | Cron + canal | B2:S19 | P |
| `/status` público | 🟨 | `system-health` exige JWT → visitante sempre vê "indisponível" | B2:R9b, F:F60 | P |
| **Prometheus + Alertmanager** (Rodada 26/10, ADR-019) | ❌ | Só config; 20 regras sem runtime; 4 exporters nunca rodam; receivers `REPLACE_ME`; `monitoring-lint` falhou 10/10 | B2:S34, H:H-35/38, C2 | G |
| 63 guards de banco das rodadas 13–47/10 | 📜 | Escritos e nunca executados (nem CI, nem cron) | C2 | M |
| Telemetria (`/admin/telemetria`) | 🎭 | Nada grava `query_telemetry` | B2:S20 | P |
| Detecção de schema drift | 🎭 | Nada grava `schema_drift_alerts` | B2:S23 | M |
| Erros e Web Vitals de produção | 💥 | `errorReporting.ts:114,200` lê `VITE_SUPABASE_ANON_KEY` — **variável que não existe** (reconferido) → nenhum erro é gravado; sem APM | A | P |
| Logs unificados de Conexões, DLQ e anomalias | 🔌 | Página existe sem rota (link dá 404); DLQ sem cron e botão 401 | D:ROT-01, B2:S26/S40 | P |
| Monitor de automação do CRM (widget da home) | 🔌 | Produtor órfão | B2:S30, F:F15 | P |
| Página de Observabilidade | ⬛ | Lazy sem rota | D:ROT-02 | P |
| Performance de RPC de negócio | 🟨 | Instrumentar RPCs de pipeline/contatos/relatórios | B2:S33 | M |
| **Backup fora do provedor, bucket imutável, restore mensal, game day** | ❌/🟨 | Drill 2026-Q2 sem evidência. Desde 12/10 existe teste de restauração lógica (`restore-drill.yml`, #97), mas só roda em PR/manual — sem restore periódico, sem backup fora do provedor | C2, `2854848` | G |
| Chaos drill, load testing (k6), plano de DR com flag `external_data_fallback` | 📜/❌ | Scripts nunca rodados; a flag não existe | C2, H | M |
| Kill switch de conexões (RUNBOOK) | ❌ | Coluna `provider` citada não existe; funções não checam `is_active` | C2 | P |
| KPIs diários (materialized views) | ⏰ | DDL das MVs não versionada; refresh sem cron | G:G24, B2:D07/D10 | P |
| `docs/perf/explain-analyze.md` | 📄 fabricado | O script gerador declara "I will simulate the documentation" | C2 | P |

### 6.8 Plataforma: banco, deploy, CI e testes

| Garantia planejada | Status | O que falta | Ref | Esf. |
|---|---|---|---|---|
| Banco nasce do repositório (`supabase db reset`) | 🟨 | Baseline do canônico + reconciliação do ledger (CR9, A7) | B2:R5, G:G07 | G |
| `types.ts` gerado do banco atual + check de drift no CI | 🟨 (regerado em 12/10) | Falta o **check automático de drift** no CI para não voltar a divergir | B2:R1, E:E-D01–D06, `81926b3` | P |
| Typecheck real e `strict` | 🟨 (typecheck real desde 12/10) | Ligar `strictNullChecks` e depois `strict` | H:H-01, B2:F01 | G |
| Pipeline de deploy de Edge Functions e migrations | 🟨 | Workflow com aprovação; `verify_jwt` no `config.toml` | B2:R3b/R13b, H:H-05 | M |
| Ambiente de homologação | ❌ | E2E e RLS rodam contra produção | H:H-18 | M |
| E2E das jornadas de escrita ("3 críticas certificadas") | 🟨 | Sempre puladas | H:H-19 | M |
| Testes das Edge Functions | ⬛ | 90 casos Deno nunca rodam (`deno test` fora do CI) | B2:F17 | P |
| Piso de cobertura | ❌ | Real 9,51%; docs dizem "70% concluído" | H:H-12, B2:F12 | P |
| Testes que testam o código real | 🟨 | 642 casos "espelho" ou "grep" | H, B2:F10/F13/F14 | M |
| Lighthouse bloqueante | 🟨 | Só aviso | B2:F08 | P |
| Linter de banco no CI (ADR-022) | 🔌 | `check-backend-linter-baseline.mjs` sai 0 sem stdin e não é chamado | A:PLAN-03 | P |
| Regra "máx. 400 linhas por arquivo" | 📄 | 91 arquivos acima; sem regra ESLint | A:IDX-01 | M |
| Cobertura de testes SQL | 🟨 | 20,7% das tabelas; rodízio e retenção sem teste; CI pula sem `PGHOST` | G:G31 | M |
| Lockfile único | ⬛ | `bun.lock`, `bun.lockb` e `package-lock.json` juntos | B2:F04 | P |
| Ícones PWA | 💥 | Os 3 PNG são texto base64 e chegam assim em produção | H:H-40 | P |
| PWA coerente (service worker) | ❌ | `main.tsx` diz `injectManifest`/`src/sw.ts` (inexistente); `vite.config.ts` usa `autoUpdate`; push re-registra outro SW | B2:R13 | M |
| Variáveis de ambiente documentadas | 🟨 | Front usa 5 `VITE_*`, `.env.example` declara 3; 3 secrets de webhook fora do template | H, B2:R4b | P |
| Scripts órfãos e lixo | ⬛ | 48 arquivos sem referência + `tmp_view_check.js` | H | P |
| Dependabot/secret scanning/SAST | ❌ | Desligados ou inexistentes | H:H-14 | P |

### 6.9 Experiência de uso — melhorias planejadas em `PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6` e `ux_improvement_strategy`

| Melhoria | Status | Ref |
|---|---|---|
| Tokens semânticos de espaçamento e raio | ❌ / 🟨 | C1:PD-1.1/1.4 |
| Recentes/Favoritos na sidebar; badges por seção; quick-add pela sidebar | ❌ | C1:PD-2.2/12.3b/12.3c |
| Busca com sugestões e atalhos `@empresa`; analytics de busca | 🟨 / ❌ | C1:PD-2.3/10.2 |
| ProgressToast em operações longas; stepper de importação; guarda de alterações não salvas | ❌ / 🟨 | C1:PD-3.3, UX-4.1/4.2 |
| Gráficos acessíveis, drill-down, comparativo YoY/MoM, exportar PNG/PDF | 🟨 / ❌ | C1:PD-11.1–11.4 |
| Touch targets ≥ 44 px, formulários mobile, gestos, haptic | 🟨 | C1:PD-3.2/4.6/5.1/5.2 |
| Virtualização de listas, `srcset`/LQIP | 🟨 / ❌ | C1:PD-6.2/6.5 |
| Sons, entrega agendada/silêncio de notificações | ❌ / 🔌 | C1:PD-9.4/9.5 |
| Offline-first com fila de mutações | 🟨 | C1:PD-14.1 |
| Vídeos tutoriais | ❌ | C1:PD-13.5 |
| Métricas de UX (TTFMI, conclusão de tarefa, SUS, NPS do produto) | ❌ | C1:PD-MET |
| Simulador de negociação (`COMPLETE_SYSTEM_ANALYSIS`) | ❌/removido | C1:CS-1 |
| "Ajuda contextual em todas as métricas", cache/fila offline (anunciados no "O que há de novo") | 🎭 | D:PH-04 |
| "Reabrir O que há de novo" e aviso de atualização do PWA | 🔌 | D:ROT-19 |

---

## 7. Funcionalidades prontas, mas escondidas

Código **completo** que só precisa de **um botão, uma rota ou um agendamento** para entregar valor. É o melhor retorno por hora de trabalho.

| Pronto no código | Falta só… | Ref |
|---|---|---|
| Inscrição de contato em nurturing (`enroll_contact_in_workflow`, RPC liberada) | Botão "Inscrever" | B1:M12 |
| Inscrição em sequência (`enrollContact`) | Botão "Inscrever" | B1:M05 |
| Classificação MQL (`evaluate_mql`, RPC liberada) | Botão ou cron | B1:M29 |
| Captura de Win/Loss (`WinLossCaptureDialog`) | Abrir ao mover deal para ganho/perdido | B1:R07 |
| Merge atômico (`merge_contacts`, `merge_companies`) | Trocar o hook | B1:C06 |
| Recomendação de playbook (`PlaybookSuggestionDrawer`) | Montar no deal/contato | B1:R17 |
| Card de intenção por conta | Montar em Empresa/Contato | D:CMP-04 |
| "Esqueci minha senha" (`ForgotPasswordForm`) | Link no login | D:CMP-01 |
| Logs/DLQ/anomalias de Conexões | Registrar a rota `/admin/conexoes/logs` | D:ROT-01 |
| Painéis Recomendação de Abordagem, saúde do cliente, vieses, DISC logs, dominância cerebral, templates por perfil, neuromarketing avançado | Montar (e remover os aleatórios) | D:CMP-05–12 |
| 10 bibliotecas Carnegie + 6 de gatilhos (~5,4 mil linhas, só usadas em testes) | Tela/aba | D:CMP-19 |
| Aprovação de follow-ups por IA, logs de recomendação, edição de territórios (RPCs prontas na allowlist) | Ligar a UI | E:E-R12, G:G14 |
| Segmentação comportamental do Marketing Hub | Mover o bloco para dentro do `return` | B1:M23 |
| SMS via Twilio | Trocar a guarda por `withAuth` | B1:M20 |
| Digest de coaching de conversas | Botão ou cron | B1:I11 |
| Detector de anomalias de Conexões | Agendar e ligar a tela | G:G38 |

---

## 8. Documentos que afirmam o que não existe

> Total de afirmações falsas/desatualizadas encontradas: **~98** (A:22 · C1:42 · C2:27 · H:7). Seleção das que mais distorcem decisões:

| Documento | Afirma | Realidade | Ref |
|---|---|---|---|
| `.lovable/plan.md` | "Estado 10/10 sustentado"; "TypeScript 0 erros"; "SLO 99,5% monitorado" | Até `e616c20` o typecheck do CI checava 0 arquivos (corrigido em 12/10, ainda com `strict: false`); cobertura 9,51%; SLO amostrado ad hoc | A:PLAN-01/02/04 |
| `docs/auditoria/06_REAUDITORIA_IMPLEMENTACAO_20261002.md` | "Métricas aleatórias removidas" | `Math.random` segue em EQ, velocidade de deal, objeções ocultas; ranking inventado em `/analytics` | B1:I04/R23 |
| `docs/audit_report.md` | Cobertura 70% "Concluído 10/10" | 9,51%, sem piso | H:H-12 |
| `docs/qa/CERTIFICATION_10_10.md` | 3 jornadas críticas certificadas | E2E de escrita sempre pulado | H:H-19 |
| `README.md` | "31 Edge Functions", "~50 migrations", "4.470 testes", TS 5.8 | 108 · 447 · 5.602 | B2:P8 |
| `HANDOFF.md` | "30 Edge Functions / 40+ tabelas" (abr/2026) | 108 / 271 | B2:P8 |
| `docs/EDGE_FUNCTIONS_API.md` | Inventário de functions | 78 de 108 não documentadas | C1 |
| `docs/COMPLETE_SYSTEM_ANALYSIS.md` | 24 componentes/hooks citados | Não existem | C1:CS-REF |
| `docs/er-diagram.md` | Diagrama ER | Vazio | C1, B2:F33 |
| `docs/perf/explain-analyze.md` | Resultados de EXPLAIN ANALYZE | Gerado por script que "simula" a documentação | C2 |
| `docs/RUNBOOK.md` / observabilidade | Kill switch por `provider`; alertas Slack/PagerDuty | Coluna inexistente; receivers `REPLACE_ME` | C2, B2:S46 |
| `docs/DISASTER_RECOVERY.md`, `docs/dr-drills/2026-Q2.md` | Drill executado | Sem evidência | C2 |
| `FUNCIONALIDADES_SISTEMA.md` | Big Five/MBTI/Eneagrama automáticos; logs DISC | Formulário manual; painel não montado | A, D:CMP-09/20 |
| `ARCHITECTURE.md` (raiz e `docs/`) | Dois documentos de arquitetura diferentes | Eleger um | B2:F32 |
| `index.md` (memória Lovable) / `CONTRIBUTING.md` | "Máx. 400 linhas", "sem `any`" | 91 arquivos acima do limite; sem enforcement | A:IDX-01 |

---

## 9. O que foi resolvido desde a auditoria de 16/08

Para registro justo — **20 entregas comprovadas** em 97 commits:

- **CI voltou a ser portão** (secrets obrigatórios, gates de banco incondicionais, E2E contra o build, credenciais E2E) — `ci.yml:37-135` [B2:R3/F11/F16/F19–F21].
- **Webhook genérico exige HMAC** + timestamp + nonces (`20261002103000_harden_incoming_webhooks.sql`) [B2:PD].
- **`dual-write-proxy` autentica** e falha fechado [B2:S31/I15].
- **Pipeline unificado** (leitura e movimento via proxy + `move_deal_atomic` com escopo) [B1:C03].
- **15 RPCs do front liberadas** para `authenticated` com escopo por `auth.uid()` (`20261006130000`) — desfez a regressão de setembro [B1 contexto].
- **Funil de marketing** e **atribuição** voltaram a funcionar pela tela [B1:M27, B2:V01].
- **Índice da fila comportamental**, **gates de índices inválidos, matriz e cobertura RLS** [B1:I15, B2:F05–F07].
- **Bloco PNL fictício de `/performance`** e **"10/10" fixo do NLP** removidos; `useCognitiveBiases` sem aleatório [B1:R22, B2:R9].
- **Fail-open do `/status`** corrigido [B2:R9b].
- **Rodízio reescrito** com 4 jobs `pg_cron` versionados [B1:R15].
- **Analytics da empresa** deixou de sair vazio (banco único obrigatório no proxy) [B1:C02].

Entregues **depois da base**, em 12/10 (ver §0): token removido dos scripts, CORS do domínio Vercel, `types.ts` regerado + typecheck real, contratos de NPS/CSAT/CES e RFM, teste de restauração lógica, geocodificação no modelo canônico, navegação com histórico/filtros e estados de erro × vazio em Empresas.

---

## 10. Fora de escopo deliberado

| Item | Decisão registrada | Resíduo encontrado |
|---|---|---|
| **Módulos de Produtos e Propostas** | "Não implementar (escopo proibido)" — `.lovable/memory/index.md:9`, `ARCHITECTURE.md:123-126` | Visualizadores de propostas do ERP (`ProposalsCard`, `CompanyErpProposalsWidget`, `useContactProposals`, `/erp`), Edge Function `visual-search` (busca de **produto** por imagem) e RPC `search_products_semantic`. **Decidir** se continuam no ar (custo de IA em escopo vetado) [A:IDX-02] |
| Distribuição de lead avulso | Removida junto com `lead-routing` em favor das ondas do rodízio | Widget ainda sugere a função [B1:X05] — confirmar a decisão |

---

## 11. Trabalho em andamento e abandonado

| PR | Situação (12/10) | Relação com este levantamento |
|---|---|---|
| [adm01-debug/Singu_V2#103](https://github.com/adm01-debug/Singu_V2/pull/103) — grava logs opcionais sem invalidar operações concluídas | **Aberto** | Ataca o CR4 (`.catch()` em 30 funções) |
| [adm01-debug/Singu_V2#106](https://github.com/adm01-debug/Singu_V2/pull/106) — isola atividades pelo vendedor autenticado | **Aberto** | Toca §6.1/§6.4 (atividades de venda) |
| [adm01-debug/Singu_V2#97](https://github.com/adm01-debug/Singu_V2/pull/97) — teste de restauração lógica em instância isolada | Mergeado em 12/10 | Parte do DR (§6.7); restore periódico segue pendente |
| [adm01-debug/Singu_V2#95](https://github.com/adm01-debug/Singu_V2/pull/95) — contratos de pesquisas (NPS/CSAT/CES) e análises (RFM, NLP, sequências) | Mergeado em 12/10 | §6.4 (envio pelo canal segue pendente) |
| [adm01-debug/Singu_V2#99](https://github.com/adm01-debug/Singu_V2/pull/99) — checagem real de tipos e alinhamento ao banco canônico | Mergeado em 12/10 | Resolve a maior parte do CR7 |
| [adm01-debug/Singu_V2#100](https://github.com/adm01-debug/Singu_V2/pull/100) — ações, mapa e reconstrução do Supabase Preview | Mergeado em 12/10 | Mapa melhorou; **Supabase Preview continua vermelho** (A7) |
| [adm01-debug/Singu_V2#82](https://github.com/adm01-debug/Singu_V2/pull/82) — teste da RPC do sidebar contra schema de produção | Mergeado em 12/10 | Evidencia triggers legados incompatíveis em produção (CR9) |
| [adm01-debug/Singu_V2#83](https://github.com/adm01-debug/Singu_V2/pull/83), [#7](https://github.com/adm01-debug/Singu_V2/pull/7) | Dependabot abertos | — |
| [adm01-debug/Singu_V2#87](https://github.com/adm01-debug/Singu_V2/pull/87) — mover `vite-plugin-pwa` para devDependencies | **Fechado sem merge** | Alerta de `npm audit` que motivou o PR pode voltar |
| [adm01-debug/Singu_V2#3](https://github.com/adm01-debug/Singu_V2/pull/3) — `contacts.length >= 0` e `reduce` sem seed | **Fechado sem merge** | Conferir se as correções entraram por outro caminho |
| [adm01-debug/Singu_V2#58](https://github.com/adm01-debug/Singu_V2/pull/58) — registrar migration t216 | **Fechado sem merge** | Ligado à paridade ledger↔repo (A7) |

O repositório **não usa Issues** (0 abertas/fechadas): todo o backlog vive em documentos — e é por isso que ele se perdeu.

---

## 12. Plano de ataque recomendado

Ordenado por **retorno por esforço**. Cada onda destrava a seguinte.

### Onda 0 — Contenção (horas)
1. **Revogar o PAT do Supabase** no painel (A1 — já saiu dos arquivos, segue no histórico). Ligar secret scanning.
2. **Proteger `main`** e condicionar o deploy da Vercel ao CI (A6).
3. **Decidir o domínio oficial** e alinhar CSP + `config.toml` + crons (A4, CR13). *(CORS já resolvido em 12/10.)*
4. **Fechar o cadastro público** e restringir `evolution-api` a admin (A8, A10).

### Onda 1 — Fundação que destrava 60+ funcionalidades (≈ 1 semana)
1. **CR4** — concluir o PR #103: trocar os 41 `.catch()` restantes (29 funções) por `await` + checagem de erro → religa IA, DISC, assinatura, buscas, WhatsApp de entrada, validações.
2. **CR1 + CR2** — trocar a guarda por "cron **ou** usuário autenticado" e criar **uma** migration com os 21 agendamentos (`pg_cron` + `pg_net`, header via Vault, URL do projeto oficial) → religa sequências, nutrição, forecast, RevOps, lead score, MQL, CS, digest, DLQ, perfis.
3. **CR8** — corrigir os parâmetros/colunas errados (Registrar interação, Mesclar empresas, Criar deal, Conversation Intelligence, MQL, MCP).
4. **CR6** — confirmar no banco as views sem `user_id` e ajustar o escopo do proxy.
5. **MFA** — tela de desafio TOTP (A9).
6. **Erros de produção** — corrigir `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` no `errorReporting.ts`.

### Onda 2 — Verdade nas telas (≈ 1 semana)
1. **CR12** — remover ou substituir todo dado fictício (Analytics, Marketing Hub, EQ, velocidade, objeções, meta-programas, Carnegie, roadmap preditivo).
2. **§7** — ligar as funcionalidades prontas e escondidas (inscrições, MQL, Win/Loss, merge, playbook, esqueci senha, logs de Conexões).
3. **CR11** — dar produtor às tabelas lidas e nunca escritas, ou retirar as telas.
4. Links quebrados e as 43 páginas sem layout.

### Onda 3 — Canais de saída (≈ 2 semanas)
1. **CR3** — provedor de e-mail + `send-transactional-email`; "enviado" só após aceite.
2. WhatsApp: escolher **uma** função de envio, corrigir o webhook de entrada.
3. Web Push real (VAPID + criptografia) ou remover a promessa.
4. Landing page / formulário / lead magnet → contato + nurturing.

### Onda 4 — Reprodutibilidade e garantia (≈ 2–3 semanas)
1. **CR9 / A7** — baseline do schema canônico versionado + reconciliação do ledger até o "Supabase Preview" ficar verde.
2. **CR7** — *(tipos e typecheck real entregues em 12/10)*: falta o check de drift no CI e ligar `strictNullChecks`.
3. **CR10** — revisar o `REVOKE ALL` de julho contra o que o front lê.
4. **CR14** — esteira de deploy de Edge Functions/migrations + homologação; E2E e RLS fora de produção; `deno test` no CI; piso de cobertura.

### Onda 5 — Observabilidade e DR de verdade
Snapshot de saúde a cada 5 min, alertas reais (Slack/WhatsApp), partições do `audit_log`, retenção LGPD com dry-run, restore mensal comprovado (PR #97), decisão sobre Prometheus (subir de fato ou retirar da documentação).

### Onda 6 — Roadmap de produto
Só depois das anteriores: motor de `/automacoes`, Report Builder, dashboards embeddable, SSO, sincronização Bitrix24 de leads/deals, telefonia, melhorias de UX da §6.9.

---

## 13. O que não foi possível verificar

| Tema | Por quê | Como fechar |
|---|---|---|
| Jobs reais em `cron.job` no banco de produção | Sem acesso SQL | `SELECT jobname, schedule, command FROM cron.job;` e anexar ao repositório |
| Se as views do canônico têm `user_id` (CR6) | Sem acesso SQL | `information_schema.columns` das 33 views |
| Grants reais das 32–36 tabelas revogadas (CR10) | Sem acesso SQL | `has_table_privilege('authenticated', …)` |
| GUC `app.connection_encryption_key` configurado (A3) | Sem acesso SQL | `current_setting(...)` |
| Secrets das Edge Functions (Twilio, Firecrawl, EnrichLayer, `CRON_SECRET`, webhooks) | Fora do repositório | Painel do Supabase |
| HIBP / política de senha do Auth | Fora do repositório | Painel do Supabase |
| Uso real de `evolution-api`, Lux/n8n, Bitrix | Logs do gateway | Logs das Edge Functions |
| Qual front os usuários realmente usam (Vercel × Lovable) | Analytics | Logs de acesso / analytics dos dois domínios |

---

## 14. Anexos e método

### 14.1 Anexos (evidência completa, `arquivo:linha`)

| Anexo | Conteúdo | Itens |
|---|---|---|
| [`docs/lacunas/A_docs_raiz_e_memoria_lovable.md`](docs/lacunas/A_docs_raiz_e_memoria_lovable.md) | README, FUNCIONALIDADES, FIELD_MAPPING, HANDOFF, CHANGELOG, auditorias da raiz, `.lovable/plan.md`, 98 memórias Lovable | 353 verificados · 97 lacunas |
| [`docs/lacunas/B1_reverificacao_estado_01_04.md`](docs/lacunas/B1_reverificacao_estado_01_04.md) | Reverificação item a item de `docs/estado/01–04` (Core, IA, Marketing, RevOps) | 111 pendências |
| [`docs/lacunas/B2_reverificacao_estado_05_10.md`](docs/lacunas/B2_reverificacao_estado_05_10.md) | `ESTADO_ATUAL.md` (riscos e plano) + `docs/estado/05–12` + status de cada cron | 149 itens |
| [`docs/lacunas/C1_docs_produto_ux_qa.md`](docs/lacunas/C1_docs_produto_ux_qa.md) | Estratégia de produto/UX, QA, TECH_DEBT, auditorias 00–06 e 99, dicionários de dados | 882 verificados |
| [`docs/lacunas/C2_adrs_migracao_dr_operacao.md`](docs/lacunas/C2_adrs_migracao_dr_operacao.md) | 22 ADRs, migração, hardening, DR, runbooks, monitoring | 194 itens |
| [`docs/lacunas/D_ui_rotas_componentes.md`](docs/lacunas/D_ui_rotas_componentes.md) | 113 rotas, navegação, placeholders, handlers falsos, componentes órfãos, flags, fluxos públicos | 96 achados |
| [`docs/lacunas/E_contratos_front_backend.md`](docs/lacunas/E_contratos_front_backend.md) | Tabelas, RPCs, colunas e funções que o front chama × o que existe | 101 achados |
| [`docs/lacunas/F_edge_functions.md`](docs/lacunas/F_edge_functions.md) | Inventário das 108 Edge Functions (gatilho, secrets, status) + padrões sistêmicos | 108 + 8 sistêmicos |
| [`docs/lacunas/G_banco_de_dados.md`](docs/lacunas/G_banco_de_dados.md) | Inventário do schema, tabelas sem consumidor/produtor, funções sem chamador, cron, filas, testes SQL, sistema de origem | 38 lacunas agregadas |
| [`docs/lacunas/H_ci_testes_deploy_infra.md`](docs/lacunas/H_ci_testes_deploy_infra.md) | CI, testes, deploy, PWA, env, monitoring, scripts | 58 lacunas |

### 14.2 Método

1. **Inventário de promessas:** leitura de todos os documentos (raiz, `docs/`, `.lovable/`, `.devin/`, `.windsurf/`), ADRs, memórias e da própria UI (textos, botões, "em breve").
2. **Verificação no código atual:** cada promessa foi seguida pelo fio **tela → hook → RPC/tabela/Edge Function → gatilho/cron** com `grep`/leitura em `src/`, `supabase/functions/`, `supabase/migrations/`, `.github/`, `tests/`, `scripts/`.
3. **Reverificação da auditoria anterior** (`ESTADO_ATUAL.md` e `docs/estado/`, commit `0fa6177`, 16/08/2026), linha a linha das tabelas de evidência — não dos resumos.
4. **Checagens de runtime somente leitura:** API do GitHub (CI, checks, PRs), `OPTIONS` nas Edge Functions publicadas, `GET /auth/v1/settings`, API da Vercel (domínios).
5. **Reprodução empírica** de defeitos sistêmicos fora do repositório (ex.: `.catch()` no builder do `supabase-js` 2.117.3).
6. **Reconferência pelo autor do consolidado** dos itens críticos citados neste documento (marcados "reconferido").

**Limites:** sem acesso SQL ao banco de produção; o grafo `graphify-out/` estava defasado (commit `b2443cd0`) e não foi usado como fonte; contagens entre fatias se sobrepõem por desenho.
