# public.sleight_of_mouth_patterns

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
| 2 | `pattern_name` | `character varying(100)` | não |  |  |  |
| 3 | `pattern_code` | `character varying(50)` | não |  |  |  |
| 4 | `category` | `character varying(50)` | sim |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `when_to_use` | `text` | sim |  |  |  |
| 7 | `structure` | `text` | sim |  |  |  |
| 8 | `example_objection` | `text` | sim |  |  |  |
| 9 | `example_response` | `text` | sim |  |  |  |
| 10 | `effectiveness_score` | `numeric(5,2)` | sim | `70` |  |  |
| 11 | `difficulty_level` | `character varying(20)` | sim | `'medium'::character varying` |  |  |
| 12 | `recommended_contexts` | `text[]` | sim |  |  |  |
| 13 | `disc_compatibility` | `character varying(10)[]` | sim |  |  |  |
| 14 | `is_active` | `boolean` | sim | `true` |  |  |
| 15 | `display_order` | `integer` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sleight_of_mouth_patterns_pattern_code_key | UNIQUE | `UNIQUE (pattern_code)` |  |  | sim |
| sleight_of_mouth_patterns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sleight_of_mouth_examples | sleight_of_mouth_examples_pattern_id_fkey | pattern_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sleight_of_mouth_patterns_pattern_code_key | btree | pattern_code | sim | sim |  | `CREATE UNIQUE INDEX sleight_of_mouth_patterns_pattern_code_key ON public.sleight_of_mouth_patterns USING btree (pattern_code)` |
| sleight_of_mouth_patterns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sleight_of_mouth_patterns_pkey ON public.sleight_of_mouth_patterns USING btree (id)` |


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

_nenhum_
