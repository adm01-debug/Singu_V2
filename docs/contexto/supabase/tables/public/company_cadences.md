# public.company_cadences

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
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `cadence_id` | `uuid` | não |  |  |  |
| 4 | `current_step` | `integer` | sim | `1` |  |  |
| 5 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `next_action_date` | `date` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'active'::text` |  |  |
| 8 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `user_id` | `uuid` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_company_cadences_status | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))` |  |  | sim |
| company_cadences_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES sales_cadences(id)` | NO ACTION | NO ACTION | sim |
| company_cadences_company_id_cadence_id_key | UNIQUE | `UNIQUE (company_id, cadence_id)` |  |  | sim |
| company_cadences_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| company_cadences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| company_cadences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_cadences_company_id_cadence_id_key | btree | company_id, cadence_id | sim | sim |  | `CREATE UNIQUE INDEX company_cadences_company_id_cadence_id_key ON public.company_cadences USING btree (company_id, cadence_id)` |
| company_cadences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_cadences_pkey ON public.company_cadences USING btree (id)` |
| idx_company_cadences_cadence_id | btree | cadence_id | não | sim |  | `CREATE INDEX idx_company_cadences_cadence_id ON public.company_cadences USING btree (cadence_id)` |
| idx_company_cadences_company | btree | company_id | não | sim |  | `CREATE INDEX idx_company_cadences_company ON public.company_cadences USING btree (company_id)` |
| idx_company_cadences_status | btree | status | não | sim |  | `CREATE INDEX idx_company_cadences_status ON public.company_cadences USING btree (status)` |
| idx_company_cadences_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_company_cadences_user_id ON public.company_cadences USING btree (user_id)` |


## Policies (RLS)

### `company_cadences_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_cadences_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `company_cadences_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_cadences_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_company_cadences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
