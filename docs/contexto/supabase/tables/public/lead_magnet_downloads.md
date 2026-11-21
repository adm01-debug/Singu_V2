# public.lead_magnet_downloads

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `magnet_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `email` | `text` | sim |  |  |  |
| 6 | `name` | `text` | sim |  |  |  |
| 7 | `utm_source` | `text` | sim |  |  |  |
| 8 | `utm_medium` | `text` | sim |  |  |  |
| 9 | `utm_campaign` | `text` | sim |  |  |  |
| 10 | `downloaded_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_magnet_downloads_magnet_id_fkey | FOREIGN KEY | `FOREIGN KEY (magnet_id) REFERENCES lead_magnets(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_magnet_downloads_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lmd_magnet | btree | magnet_id | não | sim |  | `CREATE INDEX idx_lmd_magnet ON public.lead_magnet_downloads USING btree (magnet_id)` |
| idx_lmd_user | btree | user_id | não | sim |  | `CREATE INDEX idx_lmd_user ON public.lead_magnet_downloads USING btree (user_id)` |
| lead_magnet_downloads_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_magnet_downloads_pkey ON public.lead_magnet_downloads USING btree (id)` |


## Policies (RLS)

### `lmd_owner_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `lmd_public_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM lead_magnets m   WHERE ((m.id = lead_magnet_downloads.magnet_id) AND (m.is_published = true) AND (m.user_id = lead_magnet_downloads.user_id))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
