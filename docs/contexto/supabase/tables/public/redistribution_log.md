# public.redistribution_log

> SINGU: Log append-only de redistribuições de carteira. Cada linha = 1 transferência de lead de um vendedor para outro, com motivo (inatividade, férias, cap excedido, manual, etc). Base para auditoria e analytics de rotação.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `from_user_id` | `uuid` | não |  |  |  |
| 6 | `to_user_id` | `uuid` | sim |  |  |  |
| 7 | `reason` | `text` | não |  |  |  |
| 8 | `reason_details` | `text` | sim |  |  |  |
| 9 | `triggered_by` | `text` | não | `'system'::text` |  |  |
| 10 | `triggered_by_user` | `uuid` | sim |  |  |  |
| 11 | `previous_assignment_id` | `uuid` | sim |  |  |  |
| 12 | `new_assignment_id` | `uuid` | sim |  |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `from_member_id` | `uuid` | sim |  |  |  |
| 16 | `to_member_id` | `uuid` | sim |  |  |  |
| 17 | `auto_triggered` | `boolean` | não | `false` |  |  |
| 18 | `inactivity_days` | `integer` | sim |  |  |  |
| 19 | `notes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| redistribution_log_from_member_id_fkey | FOREIGN KEY | `FOREIGN KEY (from_member_id) REFERENCES sales_team_members(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| redistribution_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| redistribution_log_reason_check | CHECK | `CHECK (reason = ANY (ARRAY['inactivity'::text, 'vacation'::text, 'cap_exceeded'::text, 'manual'::text, 'performance'::text, 'territory_change'::text, 'load_balance'::text, 'other'::text]))` |  |  | sim |
| redistribution_log_to_member_id_fkey | FOREIGN KEY | `FOREIGN KEY (to_member_id) REFERENCES sales_team_members(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| redistribution_log_triggered_by_check | CHECK | `CHECK (triggered_by = ANY (ARRAY['system'::text, 'manager'::text, 'admin'::text, 'automation'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_redistribution_log_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_redistribution_log_user_id ON public.redistribution_log USING btree (user_id)` |
| redistribution_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX redistribution_log_pkey ON public.redistribution_log USING btree (id)` |


## Policies (RLS)

### `Admins can view all redistribution logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can insert their own redistribution logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own redistribution logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
