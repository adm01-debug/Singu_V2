# public.contact_communication_style

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
| 4 | `pace` | `character varying(20)` | sim |  |  |  |
| 5 | `tone` | `character varying(20)` | sim |  |  |  |
| 6 | `detail_preference` | `character varying(20)` | sim |  |  |  |
| 7 | `decision_style` | `character varying(30)` | sim |  |  |  |
| 8 | `prefers_data` | `boolean` | sim | `false` |  |  |
| 9 | `prefers_stories` | `boolean` | sim | `false` |  |  |
| 10 | `prefers_visuals` | `boolean` | sim | `false` |  |  |
| 11 | `frequent_words` | `text[]` | sim |  |  |  |
| 12 | `favorite_expressions` | `text[]` | sim |  |  |  |
| 13 | `engagement_triggers` | `text[]` | sim |  |  |  |
| 14 | `disengagement_triggers` | `text[]` | sim |  |  |  |
| 15 | `mirroring_tips` | `text[]` | sim |  |  |  |
| 16 | `confidence_level` | `numeric(5,2)` | sim | `50` |  |  |
| 17 | `analyzed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `is_current` | `boolean` | sim | `true` |  |  |
| 19 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_communication_style_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_communication_style_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_communication_style_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_communication_style_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_communication_style_pkey ON public.contact_communication_style USING btree (id)` |


## Policies (RLS)

### `contact_communication_style_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_contact_communication_style`

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
