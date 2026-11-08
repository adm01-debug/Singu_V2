# public.coop_sistemas

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `sigla` | `character varying(20)` | não |  |  |  |
| 4 | `tipo_sistema` | `text` | não | `'COOPERATIVA_CREDITO'::text` |  |  |
| 5 | `total_cooperados` | `integer` | sim |  |  |  |
| 6 | `total_singulares` | `integer` | sim |  |  |  |
| 7 | `total_centrais` | `integer` | sim |  |  |  |
| 8 | `website` | `text` | sim |  |  |  |
| 9 | `logo_url` | `text` | sim |  |  |  |
| 10 | `grupo_economico_id` | `uuid` | sim |  |  |  |
| 11 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `is_active` | `boolean` | sim | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| coop_sistemas_grupo_economico_id_fkey | FOREIGN KEY | `FOREIGN KEY (grupo_economico_id) REFERENCES grupos_economicos(id)` | NO ACTION | NO ACTION | sim |
| coop_sistemas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| coop_sistemas_sigla_key | UNIQUE | `UNIQUE (sigla)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| coop_sistemas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX coop_sistemas_pkey ON public.coop_sistemas USING btree (id)` |
| coop_sistemas_sigla_key | btree | sigla | sim | sim |  | `CREATE UNIQUE INDEX coop_sistemas_sigla_key ON public.coop_sistemas USING btree (sigla)` |
| idx_coop_sistemas_grupo_economico_id | btree | grupo_economico_id | não | sim |  | `CREATE INDEX idx_coop_sistemas_grupo_economico_id ON public.coop_sistemas USING btree (grupo_economico_id)` |


## Policies (RLS)

### `coop_sistemas_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_coop_sistemas_upd | BEFORE | UPDATE | ROW | enabled | public.update_coop_updated_at |


## Grants

_nenhum_
