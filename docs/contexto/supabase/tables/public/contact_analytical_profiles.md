# public.contact_analytical_profiles

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `preferences` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 5 | `recurrent_topics` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 6 | `communication_style` | `text` | sim |  |  |  |
| 7 | `sentiment_trend` | `text` | sim |  |  |  |
| 8 | `last_updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `hobbies` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `tone` | `text` | sim |  |  |  |
| 11 | `summary` | `text` | sim |  |  |  |
| 12 | `based_on_count` | `integer` | não | `0` |  |  |
| 13 | `model` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_analytical_profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_analytical_profiles_contact_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_analytical_profiles_contact_unique ON public.contact_analytical_profiles USING btree (contact_id)` |
| contact_analytical_profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_analytical_profiles_pkey ON public.contact_analytical_profiles USING btree (id)` |


## Policies (RLS)

### `Users can manage analytical profiles of their contacts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view analytical profiles of their contacts`

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
