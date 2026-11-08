# _dormant.document_signers

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
| 2 | `document_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `email` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `signed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `sign_order` | `integer` | sim | `1` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| document_signers_document_id_fkey | FOREIGN KEY | `FOREIGN KEY (document_id) REFERENCES digital_signatures(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| document_signers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| document_signers_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'signed'::text, 'rejected'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| document_signers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX document_signers_pkey ON _dormant.document_signers USING btree (id)` |


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
