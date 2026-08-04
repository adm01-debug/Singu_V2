# 🧭 Plano Mestre de Auditoria Exaustiva — SINGU CRM v2

> **Responsável técnico:** Auditoria sênior (perfil PhD em Análise de Sistemas)
> **Data de início:** 2026-07-18
> **Branch:** `claude/system-audit-comprehensive-6svrho`
> **Postura:** Ceticismo metodológico. A documentação existente (`README.md`, `ARCHITECTURE.md`, `audit_report.md`, `AUDITORIA_SISTEMA.md`) afirma "10/10", "100% RLS", "Zero any", "4.470 testes". **Nada disso é aceito sem verificação contra o código-fonte real.**

---

## 0. Contexto do Sistema (ground truth medido)

| Métrica | Valor real medido | O que a doc alega |
|---|---|---|
| Arquivos rastreados (git) | **2.249** | — |
| Arquivos `.tsx` | 1.071 | — |
| Arquivos `.ts` | 745 | — |
| Migrations SQL | **262** | "~50 migrations" |
| Edge Functions | **106** (105 + `_shared`) | "31 Edge Functions" / "100" |
| Páginas | ~95 | "106 rotas" |
| Hooks | **371** | "370" |
| `strict` no TS | **`false`** | "Zero any types" |
| `strictNullChecks` | **`false`** | — |
| Ocorrências de `any` | **68** (confirmado) | "Zero any" |
| `dangerouslySetInnerHTML` | **2** | "Zero dangerouslySetInnerHTML" |
| `TODO/FIXME/HACK/XXX` | **319** | "100% implementado" |
| Edge functions com `service_role` | **81** | — |

> Já na primeira varredura, **cinco alegações centrais da documentação são falsas ou imprecisas**. Isso define o tom da auditoria: a documentação é material de marketing, não de engenharia.

---

## 1. A Missão Global dividida em 30 Etapas

A missão — *"encontrar todas as falhas e gaps do sistema, módulo a módulo, linha a linha"* — é decomposta em 30 frentes de trabalho auditáveis e independentemente verificáveis:

### Bloco A — Fundações e Verdade Estrutural (1–6)
1. **Inventário real** — contar e catalogar cada módulo, rota, hook, edge function, tabela e migration; produzir o "mapa da verdade".
2. **Auditoria de configuração de build** — `vite.config.ts`, `tsconfig*`, `eslint.config.js`, `postcss`, `tailwind.config.ts`; rigor do compilador e do linter.
3. **Auditoria de dependências** — dois lockfiles (`bun.lock` + `package-lock.json`), versões, `@types` mal-posicionados, deps órfãs, vulnerabilidades óbvias.
4. **Verificação das alegações da documentação** — cada afirmação de `README`/`ARCHITECTURE`/`audit_report` conferida contra o código.
5. **Auditoria de CI/CD** — `.github/`, gates de qualidade, se testes/lint/typecheck rodam de fato.
6. **Auditoria de variáveis de ambiente e segredos** — `.env.example`, segredos hardcoded, exposição de chaves no bundle.

### Bloco B — Segurança (7–13)
7. **RLS por tabela** — cobertura real de Row-Level Security nas 262 migrations.
8. **Qualidade das políticas RLS** — `USING (true)`, ausência de `WITH CHECK`, escopo por `user_id`.
9. **`SECURITY DEFINER` e `search_path`** — funções privilegiadas e superfície de ataque.
10. **Autenticação nas Edge Functions** — validação de JWT, `verify_jwt`, autorização vs autenticação.
11. **Uso de `service_role`** — as 81 referências: elevação de privilégio indevida.
12. **Superfícies públicas** — rotas/funções públicas (forms, deal rooms, assinaturas, surveys) e vazamento de dados.
13. **Injeção e XSS** — proxy `external-data`, SQL dinâmico, `dangerouslySetInnerHTML`, sanitização.

### Bloco C — Backend / Edge Functions (14–19)
14. **Validação de entrada** — Zod real vs prometido; parsing sem guarda.
15. **Tratamento de erros** — catches vazios, vazamento de stack, status codes.
16. **Resiliência** — circuit breaker e rate limiting: existem? são in-memory (voláteis)?
17. **Integrações externas** — timeouts, retries, falhas em cascata (WhatsApp, Firecrawl, EnrichLayer, ElevenLabs, IA, n8n).
18. **Jobs/cron e filas/DLQ** — idempotência, race conditions, poison messages, perda de eventos.
19. **Duplicação e helpers `_shared`** — inconsistências e código copiado.

