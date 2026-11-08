# zapp_history.location_dictionary

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
| 1 | `id` | `integer` | não | `nextval('zapp_history.location_dictionary_id_seq'::regclass)` |  |  |
| 2 | `city` | `text` | não |  |  |  |
| 3 | `state` | `text` | não |  |  |  |
| 4 | `region` | `text` | sim |  |  |  |
| 5 | `is_capital` | `boolean` | sim | `false` |  |  |
| 6 | `patterns` | `text[]` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| location_dictionary_city_state_key | UNIQUE | `UNIQUE (city, state)` |  |  | sim |
| location_dictionary_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| location_dictionary_city_state_key | btree | city, state | sim | sim |  | `CREATE UNIQUE INDEX location_dictionary_city_state_key ON zapp_history.location_dictionary USING btree (city, state)` |
| location_dictionary_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX location_dictionary_pkey ON zapp_history.location_dictionary USING btree (id)` |


## Policies (RLS)

### `pub_read_location`

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

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
