# public.sales_playbooks

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `scenario` | `text` | não |  |  |  |
| 6 | `stage_target` | `text` | sim |  |  |  |
| 7 | `industry_target` | `text` | sim |  |  |  |
| 8 | `persona_target` | `text` | sim |  |  |  |
| 9 | `content` | `jsonb` | não | `'{"sections": []}'::jsonb` |  |  |
| 10 | `tags` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 11 | `active` | `boolean` | não | `true` |  |  |
| 12 | `usage_count` | `integer` | não | `0` |  |  |
| 13 | `version` | `integer` | não | `1` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_playbooks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_playbooks_scenario_check | CHECK | `CHECK (scenario = ANY (ARRAY['discovery'::text, 'demo'::text, 'negotiation'::text, 'objection'::text, 'closing'::text, 'winback'::text, 'onboarding'::text, 'custom'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sales_playbooks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_playbooks_pkey ON public.sales_playbooks USING btree (id)` |


## Policies (RLS)

### `playbooks_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `playbooks_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `playbooks_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `playbooks_update_own`

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
| audit_sales_playbooks | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| update_sales_playbooks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
