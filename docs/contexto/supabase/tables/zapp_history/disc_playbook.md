# zapp_history.disc_playbook

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
| 1 | `profile` | `text` | não |  |  |  |
| 2 | `abordagem` | `text` | não |  |  |  |
| 3 | `o_que_fazer` | `text[]` | não |  |  |  |
| 4 | `o_que_evitar` | `text[]` | não |  |  |  |
| 5 | `gatilhos_eficazes` | `text[]` | não |  |  |  |
| 6 | `exemplo_resposta` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_playbook_pkey | PRIMARY KEY | `PRIMARY KEY (profile)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_playbook_pkey | btree | profile | sim | sim |  | `CREATE UNIQUE INDEX disc_playbook_pkey ON zapp_history.disc_playbook USING btree (profile)` |


## Policies (RLS)

### `pub_read_playbook`

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
