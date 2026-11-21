# public.mql_classifications

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `criteria_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | não | `'mql'::text` |  |  |
| 6 | `qualified_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `handoff_assignment_id` | `uuid` | sim |  |  |  |
| 8 | `handoff_to` | `uuid` | sim |  |  |  |
| 9 | `handoff_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `score_snapshot` | `integer` | sim |  |  |  |
| 11 | `reason` | `text` | sim |  |  |  |
| 12 | `notes` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mql_classifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mql_classifications_status_check | CHECK | `CHECK (status = ANY (ARRAY['mql'::text, 'sql'::text, 'disqualified'::text, 'customer'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_mqlcls_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_mqlcls_contact ON public.mql_classifications USING btree (contact_id)` |
| idx_mqlcls_status | btree | status | não | sim |  | `CREATE INDEX idx_mqlcls_status ON public.mql_classifications USING btree (status)` |
| idx_mqlcls_user | btree | user_id | não | sim |  | `CREATE INDEX idx_mqlcls_user ON public.mql_classifications USING btree (user_id)` |
| mql_classifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX mql_classifications_pkey ON public.mql_classifications USING btree (id)` |


## Policies (RLS)

### `mqlcls_owner_all`

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
| trg_mqlcls_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
