# public.email_thread_summaries

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
| 3 | `thread_key` | `text` | não |  |  |  |
| 4 | `interaction_ids` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 5 | `summary` | `text` | não |  |  |  |
| 6 | `key_points` | `text[]` | não | `'{}'::text[]` |  |  |
| 7 | `action_items` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 8 | `sentiment` | `text` | sim |  |  |  |
| 9 | `next_steps` | `text[]` | não | `'{}'::text[]` |  |  |
| 10 | `generated_by_model` | `text` | não | `'google/gemini-2.5-flash'::text` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_thread_summaries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| email_thread_summaries_user_id_thread_key_key | UNIQUE | `UNIQUE (user_id, thread_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_thread_summaries_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_thread_summaries_pkey ON public.email_thread_summaries USING btree (id)` |
| email_thread_summaries_user_id_thread_key_key | btree | user_id, thread_key | sim | sim |  | `CREATE UNIQUE INDEX email_thread_summaries_user_id_thread_key_key ON public.email_thread_summaries USING btree (user_id, thread_key)` |
| idx_ets_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_ets_user_created ON public.email_thread_summaries USING btree (user_id, created_at DESC)` |
| idx_ets_user_thread | btree | user_id, thread_key | não | sim |  | `CREATE INDEX idx_ets_user_thread ON public.email_thread_summaries USING btree (user_id, thread_key)` |


## Policies (RLS)

### `Users delete own email thread summaries`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own email thread summaries`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own email thread summaries`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own email thread summaries`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_email_thread_summaries_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
