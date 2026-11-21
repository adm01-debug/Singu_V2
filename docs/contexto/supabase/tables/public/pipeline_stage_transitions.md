# public.pipeline_stage_transitions

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `from_stage` | `text` | não |  |  |  |
| 3 | `to_stage` | `text` | não |  |  |  |
| 4 | `allowed` | `boolean` | sim | `true` |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pipeline_stage_transitions_from_to_idx | UNIQUE | `UNIQUE (from_stage, to_stage)` |  |  | sim |
| pipeline_stage_transitions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| pipeline_stage_transitions_from_to_idx | btree | from_stage, to_stage | sim | sim |  | `CREATE UNIQUE INDEX pipeline_stage_transitions_from_to_idx ON public.pipeline_stage_transitions USING btree (from_stage, to_stage)` |
| pipeline_stage_transitions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pipeline_stage_transitions_pkey ON public.pipeline_stage_transitions USING btree (id)` |


## Policies (RLS)

### `Leitura pública de transições`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `Transitions are viewable by everyone authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
