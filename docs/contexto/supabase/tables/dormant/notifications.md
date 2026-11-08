# _dormant.notifications

> Notificações e alertas do sistema

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
| usada por views | public.vw_notification_dashboard, public.vw_pending_notifications |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `notification_type` | `character varying(50)` | não |  |  |  |
| 4 | `category` | `character varying(50)` | sim |  |  |  |
| 5 | `priority` | `integer` | sim | `5` |  |  |
| 6 | `title` | `character varying(255)` | não |  |  |  |
| 7 | `message` | `text` | sim |  |  |  |
| 8 | `icon` | `character varying(50)` | sim |  |  |  |
| 9 | `contact_id` | `uuid` | sim |  |  |  |
| 10 | `company_id` | `uuid` | sim |  |  |  |
| 11 | `deal_id` | `uuid` | sim |  |  |  |
| 12 | `interaction_id` | `uuid` | sim |  |  |  |
| 13 | `task_id` | `uuid` | sim |  |  |  |
| 14 | `action_url` | `text` | sim |  |  |  |
| 15 | `action_label` | `character varying(100)` | sim |  |  |  |
| 16 | `secondary_action_url` | `text` | sim |  |  |  |
| 17 | `secondary_action_label` | `character varying(100)` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim |  |  |  |
| 19 | `channels_sent` | `text[]` | sim |  |  |  |
| 20 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `is_read` | `boolean` | sim | `false` |  |  |
| 22 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 23 | `is_actioned` | `boolean` | sim | `false` |  |  |
| 24 | `actioned_at` | `timestamp with time zone` | sim |  |  |  |
| 25 | `action_taken` | `character varying(100)` | sim |  |  |  |
| 26 | `is_dismissed` | `boolean` | sim | `false` |  |  |
| 27 | `dismissed_at` | `timestamp with time zone` | sim |  |  |  |
| 28 | `scheduled_for` | `timestamp with time zone` | sim | `now()` |  |  |
| 29 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 30 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notifications_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| notifications_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| notifications_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notifications_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.alert_log | alert_log_notification_id_fkey | notification_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notifications_pkey ON _dormant.notifications USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
