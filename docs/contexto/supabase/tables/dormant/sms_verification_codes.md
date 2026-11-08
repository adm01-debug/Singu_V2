# _dormant.sms_verification_codes

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `phone_number` | `text` | não |  |  |  |
| 4 | `code` | `text` | não |  |  |  |
| 5 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `used` | `boolean` | sim | `false` |  |  |
| 7 | `attempts` | `integer` | sim | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sms_verification_codes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sms_verification_codes_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sms_verification_codes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sms_verification_codes_pkey ON _dormant.sms_verification_codes USING btree (id)` |


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
