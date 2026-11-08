# _dormant.contact_preferences

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `preferred_channel` | `character varying(50)` | sim | `'whatsapp'::character varying` |  |  |
| 5 | `preferred_days` | `text[]` | sim | `'{}'::text[]` |  |  |
| 6 | `preferred_times` | `text[]` | sim | `'{}'::text[]` |  |  |
| 7 | `avoid_days` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `avoid_times` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `restrictions` | `text` | sim |  |  |  |
| 10 | `personal_notes` | `text` | sim |  |  |  |
| 11 | `communication_tips` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_preferences_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_preferences_user_id_contact_id_key | UNIQUE | `UNIQUE (user_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_preferences_pkey ON _dormant.contact_preferences USING btree (id)` |
| contact_preferences_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_preferences_user_id_contact_id_key ON _dormant.contact_preferences USING btree (user_id, contact_id)` |


## Policies (RLS)

### `Users can create their own contact preferences`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own contact preferences`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own contact preferences`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own contact preferences`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_contact_preferences | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
