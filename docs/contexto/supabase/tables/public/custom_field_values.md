# public.custom_field_values

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `custom_field_id` | `uuid` | sim |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `value_text` | `text` | sim |  |  |  |
| 5 | `value_number` | `numeric` | sim |  |  |  |
| 6 | `value_date` | `date` | sim |  |  |  |
| 7 | `value_boolean` | `boolean` | sim |  |  |  |
| 8 | `value_json` | `jsonb` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `value` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_field_values_custom_field_id_entity_id_key | UNIQUE | `UNIQUE (custom_field_id, entity_id)` |  |  | sim |
| custom_field_values_custom_field_id_fkey | FOREIGN KEY | `FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| custom_field_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_field_values_custom_field_id_entity_id_key | btree | custom_field_id, entity_id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_custom_field_id_entity_id_key ON public.custom_field_values USING btree (custom_field_id, entity_id)` |
| custom_field_values_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_pkey ON public.custom_field_values USING btree (id)` |
| idx_custom_field_values_custom_field_id | btree | custom_field_id | não | sim |  | `CREATE INDEX idx_custom_field_values_custom_field_id ON public.custom_field_values USING btree (custom_field_id)` |
| idx_custom_field_values_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_custom_field_values_user_id ON public.custom_field_values USING btree (user_id)` |


## Policies (RLS)

### `Users manage own custom field values`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `custom_field_values_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `custom_field_values_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `custom_field_values_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))` |
| WITH CHECK |  |

### `custom_field_values_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_custom_field_values_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
