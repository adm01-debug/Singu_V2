# public.abm_account_plans

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
| 2 | `account_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `template_type` | `text` | não | `'strategic'::text` |  |  |
| 5 | `goal` | `text` | sim |  |  |  |
| 6 | `objectives` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `strategies` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 8 | `key_stakeholders` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `milestones` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `status` | `text` | não | `'draft'::text` |  |  |
| 11 | `target_revenue` | `numeric` | sim |  |  |  |
| 12 | `start_date` | `date` | sim |  |  |  |
| 13 | `end_date` | `date` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| abm_account_plans_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| abm_account_plans_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]))` |  |  | sim |
| abm_account_plans_template_type_check | CHECK | `CHECK (template_type = ANY (ARRAY['strategic'::text, 'growth'::text, 'retention'::text, 'penetration'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| abm_account_plans_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX abm_account_plans_pkey ON public.abm_account_plans USING btree (id)` |
| idx_abm_plans_user | btree | user_id | não | sim |  | `CREATE INDEX idx_abm_plans_user ON public.abm_account_plans USING btree (user_id)` |


## Policies (RLS)

### `abm_plans_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `abm_plans_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_plans_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| abm_plans_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| abm_plans_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
