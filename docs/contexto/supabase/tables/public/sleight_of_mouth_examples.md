# public.sleight_of_mouth_examples

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
| usada por views | public.vw_reframe_suggestions |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `pattern_id` | `uuid` | não |  |  |  |
| 3 | `context` | `character varying(100)` | sim |  |  |  |
| 4 | `industry` | `character varying(100)` | sim |  |  |  |
| 5 | `objection_text` | `text` | não |  |  |  |
| 6 | `reframe_response` | `text` | não |  |  |  |
| 7 | `success_rate` | `numeric(5,2)` | sim |  |  |  |
| 8 | `times_used` | `integer` | sim | `0` |  |  |
| 9 | `tags` | `text[]` | sim |  |  |  |
| 10 | `is_active` | `boolean` | sim | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sleight_of_mouth_examples_pattern_id_fkey | FOREIGN KEY | `FOREIGN KEY (pattern_id) REFERENCES sleight_of_mouth_patterns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sleight_of_mouth_examples_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sleight_of_mouth_examples_pattern_id | btree | pattern_id | não | sim |  | `CREATE INDEX idx_sleight_of_mouth_examples_pattern_id ON public.sleight_of_mouth_examples USING btree (pattern_id)` |
| sleight_of_mouth_examples_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sleight_of_mouth_examples_pkey ON public.sleight_of_mouth_examples USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
