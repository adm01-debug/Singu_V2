# public.eq_assessment_questions

> Perguntas para avaliação de EQ

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `pillar` | `character varying(50)` | não |  |  |  |
| 3 | `subcomponent` | `character varying(100)` | sim |  |  |  |
| 4 | `question_text` | `text` | não |  |  |  |
| 5 | `question_type` | `character varying(20)` | sim | `'scale'::character varying` |  |  |
| 6 | `options` | `jsonb` | sim |  |  |  |
| 7 | `weight` | `numeric(3,2)` | sim | `1.0` |  |  |
| 8 | `max_score` | `integer` | sim | `5` |  |  |
| 9 | `measures_indicator` | `character varying(100)` | sim |  |  |  |
| 10 | `is_active` | `boolean` | sim | `true` |  |  |
| 11 | `display_order` | `integer` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| eq_assessment_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eq_assessment_questions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eq_assessment_questions_pkey ON public.eq_assessment_questions USING btree (id)` |


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
