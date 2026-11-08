# public.staging_portal_sicoob

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
| 1 | `id` | `integer` | não | `nextval('staging_portal_sicoob_id_seq'::regclass)` |  |  |
| 2 | `numero_cooperativa` | `character varying(10)` | sim |  |  |  |
| 3 | `num_pac` | `character varying(10)` | sim |  |  |  |
| 4 | `sigla` | `character varying(100)` | sim |  |  |  |
| 5 | `nome` | `text` | sim |  |  |  |
| 6 | `tipo_unidade` | `character varying(20)` | sim |  |  |  |
| 7 | `endereco` | `text` | sim |  |  |  |
| 8 | `numero` | `character varying(20)` | sim |  |  |  |
| 9 | `complemento` | `text` | sim |  |  |  |
| 10 | `bairro` | `character varying(200)` | sim |  |  |  |
| 11 | `cidade` | `character varying(200)` | sim |  |  |  |
| 12 | `estado` | `character varying(2)` | sim |  |  |  |
| 13 | `cep` | `character varying(20)` | sim |  |  |  |
| 14 | `email` | `character varying(300)` | sim |  |  |  |
| 15 | `telefones` | `jsonb` | sim |  |  |  |
| 16 | `latitude` | `character varying(30)` | sim |  |  |  |
| 17 | `longitude` | `character varying(30)` | sim |  |  |  |
| 18 | `portal_id` | `integer` | sim |  |  |  |
| 19 | `possui_atm` | `boolean` | sim | `false` |  |  |
| 20 | `processado` | `boolean` | sim | `false` |  |  |
| 21 | `company_id` | `uuid` | sim |  |  |  |
| 22 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| staging_portal_sicoob_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_staging_portal_chave | btree | numero_cooperativa, num_pac | não | sim |  | `CREATE INDEX idx_staging_portal_chave ON public.staging_portal_sicoob USING btree (numero_cooperativa, num_pac)` |
| staging_portal_sicoob_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX staging_portal_sicoob_pkey ON public.staging_portal_sicoob USING btree (id)` |


## Policies (RLS)

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
