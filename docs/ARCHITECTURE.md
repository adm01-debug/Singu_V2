# SINGU CRM — Arquitetura Consolidada

> Documento vivo. Atualizado em 2026-04-19 (Rodada G — 35/35 melhorias).

## 1. Visão Geral

SINGU é um CRM de vendas inteligente com análise comportamental (DISC, Inteligência
Emocional, Vieses Cognitivos), pipeline Kanban, gamificação e integrações
externas (WhatsApp, Email, Voice AI). Frontend React + TanStack Query, backend
Lovable Cloud (Supabase) com banco externo acessado via proxy edge function.

## 2. Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + Vite 5 + TypeScript 5 |
| Estilo | Tailwind v3 + shadcn/ui (tokens semânticos HSL) |
| Estado servidor | TanStack Query (exclusivo, sem `useEffect` para fetch) |
| Estado local | Zustand (sidebar) + URL params (filtros) |
| Backend | Lovable Cloud / Supabase (auth, RLS, triggers, edge functions) |
| Edge runtime | Deno + Zod + esm.sh |
| Banco externo | Supabase remoto via `external-data` proxy (RPC bridge) |
| Mapas | Leaflet 4.2.1 (pinned) |
| Testes | Vitest + Testing Library + Playwright (smoke E2E) |

## 3. Fluxo de dados

```
UI → useQuery/useMutation → Supabase Client (local) | external-data proxy → Banco externo
                                                  ↘ Edge Functions (AI, Lux, etc.)
```

Toda escrita/leitura no banco externo passa pelo proxy `external-data` para
validação de tabelas/RPCs e RLS-on-bridge.

## 4. Resiliência

| Padrão | Onde |
|--------|------|
| Circuit breaker + backoff exponencial | `lib/externalData.ts`, `useCircuitBreakerHandler` |
| Snapshot/Restore optimistic | `useMoveDeal`, `useCompleteTask`, `useRestoreEntity` |
| Fallback graceful (RPC → table query) | `useTasks`, `useInteractions` |
| `Array.isArray()` guard | obrigatório antes de iterar dados externos |
| `ExternalDataCard` | UI universal para loading/error/empty |
| ErrorBoundary granular | Pipeline, Inbox, EntityDetail |

## 5. Segurança

- **RLS** em todas as tabelas com `user_id`.
- **RBAC** via `has_role()` SECURITY DEFINER + `useIsAdmin`.
- **Brute-force**: `rateLimiter.ts` (5 tentativas / 15 min) no login.
- **Rate limit edge**: in-memory sliding window por IP (limites por função).
- **Audit trail**: triggers DB → `audit_log` table → painel `/admin/audit-trail`.
- **Linter baseline**: 0 CRITICAL/HIGH; warnings documentados.

## 6. Observabilidade

| Camada | Ferramenta |
|--------|-----------|
| Erros front-end | `errorReporting.ts` (window.onerror, unhandledrejection, QueryCache) |
| Web Vitals | `useWebVitals` → captureError quando excede thresholds |
| Painel admin | `/admin/error-logs` com filtros por severidade e fonte |
| Telemetria queries lentas | `useSlowQueryDetector` (>3s) com badge global |
| Health check edge | `/health` function para SRE |
| Logs estruturados | JSON com `requestId` por request em edge functions críticas |

## 7. Rotas críticas

| Rota | Módulo | Notas |
|------|--------|-------|
| `/` | Dashboard | KPIs executivos, alertas, atividade recente |
| `/contatos` | Contatos | CRUD + DISC + cadência + Undo destrutivo |
| `/empresas` | Empresas | CRUD + mapa + hierarquia + Undo destrutivo |
| `/pipeline` | Kanban | Forecast ponderado, snapshot/restore em moves |
| `/interacoes` | Conversas | Timeline unificada (email, WhatsApp, voz) |
| `/inbox` | Tarefas | Optimistic complete + Undo |
| `/admin/error-logs` | Admin | Painel de telemetria |
| `/admin/audit-trail` | Admin | Diff colorido de mudanças |
| `/admin/docs` | Admin | Documentação inline |

## 8. Módulos por área

- **Inteligência**: DISC, IE, Vieses, Carnegie, NLP, Lead Scoring, Churn Risk
- **Comunicação**: WhatsApp Enterprise, Email Builder, Sequências multi-canal
- **Estratégia**: ABM, Pipeline, Forecast, Territories, Lead Routing
- **Operação**: Tarefas, Reminders, Help Desk, Document Templates
- **Admin**: Audit, Telemetry, Schema Drift, Secrets, Docs, Error Logs

## 9. Módulos proibidos

- **Produtos**: gerenciado pelo ERP externo.
- **Propostas**: gerenciado pelo ERP externo.

## 10. Padrões obrigatórios

1. Português em todo texto, doc e resposta.
2. Máximo 400 linhas por arquivo `.ts`/`.tsx`.
3. Zero `any`, zero `dangerouslySetInnerHTML`.
4. Tokens semânticos HSL — sem cores hardcoded em componentes.
5. `useActionToast.destructive` em deletes com Undo via snapshot.
6. Reusar primitivas existentes (Sonner, Skeleton, Sheet, Dialog).

## 11. Estrutura de diretórios

```
src/
├── components/{admin,contacts,companies,pipeline,feedback,ui,...}
├── hooks/         # ~280 custom hooks
├── lib/           # logger, externalData, errorReporting, queryErrorReporter
├── integrations/  # supabase client + types (auto-gerado)
├── pages/         # 1 página por rota
└── contexts/

supabase/
├── functions/{external-data, ask-crm, meeting-summary, _shared, ...}
├── migrations/    # SQL (auto-gerado)
└── config.toml

e2e/               # Playwright smoke tests
scripts/           # check-bundle-size.mjs, etc.
docs/adr/          # Architecture Decision Records
```
