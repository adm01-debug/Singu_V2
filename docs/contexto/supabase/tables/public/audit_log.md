# public.audit_log

> Log de auditoria para alterações em tabelas críticas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `table_name` | `text` | não |  |  |  |
| 3 | `record_id` | `text` | não |  |  |  |
| 4 | `action` | `text` | não |  |  |  |
| 5 | `old_data` | `jsonb` | sim |  |  |  |
| 6 | `new_data` | `jsonb` | sim |  |  |  |
| 7 | `changed_fields` | `text[]` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `ip_address` | `text` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `entity_type` | `text` | sim |  |  |  |
| 13 | `entity_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| audit_log_action_check | CHECK | `CHECK (action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))` |  |  | sim |
| audit_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id)` |
| idx_audit_log_action | btree | action | não | sim |  | `CREATE INDEX idx_audit_log_action ON public.audit_log USING btree (action)` |
| idx_audit_log_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC)` |
| idx_audit_log_table_action | btree | table_name, action, created_at | não | sim |  | `CREATE INDEX idx_audit_log_table_action ON public.audit_log USING btree (table_name, action, created_at DESC)` |


## Policies (RLS)

### `System can insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view their own audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `audit_log_service`

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
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
