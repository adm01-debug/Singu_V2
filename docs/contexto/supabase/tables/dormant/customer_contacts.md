# _dormant.customer_contacts

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
| 3 | `poder_decisao` | `text` | sim |  |  |  |
| 4 | `influencia_compra` | `text` | sim |  |  |  |
| 5 | `canal_preferido` | `text` | sim |  |  |  |
| 6 | `ultima_interacao` | `date` | sim |  |  |  |
| 7 | `proximo_followup` | `date` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_contacts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_contacts_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| customer_contacts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_contacts_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX customer_contacts_contact_id_key ON _dormant.customer_contacts USING btree (contact_id)` |
| customer_contacts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_contacts_pkey ON _dormant.customer_contacts USING btree (id)` |


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
