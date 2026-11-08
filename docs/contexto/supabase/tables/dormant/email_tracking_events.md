# _dormant.email_tracking_events

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
| 2 | `email_id` | `uuid` | sim |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_tracking_events_email_id_fkey | FOREIGN KEY | `FOREIGN KEY (email_id) REFERENCES email_logs(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| email_tracking_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'failed'::text]))` |  |  | sim |
| email_tracking_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_tracking_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_tracking_events_pkey ON _dormant.email_tracking_events USING btree (id)` |


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
