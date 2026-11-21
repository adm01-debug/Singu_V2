# public.cs_nps_responses

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
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `score` | `integer` | não |  |  |  |
| 6 | `category` | `text` | não |  |  |  |
| 7 | `comment` | `text` | sim |  |  |  |
| 8 | `surveyed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cs_nps_responses_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES cs_accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cs_nps_responses_category_check | CHECK | `CHECK (category = ANY (ARRAY['promoter'::text, 'passive'::text, 'detractor'::text]))` |  |  | sim |
| cs_nps_responses_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cs_nps_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cs_nps_responses_score_check | CHECK | `CHECK (score >= 0 AND score <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cs_nps_responses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cs_nps_responses_pkey ON public.cs_nps_responses USING btree (id)` |
| idx_cs_nps_account | btree | account_id, surveyed_at | não | sim |  | `CREATE INDEX idx_cs_nps_account ON public.cs_nps_responses USING btree (account_id, surveyed_at DESC)` |
| idx_cs_nps_user | btree | user_id, surveyed_at | não | sim |  | `CREATE INDEX idx_cs_nps_user ON public.cs_nps_responses USING btree (user_id, surveyed_at DESC)` |


## Policies (RLS)

### `cs_nps_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_nps_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `cs_nps_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_nps_update`

| campo | valor |
|---|---|
| comando | UPDATE |
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
