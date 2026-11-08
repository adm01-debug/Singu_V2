# public.entity_relationships

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
| 2 | `from_type` | `entity_type` | não |  |  |  |
| 3 | `from_id` | `uuid` | não |  |  |  |
| 4 | `to_type` | `entity_type` | não |  |  |  |
| 5 | `to_id` | `uuid` | não |  |  |  |
| 6 | `role` | `entity_relationship_role` | não |  |  |  |
| 7 | `is_primary` | `boolean` | não | `false` |  |  |
| 8 | `started_at` | `date` | sim |  |  |  |
| 9 | `ended_at` | `date` | sim |  |  |  |
| 10 | `notes` | `text` | sim |  |  |  |
| 11 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 12 | `created_by` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entity_relationships_no_self | CHECK | `CHECK (NOT (from_type = to_type AND from_id = to_id))` |  |  | sim |
| entity_relationships_period_valid | CHECK | `CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)` |  |  | sim |
| entity_relationships_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| entity_relationships_unique | UNIQUE | `UNIQUE (from_type, from_id, to_type, to_id, role)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entity_relationships_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX entity_relationships_pkey ON public.entity_relationships USING btree (id)` |
| entity_relationships_unique | btree | from_type, from_id, to_type, to_id, role | sim | sim |  | `CREATE UNIQUE INDEX entity_relationships_unique ON public.entity_relationships USING btree (from_type, from_id, to_type, to_id, role)` |
| idx_entity_rel_from | btree | from_type, from_id | não | sim |  | `CREATE INDEX idx_entity_rel_from ON public.entity_relationships USING btree (from_type, from_id)` |
| idx_entity_rel_primary | btree | from_type, from_id, role | não | sim | `is_primary` | `CREATE INDEX idx_entity_rel_primary ON public.entity_relationships USING btree (from_type, from_id, role) WHERE is_primary` |
| idx_entity_rel_role | btree | role | não | sim |  | `CREATE INDEX idx_entity_rel_role ON public.entity_relationships USING btree (role)` |
| idx_entity_rel_to | btree | to_type, to_id | não | sim |  | `CREATE INDEX idx_entity_rel_to ON public.entity_relationships USING btree (to_type, to_id)` |


## Policies (RLS)

### `auth users insert entity_relationships`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `auth users read entity_relationships`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `creator or admin deletes entity_relationships`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `creator or admin updates entity_relationships`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_entity_relationships_updated_at | BEFORE | UPDATE | ROW | enabled | public.tg_set_updated_at |
| trg_validate_entity_relationship | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_entity_relationship |


## Grants

_nenhum_
