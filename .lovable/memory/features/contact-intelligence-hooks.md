---
name: Contact Intelligence Hooks
description: Hooks que consomem RPCs do banco externo via callExternalRpc para inteligência 360° de contatos (intelligence, best time, duplicates, birthdays, orphans)
type: feature
---
Hooks prioritários da Fase 3 do plano de Contatos 10/10.

| Hook | RPC | Uso |
|---|---|---|
| `useContactIntelligence(id)` | `get_contact_intelligence` | Visão 360° (score, churn, canal, próxima ação) |
| `useBestContactTime(id)` | `get_best_contact_time` | Heatmap dia/hora com taxa de sucesso |
| `useDuplicateContacts()` | `get_duplicate_contacts` | Grupos de duplicatas para merge |
| `useBirthdayContacts(days)` | `get_birthday_contacts` | Aniversariantes próximos (default 30 dias) |
| `useOrphanContacts()` | `get_orphan_contacts` | Contatos sem empresa/interações/dados |

**Convenções:**
- Todas usam `callExternalRpc` de `@/lib/externalData` (passa pela edge function `external-data` action `rpc` com allowlist).
- StaleTime: 5min (intelligence/duplicates/orphans), 10min (best-time), 1h (birthdays).
- Retornam array ou objeto único — hooks normalizam para o formato esperado pela UI.
- Parâmetros de RPC seguem convenção `p_<nome>` (ex: `p_contact_id`, `p_days_ahead`).
