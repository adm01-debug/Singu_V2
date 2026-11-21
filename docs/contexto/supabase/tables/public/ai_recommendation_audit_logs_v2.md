# public.ai_recommendation_audit_logs_v2

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `score` | `integer` | sim |  |  |  |
| 5 | `recommendation_type` | `text` | não |  |  |  |
| 6 | `reasons` | `text[]` | sim |  |  |  |
| 7 | `data_used` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `user_action` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_recommendation_audit_logs_v2_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| ai_recommendation_audit_logs_v2_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_recommendation_audit_logs_v2_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_recommendation_audit_logs_v2_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_recommendation_audit_logs_v2_pkey ON public.ai_recommendation_audit_logs_v2 USING btree (id)` |


## Policies (RLS)

### `Users can manage their own recommendation logs v2`

| campo | valor |
|---|---|
| comando | ALL |
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
