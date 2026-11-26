# public.shared_interests

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
| shared_interests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX shared_interests_pkey ON public.shared_interests USING btree (id)` |


## Policies (RLS)

### `service_role_full_shared_interests`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `shared_interests_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
