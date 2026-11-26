# public.objections

> SINGU: Registro de objeções levantadas por contatos

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
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `category` | `text` | não |  |  |  |
| 6 | `objection_text` | `text` | não |  |  |  |
| 7 | `is_real_objection` | `boolean` | sim |  |  |  |
| 8 | `real_objection_guess` | `text` | sim |  |  |  |
| 9 | `response_given` | `text` | sim |  |  |  |
| 10 | `outcome` | `text` | sim |  |  |  |
| 11 | `technique_used` | `text` | sim |  |  |  |
| 12 | `lessons_learned` | `text` | sim |  |  |  |
| 13 | `times_raised` | `integer` | sim | `1` |  |  |
| 14 | `is_resolved` | `boolean` | sim | `false` |  |  |
| 15 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| objections_category_check | CHECK | `CHECK (category = ANY (ARRAY['price'::text, 'timing'::text, 'authority'::text, 'need'::text, 'trust'::text, 'competition'::text, 'inertia'::text, 'technical'::text, 'other'::text]))` |  |  | sim |
| objections_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| objections_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| objections_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['overcome'::text, 'partially_overcome'::text, 'not_overcome'::text, 'pending'::text, 'deal_lost'::text]))` |  |  | sim |
| objections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| objections_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| objections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX objections_pkey ON public.objections USING btree (id)` |


## Policies (RLS)

### `objections_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_objections`

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
