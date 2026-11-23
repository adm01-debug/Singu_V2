# public.webhooks

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
| 3 | `url` | `text` | não |  |  |  |
| 4 | `events` | `text[]` | não |  |  |  |
| 5 | `secret` | `text` | sim |  |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `last_triggered_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `failure_count` | `integer` | sim | `0` |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhooks_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| webhooks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.webhook_logs | webhook_logs_webhook_id_fkey | webhook_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhooks_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_webhooks_created_by ON public.webhooks USING btree (created_by)` |
| webhooks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhooks_pkey ON public.webhooks USING btree (id)` |


## Policies (RLS)

### `webhooks_owner_admin_mfa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
