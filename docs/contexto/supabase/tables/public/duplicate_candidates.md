# public.duplicate_candidates

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
| 3 | `entity_1_id` | `uuid` | não |  |  |  |
| 4 | `entity_2_id` | `uuid` | não |  |  |  |
| 5 | `similarity_score` | `numeric(5,2)` | sim |  |  |  |
| 6 | `match_fields` | `text[]` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'pending'::text` |  |  |
| 8 | `reviewed_by` | `uuid` | sim |  |  |  |
| 9 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| duplicate_candidates_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['company'::text, 'contact'::text]))` |  |  | sim |
| duplicate_candidates_entity_type_entity_1_id_entity_2_id_key | UNIQUE | `UNIQUE (entity_type, entity_1_id, entity_2_id)` |  |  | sim |
| duplicate_candidates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| duplicate_candidates_reviewed_by_fkey | FOREIGN KEY | `FOREIGN KEY (reviewed_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| duplicate_candidates_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'merged'::text, 'not_duplicate'::text, 'ignored'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| duplicate_candidates_entity_type_entity_1_id_entity_2_id_key | btree | entity_type, entity_1_id, entity_2_id | sim | sim |  | `CREATE UNIQUE INDEX duplicate_candidates_entity_type_entity_1_id_entity_2_id_key ON public.duplicate_candidates USING btree (entity_type, entity_1_id, entity_2_id)` |
| duplicate_candidates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX duplicate_candidates_pkey ON public.duplicate_candidates USING btree (id)` |
| idx_duplicate_candidates_reviewed_by | btree | reviewed_by | não | sim |  | `CREATE INDEX idx_duplicate_candidates_reviewed_by ON public.duplicate_candidates USING btree (reviewed_by)` |


## Policies (RLS)

### `duplicate_candidates_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
