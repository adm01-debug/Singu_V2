# 🎯 Matriz de Risco Consolidada — Auditoria SINGU CRM v2

> Consolidação severizada de todas as frentes. Fase: **descoberta e documentação** (nenhuma correção aplicada).
> Documentos-fonte: `01_ACHADOS_SEGURANCA.md`, `02_ACHADOS_EDGE_FUNCTIONS.md`, `03_ACHADOS_FRONTEND.md`, `04_ACHADOS_BANCO.md`, `05_ACHADOS_TESTES_BUILD_DOCS.md`.

## Placar por severidade

| Severidade | Qtde | IDs |
|---|---|---|
| 🔴 **CRÍTICA** | 3 | SEC-1, FE-1, FE-2 |
| 🟠 **ALTA** | 12 | SEC-2, SEC-3, SEC-4, EF-1, EF-2, EF-3, EF-4, EF-5, EF-6, EF-7, BD-1, TQ-1, TQ-4, TQ-10 |
| 🟡 **MÉDIA** | 20 | SEC-5, SEC-6, EF-8..EF-14, BD-2..BD-6, FE-4..FE-7, TQ-6..TQ-9 |
| 🟢 **BAIXA** | 15+ | SEC-7, EF-15..EF-17, BD-7..BD-10, FE-8..FE-10, TQ-11..TQ-13 |

> Nota: FE-1/FE-2 são marcados CRÍTICO pelo agente de frontend no sentido de **quebra sistêmica de garantias** (type-safety e padrão de dados), não de exploração remota. A prioridade de negócio real está em SEC-1/SEC-2/SEC-3/SEC-4 (dados de cliente).

---

## Top 10 riscos prioritários (severidade × explorabilidade × impacto de dados)

| # | ID | Risco | Por que importa |
|---|----|-------|-----------------|
| 1 | **SEC-1** | View `document_signatures_public`/`csat_surveys_public` vaza `signature_token`/`public_token` a `anon` | Atacante **anônimo** enumera e **assina/recusa documentos** de terceiros com a anon key pública. Perda de integridade legal + PII. |
| 2 | **SEC-2** | Proxy `external-data` = CRUD total na base externa gated só por "autenticado" | Qualquer conta logada **lê/edita/deleta/exporta** todo o CRM (contatos, empresas, deals) de todos. RLS neutralizado no caminho primário. |
| 3 | **SEC-3** | Webhooks Bitrix/Evolution/Lux com service_role sem verificação de assinatura | Qualquer um **forja** eventos e sobrescreve entidades com privilégio total. |
| 4 | **SEC-4** | ~10 crons de envio/processamento sem `CRON_SECRET` | Disparo forçado de e-mail/WhatsApp/SMS → spam, esgotamento de quota, **DoS de custo**. |
| 5 | **EF-1** | `evolution-webhook` `ReferenceError` em todo sucesso → 500 + inserts duplicados | Ingestão WhatsApp **quebrada** + duplicação de `interactions` por retry. |
| 6 | **EF-6** | Filas/crons sem claim atômico → double-processing | Emails/SMS/tarefas **duplicados** (custo real e compliance). |
| 7 | **EF-2** | `whatsapp-import` import inexistente (`/cors`) → função não sobe | Funcionalidade **100% indisponível**. |
| 8 | **EF-3** | Nenhum timeout em ~40 chamadas externas | Upstream travado prende isolates e **filas inteiras**. |
| 9 | **TQ-10 + TQ-1** | CI falha no startup (actions `@v6/@v7` inexistentes); e se subisse, lint reprova (1.306 erros) | **Nenhum gate de qualidade roda** — o selo "10/10" não é verificado por máquina. |
| 10 | **BD-1** | `DROP TABLE deals CASCADE` sem recriação na mesma migration | Replay/reset da chain tem janela sem `deals`; risco de falha de provisionamento. |

---

## Tema transversal (a "grande narrativa" da auditoria)

O SINGU **não é** um sistema mal construído — há ilhas de real excelência: `incoming-webhook` (HMAC + anti-replay + DLQ), `external-data` (whitelist + optimistic locking + statement timeout), search_path hardening abrangente, DOMPurify correto, RLS com cobertura de schema quase total, cleanup de realtime, guards de divisão por zero, e uma suíte de **5.494 testes reais e verdes**.

O problema é **inconsistência sistêmica + documentação enganosa**:
1. **Os controles certos existem, mas não foram propagados.** `requireWebhookSecret` existe e ninguém usa (exceto 1); `requireCronSecret` protege 11 crons mas os que enviam mensagens ficaram de fora; timeout de fetch existe em 4 de ~40 callers. O time sabe fazer certo — mas por cópia-e-cola divergente, metade do sistema ficou frágil.
2. **A autorização do caminho de dados central anula o RLS elogiado.** Toda a garantia de segurança apresentada na doc (RLS 100%) é bypassada pelo proxy `external-data` + views públicas.
3. **A documentação é marketing, não engenharia.** "10/10", "Zero any" (são 108-119), "CSP restritiva" (inexistente), "100% RLS" (contornado), e docs internos que se contradizem (um diz 5 mil testes, outro diz "ZERO", e chamam o produto de "RelateIQ"). O único selo honesto — a suíte de testes — está desatualizado para *menos*.
4. **Os gates de qualidade não executam.** CI falha no startup; RLS matrix e E2E críticos auto-pulam; lint reprovaria. Nada disso protege o `main` de fato.

---

## Sequência de remediação recomendada (Fase V — NÃO executada nesta entrega)

**Onda 1 — Contenção de segurança (dias):** SEC-1 (remover token das views/exigir posse do token), SEC-3 (HMAC em todos os webhooks), SEC-4 (`requireCronSecret` nos crons faltantes), EF-1/EF-2 (consertar os 2 bugs que quebram funções).

**Onda 2 — Autorização e integridade (1–2 semanas):** SEC-2 (checagem de tenant/ownership no `external-data`), EF-6 (claim atômico `FOR UPDATE SKIP LOCKED`/RPC), EF-7 (idempotência de SMS), BD-1 (consolidar a saga de `deals`), BD-3 (`search_path` nas 10 funções).

**Onda 3 — Robustez e qualidade (contínuo):** EF-3 (timeouts), TQ-10 (corrigir versões de actions da CI), TQ-1 (zerar erros de lint ou ajustar regras), endurecer TS (`strict`/`strictNullChecks`) de forma incremental, FE-1/FE-2 (erradicar `any` e migrar fetch-em-`useEffect`).

**Onda 4 — Higiene e verdade (contínuo):** CSP real via headers (TQ-7), PWA sem PII (TQ-8), unicidade/índice de e-mail (BD-5/BD-6), quebrar arquivos gigantes (FE-3), **reescrever a documentação para refletir a realidade** e adicionar gates de CI que de fato bloqueiem merge.

> Estimativa grosseira: **3 CRÍTICOS + 12 ALTOS** exigem atenção antes de qualquer alegação de "produção enterprise". A base é recuperável e tem fundações boas; o trabalho é de **consistência e honestidade**, não de reescrita.
