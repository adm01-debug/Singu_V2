# _dormant.digital_signatures

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não | `'draft'::text` |  |  |
| 5 | `file_url` | `text` | sim |  |  |  |
| 6 | `created_by` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `signed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| digital_signatures_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| digital_signatures_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| digital_signatures_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'signed'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.document_signers | document_signers_document_id_fkey | document_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| digital_signatures_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX digital_signatures_pkey ON _dormant.digital_signatures USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
