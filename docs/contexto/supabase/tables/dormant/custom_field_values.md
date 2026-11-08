# _dormant.custom_field_values

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `custom_field_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `character varying(50)` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `value_text` | `text` | sim |  |  |  |
| 6 | `value_number` | `numeric(15,4)` | sim |  |  |  |
| 7 | `value_date` | `date` | sim |  |  |  |
| 8 | `value_boolean` | `boolean` | sim |  |  |  |
| 9 | `value_json` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_field_values_custom_field_id_entity_id_key | UNIQUE | `UNIQUE (custom_field_id, entity_id)` |  |  | sim |
| custom_field_values_custom_field_id_fkey | FOREIGN KEY | `FOREIGN KEY (custom_field_id) REFERENCES _dormant.custom_fields(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| custom_field_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_field_values_custom_field_id_entity_id_key | btree | custom_field_id, entity_id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_custom_field_id_entity_id_key ON _dormant.custom_field_values USING btree (custom_field_id, entity_id)` |
| custom_field_values_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_pkey ON _dormant.custom_field_values USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
