# public.user_contacts_link

> SINGU: Vínculo de permissão entre usuários e contatos compartilhados

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
| usada por views | public.vw_churn_risk_ranking, public.vw_closing_score_ranking, public.vw_deal_velocity_benchmark, public.vw_disc_compatibility |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `permission` | `text` | sim | `'view'::text` |  |  |
| 5 | `shared_by` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_contacts_link_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_contacts_link_permission_check | CHECK | `CHECK (permission = ANY (ARRAY['view'::text, 'edit'::text, 'admin'::text]))` |  |  | sim |
| user_contacts_link_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_contacts_link_shared_by_fkey | FOREIGN KEY | `FOREIGN KEY (shared_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| user_contacts_link_user_id_contact_id_key | UNIQUE | `UNIQUE (user_id, contact_id)` |  |  | sim |
| user_contacts_link_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_contacts_link_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_contacts_link_pkey ON public.user_contacts_link USING btree (id)` |
| user_contacts_link_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX user_contacts_link_user_id_contact_id_key ON public.user_contacts_link USING btree (user_id, contact_id)` |


## Policies (RLS)

### `service_role_full_user_contacts_link`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `user_contacts_link_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
