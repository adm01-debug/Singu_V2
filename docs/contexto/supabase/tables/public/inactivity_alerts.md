# public.inactivity_alerts

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
| 2 | `alert_type` | `text` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `days_inactive` | `integer` | sim |  |  |  |
| 6 | `last_interaction_date` | `timestamp with time zone` | sim |  |  |  |
| 7 | `severity` | `text` | sim | `'medium'::text` |  |  |
| 8 | `risk_score` | `integer` | sim | `0` |  |  |
| 9 | `recommended_actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `urgency_reason` | `text` | sim |  |  |  |
| 11 | `status` | `text` | sim | `'active'::text` |  |  |
| 12 | `detected_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `resolved_by` | `uuid` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_inactivity_alerts_status | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'snoozed'::text, 'resolved'::text, 'dismissed'::text]))` |  |  | sim |
| inactivity_alerts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| inactivity_alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| inactivity_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| inactivity_alerts_resolved_by_fkey | FOREIGN KEY | `FOREIGN KEY (resolved_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_inactivity_alerts_company | btree | company_id | não | sim |  | `CREATE INDEX idx_inactivity_alerts_company ON public.inactivity_alerts USING btree (company_id)` |
| idx_inactivity_alerts_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_inactivity_alerts_contact ON public.inactivity_alerts USING btree (contact_id)` |
| idx_inactivity_alerts_resolved_by | btree | resolved_by | não | sim |  | `CREATE INDEX idx_inactivity_alerts_resolved_by ON public.inactivity_alerts USING btree (resolved_by)` |
| idx_inactivity_alerts_status | btree | status | não | sim |  | `CREATE INDEX idx_inactivity_alerts_status ON public.inactivity_alerts USING btree (status)` |
| inactivity_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX inactivity_alerts_pkey ON public.inactivity_alerts USING btree (id)` |


## Policies (RLS)

### `inactivity_alerts_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_inactivity_alerts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
