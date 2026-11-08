# zapp_history.phone_to_contact

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
| 1 | `phone_normalized` | `text` | não |  |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `source` | `text` | sim | `'auto'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| phone_to_contact_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| phone_to_contact_pkey | PRIMARY KEY | `PRIMARY KEY (phone_normalized)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ptc_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_ptc_contact ON zapp_history.phone_to_contact USING btree (contact_id)` |
| phone_to_contact_pkey | btree | phone_normalized | sim | sim |  | `CREATE UNIQUE INDEX phone_to_contact_pkey ON zapp_history.phone_to_contact USING btree (phone_normalized)` |


## Policies (RLS)

### `phone_to_contact_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
