# public.incoming_webhooks

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `token` | `text` | não |  |  |  |
| 5 | `target_entity` | `text` | não |  |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `allowed_origins` | `text[]` | sim | `ARRAY[]::text[]` |  |  |
| 8 | `field_mapping` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `total_calls` | `bigint` | não | `0` |  |  |
| 10 | `total_errors` | `bigint` | não | `0` |  |  |
| 11 | `last_called_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_by` | `uuid` | não |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `webhook_secret` | `text` | sim |  |  |  |
| 16 | `require_signature` | `boolean` | não | `true` |  |  |
| 17 | `replay_window_seconds` | `integer` | não | `300` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| incoming_webhooks_active_signature_check | CHECK | `CHECK (NOT is_active OR require_signature AND webhook_secret IS NOT NULL AND length(webhook_secret) >= 32)` |  |  | sim |
| incoming_webhooks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| incoming_webhooks_target_entity_check | CHECK | `CHECK (target_entity = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text, 'interaction'::text, 'note'::text, 'custom'::text]))` |  |  | sim |
| incoming_webhooks_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.incoming_webhook_nonces | incoming_webhook_nonces_webhook_id_fkey | webhook_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| incoming_webhooks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX incoming_webhooks_pkey ON public.incoming_webhooks USING btree (id)` |
| incoming_webhooks_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX incoming_webhooks_token_key ON public.incoming_webhooks USING btree (token)` |


## Policies (RLS)

### `admins manage incoming_webhooks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_audit_incoming_webhooks | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_connection_changes |
| trg_incoming_webhooks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