### Bloco D — Banco de Dados (20–23)
20. **Integridade das migrations** — destrutivas, não-idempotentes, ordem/timestamps, contradições.
21. **Índices e performance** — FKs sem índice, colunas de filtro sem índice, índices redundantes.
22. **Constraints e integridade referencial** — `ON DELETE`, `NOT NULL`, unicidade, `CHECK`.
23. **Drift schema × código** — tabelas/colunas referenciadas no código que divergem do schema.

### Bloco E — Frontend (24–28)
24. **Null-safety** — consequências de `strictNullChecks:false`: acessos inseguros, `.map` sem guarda.
25. **Padrões de data-fetching** — TanStack Query (staleTime, queryKeys, invalidação), `useEffect`-fetch proibido.
26. **Ciclo de vida e vazamentos** — `useEffect` deps, timers/subscriptions sem cleanup, realtime.
27. **Saúde do código** — arquivos >400 linhas, `any`, código morto, imports quebrados.
28. **Lógica de negócio no cliente** — hooks de cálculo (RFM, DISC, scores): divisão por zero, `NaN`, ordenação.

### Bloco F — Qualidade, Testes e Consolidação (29–30)
29. **Testes** — quantidade real vs "4.470", qualidade (triviais vs reais), e2e Playwright, execução.
30. **Consolidação e severização** — unificar achados, atribuir severidade/CVSS-like, priorizar, documentar exaustivamente.

---

## 2. Plano de Execução em 50 Etapas

> Fase atual do usuário: **"de início apenas descubra as falhas e documente"** → executamos as etapas de **DESCOBERTA e DOCUMENTAÇÃO** (1–34). As etapas de correção (35–50) ficam planejadas, **não executadas** nesta fase.

### Fase I — Preparação e Mapeamento (1–8)  ✅ em andamento
1. Clonar contexto, confirmar branch de trabalho e árvore limpa. ✅
2. Mapear estrutura de diretórios e contagem de artefatos. ✅
3. Ler documentação existente e extrair todas as alegações verificáveis. ✅
4. Rodar varreduras rápidas de risco (`any`, `dangerouslySetInnerHTML`, TODO, `service_role`). ✅
5. Medir rigor do TypeScript e ESLint. ✅
6. Registrar o "mapa da verdade" (tabela de métricas reais). ✅
7. Definir dimensões de auditoria e critérios de severidade.
8. Instanciar frentes de trabalho paralelas (agentes por dimensão). ✅

### Fase II — Descoberta por Dimensão (9–30)
9. **Segurança/RLS:** varrer 262 migrations por tabelas sem RLS.
10. **Segurança/RLS:** classificar políticas permissivas e sem `WITH CHECK`.
11. **Segurança:** auditar `SECURITY DEFINER` + `search_path`.
12. **Segurança:** mapear `verify_jwt` e validação de JWT nas 106 funções.
13. **Segurança:** auditar as 81 referências a `service_role`.
14. **Segurança:** testar superfícies públicas e vazamento de dados.
15. **Segurança:** analisar proxy `external-data` (injeção/whitelist) e XSS.
16. **Segurança:** caçar segredos hardcoded e exposição no bundle.
17. **Edge:** auditar validação de entrada (Zod) função a função.
18. **Edge:** auditar tratamento de erros e vazamento de informação.
19. **Edge:** verificar existência real de circuit breaker/rate limiting.
20. **Edge:** auditar integrações externas (timeouts/retries/cascata).
21. **Edge:** auditar cron/filas/DLQ (idempotência/races/perda).
22. **Banco:** detectar migrations destrutivas/não-idempotentes.
23. **Banco:** mapear índices ausentes/redundantes.
24. **Banco:** auditar constraints e integridade referencial.
25. **Banco:** detectar drift schema × código.
26. **Frontend:** mapear null-safety e acessos inseguros.
27. **Frontend:** auditar padrões TanStack Query e `useEffect`-fetch.
28. **Frontend:** detectar vazamentos de ciclo de vida e realtime.
29. **Frontend:** medir arquivos >400 linhas, `any`, código morto.
30. **Frontend:** auditar lógica de cálculo (RFM/DISC/scores).

