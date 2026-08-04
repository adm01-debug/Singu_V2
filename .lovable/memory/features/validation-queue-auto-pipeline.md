---
name: validation queue auto-pipeline
description: Fila assíncrona de validação que enfileira emails/phones de contatos via trigger DB e processa via worker + pg_cron com revalidação periódica
type: feature
---

## Pipeline automático de validação

### Trigger DB
- `trg_enqueue_contact_validation` em `public.contacts` (AFTER INSERT/UPDATE OF email, phone)
- Função `enqueue_contact_validation()` SECURITY DEFINER insere em `validation_queue` quando email/phone muda ou é criado

### Tabela `validation_queue`
- Colunas: id, user_id, contact_id, kind ('email'|'phone'), value, status ('pending'|'processing'|'done'|'error'), attempts, last_error, created_at, processed_at
- RLS: SELECT/INSERT/UPDATE só pelo dono (auth.uid = user_id)
- Índices: (status, created_at), (contact_id), (user_id)

### Edge function `validation-queue-worker`
- Pega lote de até 50 itens `pending` com `attempts < 3`, marca `processing`
- Despacha para `email-verifier` ou `phone-validator` via service-role
- Marca `done` em sucesso, `pending` (retry) ou `error` (3 tentativas) em falha
- Rate limit: 12 req/min por IP

### pg_cron
- `validation-queue-drain` — `*/5 * * * *` invoca worker via pg_net
- `revalidate-stale-emails` — `0 4 * * *` re-enfileira emails com `verified_at < now() - 30d` (até 500/dia)
- `revalidate-stale-phones` — `30 4 * * *` re-enfileira phones com `validated_at < now() - 90d` (até 500/dia)

### UI
- `ValidationQueueCard` em `/enrichment` mostra contagens das últimas 24h (refetch 30s)
- Botão "Processar agora" (admin via `useIsAdmin`) invoca worker manualmente
- Hooks: `useValidationQueueStats`, `useTriggerQueueWorker` em `src/hooks/useValidationQueue.ts`
