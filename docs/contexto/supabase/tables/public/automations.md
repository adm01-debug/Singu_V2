# public.automations

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `trigger_type` | `text` | não |  |  |  |
| 5 | `trigger_entity` | `text` | sim |  |  |  |
| 6 | `trigger_event` | `text` | sim |  |  |  |
| 7 | `trigger_conditions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `actions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `run_count` | `integer` | sim | `0` |  |  |
| 11 | `last_run_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_by` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| automations_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| automations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| automations_trigger_type_check | CHECK | `CHECK (trigger_type = ANY (ARRAY['event'::text, 'schedule'::text, 'condition'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.automation_logs | automation_logs_automation_id_fkey | automation_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| automations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX automations_pkey ON public.automations USING btree (id)` |
| idx_automations_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_automations_created_by ON public.automations USING btree (created_by)` |


## Policies (RLS)

### `automations_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = created_by)` |
| WITH CHECK |  |

### `automations_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = created_by)` |

### `automations_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = created_by)` |
| WITH CHECK |  |

### `automations_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = created_by)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = created_by)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_automations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
