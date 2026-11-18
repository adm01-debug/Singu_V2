# public.incoming_webhook_nonces

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `webhook_id` | `uuid` | não |  |  |  |
| 2 | `idempotency_key` | `text` | não |  |  |  |
| 3 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| incoming_webhook_nonces_idempotency_key_check | CHECK | `CHECK (length(idempotency_key) >= 16 AND length(idempotency_key) <= 128)` |  |  | sim |
| incoming_webhook_nonces_pkey | PRIMARY KEY | `PRIMARY KEY (webhook_id, idempotency_key)` |  |  | sim |
| incoming_webhook_nonces_webhook_id_fkey | FOREIGN KEY | `FOREIGN KEY (webhook_id) REFERENCES incoming_webhooks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_incoming_webhook_nonces_expires_at | btree | expires_at | não | sim |  | `CREATE INDEX idx_incoming_webhook_nonces_expires_at ON public.incoming_webhook_nonces USING btree (expires_at)` |
| incoming_webhook_nonces_pkey | btree | webhook_id, idempotency_key | sim | sim |  | `CREATE UNIQUE INDEX incoming_webhook_nonces_pkey ON public.incoming_webhook_nonces USING btree (webhook_id, idempotency_key)` |


## Policies (RLS)

### `incoming_webhook_nonces_service_only`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
