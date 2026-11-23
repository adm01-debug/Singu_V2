# public.integrations

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
| 3 | `type` | `text` | não |  |  |  |
| 4 | `provider` | `text` | não |  |  |  |
| 5 | `credentials` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 6 | `settings` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `last_sync_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `sync_status` | `text` | sim | `'idle'::text` |  |  |
| 10 | `sync_error` | `text` | sim |  |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| integrations_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| integrations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| integrations_sync_status_check | CHECK | `CHECK (sync_status = ANY (ARRAY['idle'::text, 'syncing'::text, 'success'::text, 'error'::text]))` |  |  | sim |
| integrations_type_check | CHECK | `CHECK (type = ANY (ARRAY['crm'::text, 'email'::text, 'whatsapp'::text, 'erp'::text, 'ecommerce'::text, 'payment'::text, 'analytics'::text, 'webhook'::text, 'api'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.integration_logs | integration_logs_integration_id_fkey | integration_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_integrations_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_integrations_created_by ON public.integrations USING btree (created_by)` |
| integrations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX integrations_pkey ON public.integrations USING btree (id)` |


## Policies (RLS)

### `integrations_owner_admin_mfa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_integrations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
