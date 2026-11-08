# _dormant.alert_log

> Log de alertas disparados

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `rule_id` | `uuid` | sim |  |  |  |
| 3 | `entity_type` | `character varying(50)` | sim |  |  |  |
| 4 | `entity_id` | `uuid` | sim |  |  |  |
| 5 | `user_id` | `uuid` | sim |  |  |  |
| 6 | `trigger_data` | `jsonb` | sim |  |  |  |
| 7 | `action_taken` | `character varying(100)` | sim |  |  |  |
| 8 | `action_result` | `character varying(50)` | sim |  |  |  |
| 9 | `notification_id` | `uuid` | sim |  |  |  |
| 10 | `triggered_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alert_log_notification_id_fkey | FOREIGN KEY | `FOREIGN KEY (notification_id) REFERENCES _dormant.notifications(id)` | NO ACTION | NO ACTION | sim |
| alert_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alert_log_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| alert_log_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alert_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alert_log_pkey ON _dormant.alert_log USING btree (id)` |


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
