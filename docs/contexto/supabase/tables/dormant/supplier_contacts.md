# _dormant.supplier_contacts

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
| 3 | `tipo_representante` | `text` | sim |  |  |  |
| 4 | `linhas_produto` | `text[]` | sim |  |  |  |
| 5 | `pode_dar_desconto` | `boolean` | sim | `false` |  |  |
| 6 | `nota_atendimento` | `integer` | sim |  |  |  |
| 7 | `nota_prazo` | `integer` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_contacts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| supplier_contacts_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| supplier_contacts_nota_atendimento_check | CHECK | `CHECK (nota_atendimento >= 1 AND nota_atendimento <= 5)` |  |  | sim |
| supplier_contacts_nota_prazo_check | CHECK | `CHECK (nota_prazo >= 1 AND nota_prazo <= 5)` |  |  | sim |
| supplier_contacts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| supplier_contacts_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX supplier_contacts_contact_id_key ON _dormant.supplier_contacts USING btree (contact_id)` |
| supplier_contacts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_contacts_pkey ON _dormant.supplier_contacts USING btree (id)` |


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
