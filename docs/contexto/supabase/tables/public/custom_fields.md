# public.custom_fields

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
| 2 | `entity_type` | `text` | não |  |  |  |
| 3 | `field_name` | `text` | não |  |  |  |
| 4 | `field_label` | `text` | não |  |  |  |
| 5 | `field_type` | `text` | não |  |  |  |
| 6 | `options` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `is_required` | `boolean` | sim | `false` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `display_order` | `integer` | sim | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `field_options` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_fields_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'deal'::text, 'proposal'::text]))` |  |  | sim |
| custom_fields_entity_type_field_name_key | UNIQUE | `UNIQUE (entity_type, field_name)` |  |  | sim |
| custom_fields_field_type_check | CHECK | `CHECK (field_type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'boolean'::text, 'select'::text, 'multiselect'::text, 'url'::text, 'email'::text, 'phone'::text]))` |  |  | sim |
| custom_fields_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.custom_field_values | custom_field_values_custom_field_id_fkey | custom_field_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_fields_entity_type_field_name_key | btree | entity_type, field_name | sim | sim |  | `CREATE UNIQUE INDEX custom_fields_entity_type_field_name_key ON public.custom_fields USING btree (entity_type, field_name)` |
| custom_fields_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_fields_pkey ON public.custom_fields USING btree (id)` |
| custom_fields_user_id_entity_type_field_name_key | btree | user_id, entity_type, field_name | sim | sim |  | `CREATE UNIQUE INDEX custom_fields_user_id_entity_type_field_name_key ON public.custom_fields USING btree (user_id, entity_type, field_name)` |


## Policies (RLS)

### `Users manage own custom fields`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `custom_fields_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `custom_fields_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `custom_fields_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))` |
| WITH CHECK |  |

### `custom_fields_update`

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
| trg_custom_fields_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
