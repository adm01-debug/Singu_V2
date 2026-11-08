# _dormant.inactivity_alerts

> Alertas de inatividade e queda de engajamento

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
| usada por views | public.vw_active_alerts, public.vw_notification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `alert_type` | `character varying(50)` | não |  |  |  |
| 5 | `days_inactive` | `integer` | sim |  |  |  |
| 6 | `last_interaction_date` | `timestamp with time zone` | sim |  |  |  |
| 7 | `previous_interaction_frequency` | `numeric(5,2)` | sim |  |  |  |
| 8 | `current_interaction_frequency` | `numeric(5,2)` | sim |  |  |  |
| 9 | `severity` | `character varying(20)` | sim |  |  |  |
| 10 | `risk_score` | `integer` | sim |  |  |  |
| 11 | `context_data` | `jsonb` | sim |  |  |  |
| 12 | `recommended_actions` | `text[]` | sim |  |  |  |
| 13 | `urgency_reason` | `text` | sim |  |  |  |
| 14 | `status` | `character varying(20)` | sim | `'active'::character varying` |  |  |
| 15 | `acknowledged_by` | `uuid` | sim |  |  |  |
| 16 | `acknowledged_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `resolution_notes` | `text` | sim |  |  |  |
| 18 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `notification_sent` | `boolean` | sim | `false` |  |  |
| 20 | `notification_sent_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `detected_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| inactivity_alerts_acknowledged_by_fkey | FOREIGN KEY | `FOREIGN KEY (acknowledged_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| inactivity_alerts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| inactivity_alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| inactivity_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| inactivity_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX inactivity_alerts_pkey ON _dormant.inactivity_alerts USING btree (id)` |


## Policies (RLS)

### `dashboard_alert_owner_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((contact_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = inactivity_alerts.contact_id) AND (c.user_id = auth.uid()) AND (c.deleted_at IS NULL))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = inactivity_alerts.company_id) AND (c.user_id = auth.uid()) AND (c.deleted_at IS NULL))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
