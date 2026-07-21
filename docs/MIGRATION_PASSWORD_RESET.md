# Reset de Senhas Pós-Migração — Runbook

> Fluxo para forçar redefinição de senha no primeiro login após o cutover
> "Big-Bang" para um novo Supabase (Opção B — inclui `auth.users`).

## Visão geral

1. Marcar todos os usuários migrados com `must_reset_password: true`.
2. Elevar o rate limit de emails auth durante a janela de disparo.
3. Disparar em massa `generateLink(type='recovery')` para cada usuário.
4. Ao entrar, o app detecta a flag, encerra a sessão e envia o usuário para
   `/reset-password?forced=true`.
5. Após `updateUser({ password })`, a edge function `clear-must-reset-flag`
   remove a flag e marca `completed_at` em `migration_password_reset_log`.

## Pré-requisitos

- Migração DDL + dados aplicada no destino (ver `MIGRATION_DDL.md` /
  `MIGRATION_DATA.md`).
- `auth.users` importado com sucesso.
- Domínio de e-mail verificado no destino (Cloud → Emails).
- `SITE_URL` correto no destino (Supabase → Auth → URL configuration).
- `env.migration` preenchido com `TARGET_SUPABASE_URL`,
  `TARGET_SERVICE_ROLE_KEY`, `TARGET_SITE_URL`.
- Deno ≥ 1.40 instalado localmente para rodar o worker.
- Edge function `clear-must-reset-flag` deployada no destino.

## Comunicação prévia (48h antes)

Envie aviso in-app + email transacional aos usuários:

> "Nos próximos dias migraremos o SINGU CRM para uma nova infraestrutura.
>  Por segurança, você receberá um link para redefinir sua senha antes do
>  próximo acesso. Nenhuma ação é necessária agora."

## Passo-a-passo (janela de cutover)

### 1. Criar tabela de log no destino

```bash
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 \
  -f scripts/migration/sql/create-reset-log.sql
```

### 2. Marcar usuários com must_reset_password

```bash
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 \
  -f scripts/migration/sql/mark-must-reset.sql
```

A query final imprime `must_reset / total_users` — anote para comparar com
os envios.

### 3. Elevar rate limit auth (temporário)

No dashboard Supabase do destino: **Auth → Rate Limits → Emails sent** → 1000/h.
Anote o valor original para restaurar após a janela.

### 4. Dry-run

```bash
./scripts/migration/reset-passwords.sh --dry-run
```

Confirma paginação, filtragem de providers sociais e idempotência. Nenhum
e-mail é enviado.

### 5. Disparo real

```bash
./scripts/migration/reset-passwords.sh
```

Logs JSONL em `scripts/migration/logs/reset-passwords-<TS>.jsonl`.
O script processa lotes de 100 com 10s de pausa entre eles e throttle de
10 req/s dentro do lote. Rerun é seguro: usuários já com `status='sent'`
são pulados.

### 6. Monitoramento em tempo real

```sql
-- Progresso agregado
SELECT status, count(*) FROM public.migration_password_reset_log GROUP BY 1;

-- Falhas mais recentes
SELECT user_id, email_hash, error_code, error_message, attempts, updated_at
FROM public.migration_password_reset_log
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 50;

-- Taxa de conclusão (usuários que efetivamente resetaram)
SELECT
  count(*) FILTER (WHERE completed_at IS NOT NULL) AS completed,
  count(*) FILTER (WHERE status = 'sent')          AS sent_total,
  round(100.0 * count(*) FILTER (WHERE completed_at IS NOT NULL)
        / NULLIF(count(*) FILTER (WHERE status = 'sent'), 0), 2) AS pct
FROM public.migration_password_reset_log;
```

Cruze com `email_send_log` (delivery/bounce) e com a página admin
`/admin/error-budget` (métricas agregadas).

### 7. Reprocessar falhas

```sql
-- Marcar 'failed' → 'pending' para o script reprocessar
UPDATE public.migration_password_reset_log
SET status = 'pending', attempts = 0
WHERE status = 'failed';
```

Depois rode `reset-passwords.sh` novamente.

### 8. Restaurar rate limit

Após o disparo terminar, retorne o rate limit ao valor original.

## Rollback

Se algo der errado (ex.: usuário legítimo travado sem receber o e-mail),
remova a flag de forma cirúrgica:

```bash
./scripts/migration/unmark-must-reset.sh usuario@exemplo.com
```

Ou, em cenário catastrófico:

```bash
./scripts/migration/unmark-must-reset.sh --all
```

O usuário volta a fazer login com a senha migrada.

## Métricas de sucesso

- **24h:** ≥ 40% dos usuários com `completed_at IS NOT NULL`.
- **7d:**  ≥ 80%.
- **30d:** ≥ 95%. Para os 5% restantes, considerar contato ativo
  (WhatsApp/telefone) ou desativação temporária da conta.

## Notas técnicas

- **Escopo:** apenas usuários com `provider='email'` em `auth.identities`.
  Contas exclusivamente sociais (Google/Apple) são ignoradas — o SSO
  continua funcionando sem interrupção.
- **Idempotência:** `migration_password_reset_log.user_id` é `UNIQUE`;
  reruns pulam envios bem-sucedidos.
- **Segurança:** o log armazena apenas `sha256(lower(email))`, nunca o
  e-mail em claro. `service_role` só é usado localmente pelo worker; nunca
  vai ao frontend.
- **Guard client-side:** `useAuth.signIn` verifica
  `user_metadata.must_reset_password`; se `true`, chama
  `resetPasswordForEmail`, faz `signOut` e mostra toast informando que o
  link foi enviado.
- **Limpeza:** `clear-must-reset-flag` valida o JWT do próprio usuário,
  usa `service_role` para remover as chaves `must_reset_password` e
  `migrated_at` do `user_metadata`, e marca `completed_at`.

## Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `scripts/migration/sql/create-reset-log.sql` | Tabela de log (destino) |
| `scripts/migration/sql/mark-must-reset.sql`  | Marca todos os usuários migrados |
| `scripts/migration/reset-passwords.ts`       | Worker Deno (Admin API) |
| `scripts/migration/reset-passwords.sh`       | Wrapper com env + logging |
| `scripts/migration/unmark-must-reset.sh`     | Rollback por email ou `--all` |
| `supabase/functions/clear-must-reset-flag/`  | Edge function pós-reset |
| `supabase/functions/_shared/email-templates/password-migration-reset.tsx` | Template opcional |
| `src/hooks/useAuth.tsx`                      | Guard no `signIn` |
| `src/pages/ResetPassword.tsx`                | Banner `?forced=true` + limpeza |