# public.connection_configs

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
| 3 | `connection_type` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `is_active` | `boolean` | não | `true` |  |  |
| 6 | `config` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 7 | `secret_refs` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 8 | `last_tested_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `last_test_status` | `text` | sim |  |  |  |
| 10 | `last_test_latency_ms` | `integer` | sim |  |  |  |
| 11 | `last_test_message` | `text` | sim |  |  |  |
| 12 | `created_by` | `uuid` | não |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `encrypted_config` | `bytea` | sim |  |  |  |
| 16 | `encryption_version` | `smallint` | não | `1` |  |  |
| 17 | `discovered_schema` | `jsonb` | sim |  |  |  |
| 18 | `discovered_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| connection_configs_connection_type_check | CHECK | `CHECK (connection_type = ANY (ARRAY['supabase_external'::text, 'bitrix24'::text, 'n8n'::text, 'mcp_claude'::text, 'custom'::text]))` |  |  | sim |
| connection_configs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| connection_configs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX connection_configs_pkey ON public.connection_configs USING btree (id)` |
| idx_connection_configs_active | btree | is_active | não | sim |  | `CREATE INDEX idx_connection_configs_active ON public.connection_configs USING btree (is_active)` |
| idx_connection_configs_type | btree | connection_type | não | sim |  | `CREATE INDEX idx_connection_configs_type ON public.connection_configs USING btree (connection_type)` |


## Policies (RLS)

### `admins manage connection_configs`

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
| trg_audit_connection_configs | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_connection_changes |
| trg_connection_configs_encrypt | BEFORE | INSERT OR UPDATE | ROW | enabled | public.connection_configs_encrypt_trigger |
| trg_connection_configs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
