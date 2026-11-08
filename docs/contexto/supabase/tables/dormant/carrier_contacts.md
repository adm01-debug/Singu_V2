# _dormant.carrier_contacts

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `tipo_funcao` | `text` | sim |  |  |  |
| 4 | `tipo_veiculo` | `text` | sim |  |  |  |
| 5 | `placa_veiculo` | `text` | sim |  |  |  |
| 6 | `rotas_atendidas` | `text[]` | sim |  |  |  |
| 7 | `nota_pontualidade` | `integer` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_contacts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_contacts_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| carrier_contacts_nota_pontualidade_check | CHECK | `CHECK (nota_pontualidade >= 1 AND nota_pontualidade <= 5)` |  |  | sim |
| carrier_contacts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_contacts_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX carrier_contacts_contact_id_key ON _dormant.carrier_contacts USING btree (contact_id)` |
| carrier_contacts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_contacts_pkey ON _dormant.carrier_contacts USING btree (id)` |


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
