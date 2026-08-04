# Superfície do Sistema — Rodada 27/10

Snapshot em 22/07/2026. Fonte: `src/pages/`, `supabase/functions/`, `src/hooks/`, `src/app/AppRoutes.tsx`.

## Totais
| Camada | Contagem |
| --- | --- |
| Páginas React (`src/pages/*.tsx`) | 121 |
| Edge functions (`supabase/functions/*`) | 109 |
| Hooks (`src/hooks/**`) | 378 |
| Tabelas `public.*` com RLS | 250+ |

## Módulos principais mapeados
CRM Core, Cadastro, Contatos/Ficha360, Empresas, Pipeline/Deals, Interações, WhatsApp,
Histórico Unificado, Perfis Comportamentais, Inbox/Tarefas, Notificações, Sequências,
Campanhas, Landing Pages, Ask CRM, Territórios, ABM, Intent Data, Enrichment,
Admin (Audit-Trail, Error-Logs, Error-Budget, Lux-Config, Email-Diagnostics,
Voice-Diagnostics, Conexões-Logs, Knowledge-Export, Field-Mapping, Schema-Drift,
Secrets-Management, Telemetria).

Cobertura E2E existente: `e2e/smoke.spec.ts` (3 jornadas), `tests/contatos-excelencia.spec.ts`,
`tests/contacts-rapport.spec.ts`, `tests/e2e/auth-parallel-refresh.spec.ts`,
`tests/e2e/contacts.spec.ts`, `tests/e2e/navigation.spec.ts`.

Gaps identificados (sem cobertura E2E dedicada — recomendado adicionar antes da próxima release):
Ask CRM, ABM Campaigns, Intent Setup, Landing Pages públicas `/lp/:slug`, Deal Rooms
públicos, Enrichment (email/phone), Territórios, Nurturing, NPS, Custom Reports.