# _dormant.health_alerts

> SINGU: Alertas de saúde do relacionamento

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `alert_type` | `text` | não |  |  |  |
| 6 | `severity` | `text` | não |  |  |  |
| 7 | `title` | `text` | não |  |  |  |
| 8 | `message` | `text` | não |  |  |  |
| 9 | `data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `recommended_action` | `text` | sim |  |  |  |
| 11 | `action_deadline` | `date` | sim |  |  |  |
| 12 | `status` | `text` | sim | `'active'::text` |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `resolved_by` | `uuid` | sim |  |  |  |
| 15 | `resolution_notes` | `text` | sim |  |  |  |
| 16 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| health_alerts_alert_type_check | CHECK | `CHECK (alert_type = ANY (ARRAY['score_drop'::text, 'no_interaction'::text, 'negative_sentiment'::text, 'churn_risk'::text, 'engagement_drop'::text, 'competitor_mention'::text, 'unresolved_objection'::text, 'missed_follow_up'::text, 'birthday_upcoming'::text, 'contract_expiring'::text, 'payment_overdue'::text, 'custom'::text]))` |  |  | sim |
| health_alerts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| health_alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| health_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| health_alerts_resolved_by_fkey | FOREIGN KEY | `FOREIGN KEY (resolved_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| health_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| health_alerts_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'acknowledged'::text, 'resolved'::text, 'dismissed'::text]))` |  |  | sim |
| health_alerts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| health_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX health_alerts_pkey ON _dormant.health_alerts USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_health_alerts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
