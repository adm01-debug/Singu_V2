# _dormant.entity_versions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `entity_type` | `text` | não |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `version_number` | `integer` | não |  |  |  |
| 5 | `data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `changed_by` | `uuid` | sim |  |  |  |
| 7 | `changed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `change_summary` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entity_versions_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| entity_versions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| unique_entity_version | UNIQUE | `UNIQUE (entity_type, entity_id, version_number)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entity_versions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX entity_versions_pkey ON _dormant.entity_versions USING btree (id)` |
| unique_entity_version | btree | entity_type, entity_id, version_number | sim | sim |  | `CREATE UNIQUE INDEX unique_entity_version ON _dormant.entity_versions USING btree (entity_type, entity_id, version_number)` |


## Policies (RLS)

### `dormant_deny_all_entity_versions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
