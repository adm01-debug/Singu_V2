# _dormant.shared_interests

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_communication_dashboard, public.vw_rapport_points |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `interest_category` | `character varying(100)` | sim |  |  |  |
| 5 | `interest_name` | `character varying(255)` | sim |  |  |  |
| 6 | `interest_details` | `text` | sim |  |  |  |
| 7 | `source` | `character varying(50)` | sim |  |  |  |
| 8 | `discovered_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `rapport_value` | `character varying(20)` | sim | `'medium'::character varying` |  |  |
| 10 | `times_mentioned` | `integer` | sim | `0` |  |  |
| 11 | `last_mentioned_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `conversation_starters` | `text[]` | sim |  |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| shared_interests_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| shared_interests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| shared_interests_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| shared_interests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX shared_interests_pkey ON _dormant.shared_interests USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
