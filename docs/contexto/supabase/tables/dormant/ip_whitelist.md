# _dormant.ip_whitelist

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `ip_address` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `added_by` | `uuid` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ip_whitelist_added_by_fkey | FOREIGN KEY | `FOREIGN KEY (added_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| ip_whitelist_ip_address_key | UNIQUE | `UNIQUE (ip_address)` |  |  | sim |
| ip_whitelist_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ip_whitelist_ip_address_key | btree | ip_address | sim | sim |  | `CREATE UNIQUE INDEX ip_whitelist_ip_address_key ON _dormant.ip_whitelist USING btree (ip_address)` |
| ip_whitelist_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ip_whitelist_pkey ON _dormant.ip_whitelist USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
