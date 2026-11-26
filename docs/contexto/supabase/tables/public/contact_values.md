# public.contact_values

> SINGU: Valores pessoais e profissionais identificados

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `value_name` | `text` | não |  |  |  |
| 5 | `category` | `text` | sim |  |  |  |
| 6 | `importance` | `integer` | sim | `5` |  |  |
| 7 | `evidence` | `text` | sim |  |  |  |
| 8 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 9 | `discovered_in_interaction_id` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_values_category_check | CHECK | `CHECK (category = ANY (ARRAY['personal'::text, 'professional'::text, 'financial'::text, 'family'::text, 'health'::text, 'social'::text, 'achievement'::text, 'security'::text, 'freedom'::text, 'other'::text]))` |  |  | sim |
| contact_values_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| contact_values_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_values_discovered_in_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (discovered_in_interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| contact_values_importance_check | CHECK | `CHECK (importance >= 1 AND importance <= 10)` |  |  | sim |
| contact_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_values_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_values_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_values_pkey ON public.contact_values USING btree (id)` |


## Policies (RLS)

### `contact_values_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_contact_values`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
