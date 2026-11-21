# public.ai_tone_preferences

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
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `preferred_tone` | `text` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_tone_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_tone_preferences_user_id_company_id_key | UNIQUE | `UNIQUE (user_id, company_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_tone_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_tone_preferences_pkey ON public.ai_tone_preferences USING btree (id)` |
| ai_tone_preferences_user_id_company_id_key | btree | user_id, company_id | sim | sim |  | `CREATE UNIQUE INDEX ai_tone_preferences_user_id_company_id_key ON public.ai_tone_preferences USING btree (user_id, company_id)` |


## Policies (RLS)

### `Users can manage their own tone preferences`

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
| update_ai_tone_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