### Fase III — Verificação Dinâmica e Testes (31–34)
31. Executar `test:unit` (Vitest) e capturar passa/falha/erro.
32. Executar `lint` e `tsc --noEmit`; capturar contagens reais.
33. Inventariar e avaliar testes e2e (Playwright) e a alegação "4.470 testes".
34. **Bateria E2E dirigida** por ferramenta/função crítica (rotas públicas, auth, CRUD core, proxy externo, webhooks) — smoke funcional onde executável no ambiente.

### Fase IV — Consolidação e Documentação (35–36 desta fase de descoberta)
35. Consolidar achados de todas as frentes, deduplicar e severizar.
36. Produzir os documentos de auditoria exaustivos (este plano + `01_ACHADOS_*` + matriz de risco) e abrir PR draft.

### Fase V — Remediação (PLANEJADA — não executada nesta fase) (37–50)
37. Priorizar achados por severidade × esforço (matriz).
38. Corrigir Críticos de segurança (RLS/auth/segredos).
39. Corrigir Críticos de integridade de dados (constraints/migrations).
40. Endurecer o compilador (`strict`, `strictNullChecks`) incrementalmente.
41. Corrigir bugs de null-safety de alto impacto.
42. Endurecer Edge Functions (validação/erros/resiliência).
43. Corrigir jobs/cron/filas (idempotência/races).
44. Adicionar índices e constraints faltantes.
45. Resolver drift schema × código.
46. Remover código morto e refatorar arquivos gigantes.
47. Elevar cobertura de testes real para os módulos de cálculo e segurança.
48. Adicionar gates de CI (lint/typecheck/testes obrigatórios).
49. Corrigir a documentação para refletir a realidade.
50. Reauditoria de verificação e assinatura de conformidade honesta.

---

## 3. Critérios de Severidade

| Severidade | Definição | Exemplo |
|---|---|---|
| **CRÍTICA** | Exploração remota, perda/vazamento de dados, ou quebra silenciosa de segurança em produção. | Tabela sem RLS com dados de cliente; webhook sem verificação; segredo no bundle. |
| **ALTA** | Bug que corrompe dados/decisões de negócio, ou vulnerabilidade que exige pré-condição. | Divisão por zero em score; `service_role` sem checagem; migration destrutiva. |
| **MÉDIA** | Falha funcional degradada, dívida técnica que amplia risco. | `useEffect`-fetch, falta de índice, catch vazio. |
| **BAIXA** | Higiene, consistência, manutenibilidade. | Código morto, arquivo >400 linhas, TODO. |

---

## 4. Artefatos desta Auditoria — ✅ CONCLUÍDOS (fase de descoberta)

- `docs/auditoria/00_PLANO_MESTRE_AUDITORIA.md` — este documento (missão em 30 etapas + plano em 50).
- `docs/auditoria/01_ACHADOS_SEGURANCA.md` — 7 achados (1 CRÍTICO, 3 ALTOS).
- `docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md` — 17 achados (2 CRÍTICOS de quebra de função).
- `docs/auditoria/03_ACHADOS_FRONTEND.md` — 11 achados (119 `any`, 72 fetch-em-useEffect, 65 arquivos >400 linhas).
- `docs/auditoria/04_ACHADOS_BANCO.md` — 11 achados (drift, DROP CASCADE, search_path, idempotência).
- `docs/auditoria/05_ACHADOS_TESTES_BUILD_DOCS.md` — 13 achados (5.494 testes reais, 1.306 erros de lint, CSP inexistente, CI quebrada).
- `docs/auditoria/99_MATRIZ_DE_RISCO.md` — consolidação severizada + Top 10 + ondas de remediação.

## 5. Status de Execução

| Fase | Etapas | Status |
|---|---|---|
| I — Preparação e Mapeamento | 1–8 | ✅ Concluída |
| II — Descoberta por Dimensão | 9–30 | ✅ Concluída (5 frentes) |
| III — Verificação Dinâmica e Testes | 31–34 | ✅ Concluída (vitest/tsc/eslint executados; E2E inventariado) |
| IV — Consolidação e Documentação | 35–36 | ✅ Concluída (matriz de risco + PR) |
| V — Remediação | 37–50 | ⏸️ **PLANEJADA — não executada** (aguarda decisão do usuário) |

**Achados totais: 3 CRÍTICOS · 12 ALTOS · 20 MÉDIOS · 15+ BAIXOS.**

> **Escopo desta entrega:** apenas descoberta e documentação. Nenhuma correção de código é aplicada — conforme instrução "de início apenas descubra as falhas e documente".
