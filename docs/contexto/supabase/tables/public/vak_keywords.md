# public.vak_keywords

> Dicionário de palavras-chave por modalidade VAK para detecção automática

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
| 2 | `vak_type` | `character varying(1)` | não |  |  |  |
| 3 | `keyword` | `character varying(100)` | não |  |  |  |
| 4 | `category` | `character varying(50)` | sim |  |  |  |
| 5 | `example_phrase` | `text` | sim |  |  |  |
| 6 | `weight` | `numeric(3,2)` | sim | `1.0` |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| vak_keywords_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| vak_keywords_vak_type_check | CHECK | `CHECK (vak_type::text = ANY (ARRAY['V'::character varying::text, 'A'::character varying::text, 'K'::character varying::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| vak_keywords_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX vak_keywords_pkey ON public.vak_keywords USING btree (id)` |


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
