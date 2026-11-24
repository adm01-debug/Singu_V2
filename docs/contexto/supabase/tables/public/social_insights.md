# public.social_insights

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `platform` | `text` | não |  |  |  |
| 5 | `insight_type` | `text` | sim |  |  |  |
| 6 | `content` | `text` | não | `''::text` |  |  |
| 7 | `source_url` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `indicator_score` | `numeric` | não | `0` |  |  |
| 10 | `sentiment` | `text` | não | `'neutral'::text` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_insights_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_insights_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| social_insights_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| social_insights_contact_id_idx | btree | contact_id | não | sim |  | `CREATE INDEX social_insights_contact_id_idx ON public.social_insights USING btree (contact_id)` |
| social_insights_contact_id_platform_idx | btree | contact_id, platform | não | sim |  | `CREATE INDEX social_insights_contact_id_platform_idx ON public.social_insights USING btree (contact_id, platform)` |
| social_insights_created_at_idx | btree | created_at | não | sim |  | `CREATE INDEX social_insights_created_at_idx ON public.social_insights USING btree (created_at DESC)` |
| social_insights_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_insights_pkey ON public.social_insights USING btree (id)` |
| social_insights_user_id_idx | btree | user_id | não | sim |  | `CREATE INDEX social_insights_user_id_idx ON public.social_insights USING btree (user_id)` |


## Policies (RLS)

### `social_insights_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `social_insights_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `social_insights_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `social_insights_update_own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
