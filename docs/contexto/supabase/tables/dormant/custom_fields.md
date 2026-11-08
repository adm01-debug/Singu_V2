# _dormant.custom_fields

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
| 2 | `entity_type` | `character varying(50)` | não |  |  |  |
| 3 | `field_name` | `character varying(100)` | não |  |  |  |
| 4 | `field_label` | `character varying(255)` | não |  |  |  |
| 5 | `field_type` | `character varying(50)` | não |  |  |  |
| 6 | `options` | `jsonb` | sim |  |  |  |
| 7 | `is_required` | `boolean` | sim | `false` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `sort_order` | `integer` | sim | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_fields_entity_type_field_name_key | UNIQUE | `UNIQUE (entity_type, field_name)` |  |  | sim |
| custom_fields_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.custom_field_values | custom_field_values_custom_field_id_fkey | custom_field_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_fields_entity_type_field_name_key | btree | entity_type, field_name | sim | sim |  | `CREATE UNIQUE INDEX custom_fields_entity_type_field_name_key ON _dormant.custom_fields USING btree (entity_type, field_name)` |
| custom_fields_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_fields_pkey ON _dormant.custom_fields USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
