# public.proximo_passo_feedback

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `text` | não |  |  |  |
| 4 | `passo_id` | `text` | não |  |  |  |
| 5 | `outcome` | `passo_outcome` | não |  |  |  |
| 6 | `channel_used` | `text` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `executed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| proximo_passo_feedback_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| proximo_passo_feedback_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ppf_user_contact_passo | btree | user_id, contact_id, passo_id, executed_at | não | sim |  | `CREATE INDEX idx_ppf_user_contact_passo ON public.proximo_passo_feedback USING btree (user_id, contact_id, passo_id, executed_at DESC)` |
| proximo_passo_feedback_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX proximo_passo_feedback_pkey ON public.proximo_passo_feedback USING btree (id)` |


## Policies (RLS)

### `Users can delete their own passo feedbacks`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Users can insert their own passo feedbacks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `Users can view their own passo feedbacks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
