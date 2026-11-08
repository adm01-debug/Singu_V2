# _dormant.quotes

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
| 2 | `quote_number` | `text` | não |  |  |  |
| 3 | `client_id` | `uuid` | sim |  |  |  |
| 4 | `salesperson_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | não | `'draft'::text` |  |  |
| 6 | `items` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `subtotal` | `numeric(12,2)` | não | `0` |  |  |
| 8 | `discount_percent` | `numeric(5,2)` | sim | `0` |  |  |
| 9 | `discount_amount` | `numeric(12,2)` | sim | `0` |  |  |
| 10 | `total` | `numeric(12,2)` | não | `0` |  |  |
| 11 | `client_email` | `text` | sim |  |  |  |
| 12 | `client_phone` | `text` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `valid_until` | `date` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quotes_client_id_fkey | FOREIGN KEY | `FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| quotes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| quotes_quote_number_key | UNIQUE | `UNIQUE (quote_number)` |  |  | sim |
| quotes_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| quotes_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'approved'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.quote_sync_logs | quote_sync_logs_quote_id_fkey | quote_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| quotes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX quotes_pkey ON _dormant.quotes USING btree (id)` |
| quotes_quote_number_key | btree | quote_number | sim | sim |  | `CREATE UNIQUE INDEX quotes_quote_number_key ON _dormant.quotes USING btree (quote_number)` |


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
