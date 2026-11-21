# public.cs_qbrs

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
| 3 | `account_id` | `uuid` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `scheduled_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `status` | `text` | não | `'scheduled'::text` |  |  |
| 8 | `agenda` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `outcomes` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `next_steps` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 11 | `attendees` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 12 | `notes` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cs_qbrs_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES cs_accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cs_qbrs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cs_qbrs_status_check | CHECK | `CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cs_qbrs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cs_qbrs_pkey ON public.cs_qbrs USING btree (id)` |


## Policies (RLS)

### `cs_qbrs_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_qbrs_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `cs_qbrs_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_qbrs_update`

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
| trg_cs_qbrs_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
