# zapp_history.product_dictionary

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
| usada por views | zapp_history.v_top_produtos_demanda |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `integer` | não | `nextval('zapp_history.product_dictionary_id_seq'::regclass)` |  |  |
| 2 | `canonical_name` | `text` | não |  |  |  |
| 3 | `patterns` | `text[]` | não |  |  |  |
| 4 | `category` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| product_dictionary_canonical_name_key | UNIQUE | `UNIQUE (canonical_name)` |  |  | sim |
| product_dictionary_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_product_dict_patterns | gin | patterns | não | sim |  | `CREATE INDEX idx_product_dict_patterns ON zapp_history.product_dictionary USING gin (patterns)` |
| product_dictionary_canonical_name_key | btree | canonical_name | sim | sim |  | `CREATE UNIQUE INDEX product_dictionary_canonical_name_key ON zapp_history.product_dictionary USING btree (canonical_name)` |
| product_dictionary_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX product_dictionary_pkey ON zapp_history.product_dictionary USING btree (id)` |


## Policies (RLS)

### `pub_read_products`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | anon, authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
