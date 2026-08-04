---
name: bulk revalidation flow
description: Card em /enrichment para revalidação manual em massa de emails/telefones com filtros (status, idade, limite) e preview server-side via edge function bulk-revalidate
type: feature
---

## Revalidação em massa

### UI
- `BulkRevalidateCard` em `/enrichment` (abaixo do `ValidationQueueCard`)
- Filtros: kind (email/phone/both), statuses multi-select (valid/invalid/risky/unknown/never), slider olderThanDays (0-180), limit (50/200/500/1000)
- Preview ao vivo via `useBulkRevalidatePreview` (dryRun=true, staleTime 10s)
- Botão confirma via AlertDialog antes de enfileirar
- Toast de sucesso traz ação "Ver fila" que rola até `#validation-queue-card`

### Edge function `bulk-revalidate`
- Body Zod: `{ kind, statuses, olderThanDays, limit, dryRun }`
- JWT obrigatório, rate limit 10 req/min por IP
- Busca contatos do user, junta com último `email_verifications`/`phone_validations` em chunks de 500
- Filtra por status atual e idade da última verificação
- `dryRun=true` retorna apenas contagens; senão insere em `validation_queue` (status='pending')
- Worker existente (`validation-queue-worker`) drena normalmente

### Hooks
- `useBulkRevalidatePreview(filters, enabled)` — TanStack Query
- `useBulkRevalidate()` — mutation, invalida `validation-queue-stats`

### Restrições
- Não recria edge functions de validação — apenas alimenta a fila
- Limite máximo absoluto: 2000 itens por execução
