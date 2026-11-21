# public.mql_criteria

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `conditions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `auto_handoff` | `boolean` | não | `false` |  |  |
| 8 | `handoff_to_role` | `text` | não | `'sdr'::text` |  |  |
| 9 | `priority` | `integer` | não | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mql_criteria_handoff_to_role_check | CHECK | `CHECK (handoff_to_role = ANY (ARRAY['sdr'::text, 'closer'::text, 'manager'::text]))` |  |  | sim |
| mql_criteria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_mqlc_user | btree | user_id | não | sim |  | `CREATE INDEX idx_mqlc_user ON public.mql_criteria USING btree (user_id)` |
| mql_criteria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX mql_criteria_pkey ON public.mql_criteria USING btree (id)` |


## Policies (RLS)

### `mqlc_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_mqlc_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
