# _dormant.client_values

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
| 4 | `category` | `text` | não |  |  |  |
| 5 | `value_name` | `text` | não |  |  |  |
| 6 | `importance` | `integer` | sim | `5` |  |  |
| 7 | `detected_phrases` | `text[]` | sim |  |  |  |
| 8 | `frequency` | `integer` | sim | `1` |  |  |
| 9 | `last_mentioned` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| client_values_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| client_values_importance_check | CHECK | `CHECK (importance >= 1 AND importance <= 10)` |  |  | sim |
| client_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| client_values_user_id_contact_id_category_value_name_key | UNIQUE | `UNIQUE (user_id, contact_id, category, value_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| client_values_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX client_values_pkey ON _dormant.client_values USING btree (id)` |
| client_values_user_id_contact_id_category_value_name_key | btree | user_id, contact_id, category, value_name | sim | sim |  | `CREATE UNIQUE INDEX client_values_user_id_contact_id_category_value_name_key ON _dormant.client_values USING btree (user_id, contact_id, category, value_name)` |
| idx_client_values_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_client_values_contact ON _dormant.client_values USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own client values`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own client values`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own client values`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own client values`

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
| set_updated_at_client_values | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
