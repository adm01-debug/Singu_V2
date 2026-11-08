# public.ragas_scores

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
| usada por views | public.v_ragas_by_agent |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `workspace_id` | `uuid` | sim |  |  |  |
| 3 | `agent_id` | `uuid` | sim |  |  |  |
| 4 | `evaluation_run_id` | `uuid` | sim |  |  |  |
| 5 | `query` | `text` | não |  |  |  |
| 6 | `answer` | `text` | não |  |  |  |
| 7 | `faithfulness` | `double precision` | sim | `0` |  |  |
| 8 | `answer_relevancy` | `double precision` | sim | `0` |  |  |
| 9 | `context_precision` | `double precision` | sim | `0` |  |  |
| 10 | `context_recall` | `double precision` | sim | `0` |  |  |
| 11 | `answer_correctness` | `double precision` | sim | `0` |  |  |
| 12 | `overall_score` | `double precision` | sim | `0` |  |  |
| 13 | `contexts_count` | `integer` | sim | `0` |  |  |
| 14 | `model_used` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ragas_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ragas_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ragas_scores_pkey ON public.ragas_scores USING btree (id)` |


## Policies (RLS)

### `ragas_scores_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `ragas_scores_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
