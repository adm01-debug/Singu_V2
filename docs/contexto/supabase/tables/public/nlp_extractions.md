# public.nlp_extractions

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
| usada por views | public.v_nlp_analytics |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `workspace_id` | `uuid` | sim |  |  |  |
| 3 | `source_type` | `text` | não | `'whatsapp'::text` |  |  |
| 4 | `source_id` | `text` | sim |  |  |  |
| 5 | `raw_text` | `text` | não |  |  |  |
| 6 | `entities` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `structured_order` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `sentiment_label` | `text` | sim |  |  |  |
| 9 | `sentiment_score` | `double precision` | sim |  |  |  |
| 10 | `pipeline_version` | `text` | sim | `'v2'::text` |  |  |
| 11 | `processing_time_ms` | `integer` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nlp_extractions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| nlp_extractions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nlp_extractions_pkey ON public.nlp_extractions USING btree (id)` |


## Policies (RLS)

### `nlp_extractions_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `nlp_extractions_select`

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
