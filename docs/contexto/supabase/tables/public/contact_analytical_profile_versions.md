# public.contact_analytical_profile_versions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `profile_id` | `uuid` | sim |  |  |  |
| 5 | `summary` | `text` | sim |  |  |  |
| 6 | `tone` | `text` | sim |  |  |  |
| 7 | `communication_style` | `text` | sim |  |  |  |
| 8 | `sentiment_trend` | `text` | sim |  |  |  |
| 9 | `preferences` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `hobbies` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 11 | `recurrent_topics` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 12 | `based_on_count` | `integer` | não | `0` |  |  |
| 13 | `model` | `text` | sim |  |  |  |
| 14 | `trigger_source` | `text` | sim |  |  |  |
| 15 | `generated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_analytical_profile_versions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_analytical_profile_versions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_analytical_profile_versions_pkey ON public.contact_analytical_profile_versions USING btree (id)` |
| idx_capv_contact_generated | btree | contact_id, generated_at | não | sim |  | `CREATE INDEX idx_capv_contact_generated ON public.contact_analytical_profile_versions USING btree (contact_id, generated_at DESC)` |
| idx_capv_user | btree | user_id | não | sim |  | `CREATE INDEX idx_capv_user ON public.contact_analytical_profile_versions USING btree (user_id)` |


## Policies (RLS)

### `Users insert own profile versions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users read own profile versions`

| campo | valor |
|---|---|
| comando | SELECT |
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
